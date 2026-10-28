import { Plugin } from "@opencode/plugin";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

/**
 * Bóveda CBPG en OpenCode.
 *
 * - Al iniciar una sesión, si la nota de inicio no llegó por `instructions`,
 *   inyecta el mapa una sola vez. Es una lectura de archivo, no un proceso:
 *   funciona aunque Python no esté en el PATH.
 * - Cuando la sesión queda inactiva, regenera las notas derivadas del código y
 *   verifica enlaces/fuentes. No escribe decisiones: eso es la bitácora.
 *
 * `session.idle` llega muchas veces seguidas, así que las corridas se espacian:
 * sin el freno, el generador competiría con cualquier edición y se comería la
 * CPU. Una regeneración con 15 s de retraso no le sirve a nadie de menos.
 *
 * Si el generador falla, se registra en el log del servidor y la sesión sigue.
 * El cierre manual es `pnpm boveda`.
 */

const MAPA = join("vault", "00-Inicio", "Boveda CBPG.md");
const TIEMPO_MS = 20_000;
const ESPERA_MS = 15_000;

const ejecutar = promisify(execFile);

interface Resultado {
  ok: boolean;
  salida: string;
  error: string;
}

/** Sin frontmatter YAML: al modelo solo le sirve el cuerpo. */
function sinFrontmatter(texto: string): string {
  return texto.startsWith("---\n")
    ? texto.split("\n---\n").slice(1).join("\n---\n").trim()
    : texto.trim();
}

async function correr(
  directorio: string,
  ...argumentos: string[]
): Promise<Resultado> {
  try {
    const { stdout } = await ejecutar(
      "python3",
      ["scripts/vault/vault.py", ...argumentos],
      { cwd: directorio, encoding: "utf8", timeout: TIEMPO_MS },
    );
    return { ok: true, salida: stdout.trim(), error: "" };
  } catch (fallo) {
    const error = fallo as { stderr?: string; message?: string };
    return {
      ok: false,
      salida: "",
      error: (error.stderr ?? "").trim() || (error.message ?? "error desconocido"),
    };
  }
}

function yaTieneMapa(sistema: Array<{ type: string; text?: string }>): boolean {
  return sistema.some(
    (parte) => parte.type === "text" && (parte.text ?? "").includes("Bóveda CBPG"),
  );
}

export default Plugin.define({
  id: "boveda-cbpg",
  async setup(ctx) {
    const directorio = ctx.location.directory;
    const revisadas = new Set<string>();

    let ultima = 0;
    let enCurso = false;

    const sincronizar = async () => {
      if (enCurso) return;
      const ahora = Date.now();
      if (ahora - ultima < ESPERA_MS) return;
      ultima = ahora;
      enCurso = true;
      try {
        const generado = await correr(directorio, "generar");
        if (!generado.ok) {
          console.error("[boveda] generar falló:", generado.error);
          return;
        }
        // `verificar` rehace los mismos cálculos que `generar`: solo vale la
        // pena si algo cambió. Si no, quedan dos procesos por nada.
        if (/\b0 nota\(s\) actualizada\(s\)/.test(generado.salida)) return;

        const cambiadas = generado.salida.match(/(\d+) nota\(s\) actualizada/)?.[1];
        console.log(`[boveda] ${cambiadas} nota(s) actualizada(s)`);

        const verificado = await correr(directorio, "verificar");
        if (!verificado.ok) {
          console.error("[boveda] verificar falló:", verificado.error);
        }
      } finally {
        enCurso = false;
      }
    };

    const contexto = await ctx.session.hook("context", (evento) => {
      if (revisadas.has(evento.sessionID)) return;
      revisadas.add(evento.sessionID);

      if (yaTieneMapa(evento.system)) return;

      let mapa: string;
      try {
        mapa = sinFrontmatter(readFileSync(join(directorio, MAPA), "utf8"));
      } catch (fallo) {
        console.error("[boveda] no se pudo leer el mapa:", fallo);
        return;
      }
      if (!mapa) return;

      evento.system.push({
        type: "text",
        text: `<boveda-cbpg>\n${mapa}\n</boveda-cbpg>`,
      });
    });

    const controlador = new AbortController();
    const eventos = (async () => {
      for await (const _ of ctx.event.subscribe({
        types: ["session.idle"],
        signal: controlador.signal,
      })) {
        await sincronizar();
      }
    })();

    return async () => {
      controlador.abort();
      await contexto.dispose();
      await eventos.catch(() => {});
    };
  },
});
