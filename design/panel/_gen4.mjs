import { writeFileSync, readFileSync } from 'node:fs';

const src = readFileSync('_gen.mjs', 'utf8');
const CSS = src.slice(src.indexOf('const CSS = `') + 13, src.indexOf('`;\n\nconst doc'));

/* Tablet 768x1024: el sidebar se reduce a un raíl de iconos y las tablas
   pierden las columnas que no caben. Mismos tokens que escritorio. */
const EXTRA = `
  a,button,.pill,.chip{touch-action:manipulation}
  :focus-visible{outline:2px solid var(--accent-deep);outline-offset:3px;border-radius:6px}
  @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

  .shell{grid-template-columns:84px minmax(0,1fr)}
  .rail{background:var(--surface);border-right:1px solid var(--line);
    display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px}
  .rail__marca{width:44px;height:44px;border-radius:14px;background:var(--accent-tint);
    color:var(--accent-deep);display:flex;align-items:center;justify-content:center;
    font-size:15px;font-weight:600;margin-bottom:12px;letter-spacing:.02em}
  .rail a{width:68px;min-height:60px;border-radius:var(--radius-sm);display:flex;
    flex-direction:column;align-items:center;justify-content:center;gap:4px;
    font-size:11px;line-height:1.2;font-weight:500;color:var(--ink-soft);text-align:center;
    transition:background .2s var(--ease),color .2s var(--ease)}
  .rail a:hover{background:var(--bg)}
  .rail a.is-on{background:var(--accent-tint);color:var(--accent-deep);font-weight:600}
  .rail i{display:block;width:22px;height:22px;position:relative}
  .rail svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
  .rail .pto{position:absolute;top:-3px;right:-6px;min-width:17px;height:17px;border-radius:100px;
    background:var(--accent);color:var(--on-accent);font-size:10.5px;font-weight:700;font-style:normal;
    line-height:17px;text-align:center;border:2px solid var(--surface)}
  .rail__pie{margin-top:auto;width:44px;height:44px;border-radius:100px;background:var(--bg-deep);
    color:var(--ink-soft);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600}

  .top{padding:0 24px}
  .main{padding:24px;gap:16px}
  .head h1{font-size:27px}
  .panel{padding:20px 22px}
  .panel--flush{padding:20px 0 0}
  .panel--flush .panel__t{padding:0 16px}
  .tabla th,.tabla td{padding:11px 16px}
  .tabla{font-size:14px}
  .tiles{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
  .tile{padding:16px 18px;gap:4px}
  .tile__v{font-size:27px}
  .filtros{gap:10px}
  .filtros .campo{min-width:150px}
  .campo input,.campo select,.campo textarea{min-height:46px}
  .btn{min-height:44px}
  .btn--chico{min-height:44px;padding:11px 18px}
  .panel__t a{display:inline-flex;align-items:center;min-height:44px;padding-inline:4px}
  .top__mig a{display:inline-flex;align-items:center;min-height:44px}
  .num{text-align:right;font-variant-numeric:tabular-nums}
`;

const ico = {
  home: '<svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
  pac: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c.6-3.7 3.4-5.6 7-5.6s6.4 1.9 7 5.6"/></svg>',
  pro: '<svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 11h8M8 15h5"/></svg>',
  pag: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M6.5 14.5h3"/></svg>',
  cfg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1"/></svg>',
  lupa: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  wa: '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-4A8 8 0 1 1 20 12z"/></svg>',
  atras: '<svg viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>',
};

const rail = (on, badge = 3) => `
  <aside class="rail">
    <div class="rail__marca" title="Dra. [NOMBRE]">Dr</div>
    <nav style="display:flex;flex-direction:column;gap:6px" aria-label="Secciones">
      <a href="#" class="${on === 'home' ? 'is-on' : ''}" ${on === 'home' ? 'aria-current="page"' : ''}><i>${ico.home}</i>Inicio</a>
      <a href="#" class="${on === 'pac' ? 'is-on' : ''}" ${on === 'pac' ? 'aria-current="page"' : ''}><i>${ico.pac}</i>Pacientes</a>
      <a href="#" class="${on === 'pro' ? 'is-on' : ''}" ${on === 'pro' ? 'aria-current="page"' : ''}><i>${ico.pro}<em class="pto">${badge}</em></i>Prospectos</a>
      <a href="#" class="${on === 'pag' ? 'is-on' : ''}" ${on === 'pag' ? 'aria-current="page"' : ''}><i>${ico.pag}</i>Pagos</a>
      <a href="#" style="margin-top:10px"><i>${ico.cfg}</i>Ajustes</a>
    </nav>
    <div class="rail__pie" title="doctora@[DOMINIO]">DR</div>
  </aside>`;

const top = (mig, der = '') => `
    <header class="top">
      <div class="top__mig">${mig}</div>
      <div class="top__der">${der}</div>
    </header>`;

const buscar = (ph) => `<div class="buscar" style="min-width:200px">${ico.lupa}<input type="search" placeholder="${ph}" aria-label="${ph}"></div>`;

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

/* ---------- Inicio ---------- */
writeFileSync('TabletHome.dc.html', doc(`
<div class="shell">
  ${rail('home')}
  <div class="col">
    ${top('Inicio', `<button class="btn btn--chico">+ Registrar pago</button>`)}
    <main class="main">
      <div class="head">
        <div><h1>Buen día, doctora</h1><p>Jueves 4 de septiembre · 6 citas esta semana</p></div>
      </div>

      <div class="tiles">
        <div class="tile"><span class="tile__k">Sin contactar</span><span class="tile__v">3</span><span class="tile__d alta">Prospectos nuevos</span></div>
        <div class="tile"><span class="tile__k">Vencido</span><span class="tile__v">$9,800</span><span class="tile__d alta">4 cuotas</span></div>
        <div class="tile"><span class="tile__k">Cobrado</span><span class="tile__v">$68,400</span><span class="tile__d ok">75% de $91,200</span></div>
        <div class="tile"><span class="tile__k">Pacientes</span><span class="tile__v">42</span><span class="tile__d">+2 este mes</span></div>
      </div>

      <section class="panel panel--flush">
        <div class="panel__t"><h2>Prospectos sin contactar</h2><a href="#">Ver todos</a></div>
        <table class="tabla">
          <thead><tr><th>Prospecto</th><th>Tratamiento</th><th>Recibida</th><th class="acc">Acción</th></tr></thead>
          <tbody>
            <tr><td><span class="nom">Mariana Estrada</span><span class="sec">55 1234 5678</span></td><td>Alineadores invisibles</td><td>Hoy, 09:14</td><td class="acc"><button class="btn btn--chico btn--wa">${ico.wa} WhatsApp</button></td></tr>
            <tr><td><span class="nom">Luis Fernando Cruz</span><span class="sec">55 9876 5432</span></td><td>Brackets estéticos</td><td>Ayer, 18:40</td><td class="acc"><button class="btn btn--chico btn--wa">${ico.wa} WhatsApp</button></td></tr>
                      </tbody>
        </table>
      </section>

      <section class="panel panel--flush">
        <div class="panel__t"><h2>Pagos por cobrar</h2><a href="#">Ir a pagos</a></div>
        <table class="tabla">
          <thead><tr><th>Paciente</th><th>Concepto</th><th>Vence</th><th class="num">Monto</th></tr></thead>
          <tbody>
            <tr><td class="nom">Jorge Palacios</td><td>Mensualidad 7 de 18</td><td><span class="chip chip--vencida">15 ago</span></td><td class="num">$2,450</td></tr>
            <tr><td class="nom">Paola Márquez</td><td>Mensualidad 3 de 24</td><td><span class="chip chip--vencida">28 ago</span></td><td class="num">$2,450</td></tr>
            <tr><td class="nom">Emiliano Ruiz</td><td>Mensualidad 12 de 20</td><td>5 sep</td><td class="num">$2,450</td></tr>
                      </tbody>
        </table>
      </section>
    </main>
  </div>
</div>
`));

/* ---------- Pacientes ---------- */
writeFileSync('TabletPacientes.dc.html', doc(`
<div class="shell">
  ${rail('pac')}
  <div class="col">
    ${top('Pacientes', `<button class="btn btn--chico">+ Nuevo paciente</button>`)}
    <main class="main">
      <div class="head"><div><h1>Pacientes</h1><p>42 activos · 7 en retención · 11 dados de alta</p></div></div>

      <section class="panel">
        <div class="filtros">
          ${buscar('Buscar por nombre o teléfono')}
          <div class="campo"><label>Tratamiento</label><select><option>Todos</option><option>Alineadores invisibles</option><option>Brackets estéticos</option><option>Brackets metálicos</option></select></div>
          <div class="campo"><label>Estado</label><select><option>Activos</option><option>En retención</option><option>Alta</option></select></div>
        </div>
      </section>

      <section class="panel panel--flush">
        <div class="panel__t"><h2>42 pacientes activos</h2><a href="#">Exportar</a></div>
        <table class="tabla">
          <thead><tr><th>Paciente</th><th>Tratamiento</th><th>Avance</th><th class="num">Saldo</th><th>Estado</th></tr></thead>
          <tbody>
            <tr><td><span class="nom"><a href="#">Jorge Palacios</a></span><span class="sec">Desde feb 2026</span></td><td>Brackets metálicos</td><td style="min-width:110px">Mes 7 de 18<div class="barra" style="margin-top:6px"><i style="width:39%"></i></div></td><td class="num">$27,000</td><td><span class="chip chip--vencida">Vencido</span></td></tr>
            <tr><td><span class="nom"><a href="#">Paola Márquez</a></span><span class="sec">Desde jul 2026</span></td><td>Alineadores invisibles</td><td>Mes 3 de 24<div class="barra" style="margin-top:6px"><i style="width:12%"></i></div></td><td class="num">$51,450</td><td><span class="chip chip--vencida">Vencido</span></td></tr>
            <tr><td><span class="nom"><a href="#">Emiliano Ruiz</a></span><span class="sec">Desde sep 2025</span></td><td>Brackets estéticos</td><td>Mes 12 de 20<div class="barra" style="margin-top:6px"><i style="width:60%"></i></div></td><td class="num">$19,600</td><td><span class="chip chip--agendada">Al corriente</span></td></tr>
            <tr><td><span class="nom"><a href="#">Regina Ávalos</a></span><span class="sec">Desde ago 2026</span></td><td>Ortodoncia infantil</td><td>Mes 2 de 18<div class="barra" style="margin-top:6px"><i style="width:11%"></i></div></td><td class="num">$46,400</td><td><span class="chip chip--agendada">Al corriente</span></td></tr>
            
            
          </tbody>
        </table>
      </section>
    </main>
  </div>
</div>
`));

/* ---------- Prospectos ---------- */
writeFileSync('TabletProspectos.dc.html', doc(`
<div class="shell">
  ${rail('pro')}
  <div class="col">
    ${top('Prospectos', `<span style="font-size:13.5px;color:var(--ink-soft)">Del formulario del sitio</span>`)}
    <main class="main">
      <div class="head"><div><h1>Prospectos</h1><p>3 nuevas sin contactar · 57 solicitudes en total</p></div></div>

      <div class="aviso aviso--info">El mensaje que escribe la persona puede contener datos de salud. No lo compartas fuera del panel.</div>

      <section class="panel">
        <div class="filtros">
          ${buscar('Buscar por nombre o teléfono')}
          <div class="campo"><label>Estado</label><select><option>Todos</option><option selected>Nueva</option><option>Contactada</option><option>Agendada</option><option>Descartada</option></select></div>
          <div class="campo"><label>Tratamiento</label><select><option>Todos</option><option>Alineadores invisibles</option><option>Brackets estéticos</option></select></div>
        </div>
      </section>

      <section class="panel panel--flush">
        <div class="panel__t"><h2>Solicitudes</h2><span style="font-size:13.5px;color:var(--ink-soft)">Últimas 200</span></div>
        <table class="tabla">
          <thead><tr><th>Prospecto</th><th>Tratamiento</th><th>Recibida</th><th>Estado</th><th class="acc">Acciones</th></tr></thead>
          <tbody>
            <tr><td><span class="nom"><a href="#">Mariana Estrada</a></span><span class="sec">55 1234 5678</span></td><td>Alineadores invisibles</td><td>Hoy, 09:14</td><td><span class="chip chip--nueva">Nueva</span></td><td class="acc"><button class="btn btn--chico btn--wa">${ico.wa} WhatsApp</button></td></tr>
            <tr><td><span class="nom"><a href="#">Luis Fernando Cruz</a></span><span class="sec">55 9876 5432</span></td><td>Brackets estéticos</td><td>Ayer, 18:40</td><td><span class="chip chip--nueva">Nueva</span></td><td class="acc"><button class="btn btn--chico btn--wa">${ico.wa} WhatsApp</button></td></tr>
            <tr><td><span class="nom"><a href="#">Ana Sofía Rentería</a></span><span class="sec">81 2233 4455</span></td><td>Ortodoncia infantil</td><td>2 sep, 11:05</td><td><span class="chip chip--nueva">Nueva</span></td><td class="acc"><button class="btn btn--chico btn--wa">${ico.wa} WhatsApp</button></td></tr>
            <tr><td><span class="nom"><a href="#">Daniela Ibarra</a></span><span class="sec">55 1010 2020</span></td><td>Brackets metálicos</td><td>28 ago, 12:31</td><td><span class="chip chip--agendada">Agendada</span></td><td class="acc"><button class="btn btn--chico">Convertir</button></td></tr>
            
            
          </tbody>
        </table>
      </section>
    </main>
  </div>
</div>
`));

/* ---------- Pagos ---------- */
writeFileSync('TabletPagos.dc.html', doc(`
<div class="shell">
  ${rail('pag')}
  <div class="col">
    ${top('Pagos', `<button class="btn btn--chico">+ Registrar pago</button>`)}
    <main class="main">
      <div class="head">
        <div><h1>Pagos</h1><p>Septiembre de 2026</p></div>
        <div class="campo"><label>Periodo</label><select><option>Septiembre 2026</option><option>Agosto 2026</option></select></div>
      </div>

      <div class="tiles">
        <div class="tile"><span class="tile__k">Cobrado</span><span class="tile__v">$68,400</span><span class="tile__d ok">75%</span></div>
        <div class="tile"><span class="tile__k">Esperado</span><span class="tile__v">$91,200</span><span class="tile__d">37 cuotas</span></div>
        <div class="tile"><span class="tile__k">Vencido</span><span class="tile__v">$9,800</span><span class="tile__d alta">4 cuotas</span></div>
        <div class="tile"><span class="tile__k">Cargos sueltos</span><span class="tile__v">$7,300</span><span class="tile__d">Retenedores</span></div>
      </div>

      <section class="panel">
        <div class="filtros">
          ${buscar('Buscar por paciente')}
          <div class="campo"><label>Tipo</label><select><option>Todos</option><option>Mensualidad</option><option>Enganche</option><option>Cargo suelto</option></select></div>
          <div class="campo"><label>Estado</label><select><option>Todos</option><option>Pagado</option><option>Pendiente</option><option>Vencido</option></select></div>
        </div>
      </section>

      <section class="panel panel--flush">
        <div class="panel__t"><h2>Movimientos</h2><a href="#">Exportar CSV</a></div>
        <table class="tabla">
          <thead><tr><th>Paciente</th><th>Concepto</th><th>Fecha</th><th class="num">Monto</th><th>Estado</th></tr></thead>
          <tbody>
            <tr><td class="nom">Emiliano Ruiz</td><td>Mensualidad 12 de 20<span class="sec">Transferencia</span></td><td>4 sep</td><td class="num">$2,450</td><td><span class="chip chip--agendada">Pagado</span></td></tr>
            <tr><td class="nom">Daniela Ibarra</td><td>Enganche<span class="sec">Tarjeta</span></td><td>4 sep</td><td class="num">$10,000</td><td><span class="chip chip--agendada">Pagado</span></td></tr>
            <tr><td class="nom">Regina Ávalos</td><td>Mensualidad 2 de 18</td><td>Vence 8 sep</td><td class="num">$2,900</td><td><span class="chip chip--nueva">Pendiente</span></td></tr>
            <tr><td class="nom">Jorge Palacios</td><td>Mensualidad 7 de 18</td><td>Venció 15 ago</td><td class="num">$2,450</td><td><span class="chip chip--vencida">Vencido</span></td></tr>
            <tr><td class="nom">Jorge Palacios</td><td>Retenedor extra<span class="sec">Cargo suelto · efectivo</span></td><td>2 ago</td><td class="num">$1,800</td><td><span class="chip chip--agendada">Pagado</span></td></tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</div>
`));

/* ---------- Ficha de paciente ---------- */
writeFileSync('TabletPaciente.dc.html', doc(`
<div class="shell">
  ${rail('pac')}
  <div class="col">
    ${top('<a href="#">Pacientes</a> · Jorge Palacios', `<button class="btn btn--ghost btn--chico">${ico.wa} WhatsApp</button><button class="btn btn--chico">+ Registrar pago</button>`)}
    <main class="main">
      <div class="head">
        <div><h1>Jorge Palacios</h1><p>Brackets metálicos · desde el 12 de febrero de 2026</p></div>
        <span class="chip chip--vencida">Cuota vencida hace 20 días</span>
      </div>

      <section class="panel">
        <div class="panel__t"><h2>Plan de tratamiento</h2><a href="#">Editar plan</a></div>
        <div class="tiles" style="grid-template-columns:repeat(3,minmax(0,1fr))">
          <div class="tile" style="box-shadow:none;background:var(--bg)"><span class="tile__k">Costo total</span><span class="tile__v" style="font-size:24px">$49,000</span><span class="tile__d">[PRECIO REAL]</span></div>
          <div class="tile" style="box-shadow:none;background:var(--bg)"><span class="tile__k">Pagado</span><span class="tile__v" style="font-size:24px">$22,000</span><span class="tile__d">Enganche + 6 cuotas</span></div>
          <div class="tile" style="box-shadow:none;background:var(--bg)"><span class="tile__k">Saldo</span><span class="tile__v" style="font-size:24px">$27,000</span><span class="tile__d alta">1 cuota vencida</span></div>
        </div>
        <div style="margin-top:16px">
          <div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--ink-soft);margin-bottom:6px"><span>Mes 7 de 18</span><span>45% del plan</span></div>
          <div class="barra"><i style="width:45%"></i></div>
        </div>
      </section>

      <div style="display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px;align-items:start">
        <section class="panel panel--flush">
          <div class="panel__t"><h2>Historial de pagos</h2><a href="#">Ver todo</a></div>
          <table class="tabla">
            <thead><tr><th>Concepto</th><th>Fecha</th><th class="num">Monto</th></tr></thead>
            <tbody>
              <tr><td>Mensualidad 7 de 18<span class="sec"><span class="chip chip--vencida">Vencida</span></span></td><td>15 ago</td><td class="num">$2,450</td></tr>
              <tr><td>Retenedor extra<span class="sec">Efectivo</span></td><td>2 ago</td><td class="num">$1,800</td></tr>
              <tr><td>Mensualidad 6 de 18<span class="sec">Transferencia</span></td><td>15 jul</td><td class="num">$2,450</td></tr>
              <tr><td>Enganche<span class="sec">Transferencia</span></td><td>12 feb</td><td class="num">$10,000</td></tr>
            </tbody>
          </table>
        </section>

        <div style="display:flex;flex-direction:column;gap:16px">
          <section class="panel">
            <div class="panel__t"><h2>Datos</h2><a href="#">Editar</a></div>
            <dl class="datos" style="font-size:14.5px">
              <dt>Teléfono</dt><dd>55 4411 2200</dd>
              <dt>Inicio</dt><dd>12 feb 2026</dd>
              <dt>Fin estimado</dt><dd>ago 2027</dd>
              <dt>Origen</dt><dd><a href="#">Solicitud del sitio</a></dd>
            </dl>
          </section>
          <section class="panel">
            <div class="panel__t"><h2>Notas privadas</h2></div>
            <div style="background:var(--bg);border-radius:var(--radius-sm);padding:14px;font-size:14.5px;white-space:pre-wrap">Prefiere citas por la tarde. Pidió dividir la mensualidad de agosto en dos partes.</div>
          </section>
        </div>
      </div>
    </main>
  </div>
</div>
`));

/* ---------- Registrar pago ---------- */
writeFileSync('TabletRegistrarPago.dc.html', doc(`
<div style="background:rgba(38,34,29,.28);min-height:100%;display:flex;align-items:center;justify-content:center;padding:28px">
  <div class="panel" style="width:100%;max-width:600px;box-shadow:var(--shadow-md);padding:26px 28px">
    <div class="panel__t" style="margin-bottom:6px"><h2 style="font-size:22px">Registrar pago</h2><a href="#" aria-label="Cerrar">Cerrar</a></div>
    <p style="margin:0 0 18px;color:var(--ink-soft);font-size:14.5px">Queda asentado en la ficha del paciente y en la vista de Pagos.</p>

    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="campo"><label for="tp">Paciente</label><select id="tp"><option>Jorge Palacios · Brackets metálicos</option><option>Paola Márquez · Alineadores invisibles</option></select></div>
      <div class="campo"><label for="tc">Concepto</label>
        <select id="tc"><option>Mensualidad 7 de 18 — vencida el 15 ago ($2,450)</option><option>Mensualidad 8 de 18 — vence el 15 sep</option><option>Cargo suelto</option></select>
        <span class="ayuda">Se rellena el monto del plan. Ajústalo si fue un abono parcial.</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="campo"><label for="tm">Monto (MXN)</label><input id="tm" type="text" inputmode="decimal" value="2,450.00" style="font-variant-numeric:tabular-nums"></div>
        <div class="campo"><label for="tf">Fecha del pago</label><input id="tf" type="date" value="2026-09-04"></div>
      </div>
      <div class="campo"><label id="tl">Método</label>
        <div style="display:flex;gap:10px;flex-wrap:wrap" role="radiogroup" aria-labelledby="tl">
          <span class="btn btn--ghost btn--chico" role="radio" aria-checked="true" style="border-color:var(--accent);background:var(--accent-tint);color:var(--accent-deep)">Efectivo</span>
          <span class="btn btn--ghost btn--chico" role="radio" aria-checked="false">Transferencia</span>
          <span class="btn btn--ghost btn--chico" role="radio" aria-checked="false">Tarjeta</span>
        </div>
      </div>
      <div class="campo"><label for="tn">Nota <span style="font-weight:400;color:var(--ink-soft)">(opcional)</span></label><textarea id="tn" placeholder="Abono parcial, acordado por WhatsApp…"></textarea></div>
      <div class="aviso aviso--info">Saldo después de este pago: <b>$24,550</b> · queda 1 cuota vencida.</div>
      <div style="display:flex;justify-content:flex-end;gap:12px;padding-top:2px">
        <button class="btn btn--ghost">Cancelar</button>
        <button class="btn">Guardar pago</button>
      </div>
    </div>
  </div>
</div>
`));

console.log('tablet ok — 6 pantallas');
