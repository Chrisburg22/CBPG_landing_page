import { writeFileSync, readFileSync } from 'node:fs';

// reutiliza el CSS del generador de pantallas
const src = readFileSync('_gen.mjs', 'utf8');
const CSS = src.slice(src.indexOf('const CSS = `') + 13, src.indexOf('`;\n\nconst doc'));

const EXTRA = `
  .lienzo{padding:34px 38px;display:flex;flex-direction:column;gap:26px;min-height:100%}
  .lienzo h1{font-size:28px}
  .lienzo .sub{margin:6px 0 0;color:var(--ink-soft);font-size:14.5px;max-width:74ch}
  .fila{display:flex;align-items:stretch;gap:0;flex-wrap:wrap}
  .caja{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-sm);
        padding:14px 16px;min-width:172px;max-width:216px;box-shadow:var(--shadow-sm)}
  .caja b{display:block;font-size:15px;font-weight:600;margin-bottom:4px}
  .caja span{font-size:13px;color:var(--ink-soft);line-height:1.45;display:block}
  .caja--ini{background:var(--ink);border-color:var(--ink)}
  .caja--ini b{color:var(--on-accent)} .caja--ini span{color:#a59c8d}
  .caja--acc{background:var(--accent-tint);border-color:#c3d8d3}
  .caja--acc b{color:var(--accent-deep)}
  .caja--fin{background:#e4efdf;border-color:#c9debf} .caja--fin b{color:#3f6b32}
  .caja--mal{background:#f8e7e2;border-color:#eccfc6} .caja--mal b{color:#b4452e}
  .caja--esp{background:var(--bg);border-style:dashed}
  .flecha{align-self:center;display:flex;align-items:center;gap:6px;padding:0 12px;color:var(--ink-soft);font-size:12.5px;white-space:nowrap}
  .flecha::after{content:"";width:26px;height:1px;background:var(--line);position:relative}
  .flecha svg{width:14px;height:14px;stroke:var(--ink-soft);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .rama{display:flex;flex-direction:column;gap:12px}
  .nota{font-size:13px;color:var(--ink-soft);background:var(--bg);border-left:0;border:1px solid var(--line);
        border-radius:var(--radius-sm);padding:12px 15px;max-width:80ch}
  .nota code,code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em;
        background:var(--accent-tint);color:var(--accent-deep);border-radius:5px;padding:1px 5px}
  .tabla-def{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-sm);
        box-shadow:var(--shadow-sm);min-width:246px;overflow:hidden}
  .tabla-def h3{font-size:14.5px;padding:11px 15px;border-bottom:1px solid var(--line);background:var(--bg);
        letter-spacing:.04em;font-family:ui-monospace,Menlo,monospace;font-weight:600}
  .tabla-def h3 em{font-style:normal;float:right;font-family:system-ui,sans-serif;font-size:11.5px;
        letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}
  .tabla-def ul{margin:0;padding:10px 15px 13px;list-style:none;font-size:13px;
        font-family:ui-monospace,Menlo,monospace;line-height:1.85;color:var(--ink-soft)}
  .tabla-def li b{color:var(--ink);font-weight:600}
  .tabla-def--nueva{border-color:#c3d8d3} .tabla-def--nueva h3{background:var(--accent-tint);color:var(--accent-deep)}
`;

const ar = (t = '') => `<div class="flecha"><span>${t}</span><svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg></div>`;

const doc = (body) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>${CSS}${EXTRA}</style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;

/* --- 9. Flujo prospecto --- */
writeFileSync('FlujoProspecto.dc.html', doc(`
<div class="lienzo">
  <div>
    <h1>Flujo: de prospecto a paciente</h1>
    <p class="sub">Los cuatro estados son los que ya existen hoy en la columna <code>estado</code> de <code>solicitudes</code> (CHECK, no enum). Lo único nuevo es la conversión a paciente.</p>
  </div>

  <div class="fila">
    <div class="caja caja--ini"><b>Formulario del sitio</b><span>nombre, teléfono, tratamiento, mensaje, consentimiento</span></div>
    ${ar('POST /api/contact')}
    <div class="caja"><b>solicitudes</b><span>estado = <code>nueva</code><br>llega al panel</span></div>
    ${ar('la doctora escribe')}
    <div class="caja caja--acc"><b>WhatsApp</b><span>mensaje prellenado desde la ficha</span></div>
    ${ar()}
    <div class="caja"><b>contactada</b><span>quedó constancia de que ya se le escribió</span></div>
  </div>

  <div class="fila" style="padding-left:42px">
    <div class="caja caja--esp"><b>¿Responde?</b><span>decisión de la doctora</span></div>
    ${ar('sí, quiere cita')}
    <div class="rama">
      <div class="fila">
        <div class="caja"><b>agendada</b><span>tiene cita de valoración</span></div>
        ${ar('acepta tratamiento')}
        <div class="caja caja--fin"><b>Convertir en paciente</b><span>crea la ficha y hereda nombre, teléfono y tratamiento</span></div>
        ${ar()}
        <div class="caja caja--fin"><b>Alta del plan</b><span>total, enganche y nº de mensualidades</span></div>
      </div>
      <div class="fila">
        <div class="caja caja--mal"><b>descartada</b><span>no contesta, no le interesa o no es candidato</span></div>
        <div class="flecha" style="padding-left:16px"><span>se puede reabrir a <code>contactada</code></span></div>
      </div>
    </div>
  </div>

  <div class="nota"><b>Reglas que ya rigen hoy:</b> el panel solo puede actualizar <code>estado</code> y <code>notas</code> (GRANT por columna). La solicitud original nunca se borra al convertir — el paciente guarda un <code>solicitud_id</code> para conservar la trazabilidad y la versión del aviso de privacidad aceptada.</div>
</div>
`));

/* --- 10. Flujo pago --- */
writeFileSync('FlujoPago.dc.html', doc(`
<div class="lienzo">
  <div>
    <h1>Flujo: plan de pagos y cobros</h1>
    <p class="sub">Dos caminos que conviven: las mensualidades del plan (se generan solas al dar de alta el tratamiento) y los cargos sueltos (retenedor, radiografía, urgencia).</p>
  </div>

  <div class="fila">
    <div class="caja caja--ini"><b>Alta del plan</b><span>costo total · enganche · nº de mensualidades · día de corte</span></div>
    ${ar('automático')}
    <div class="caja caja--acc"><b>Se generan las cuotas</b><span>una fila por mensualidad con su fecha de vencimiento</span></div>
    ${ar()}
    <div class="caja"><b>cuota · pendiente</b><span>aparece en «Pagos por cobrar»</span></div>
  </div>

  <div class="fila" style="padding-left:42px">
    <div class="caja caja--esp"><b>¿Pagó a tiempo?</b></div>
    ${ar('sí')}
    <div class="rama">
      <div class="fila">
        <div class="caja caja--acc"><b>Registrar pago</b><span>monto, método, fecha, nota</span></div>
        ${ar()}
        <div class="caja caja--fin"><b>cuota · pagada</b><span>baja el saldo del paciente y sube el cobrado del mes</span></div>
      </div>
      <div class="fila">
        <div class="caja caja--mal"><b>cuota · vencida</b><span>pasó la fecha sin pago</span></div>
        ${ar('recordatorio')}
        <div class="caja caja--acc"><b>WhatsApp de cobro</b><span>vuelve al registro de pago cuando abone</span></div>
      </div>
    </div>
  </div>

  <div class="fila">
    <div class="caja caja--ini"><b>Cargo suelto</b><span>retenedor, radiografía, urgencia · fuera del plan</span></div>
    ${ar('se cobra en el momento')}
    <div class="caja caja--fin"><b>pago · pagado</b><span>entra al total del mes, no toca el saldo del plan</span></div>
  </div>

  <div class="nota"><b>Abonos parciales:</b> si el paciente paga menos que la cuota, el pago se guarda con su monto real y la cuota queda <code>parcial</code> con el resto pendiente. El saldo del paciente siempre es <code>total del plan − suma de pagos</code>, nunca un número escrito a mano.</div>
</div>
`));

/* --- 11. Modelo de datos --- */
writeFileSync('ModeloDatos.dc.html', doc(`
<div class="lienzo">
  <div>
    <h1>Modelo de datos propuesto</h1>
    <p class="sub"><code>solicitudes</code> y <code>admins</code> ya existen en Supabase. Las cuatro tablas marcadas como nuevas son la propuesta a aprobar antes de escribir la migración.</p>
  </div>

  <div class="fila" style="align-items:flex-start;gap:0">
    <div class="tabla-def">
      <h3>solicitudes <em>existe</em></h3>
      <ul>
        <li><b>id</b> uuid PK</li>
        <li>nombre · telefono</li>
        <li>tratamiento</li>
        <li>mensaje <span style="color:#b4452e">(salud)</span></li>
        <li>estado · notas</li>
        <li>consentimiento_en</li>
        <li>aviso_version</li>
        <li>creado_en</li>
      </ul>
    </div>
    ${ar('convertir')}
    <div class="tabla-def tabla-def--nueva">
      <h3>pacientes <em>nueva</em></h3>
      <ul>
        <li><b>id</b> uuid PK</li>
        <li><b>solicitud_id</b> FK null</li>
        <li>nombre · telefono</li>
        <li>estado activo·retencion·<br>&nbsp;&nbsp;alta·pausado</li>
        <li>notas</li>
        <li>creado_en</li>
      </ul>
    </div>
    ${ar('1 : N')}
    <div class="tabla-def tabla-def--nueva">
      <h3>planes_tratamiento <em>nueva</em></h3>
      <ul>
        <li><b>id</b> uuid PK</li>
        <li><b>paciente_id</b> FK</li>
        <li>tratamiento</li>
        <li>costo_total · enganche</li>
        <li>num_cuotas · dia_corte</li>
        <li>inicio · fin_estimado</li>
      </ul>
    </div>
  </div>

  <div class="fila" style="align-items:flex-start;padding-left:300px">
    <div class="tabla-def tabla-def--nueva">
      <h3>cuotas <em>nueva</em></h3>
      <ul>
        <li><b>id</b> uuid PK</li>
        <li><b>plan_id</b> FK</li>
        <li>numero · monto</li>
        <li>vence_el</li>
        <li>estado pendiente·parcial·<br>&nbsp;&nbsp;pagada·vencida</li>
      </ul>
    </div>
    ${ar('1 : N')}
    <div class="tabla-def tabla-def--nueva">
      <h3>pagos <em>nueva</em></h3>
      <ul>
        <li><b>id</b> uuid PK</li>
        <li><b>paciente_id</b> FK</li>
        <li><b>cuota_id</b> FK null</li>
        <li>tipo mensualidad·enganche·<br>&nbsp;&nbsp;cargo_suelto</li>
        <li>concepto · monto</li>
        <li>metodo · pagado_el</li>
        <li>nota · creado_en</li>
      </ul>
    </div>
    <div class="flecha" style="padding-left:18px"><span><code>cuota_id</code> nulo = cargo suelto</span></div>
  </div>

  <div class="nota"><b>Por decidir antes de migrar:</b> ¿el saldo y el estado de las cuotas se calculan en vistas de Postgres (siempre correctos, cero desincronización) o se guardan en columnas? Recomiendo vistas. Y RLS con la misma allowlist de <code>admins</code> que ya protege <code>solicitudes</code> — ninguna de estas tablas debe ser legible por el rol anónimo.</div>
</div>
`));

console.log('flujos ok');
