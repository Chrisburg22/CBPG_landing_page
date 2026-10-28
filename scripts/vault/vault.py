#!/usr/bin/env python3
"""Genera y verifica la boveda Obsidian de CBPG.

La boveda vive en ``vault/``. Las notas escritas a mano explican arquitectura,
dominio y recetas; las notas generadas se construyen desde el codigo para que no
envejezcan en silencio.

Uso::

    python3 scripts/vault/vault.py generar
    python3 scripts/vault/vault.py verificar
    python3 scripts/vault/vault.py brief

Solo usa la biblioteca estandar de Python 3.
"""

from __future__ import annotations

import hashlib
import re
import sys
import unicodedata
from collections.abc import Callable
from datetime import date, datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
BOVEDA = RAIZ / "vault"

NOTA_INDICE = BOVEDA / "00-Inicio" / "Indice completo.md"
NOTA_MAPA = BOVEDA / "01-Proyecto" / "Mapa del repositorio.md"
NOTA_RUTAS = BOVEDA / "02-Panel" / "Rutas del panel.md"
NOTA_TABLAS = BOVEDA / "04-Datos" / "Tablas.md"

# Directorios que no son codigo del proyecto o son artefactos de build.
IGNORAR = {
    ".git",
    ".astro",
    ".vercel",
    ".claude",
    "node_modules",
    "dist",
    "test-results",
    "playwright-report",
    "demo-video",
    "manual-video",
    "vault",
}

# Archivos o carpetas ignorados por git que sí viven en el árbol local. Se
# excluyen para que el mapa no cambie entre una máquina y otra.
IGNORAR_RUTAS = {
    "design/panel/panel-ortodoncia.html",
    "design/panel/rediseno/panel-bp-rediseno.html",
    "docs/panel/videos",
}

# El orden importa: ``Indice completo`` se genera al final, cuando ya existen
# las demas notas generadas que debe listar.
GENERADAS: list[tuple[Path, Callable[[], str], list[str]]] = []

RESUMEN_GENERADO = {
    "Indice completo": "Índice de todas las notas de la bóveda.",
    "Mapa del repositorio": "Estructura y tamaño del código.",
    "Rutas del panel": "Rutas, prerender y acceso.",
    "Tablas": "Columnas, tipos, RLS, vistas y funciones.",
}


# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------

def normalizar(valor: str) -> str:
    return unicodedata.normalize("NFC", valor).casefold().strip()


def leer(ruta: Path) -> str:
    return ruta.read_text(encoding="utf-8")


def separar_frontmatter(texto: str) -> tuple[str, str]:
    if texto.startswith("---\n"):
        partes = texto.split("\n---\n", 1)
        if len(partes) == 2:
            return partes[0][4:], partes[1]
    return "", texto


def parsear_frontmatter(texto: str) -> dict:
    datos: dict = {}
    cabecera, _ = separar_frontmatter(texto)
    clave = None
    for linea in cabecera.splitlines():
        if not linea.strip():
            continue
        if re.match(r"^\s*-\s+", linea):
            if clave is not None:
                if not isinstance(datos.get(clave), list):
                    datos[clave] = []
                datos[clave].append(linea.split("-", 1)[1].strip().strip('"').strip("'"))
            continue
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", linea)
        if m:
            clave = m.group(1)
            valor = m.group(2).strip()
            if valor.startswith("[") and valor.endswith("]"):
                datos[clave] = [
                    v.strip().strip('"').strip("'")
                    for v in valor[1:-1].split(",")
                    if v.strip()
                ]
            else:
                datos[clave] = valor if valor else []
    return datos


def tabla(cabeceras: list[str], filas: list[list[str]]) -> str:
    lineas = [
        "| " + " | ".join(cabeceras) + " |",
        "| " + " | ".join("---" for _ in cabeceras) + " |",
    ]
    for fila in filas:
        lineas.append("| " + " | ".join(celda.replace("|", "\\|") for celda in fila) + " |")
    return "\n".join(lineas)


def _lineas(ruta: Path) -> int | None:
    try:
        return len(leer(ruta).splitlines())
    except (OSError, UnicodeDecodeError):
        return None


def _ignorada(ruta: Path) -> bool:
    """Solo mira la primera carpeta: `scripts/vault/` sí es código."""
    relativa = ruta.relative_to(RAIZ)
    texto = relativa.as_posix()
    if any(texto == r or texto.startswith(f"{r}/") for r in IGNORAR_RUTAS):
        return True
    return bool(relativa.parts) and relativa.parts[0] in IGNORAR


def _archivos(carpeta: Path, patron: str = "*") -> list[Path]:
    if not carpeta.exists():
        return []
    return sorted(
        archivo
        for archivo in carpeta.glob(patron)
        if archivo.is_file() and not _ignorada(archivo)
    )


def _listado(carpeta: Path, patron: str = "*") -> str:
    """Lista compacta de archivos con su numero de lineas."""
    archivos = _archivos(carpeta, patron)
    if not archivos:
        return "—"
    return " · ".join(
        f"`{a.name}` ({lineas})" if (lineas := _lineas(a)) is not None else f"`{a.name}`"
        for a in archivos
    )


def _contar(carpeta: Path) -> int:
    total = 0
    for archivo in carpeta.rglob("*"):
        if not archivo.is_file() or _ignorada(archivo):
            continue
        total += 1
    return total


def _tabla_arbol(carpeta: Path) -> list[list[str]]:
    filas = []
    for hijo in sorted(carpeta.iterdir(), key=lambda p: p.name.casefold()):
        if not hijo.is_dir() or hijo.name in IGNORAR:
            continue
        filas.append([f"`{hijo.relative_to(RAIZ).as_posix()}/`", str(_contar(hijo))])
    return filas


# --------------------------------------------------------------------------
# Mapa del repositorio
# --------------------------------------------------------------------------

def render_mapa() -> str:
    raiz_dirs = _tabla_arbol(RAIZ)
    src_dirs = _tabla_arbol(RAIZ / "src")
    conservar = {".env.example", ".gitignore", ".npmrc"}
    archivos_raiz = sorted(
        archivo
        for archivo in RAIZ.iterdir()
        if archivo.is_file()
        and archivo.name != "pnpm-lock.yaml"
        and (not archivo.name.startswith(".") or archivo.name in conservar)
    )

    lineas = [
        "# Mapa del repositorio",
        "",
        "Estructura y tamaño del código, generada desde el árbol de archivos.",
        "Excluye `.git`, artefactos de build, dependencias y la propia bóveda.",
        "",
        f"- **{sum(int(f[1]) for f in raiz_dirs)} archivos** en las carpetas del proyecto.",
        "- Los números entre paréntesis son líneas, no KB.",
        "",
        "## Raíz",
        "",
        tabla(["Carpeta", "Archivos"], raiz_dirs),
        "",
        "Archivos sueltos en la raíz:",
        "",
        " · ".join(
            f"`{a.name}` ({lineas})" if (lineas := _lineas(a)) is not None else f"`{a.name}`"
            for a in archivos_raiz
        ) or "—",
        "",
        "## `src/`",
        "",
        tabla(["Carpeta", "Archivos"], src_dirs),
        "",
        "## `src/lib/` — dominio",
        "",
        _listado(RAIZ / "src" / "lib", "*.ts"),
        "",
        "## `src/lib/supabase/` — clientes y tipos",
        "",
        _listado(RAIZ / "src" / "lib" / "supabase", "*.ts"),
        "",
        "## `src/lib/google/` — Calendar",
        "",
        _listado(RAIZ / "src" / "lib" / "google", "*.ts"),
        "",
        "## `src/components/` — landing",
        "",
        _listado(RAIZ / "src" / "components", "*.astro"),
        "",
        "## `src/components/admin/` — panel",
        "",
        _listado(RAIZ / "src" / "components" / "admin", "*.astro"),
        "",
        "## `scripts/`",
        "",
        _listado(RAIZ / "scripts"),
        "",
        "## `scripts/vault/` — generador de esta bóveda",
        "",
        _listado(RAIZ / "scripts" / "vault"),
        "",
        "## `e2e/`",
        "",
        _listado(RAIZ / "e2e", "*.ts"),
        "",
        "## `docs/panel/`",
        "",
        _listado(RAIZ / "docs" / "panel"),
        "",
        "## `supabase/migrations/`",
        "",
        _listado(RAIZ / "supabase" / "migrations", "*.sql"),
        "",
        "## `public/`",
        "",
        _listado(RAIZ / "public"),
        "",
        "Ver [[Arquitectura]] para saber qué hace cada carpeta y [[Rutas del panel]]",
        "para las rutas.",
        "",
    ]
    return "\n".join(lineas)


# --------------------------------------------------------------------------
# Rutas del panel
# --------------------------------------------------------------------------

def _rutas_publicas() -> set[str]:
    archivo = RAIZ / "src" / "lib" / "admin.ts"
    if not archivo.exists():
        return set()
    m = re.search(r"RUTAS_PUBLICAS_ADMIN\s*=\s*new Set\(\[(.*?)\]\)", leer(archivo), re.S)
    return set(re.findall(r"'([^']+)'", m.group(1))) if m else set()


def _solo_doctora() -> list[str]:
    archivo = RAIZ / "src" / "lib" / "roles.ts"
    if not archivo.exists():
        return []
    m = re.search(r"SOLO_DOCTORA\s*=\s*\[(.*?)\]\s*as const", leer(archivo), re.S)
    return re.findall(r"'([^']+)'", m.group(1)) if m else []


def _ruta_de_pagina(archivo: Path) -> str:
    relativo = archivo.relative_to(RAIZ / "src" / "pages").with_suffix("")
    partes = list(relativo.parts)
    if partes and partes[-1] == "index":
        partes = partes[:-1]
    return "/" + "/".join(partes) if partes else "/"


def _acceso(ruta: str, publicas: set[str], doctora: list[str]) -> str:
    if ruta in publicas:
        return "público"
    if ruta == "/api/contact":
        return "público (formulario)"
    if ruta.startswith("/api/cron/"):
        return "cron (Bearer)"
    if ruta.startswith("/api/"):
        return "servidor"
    if ruta.startswith("/admin/prospectos/") and ruta.endswith("/convertir"):
        return "doctora"
    if any(ruta == p or ruta.startswith(f"{p}/") for p in doctora):
        return "doctora"
    if ruta.startswith("/admin"):
        return "doctora + recepción"
    return "público"


def render_rutas() -> str:
    carpeta = RAIZ / "src" / "pages"
    if not carpeta.exists():
        return "# Rutas del panel\n\n> [!warning] No se encontró `src/pages`."

    publicas = _rutas_publicas()
    doctora = _solo_doctora()
    filas = []
    for archivo in sorted(carpeta.rglob("*")):
        if not archivo.is_file() or archivo.suffix not in {".astro", ".ts"}:
            continue
        ruta = _ruta_de_pagina(archivo)
        texto = leer(archivo)
        ssr = "export const prerender = false" in texto
        es_panel = ruta.startswith("/admin") or ruta.startswith("/api")
        if ssr:
            render = "SSR"
        elif es_panel:
            render = "⚠️ estático — falta `prerender = false`"
        else:
            render = "estático"
        tipo = "página" if archivo.suffix == ".astro" else "endpoint"
        filas.append([
            f"`{ruta}`",
            tipo,
            render,
            _acceso(ruta, publicas, doctora),
            f"`{archivo.relative_to(RAIZ).as_posix()}`",
        ])

    admin = [f for f in filas if f[0].startswith("`/admin")]
    api = [f for f in filas if f[0].startswith("`/api")]
    publico = [f for f in filas if f not in admin and f not in api]
    mal = [f for f in filas if f[2].startswith("⚠️")]

    lineas = [
        "# Rutas del panel",
        "",
        "Rutas de `src/pages/`, su tipo, si se renderizan en el servidor y quién",
        "puede verlas. Se genera desde los archivos y desde `src/lib/roles.ts`.",
        "",
        f"- **{len(filas)} rutas**: {len(admin)} de panel, {len(api)} de API, "
        f"{len(publico)} públicas.",
        f"- **{len(mal)} rutas de panel/API sin `prerender = false`.** "
        "Si hay alguna, el panel quedaría público.",
        "- `doctora + recepción` = cualquier cuenta con fila en `admins`; RLS sigue",
        "  decidiendo las filas.",
        "",
        "## Panel",
        "",
        tabla(["Ruta", "Tipo", "Render", "Acceso", "Archivo"], admin),
        "",
        "## API",
        "",
        tabla(["Ruta", "Tipo", "Render", "Acceso", "Archivo"], api),
        "",
        "## Públicas",
        "",
        tabla(["Ruta", "Tipo", "Render", "Acceso", "Archivo"], publico),
        "",
        "## Reglas",
        "",
        "- Toda ruta nueva bajo `/admin` o `/api` que use sesión lleva",
        "  `export const prerender = false`.",
        "- `RUTAS_PUBLICAS_ADMIN` (`src/lib/admin.ts`) solo contiene login, entrar y",
        "  salir. Ampliarla abre el panel sin sesión.",
        "- `SOLO_DOCTORA` (`src/lib/roles.ts`) son prefijos; la conversión",
        "  `/admin/prospectos/<id>/convertir` se reconoce aparte.",
        "- La barrera real es RLS. La interfaz y el middleware solo evitan pantallas",
        "  vacías.",
        "",
        "Ver [[Acceso y roles]] y [[Arquitectura]].",
        "",
    ]
    return "\n".join(lineas)


# --------------------------------------------------------------------------
# Tablas
# --------------------------------------------------------------------------

TABLAS_TS = {
    "SolicitudFila": "solicitudes",
    "PacienteFila": "pacientes",
    "PlanFila": "planes_tratamiento",
    "CuotaFila": "cuotas",
    "PagoFila": "pagos",
    "CitaFila": "citas",
    "AccionProspectoFila": "acciones_prospecto",
    "RecordatorioCobroFila": "recordatorios_cobro",
    "IntegracionGoogleFila": "integracion_google",
    "AdminsFila": "admins",
    "VistaCuotaFila": "vista_cuotas",
    "VistaSaldoFila": "vista_saldo_paciente",
}

VISTAS = {"vista_cuotas", "vista_saldo_paciente"}


def _parsear_tipos_ts(texto: str) -> dict[str, list[tuple[str, str]]]:
    tipos = {}
    for m in re.finditer(r"type\s+(\w+Fila)\s*=\s*\{(.*?)\n\};", texto, re.S):
        campos = []
        for linea in m.group(2).splitlines():
            limpia = linea.strip()
            if not limpia or limpia.startswith(("//", "/*", "*")):
                continue
            m_campo = re.match(r"(\w+):\s*(.+?);(?:\s*//.*)?$", limpia)
            if m_campo:
                campos.append((m_campo.group(1), m_campo.group(2).strip()))
        tipos[m.group(1)] = campos

    m_admins = re.search(r"admins:\s*\{\s*Row:\s*\{([^}]*)\}", texto, re.S)
    if m_admins:
        campos = []
        for trozo in m_admins.group(1).split(";"):
            if ":" in trozo:
                nombre, tipo = trozo.split(":", 1)
                campos.append((nombre.strip(), tipo.strip()))
        tipos["AdminsFila"] = campos
    return tipos


def _parsear_columnas_sql(cuerpo: str) -> dict[str, dict]:
    columnas: dict[str, dict] = {}
    for linea in cuerpo.splitlines():
        limpia = linea.strip().rstrip(",")
        if not limpia or limpia.startswith("--"):
            continue
        if limpia.upper().startswith(("CONSTRAINT", "PRIMARY KEY", "UNIQUE", "CHECK")):
            continue
        m = re.match(
            r"(\w+)\s+(.+?)(?=\s+(?:NOT NULL|DEFAULT|CHECK|CONSTRAINT|REFERENCES|"
            r"PRIMARY KEY|UNIQUE)\b|$)",
            limpia,
            re.I,
        )
        if not m:
            continue
        nombre, tipo = m.group(1), m.group(2).strip()
        resto = limpia[m.end():]
        notas = []
        if re.search(r"\bPRIMARY KEY\b", limpia, re.I):
            notas.append("PK")
        if re.search(r"\bNOT NULL\b", resto, re.I):
            notas.append("NOT NULL")
        m_default = re.search(
            r"\bDEFAULT\s+([^,]+?)(?=\s+(?:NOT NULL|CHECK)\b|$)", resto, re.I
        )
        if m_default:
            notas.append(f"default `{m_default.group(1).strip()}`")
        m_enum = re.search(
            r"CHECK\s*\(\s*\w+(?:::text)?\s*=\s*ANY\s*\(\s*ARRAY\[(.*?)\]"
            r"(?:::text\[\])?\s*\)\s*\)",
            resto,
            re.I | re.S,
        )
        if m_enum:
            valores = re.findall(r"'([^']*)'", m_enum.group(1))
            notas.append("enum: " + ", ".join(valores))
        if re.search(r"\bUNIQUE\b", resto, re.I):
            notas.append("UNIQUE")
        m_fk = re.search(
            r"REFERENCES\s+(?:public\.)?(\w+)\((\w+)\)"
            r"(?:\s+ON DELETE\s+(SET\s+NULL|CASCADE|RESTRICT|NO\s+ACTION|SET\s+DEFAULT))?",
            resto,
            re.I,
        )
        if m_fk:
            nota = f"FK → `{m_fk.group(1)}.{m_fk.group(2)}`"
            if m_fk.group(3):
                nota += f" (on delete {m_fk.group(3).lower()})"
            notas.append(nota)
        columnas[nombre] = {"tipo": tipo, "notas": notas}
    return columnas


def _sql_tablas() -> dict[str, dict]:
    tablas: dict[str, dict] = {}
    carpeta = RAIZ / "supabase" / "migrations"
    if not carpeta.exists():
        return tablas
    for archivo in sorted(carpeta.glob("*.sql")):
        texto = leer(archivo)
        for m in re.finditer(
            r"create table(?:\s+if not exists)?\s+(?:public\.)?(\w+)\s*\((.*?)\n\);",
            texto,
            re.S | re.I,
        ):
            tablas[m.group(1)] = {
                "columnas": _parsear_columnas_sql(m.group(2)),
                "origen": f"supabase/migrations/{archivo.name}",
            }
    return tablas


def _politicas() -> dict[str, dict[str, str]]:
    estado: dict[str, dict[str, str]] = {}
    carpeta = RAIZ / "supabase" / "migrations"
    if not carpeta.exists():
        return estado
    for archivo in sorted(carpeta.glob("*.sql")):
        texto = leer(archivo)
        for m in re.finditer(
            r'drop policy "([^"]+)"\s+on\s+public\.(\w+);', texto, re.I
        ):
            estado.setdefault(m.group(2), {}).pop(m.group(1), None)
        for m in re.finditer(
            r'create policy "([^"]+)"\s+on\s+public\.(\w+)(.*?);', texto, re.S | re.I
        ):
            cuerpo = m.group(3)
            if "es_doctora" in cuerpo:
                rol = "es_doctora"
            elif "es_admin" in cuerpo:
                rol = "es_admin"
            else:
                rol = "?"
            estado.setdefault(m.group(2), {})[m.group(1)] = rol
    return estado


def _acceso_tabla(nombre: str, politicas: dict[str, dict[str, str]]) -> str:
    reglas = politicas.get(nombre, {})
    if nombre == "integracion_google":
        return "Solo servidor (RLS sin políticas ni GRANT)"
    if nombre == "solicitudes":
        return "Doctora y recepción (política previa a las migraciones)"
    if nombre == "admins":
        return "Cada cuenta su propia fila"
    if not reglas:
        return "Sin políticas en las migraciones (revisar)"
    roles = set(reglas.values())
    if roles == {"es_doctora"}:
        return "Solo doctora"
    if roles == {"es_admin"}:
        return "Doctora y recepción"
    if roles == {"es_admin", "es_doctora"}:
        return "Doctora y recepción (con políticas mixtas)"
    return "Revisar políticas"


def render_tablas() -> str:
    archivo_tipos = RAIZ / "src" / "lib" / "supabase" / "tipos.ts"
    if not archivo_tipos.exists():
        return "# Tablas\n\n> [!warning] No se encontró `src/lib/supabase/tipos.ts`."

    tipos = _parsear_tipos_ts(leer(archivo_tipos))
    sql = _sql_tablas()
    politicas = _politicas()

    tablas: dict[str, dict] = {}
    for tipo, nombre in TABLAS_TS.items():
        campos = tipos.get(tipo, [])
        if not campos:
            continue
        origen = sql.get(nombre, {}).get("origen", "src/lib/supabase/tipos.ts")
        columnas = []
        for columna, tipo_ts in campos:
            info_sql = sql.get(nombre, {}).get("columnas", {}).get(columna, {})
            columnas.append({
                "nombre": columna,
                "tipo": tipo_ts,
                "notas": info_sql.get("notas", []),
            })
        tablas[nombre] = {"columnas": columnas, "origen": origen}

    total_columnas = sum(len(t["columnas"]) for t in tablas.values())
    reales = [n for n in tablas if n not in VISTAS]
    lineas = [
        "# Tablas",
        "",
        "Esquema leído de `src/lib/supabase/tipos.ts` y de las migraciones. Los",
        "tipos de TypeScript mandan; el SQL aporta `NOT NULL`, `default` y claves",
        "foráneas cuando existen. Los CHECK de estado se ven en el tipo de TS.",
        "",
        f"- **{len(reales)} tablas**, **{len(tablas) - len(reales)} vistas**, "
        f"**{total_columnas} columnas**.",
        "- `solicitudes` y `admins` son anteriores a `supabase/migrations/`; su",
        "  esquema vive en `tipos.ts`.",
        "- Los importes `numeric` llegan como `string`, no como `number`.",
        "",
        "## Tablas",
        "",
        " · ".join(f"[[#{n}]]" for n in sorted(reales)),
        "",
    ]
    for nombre in sorted(reales):
        info = tablas[nombre]
        lineas += [
            f"## {nombre}",
            "",
            f"`{info['origen']}` · {len(info['columnas'])} columnas · "
            f"{_acceso_tabla(nombre, politicas)}",
            "",
            tabla(
                ["Columna", "Tipo", "Notas"],
                [
                    [
                        f"`{c['nombre']}`",
                        f"`{c['tipo']}`",
                        ", ".join(c["notas"]) or "—",
                    ]
                    for c in info["columnas"]
                ],
            ),
            "",
        ]

    lineas += ["## Vistas", ""]
    for nombre in sorted(n for n in tablas if n in VISTAS):
        info = tablas[nombre]
        lineas += [
            f"### {nombre}",
            "",
            f"`{info['origen']}` · solo lectura (`security_invoker`)",
            "",
            tabla(
                ["Columna", "Tipo", "Notas"],
                [
                    [
                        f"`{c['nombre']}`",
                        f"`{c['tipo']}`",
                        ", ".join(c["notas"]) or "—",
                    ]
                    for c in info["columnas"]
                ],
            ),
            "",
        ]

    lineas += [
        "## Funciones",
        "",
        "- `public.crear_plan_con_cuotas(...)` — crea el plan y sus cuotas.",
        "- `public.tocar_actualizado_en()` — trigger `BEFORE UPDATE`.",
        "- `privado.es_admin()` — doctora o recepción.",
        "- `privado.es_doctora()` — solo doctora.",
        "- `privado.rol_actual()` — rol de `auth.uid()`.",
        "",
        "## Reglas",
        "",
        "- RLS activo en todas las tablas; la política es la barrera real.",
        "- `integracion_google`: RLS sin políticas y sin GRANT, solo clave secreta.",
        "- Estados con `CHECK`, no enums de Postgres.",
        "- GRANT por columna; `tipos.ts` refleja lo escribible en `Update`.",
        "- Horas con zona en `timestamptz` (UTC); fechas puras en `date`.",
        "",
        "Ver [[Modelo de datos]] y [[Migraciones]].",
        "",
    ]
    return "\n".join(lineas)


# --------------------------------------------------------------------------
# Índice
# --------------------------------------------------------------------------

def _titulo_nota(archivo: Path) -> str:
    _, cuerpo = separar_frontmatter(leer(archivo))
    for linea in cuerpo.splitlines():
        if linea.startswith("# "):
            return linea[2:].strip()
    return archivo.stem


def render_indice() -> str:
    notas = [
        archivo
        for archivo in BOVEDA.rglob("*.md")
        if ".obsidian" not in archivo.parts and archivo.name != "Indice completo.md"
    ]
    grupos: dict[str, list[Path]] = {}
    for archivo in notas:
        carpeta = archivo.parent.relative_to(BOVEDA).as_posix()
        grupos.setdefault(carpeta, []).append(archivo)

    lineas = [
        "# Índice completo",
        "",
        f"{len(notas)} notas. Ordenadas por carpeta; el nombre del enlace es el",
        "título visible. Las notas `generado` no se editan a mano.",
        "",
    ]
    for carpeta in sorted(grupos):
        lineas += [f"## {carpeta}", ""]
        for archivo in sorted(grupos[carpeta], key=lambda a: a.stem.casefold()):
            datos = parsear_frontmatter(leer(archivo))
            titulo = _titulo_nota(archivo)
            resumen = datos.get("resumen") or RESUMEN_GENERADO.get(archivo.stem)
            enlace = f"[[{archivo.stem}]]" if titulo == archivo.stem else f"[[{archivo.stem}|{titulo}]]"
            if isinstance(resumen, str) and resumen:
                lineas.append(f"- {enlace} — {resumen}")
            else:
                lineas.append(f"- {enlace}")
        lineas.append("")
    return "\n".join(lineas)


# --------------------------------------------------------------------------
# Escritura
# --------------------------------------------------------------------------

def _cuerpo_generado(texto: str) -> str:
    _, cuerpo = separar_frontmatter(texto)
    cuerpo = re.sub(r"^\s*<!--.*?-->\s*", "", cuerpo, count=1, flags=re.S)
    return cuerpo.strip()


def escribir_generada(ruta: Path, cuerpo: str, tags: list[str]) -> bool:
    """Escribe la nota solo si el texto completo cambió. Devuelve si escribió."""
    cuerpo = cuerpo.strip() + "\n"
    huella = hashlib.sha256(cuerpo.encode("utf-8")).hexdigest()[:12]

    # La fecha solo avanza cuando el cuerpo cambia: la del commit no sirve,
    # porque avanza igual aunque la nota no se toque.
    actualizado = date.today().isoformat()
    if ruta.exists():
        datos = parsear_frontmatter(leer(ruta))
        # Si el cuerpo no cambió, se conserva la fecha: así `generar` no
        # reescribe la nota cada día que alguien lo corre sin motivo.
        if datos.get("hash") == huella and datos.get("actualizado"):
            actualizado = str(datos["actualizado"])

    etiquetas = "\n".join(f"  - {t}" for t in tags)
    texto = (
        "---\n"
        "tipo: generado\n"
        "generado_por: scripts/vault/vault.py\n"
        f"hash: {huella}\n"
        f"actualizado: {actualizado}\n"
        "tags:\n"
        f"{etiquetas}\n"
        "---\n\n"
        "<!-- No editar a mano: pnpm boveda:generar -->\n\n"
        f"{cuerpo}"
    )
    if ruta.exists() and leer(ruta) == texto:
        return False
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(texto, encoding="utf-8")
    return True


GENERADAS.extend([
    (NOTA_MAPA, render_mapa, ["proyecto", "generado"]),
    (NOTA_RUTAS, render_rutas, ["panel", "generado"]),
    (NOTA_TABLAS, render_tablas, ["datos", "generado"]),
    (NOTA_INDICE, render_indice, ["indice", "generado"]),
])


# --------------------------------------------------------------------------
# Brief
# --------------------------------------------------------------------------

def brief() -> int:
    """Imprime el mapa de inicio para inyectarlo al abrir una conversación.

    No escribe nada. Es compacto a propósito: la nota de inicio ya contiene el
    mapa; el índice completo se deja en disco para no duplicarlo en el contexto.
    """
    entrada = BOVEDA / "00-Inicio" / "Boveda CBPG.md"
    if not entrada.exists():
        print(
            "No existe `vault/00-Inicio/Boveda CBPG.md`; "
            "corre `python3 scripts/vault/vault.py generar`.",
            file=sys.stderr,
        )
        return 1
    cuerpo = separar_frontmatter(leer(entrada))[1].strip()
    notas = len([
        a for a in BOVEDA.rglob("*.md") if ".obsidian" not in a.parts
    ])
    print(cuerpo)
    print()
    print(f"Bóveda: {notas} notas · índice completo en `vault/00-Inicio/Indice completo.md`.")
    return 0


# --------------------------------------------------------------------------
# Verificación
# --------------------------------------------------------------------------

def _sin_codigo(texto: str) -> str:
    texto = re.sub(r"```.*?```", "", texto, flags=re.S)
    return re.sub(r"`[^`\n]*`", "", texto)


def _encabezados(texto: str) -> set[str]:
    _, cuerpo = separar_frontmatter(texto)
    cuerpo = re.sub(r"```.*?```", "", cuerpo, flags=re.S)
    return {
        normalizar(re.sub(r"\s+", " ", titulo.strip()))
        for titulo in re.findall(r"^#{1,6}[ \t]+(.+?)[ \t]*$", cuerpo, re.M)
    }


def _archivos_boveda() -> dict[str, Path]:
    archivos = {}
    for archivo in BOVEDA.rglob("*"):
        if archivo.is_file() and ".obsidian" not in archivo.parts:
            archivos.setdefault(normalizar(archivo.name), archivo)
            archivos.setdefault(normalizar(archivo.stem), archivo)
    return archivos


def _generadas_esperadas() -> dict[Path, str]:
    return {ruta: render() for ruta, render, _ in GENERADAS}


def verificar() -> int:
    errores: list[str] = []
    avisos: list[str] = []

    notas = [
        archivo for archivo in BOVEDA.rglob("*.md")
        if ".obsidian" not in archivo.parts
    ]
    archivos = _archivos_boveda()
    encabezados = {nota: _encabezados(leer(nota)) for nota in notas}

    vistos: dict[str, Path] = {}
    for nota in notas:
        clave = normalizar(nota.stem)
        if clave in vistos and vistos[clave] != nota:
            errores.append(
                f"nombre duplicado: `{nota.relative_to(BOVEDA)}` y "
                f"`{vistos[clave].relative_to(BOVEDA)}`"
            )
        vistos[clave] = nota

    for nota in notas:
        texto = leer(nota)
        datos = parsear_frontmatter(texto)
        tipo = datos.get("tipo")
        if not tipo:
            errores.append(f"sin `tipo` en el frontmatter: `{nota.relative_to(BOVEDA)}`")
        if tipo != "generado" and not datos.get("resumen"):
            errores.append(f"sin `resumen` en el frontmatter: `{nota.relative_to(BOVEDA)}`")

        cuerpo = _sin_codigo(separar_frontmatter(texto)[1])
        for enlace in re.findall(r"\[\[([^\]]+)\]\]", cuerpo):
            objetivo = enlace.replace("\\|", "|").split("|")[0]
            destino, _, encabezado = objetivo.partition("#")
            destino = destino.split("^")[0].strip()
            if destino.endswith(".md"):
                destino = destino[:-3]
            nota_destino = nota
            if destino:
                clave_destino = normalizar(destino)
                if clave_destino not in archivos:
                    errores.append(
                        f"enlace roto: `{nota.relative_to(BOVEDA)}` → `[[{destino}]]`"
                    )
                    continue
                nota_destino = archivos[clave_destino]
            encabezado = encabezado.split("^")[0].strip()
            if encabezado and normalizar(encabezado) not in encabezados.get(nota_destino, set()):
                errores.append(
                    f"encabezado inexistente: `{nota.relative_to(BOVEDA)}` → "
                    f"`[[{enlace}]]`"
                )

        if tipo != "generado":
            fuentes = datos.get("fuentes") or []
            if isinstance(fuentes, str):
                fuentes = [fuentes]
            actualizado = datos.get("actualizado")
            fecha_nota = None
            if actualizado:
                try:
                    fecha_nota = datetime.strptime(str(actualizado), "%Y-%m-%d").date()
                except ValueError:
                    errores.append(
                        f"fecha inválida en `{nota.relative_to(BOVEDA)}`: {actualizado}"
                    )
            for fuente in fuentes:
                ruta = RAIZ / fuente
                if not ruta.exists():
                    errores.append(
                        f"fuente inexistente: `{nota.relative_to(BOVEDA)}` → `{fuente}`"
                    )
                    continue
                if not fecha_nota or not ruta.is_file():
                    continue
                mtime = datetime.fromtimestamp(ruta.stat().st_mtime).date()
                if mtime > fecha_nota:
                    avisos.append(
                        f"posible desactualización: `{nota.relative_to(BOVEDA)}` "
                        f"(fuente `{fuente}` modificada el {mtime}; nota fechada "
                        f"{fecha_nota})"
                    )

    esperadas = _generadas_esperadas()
    for ruta, cuerpo in esperadas.items():
        if not ruta.exists():
            errores.append(f"falta nota generada: `{ruta.relative_to(BOVEDA)}`")
            continue
        actual = leer(ruta)
        datos = parsear_frontmatter(actual)
        huella = hashlib.sha256((cuerpo.strip() + "\n").encode("utf-8")).hexdigest()[:12]
        if datos.get("hash") != huella or _cuerpo_generado(actual) != cuerpo.strip():
            avisos.append(
                f"nota generada obsoleta o editada: `{ruta.relative_to(BOVEDA)}` "
                "(corre `pnpm boveda:generar`)"
            )

    print(f"Bóveda: {len(notas)} notas")
    print(f"Errores: {len(errores)} · Avisos: {len(avisos)}")
    for error in errores:
        print(f"  ✗ {error}")
    for aviso in avisos:
        print(f"  ! {aviso}")
    return 1 if errores else 0


def generar() -> int:
    cambiadas = 0
    for ruta, render, tags in GENERADAS:
        if escribir_generada(ruta, render(), tags):
            print(f"  ✓ {ruta.relative_to(RAIZ)}")
            cambiadas += 1
        else:
            print(f"  = {ruta.relative_to(RAIZ)} (sin cambios)")
    print(f"\nBóveda generada en {BOVEDA.relative_to(RAIZ)}/ · "
          f"{cambiadas} nota(s) actualizada(s)")
    return 0


def main(argv: list[str]) -> int:
    if len(argv) != 2 or argv[1] not in {"generar", "verificar", "brief"}:
        print(__doc__.strip())
        return 2
    if argv[1] == "generar":
        return generar()
    if argv[1] == "verificar":
        return verificar()
    return brief()


if __name__ == "__main__":
    sys.exit(main(sys.argv))
