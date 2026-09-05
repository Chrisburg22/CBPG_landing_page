import { writeFileSync } from 'node:fs';

const CSS = `
  :root{
    --bg:#f5f1ea; --bg-deep:#efe9df; --surface:#fffdf9; --ink:#26221d; --ink-soft:#6f675c;
    --line:#e3dccf; --accent:#2f7d75; --accent-deep:#245f59; --accent-tint:#e2ebe7; --on-accent:#fbfaf6;
    --radius:18px; --radius-sm:12px; --radius-lg:28px;
    --shadow-sm:0 1px 2px rgba(38,34,29,.04), 0 6px 18px rgba(38,34,29,.05);
    --shadow-md:0 4px 12px rgba(38,34,29,.06), 0 24px 48px rgba(38,34,29,.09);
    --ease:cubic-bezier(.2,.8,.2,1);
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg-deep);color:var(--ink);
    font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:16px;line-height:1.6;
    -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
  a{color:var(--accent-deep);text-decoration:none} a:hover{color:var(--accent)}
  h1,h2,h3,h4{margin:0;font-weight:600;line-height:1.15;letter-spacing:-.01em}

  /* shell */
  .shell{display:grid;grid-template-columns:248px minmax(0,1fr);min-height:100%}
  .side{background:var(--surface);border-right:1px solid var(--line);display:flex;flex-direction:column;gap:26px;padding:20px 16px}
  .side__marca{display:flex;align-items:center;gap:10px;padding:6px 10px 0}
  .side__marca b{font-size:19px;font-weight:600;letter-spacing:-.01em}
  .side__marca span{display:block;font-size:12px;color:var(--ink-soft);letter-spacing:.04em}
  .nav{display:flex;flex-direction:column;gap:4px}
  .nav__t{font-size:11.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);padding:0 12px 8px}
  .nav a{display:flex;align-items:center;gap:11px;padding:11px 12px;border-radius:var(--radius-sm);
    font-size:15px;font-weight:500;color:var(--ink);transition:background .25s var(--ease)}
  .nav a:hover{background:var(--bg)}
  .nav a.is-on{background:var(--accent-tint);color:var(--accent-deep);font-weight:600}
  .nav a .n{margin-left:auto;font-size:12.5px;font-weight:600;background:var(--accent);color:var(--on-accent);
    border-radius:100px;padding:1px 8px}
  .nav svg{width:20px;height:20px;flex:none;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
  .side__pie{margin-top:auto;border-top:1px solid var(--line);padding:14px 12px 4px;font-size:13px;color:var(--ink-soft)}
  .side__pie b{display:block;color:var(--ink);font-size:14px;font-weight:600}

  .col{display:flex;flex-direction:column;min-width:0}
  .top{background:var(--surface);border-bottom:1px solid var(--line);min-height:62px;
    display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 30px}
  .top__mig{font-size:13.5px;color:var(--ink-soft)}
  .top__der{display:flex;align-items:center;gap:12px}
  .main{padding:30px;display:flex;flex-direction:column;gap:20px}

  .head{display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:16px}
  .head h1{font-size:32px}
  .head p{margin:6px 0 0;color:var(--ink-soft);font-size:14.5px}

  .panel{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);
    padding:24px 26px;box-shadow:var(--shadow-sm)}
  .panel--flush{padding:24px 0 0}
  .panel__t{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
  .panel--flush .panel__t{padding:0 26px}
  .panel__t h2{font-size:19px}
  .panel__t a{font-size:14px;font-weight:600}

  /* botones */
  .btn{display:inline-flex;align-items:center;gap:9px;border:1px solid transparent;border-radius:100px;
    font:inherit;font-size:16px;font-weight:600;padding:15px 26px;cursor:pointer;
    background:var(--accent);color:var(--on-accent);box-shadow:0 8px 22px -10px var(--accent);
    transition:box-shadow .25s var(--ease),background .25s var(--ease)}
  .btn:hover{box-shadow:0 14px 30px -12px var(--accent)}
  .btn--ghost{background:transparent;color:var(--ink);border-color:var(--line);box-shadow:none}
  .btn--ghost:hover{background:var(--bg);box-shadow:none}
  .btn--chico{padding:9px 16px;font-size:14px}
  .btn--wa{background:#178043;color:#fff;box-shadow:0 12px 30px -8px rgba(23,128,67,.55)}

  /* campos */
  .campo{display:flex;flex-direction:column}
  .campo label{font-size:14px;font-weight:600;margin-bottom:7px}
  .campo input,.campo select,.campo textarea,.buscar input{font:inherit;font-size:16px;padding:13px 15px;
    border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--bg);color:var(--ink)}
  .campo input:focus,.campo select:focus,.campo textarea:focus,.buscar input:focus{
    outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-tint)}
  .campo textarea{resize:vertical;min-height:88px}
  .campo .ayuda{font-size:12.5px;color:var(--ink-soft);margin-top:6px}
  .filtros{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap}
  .filtros .campo{min-width:190px}
  .buscar{position:relative;flex:1;min-width:230px}
  .buscar input{width:100%;padding-left:42px}
  .buscar svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:18px;height:18px;
    stroke:var(--ink-soft);fill:none;stroke-width:1.7}

  /* tiles */
  .tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
  .tile{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);
    padding:20px 22px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:6px}
  .tile__k{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}
  .tile__v{font-size:36px;font-weight:600;letter-spacing:-.02em;line-height:1.05}
  .tile__d{font-size:13px;color:var(--ink-soft)}
  .tile__d.alta{color:#b4452e;font-weight:600}
  .tile__d.ok{color:#3f6b32;font-weight:600}

  /* tabla */
  .tabla{width:100%;border-collapse:collapse;font-size:14.5px}
  .tabla th,.tabla td{text-align:left;padding:13px 26px;border-bottom:1px solid var(--line);vertical-align:top}
  .tabla th{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);white-space:nowrap}
  .tabla tbody tr:hover{background:var(--bg)}
  .tabla tbody tr:last-child td{border-bottom:0}
  .tabla .num{text-align:right;font-variant-numeric:tabular-nums}
  .tabla .acc{text-align:right;white-space:nowrap}
  .sec{color:var(--ink-soft);font-size:13px;display:block;margin-top:3px}
  .nom{font-weight:600}

  /* chips */
  .chip{display:inline-block;font-size:12.5px;font-weight:600;padding:4px 11px;border-radius:100px;border:1px solid transparent;white-space:nowrap}
  .chip--nueva{background:var(--accent-tint);color:var(--accent-deep);border-color:#c3d8d3}
  .chip--contactada{background:#fdf1dc;color:#8a5c15;border-color:#ecd9b0}
  .chip--agendada{background:#e4efdf;color:#3f6b32;border-color:#c9debf}
  .chip--descartada{background:#efece7;color:var(--ink-soft);border-color:var(--line)}
  .chip--vencida{background:#f8e7e2;color:#b4452e;border-color:#eccfc6}

  .aviso{border-radius:var(--radius-sm);padding:12px 16px;font-size:14.5px;border:1px solid}
  .aviso--info{background:var(--accent-tint);border-color:#c3d8d3;color:var(--accent-deep)}
  .aviso--error{background:#f8e7e2;border-color:#eccfc6;color:#b4452e}

  .barra{height:6px;border-radius:100px;background:var(--bg-deep);overflow:hidden}
  .barra i{display:block;height:100%;background:var(--accent);border-radius:100px}

  .datos{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:10px 20px;font-size:15px;margin:0}
  .datos dt{font-size:13.5px;color:var(--ink-soft)}
  .datos dd{margin:0}
`;

const doc = (body, extra = '') => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>${CSS}${extra}</style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;

const ico = {
  home: '<svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
  pac: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c.6-3.7 3.4-5.6 7-5.6s6.4 1.9 7 5.6"/></svg>',
  pro: '<svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 11h8M8 15h5"/></svg>',
  pag: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M6.5 14.5h3"/></svg>',
  cfg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1"/></svg>',
  lupa: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  wa: '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor"><path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-4A8 8 0 1 1 20 12z"/></svg>',
};

const side = (on, badge = 3) => `
  <aside class="side">
    <div class="side__marca">
      <div><b>Dra. [NOMBRE]</b><span>Panel de consultorio</span></div>
    </div>
    <nav class="nav">
      <div class="nav__t">Consultorio</div>
      <a href="#" class="${on === 'home' ? 'is-on' : ''}">${ico.home} Inicio</a>
      <a href="#" class="${on === 'pac' ? 'is-on' : ''}">${ico.pac} Pacientes</a>
      <a href="#" class="${on === 'pro' ? 'is-on' : ''}">${ico.pro} Prospectos <span class="n">${badge}</span></a>
      <a href="#" class="${on === 'pag' ? 'is-on' : ''}">${ico.pag} Pagos</a>
    </nav>
    <nav class="nav">
      <div class="nav__t">Cuenta</div>
      <a href="#">${ico.cfg} Ajustes</a>
    </nav>
    <div class="side__pie"><b>Dra. [NOMBRE]</b>doctora@[DOMINIO]<br><a href="#">Cerrar sesión</a></div>
  </aside>`;

const top = (mig, der) => `
    <header class="top">
      <div class="top__mig">${mig}</div>
      <div class="top__der">${der}</div>
    </header>`;

const buscar = (ph) => `<div class="buscar">${ico.lupa}<input type="search" placeholder="${ph}"></div>`;

/* ---------------- 1. Home ---------------- */
writeFileSync('Main.dc.html', doc(`
<div class="shell">
  ${side('home')}
  <div class="col">
    ${top('Inicio', `<button class="btn btn--chico">+ Registrar pago</button>`)}
    <main class="main">
      <div class="head">
        <div>
          <h1>Buen día, doctora</h1>
          <p>Jueves 4 de septiembre · 6 citas agendadas esta semana</p>
        </div>
        <button class="btn btn--ghost btn--chico">Ver agenda</button>
      </div>

      <div class="tiles">
        <div class="tile"><span class="tile__k">Prospectos nuevos</span><span class="tile__v">3</span><span class="tile__d alta">Sin contactar</span></div>
        <div class="tile"><span class="tile__k">Pacientes activos</span><span class="tile__v">42</span><span class="tile__d">+2 este mes</span></div>
        <div class="tile"><span class="tile__k">Cobrado en septiembre</span><span class="tile__v">$68,400</span><span class="tile__d ok">de $91,200 esperado</span></div>
        <div class="tile"><span class="tile__k">Cuotas vencidas</span><span class="tile__v">4</span><span class="tile__d alta">$9,800 por cobrar</span></div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:20px">
        <section class="panel panel--flush">
          <div class="panel__t"><h2>Prospectos sin contactar</h2><a href="#">Ver todos</a></div>
          <table class="tabla">
            <thead><tr><th>Prospecto</th><th>Tratamiento</th><th>Recibida</th><th class="acc">Acción</th></tr></thead>
            <tbody>
              <tr><td><span class="nom">Mariana Estrada</span><span class="sec">55 1234 5678</span></td><td>Alineadores invisibles</td><td>Hoy, 09:14</td><td class="acc"><button class="btn btn--chico btn--wa">${ico.wa} WhatsApp</button></td></tr>
              <tr><td><span class="nom">Luis Fernando Cruz</span><span class="sec">55 9876 5432</span></td><td>Brackets estéticos</td><td>Ayer, 18:40</td><td class="acc"><button class="btn btn--chico btn--wa">${ico.wa} WhatsApp</button></td></tr>
              <tr><td><span class="nom">Ana Sofía Rentería</span><span class="sec">81 2233 4455</span></td><td>Ortodoncia infantil</td><td>2 sep, 11:05</td><td class="acc"><button class="btn btn--chico btn--wa">${ico.wa} WhatsApp</button></td></tr>
            </tbody>
          </table>
        </section>

        <section class="panel panel--flush">
          <div class="panel__t"><h2>Pagos por cobrar</h2><a href="#">Ir a pagos</a></div>
          <table class="tabla">
            <thead><tr><th>Paciente</th><th>Vence</th><th class="num">Monto</th></tr></thead>
            <tbody>
              <tr><td><span class="nom">Jorge Palacios</span><span class="sec">Mensualidad 7 de 18</span></td><td><span class="chip chip--vencida">15 ago</span></td><td class="num">$2,450</td></tr>
              <tr><td><span class="nom">Paola Márquez</span><span class="sec">Mensualidad 3 de 24</span></td><td><span class="chip chip--vencida">28 ago</span></td><td class="num">$2,450</td></tr>
              <tr><td><span class="nom">Emiliano Ruiz</span><span class="sec">Mensualidad 12 de 20</span></td><td>5 sep</td><td class="num">$2,450</td></tr>
              <tr><td><span class="nom">Regina Ávalos</span><span class="sec">Mensualidad 2 de 18</span></td><td>8 sep</td><td class="num">$2,900</td></tr>
            </tbody>
          </table>
        </section>
      </div>

      <section class="panel">
        <div class="panel__t"><h2>Actividad reciente</h2></div>
        <div style="display:flex;flex-direction:column;gap:12px;font-size:14.5px">
          <div style="display:flex;gap:14px"><span style="color:var(--ink-soft);min-width:96px">Hoy, 10:02</span><span>Pago de <b>$2,450</b> registrado a <a href="#">Emiliano Ruiz</a> · transferencia</span></div>
          <div style="display:flex;gap:14px"><span style="color:var(--ink-soft);min-width:96px">Hoy, 09:20</span><span><a href="#">Daniela Ibarra</a> pasó de prospecto a <b>paciente activa</b> · Brackets metálicos</span></div>
          <div style="display:flex;gap:14px"><span style="color:var(--ink-soft);min-width:96px">Ayer, 17:35</span><span>Solicitud de <a href="#">Luis Fernando Cruz</a> marcada como <span class="chip chip--contactada">contactada</span></span></div>
        </div>
      </section>
    </main>
  </div>
</div>
`));

/* ---------------- 2. Pacientes ---------------- */
writeFileSync('Pacientes.dc.html', doc(`
<div class="shell">
  ${side('pac')}
  <div class="col">
    ${top('Pacientes', `<button class="btn btn--chico">+ Nuevo paciente</button>`)}
    <main class="main">
      <div class="head">
        <div><h1>Pacientes</h1><p>42 activos · 7 en retención · 11 dados de alta</p></div>
      </div>

      <section class="panel">
        <div class="filtros">
          ${buscar('Buscar por nombre o teléfono')}
          <div class="campo"><label>Tratamiento</label><select><option>Todos</option><option>Alineadores invisibles</option><option>Brackets estéticos</option><option>Brackets metálicos</option><option>Ortodoncia infantil</option></select></div>
          <div class="campo"><label>Estado</label><select><option>Activos</option><option>En retención</option><option>Alta</option><option>Pausados</option></select></div>
          <div class="campo"><label>Saldo</label><select><option>Cualquiera</option><option>Con adeudo vencido</option><option>Al corriente</option></select></div>
        </div>
      </section>

      <section class="panel panel--flush">
        <div class="panel__t"><h2>42 pacientes activos</h2><a href="#">Exportar</a></div>
        <table class="tabla">
          <thead><tr><th>Paciente</th><th>Tratamiento</th><th>Inicio</th><th>Avance</th><th class="num">Saldo</th><th>Estado</th><th class="acc"></th></tr></thead>
          <tbody>
            <tr><td><span class="nom"><a href="#">Jorge Palacios</a></span><span class="sec">55 4411 2200</span></td><td>Brackets metálicos</td><td>12 feb 2026</td><td style="min-width:130px">Mes 7 de 18<div class="barra" style="margin-top:6px"><i style="width:39%"></i></div></td><td class="num">$27,000</td><td><span class="chip chip--vencida">Vencido</span></td><td class="acc"><a href="#">Ver ficha</a></td></tr>
            <tr><td><span class="nom"><a href="#">Paola Márquez</a></span><span class="sec">55 7788 1122</span></td><td>Alineadores invisibles</td><td>2 jul 2026</td><td>Mes 3 de 24<div class="barra" style="margin-top:6px"><i style="width:12%"></i></div></td><td class="num">$51,450</td><td><span class="chip chip--vencida">Vencido</span></td><td class="acc"><a href="#">Ver ficha</a></td></tr>
            <tr><td><span class="nom"><a href="#">Emiliano Ruiz</a></span><span class="sec">55 3322 9900</span></td><td>Brackets estéticos</td><td>20 sep 2025</td><td>Mes 12 de 20<div class="barra" style="margin-top:6px"><i style="width:60%"></i></div></td><td class="num">$19,600</td><td><span class="chip chip--agendada">Al corriente</span></td><td class="acc"><a href="#">Ver ficha</a></td></tr>
            <tr><td><span class="nom"><a href="#">Regina Ávalos</a></span><span class="sec">81 5566 3344</span></td><td>Ortodoncia infantil</td><td>15 ago 2026</td><td>Mes 2 de 18<div class="barra" style="margin-top:6px"><i style="width:11%"></i></div></td><td class="num">$46,400</td><td><span class="chip chip--agendada">Al corriente</span></td><td class="acc"><a href="#">Ver ficha</a></td></tr>
            <tr><td><span class="nom"><a href="#">Daniela Ibarra</a></span><span class="sec">55 1010 2020</span></td><td>Brackets metálicos</td><td>4 sep 2026</td><td>Mes 1 de 18<div class="barra" style="margin-top:6px"><i style="width:5%"></i></div></td><td class="num">$38,500</td><td><span class="chip chip--nueva">Recién iniciado</span></td><td class="acc"><a href="#">Ver ficha</a></td></tr>
            <tr><td><span class="nom"><a href="#">Héctor Nava</a></span><span class="sec">55 6677 8899</span></td><td>Alineadores invisibles</td><td>10 ene 2025</td><td>Mes 20 de 20<div class="barra" style="margin-top:6px"><i style="width:100%"></i></div></td><td class="num">$0</td><td><span class="chip chip--descartada">En retención</span></td><td class="acc"><a href="#">Ver ficha</a></td></tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</div>
`));

/* ---------------- 3. Paciente detalle ---------------- */
writeFileSync('PacienteDetalle.dc.html', doc(`
<div class="shell">
  ${side('pac')}
  <div class="col">
    ${top('<a href="#">Pacientes</a> · Jorge Palacios', `<button class="btn btn--ghost btn--chico">${ico.wa} WhatsApp</button><button class="btn btn--chico">+ Registrar pago</button>`)}
    <main class="main">
      <div class="head">
        <div><h1>Jorge Palacios</h1><p>Brackets metálicos · paciente desde el 12 de febrero de 2026 · viene de una solicitud del sitio</p></div>
        <span class="chip chip--vencida">Cuota vencida hace 20 días</span>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:20px;align-items:start">
        <div style="display:flex;flex-direction:column;gap:20px">
          <section class="panel">
            <div class="panel__t"><h2>Plan de tratamiento</h2><a href="#">Editar plan</a></div>
            <div class="tiles" style="grid-template-columns:repeat(3,minmax(0,1fr));gap:14px">
              <div class="tile" style="box-shadow:none;background:var(--bg)"><span class="tile__k">Costo total</span><span class="tile__v" style="font-size:27px">$49,000</span><span class="tile__d">[PRECIO REAL]</span></div>
              <div class="tile" style="box-shadow:none;background:var(--bg)"><span class="tile__k">Pagado</span><span class="tile__v" style="font-size:27px">$22,000</span><span class="tile__d">Enganche + 6 cuotas</span></div>
              <div class="tile" style="box-shadow:none;background:var(--bg)"><span class="tile__k">Saldo</span><span class="tile__v" style="font-size:27px">$27,000</span><span class="tile__d alta">1 cuota vencida</span></div>
            </div>
            <div style="margin-top:18px">
              <div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--ink-soft);margin-bottom:6px"><span>Mes 7 de 18</span><span>45% del plan</span></div>
              <div class="barra"><i style="width:45%"></i></div>
            </div>
          </section>

          <section class="panel panel--flush">
            <div class="panel__t"><h2>Historial de pagos</h2><a href="#">Ver todo</a></div>
            <table class="tabla">
              <thead><tr><th>Concepto</th><th>Fecha</th><th>Método</th><th class="num">Monto</th><th>Estado</th></tr></thead>
              <tbody>
                <tr><td>Mensualidad 7 de 18</td><td>15 ago 2026</td><td>—</td><td class="num">$2,450</td><td><span class="chip chip--vencida">Vencida</span></td></tr>
                <tr><td>Retenedor extra</td><td>2 ago 2026</td><td>Efectivo</td><td class="num">$1,800</td><td><span class="chip chip--agendada">Pagado</span></td></tr>
                <tr><td>Mensualidad 6 de 18</td><td>15 jul 2026</td><td>Transferencia</td><td class="num">$2,450</td><td><span class="chip chip--agendada">Pagado</span></td></tr>
                <tr><td>Mensualidad 5 de 18</td><td>14 jun 2026</td><td>Tarjeta</td><td class="num">$2,450</td><td><span class="chip chip--agendada">Pagado</span></td></tr>
                <tr><td>Enganche</td><td>12 feb 2026</td><td>Transferencia</td><td class="num">$10,000</td><td><span class="chip chip--agendada">Pagado</span></td></tr>
              </tbody>
            </table>
          </section>
        </div>

        <div style="display:flex;flex-direction:column;gap:20px">
          <section class="panel">
            <div class="panel__t"><h2>Datos</h2><a href="#">Editar</a></div>
            <dl class="datos">
              <dt>Teléfono</dt><dd>55 4411 2200</dd>
              <dt>Tratamiento</dt><dd>Brackets metálicos</dd>
              <dt>Inicio</dt><dd>12 feb 2026</dd>
              <dt>Fin estimado</dt><dd>ago 2027</dd>
              <dt>Origen</dt><dd><a href="#">Solicitud del sitio</a></dd>
              <dt>Aviso</dt><dd>Aceptado v2026-02-01</dd>
            </dl>
          </section>
          <section class="panel">
            <div class="panel__t"><h2>Notas privadas</h2></div>
            <div style="background:var(--bg);border-radius:var(--radius-sm);padding:16px;font-size:15px;white-space:pre-wrap">Prefiere citas por la tarde. Pidió dividir la mensualidad de agosto en dos partes; quedó de confirmar por WhatsApp.</div>
            <p style="font-size:12.5px;color:var(--ink-soft);margin:10px 0 0">Solo visibles para la doctora. No incluir datos clínicos sensibles que no hagan falta aquí.</p>
          </section>
        </div>
      </div>
    </main>
  </div>
</div>
`));

/* ---------------- 4. Prospectos ---------------- */
writeFileSync('Prospectos.dc.html', doc(`
<div class="shell">
  ${side('pro')}
  <div class="col">
    ${top('Prospectos', `<span style="font-size:13.5px;color:var(--ink-soft)">Del formulario del sitio</span>`)}
    <main class="main">
      <div class="head">
        <div><h1>Prospectos</h1><p>3 nuevas sin contactar · 57 solicitudes en total</p></div>
      </div>

      <div class="aviso aviso--info">El mensaje que escribe la persona puede contener datos de salud. No lo compartas fuera del panel.</div>

      <section class="panel">
        <div class="filtros">
          ${buscar('Buscar por nombre o teléfono')}
          <div class="campo"><label>Estado</label><select><option>Todos</option><option selected>Nueva</option><option>Contactada</option><option>Agendada</option><option>Descartada</option></select></div>
          <div class="campo"><label>Tratamiento</label><select><option>Todos</option><option>Alineadores invisibles</option><option>Brackets estéticos</option><option>Brackets metálicos</option><option>Ortodoncia infantil</option><option>Aún no estoy seguro/a</option></select></div>
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
            <tr><td><span class="nom"><a href="#">Daniela Ibarra</a></span><span class="sec">55 1010 2020</span></td><td>Brackets metálicos</td><td>28 ago, 12:31</td><td><span class="chip chip--agendada">Agendada</span></td><td class="acc"><button class="btn btn--chico">Convertir en paciente</button></td></tr>
            <tr><td><span class="nom"><a href="#">Rodrigo Serrano</a></span><span class="sec">55 4455 6677</span></td><td>Aún no estoy seguro/a</td><td>27 ago, 20:02</td><td><span class="chip chip--contactada">Contactada</span></td><td class="acc"><a href="#">Ver detalle</a></td></tr>
            <tr><td><span class="nom"><a href="#">Carmen Delgado</a></span><span class="sec">33 8899 1010</span></td><td>Alineadores invisibles</td><td>25 ago, 08:47</td><td><span class="chip chip--descartada">Descartada</span></td><td class="acc"><a href="#">Ver detalle</a></td></tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</div>
`));

/* ---------------- 5. Pagos ---------------- */
writeFileSync('Pagos.dc.html', doc(`
<div class="shell">
  ${side('pag')}
  <div class="col">
    ${top('Pagos', `<button class="btn btn--chico">+ Registrar pago</button>`)}
    <main class="main">
      <div class="head">
        <div><h1>Pagos</h1><p>Septiembre de 2026</p></div>
        <div class="filtros"><div class="campo"><label>Periodo</label><select><option>Septiembre 2026</option><option>Agosto 2026</option><option>Este año</option></select></div></div>
      </div>

      <div class="tiles">
        <div class="tile"><span class="tile__k">Cobrado</span><span class="tile__v">$68,400</span><span class="tile__d ok">75% de lo esperado</span></div>
        <div class="tile"><span class="tile__k">Esperado del mes</span><span class="tile__v">$91,200</span><span class="tile__d">37 cuotas programadas</span></div>
        <div class="tile"><span class="tile__k">Vencido</span><span class="tile__v">$9,800</span><span class="tile__d alta">4 cuotas de 4 pacientes</span></div>
        <div class="tile"><span class="tile__k">Cargos sueltos</span><span class="tile__v">$7,300</span><span class="tile__d">Retenedores y urgencias</span></div>
      </div>

      <section class="panel">
        <div class="filtros">
          ${buscar('Buscar por paciente')}
          <div class="campo"><label>Tipo</label><select><option>Todos</option><option>Mensualidad</option><option>Enganche</option><option>Cargo suelto</option></select></div>
          <div class="campo"><label>Estado</label><select><option>Todos</option><option>Pagado</option><option>Pendiente</option><option>Vencido</option></select></div>
          <div class="campo"><label>Método</label><select><option>Todos</option><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option></select></div>
        </div>
      </section>

      <section class="panel panel--flush">
        <div class="panel__t"><h2>Movimientos</h2><a href="#">Exportar CSV</a></div>
        <table class="tabla">
          <thead><tr><th>Paciente</th><th>Concepto</th><th>Tipo</th><th>Fecha</th><th>Método</th><th class="num">Monto</th><th>Estado</th></tr></thead>
          <tbody>
            <tr><td class="nom">Emiliano Ruiz</td><td>Mensualidad 12 de 20</td><td>Mensualidad</td><td>4 sep 2026</td><td>Transferencia</td><td class="num">$2,450</td><td><span class="chip chip--agendada">Pagado</span></td></tr>
            <tr><td class="nom">Daniela Ibarra</td><td>Enganche</td><td>Enganche</td><td>4 sep 2026</td><td>Tarjeta</td><td class="num">$10,000</td><td><span class="chip chip--agendada">Pagado</span></td></tr>
            <tr><td class="nom">Regina Ávalos</td><td>Mensualidad 2 de 18</td><td>Mensualidad</td><td>Vence 8 sep</td><td>—</td><td class="num">$2,900</td><td><span class="chip chip--nueva">Pendiente</span></td></tr>
            <tr><td class="nom">Jorge Palacios</td><td>Mensualidad 7 de 18</td><td>Mensualidad</td><td>Venció 15 ago</td><td>—</td><td class="num">$2,450</td><td><span class="chip chip--vencida">Vencido</span></td></tr>
            <tr><td class="nom">Jorge Palacios</td><td>Retenedor extra</td><td>Cargo suelto</td><td>2 ago 2026</td><td>Efectivo</td><td class="num">$1,800</td><td><span class="chip chip--agendada">Pagado</span></td></tr>
            <tr><td class="nom">Paola Márquez</td><td>Mensualidad 3 de 24</td><td>Mensualidad</td><td>Venció 28 ago</td><td>—</td><td class="num">$2,450</td><td><span class="chip chip--vencida">Vencido</span></td></tr>
            <tr><td class="nom">Héctor Nava</td><td>Radiografía de control</td><td>Cargo suelto</td><td>29 ago 2026</td><td>Efectivo</td><td class="num">$950</td><td><span class="chip chip--agendada">Pagado</span></td></tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</div>
`));

/* ---------------- 6. Registrar pago ---------------- */
writeFileSync('RegistrarPago.dc.html', doc(`
<div style="background:rgba(38,34,29,.28);min-height:100%;display:flex;align-items:center;justify-content:center;padding:28px">
  <div class="panel" style="width:100%;max-width:600px;box-shadow:var(--shadow-md);padding:28px 30px">
    <div class="panel__t" style="margin-bottom:6px"><h2 style="font-size:23px">Registrar pago</h2><a href="#" aria-label="Cerrar">Cerrar</a></div>
    <p style="margin:0 0 20px;color:var(--ink-soft);font-size:14.5px">Queda asentado en la ficha del paciente y en la vista de Pagos.</p>

    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="campo"><label for="p">Paciente</label><select id="p"><option>Jorge Palacios · Brackets metálicos</option><option>Paola Márquez · Alineadores invisibles</option><option>Emiliano Ruiz · Brackets estéticos</option></select></div>

      <div class="campo"><label for="c">Concepto</label>
        <select id="c"><option>Mensualidad 7 de 18 — vencida el 15 ago ($2,450)</option><option>Mensualidad 8 de 18 — vence el 15 sep ($2,450)</option><option>Enganche</option><option>Cargo suelto (retenedor, radiografía, urgencia…)</option></select>
        <span class="ayuda">Al elegir una mensualidad se rellena el monto del plan; puedes ajustarlo si fue un abono parcial.</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="campo"><label for="m">Monto (MXN)</label><input id="m" type="text" value="2,450.00"></div>
        <div class="campo"><label for="f">Fecha del pago</label><input id="f" type="date" value="2026-09-04"></div>
      </div>

      <div class="campo"><label>Método</label>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <span class="btn btn--ghost btn--chico" style="border-color:var(--accent);background:var(--accent-tint);color:var(--accent-deep)">Efectivo</span>
          <span class="btn btn--ghost btn--chico">Transferencia</span>
          <span class="btn btn--ghost btn--chico">Tarjeta</span>
        </div>
      </div>

      <div class="campo"><label for="n">Nota (opcional)</label><textarea id="n" placeholder="Abono parcial, acordado por WhatsApp…"></textarea></div>

      <div class="aviso aviso--info">Saldo después de este pago: <b>$24,550</b> · queda 1 cuota vencida.</div>

      <div style="display:flex;justify-content:flex-end;gap:12px;padding-top:4px">
        <button class="btn btn--ghost">Cancelar</button>
        <button class="btn">Guardar pago</button>
      </div>
    </div>
  </div>
</div>
`));

/* ---------------- 7. Sidebar ---------------- */
writeFileSync('Sidebar.dc.html', doc(`
<div style="display:flex;height:100%;background:var(--bg-deep)">
  <div style="width:248px;display:flex;background:var(--surface)">${side('pro').replace('<aside class="side">','<aside class="side" style="flex:1;border-right:1px solid var(--line)">')}</div>
  <div style="padding:24px;font-size:14px;color:var(--ink-soft);max-width:230px">
    <p style="margin:0 0 12px"><b style="color:var(--ink)">Estados</b></p>
    <p style="margin:0 0 10px">Reposo: sin fondo.</p>
    <p style="margin:0 0 10px">Hover: fondo <code>--bg</code>.</p>
    <p style="margin:0 0 10px">Activo: fondo <code>--accent-tint</code>, texto <code>--accent-deep</code>, peso 600.</p>
    <p style="margin:0">El contador de prospectos nuevos usa <code>--accent</code> sobre <code>--on-accent</code>.</p>
  </div>
</div>
`));

/* ---------------- 8. Mobile home ---------------- */
writeFileSync('MobileHome.dc.html', doc(`
<div style="min-height:100%;background:var(--bg-deep);display:flex;flex-direction:column">
  <header style="background:var(--surface);border-bottom:1px solid var(--line);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0">
    <div><b style="font-size:17px">Dra. [NOMBRE]</b><span style="display:block;font-size:12px;color:var(--ink-soft)">Panel de consultorio</span></div>
    <button class="btn btn--ghost" style="padding:11px;min-width:44px;min-height:44px;justify-content:center" aria-label="Menú">
      <svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </header>

  <main style="padding:18px;display:flex;flex-direction:column;gap:16px;flex:1">
    <div><h1 style="font-size:26px">Buen día, doctora</h1><p style="margin:6px 0 0;color:var(--ink-soft);font-size:14px">Jueves 4 de septiembre</p></div>

    <div class="tiles" style="grid-template-columns:1fr 1fr;gap:12px">
      <div class="tile" style="padding:16px"><span class="tile__k">Prospectos nuevos</span><span class="tile__v" style="font-size:30px">3</span><span class="tile__d alta">Sin contactar</span></div>
      <div class="tile" style="padding:16px"><span class="tile__k">Cuotas vencidas</span><span class="tile__v" style="font-size:30px">4</span><span class="tile__d alta">$9,800</span></div>
      <div class="tile" style="padding:16px"><span class="tile__k">Pacientes activos</span><span class="tile__v" style="font-size:30px">42</span><span class="tile__d">+2 este mes</span></div>
      <div class="tile" style="padding:16px"><span class="tile__k">Cobrado</span><span class="tile__v" style="font-size:30px">$68.4k</span><span class="tile__d ok">de $91.2k</span></div>
    </div>

    <section class="panel" style="padding:18px">
      <div class="panel__t"><h2 style="font-size:17px">Sin contactar</h2><a href="#">Ver todos</a></div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
          <div><span class="nom">Mariana Estrada</span><span class="sec">Alineadores · hoy 09:14</span></div>
          <button class="btn btn--wa" style="padding:12px 16px;font-size:14px;min-height:44px">${ico.wa} WhatsApp</button>
        </div>
        <div style="height:1px;background:var(--line)"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
          <div><span class="nom">Luis F. Cruz</span><span class="sec">Brackets estéticos · ayer</span></div>
          <button class="btn btn--wa" style="padding:12px 16px;font-size:14px;min-height:44px">${ico.wa} WhatsApp</button>
        </div>
      </div>
    </section>

    <section class="panel" style="padding:18px">
      <div class="panel__t"><h2 style="font-size:17px">Por cobrar</h2><a href="#">Pagos</a></div>
      <div style="display:flex;flex-direction:column;gap:12px;font-size:14.5px">
        <div style="display:flex;justify-content:space-between;gap:10px"><span><b>Jorge Palacios</b><span class="sec">Mensualidad 7 de 18</span></span><span style="text-align:right"><b>$2,450</b><span class="sec"><span class="chip chip--vencida">15 ago</span></span></span></div>
        <div style="display:flex;justify-content:space-between;gap:10px"><span><b>Paola Márquez</b><span class="sec">Mensualidad 3 de 24</span></span><span style="text-align:right"><b>$2,450</b><span class="sec"><span class="chip chip--vencida">28 ago</span></span></span></div>
      </div>
    </section>
  </main>

  <nav style="background:var(--surface);border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(4,1fr);padding:8px 6px 14px">
    <a href="#" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;min-height:44px;font-size:11.5px;font-weight:600;color:var(--accent-deep)"><span style="display:block;width:22px;height:22px">${ico.home}</span>Inicio</a>
    <a href="#" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;min-height:44px;font-size:11.5px;font-weight:500;color:var(--ink-soft)"><span style="display:block;width:22px;height:22px">${ico.pac}</span>Pacientes</a>
    <a href="#" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;min-height:44px;font-size:11.5px;font-weight:500;color:var(--ink-soft)"><span style="display:block;width:22px;height:22px">${ico.pro}</span>Prospectos</a>
    <a href="#" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;min-height:44px;font-size:11.5px;font-weight:500;color:var(--ink-soft)"><span style="display:block;width:22px;height:22px">${ico.pag}</span>Pagos</a>
  </nav>
</div>
`, `
  nav svg{width:22px;height:22px}
`));

console.log('pantallas ok');
