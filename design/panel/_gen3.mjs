import { writeFileSync, readFileSync } from 'node:fs';

const src = readFileSync('_gen.mjs', 'utf8');
const CSS = src.slice(src.indexOf('const CSS = `') + 13, src.indexOf('`;\n\nconst doc'));

/* Sistema movil. Owner de las 7 pantallas Mobile*.dc.html
   (incluida MobileHome, que _gen.mjs escribe primero y este sobreescribe). */
const EXTRA = `
  /* --- base movil --- */
  html,body{-webkit-text-size-adjust:100%}
  a,button,.pill,.chip{touch-action:manipulation}
  :focus-visible{outline:2px solid var(--accent-deep);outline-offset:3px;border-radius:6px}
  @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

  .m{min-height:100%;background:var(--bg-deep);display:flex;flex-direction:column}

  /* --- cabecera --- */
  .m__top{background:var(--surface);border-bottom:1px solid var(--line);
    padding:10px 16px calc(10px);padding-top:calc(10px + env(safe-area-inset-top));
    display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:20;min-height:56px}
  .m__top h1{font-size:20px;line-height:1.25;flex:1;min-width:0}
  .m__sub{margin:2px 0 0;color:var(--ink-soft);font-size:13px;line-height:1.35}
  .m__icono{display:inline-flex;align-items:center;justify-content:center;
    width:44px;height:44px;flex:none;border-radius:100px;border:1px solid transparent;
    background:transparent;color:var(--ink);cursor:pointer;
    transition:background .18s var(--ease),transform .18s var(--ease)}
  .m__icono:active{background:var(--bg);transform:scale(.94)}
  .m__icono--pri{background:var(--accent);color:var(--on-accent);box-shadow:0 8px 22px -10px var(--accent)}
  .m__icono--pri:active{background:var(--accent-deep)}
  .m__icono--wa{background:#178043;color:#fff;box-shadow:0 12px 30px -8px rgba(23,128,67,.55)}
  .m__icono svg{width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .m__atras{margin-left:-10px}

  /* --- cuerpo: reserva sitio para las barras fijas --- */
  .m__main{padding:16px;padding-bottom:12px;display:flex;flex-direction:column;gap:12px;flex:1;
    overscroll-behavior:contain}

  /* --- barra de pestanas --- */
  .m__nav{background:var(--surface);border-top:1px solid var(--line);display:grid;
    grid-template-columns:repeat(4,1fr);gap:4px;padding:6px 6px;position:sticky;bottom:0;z-index:20;
    padding-bottom:calc(6px + env(safe-area-inset-bottom))}
  .m__nav a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
    min-height:52px;padding:6px 4px;border-radius:var(--radius-sm);
    font-size:11px;line-height:1.2;font-weight:500;color:var(--ink-soft);text-align:center;
    transition:background .18s var(--ease),color .18s var(--ease)}
  .m__nav a:active{background:var(--bg)}
  .m__nav a.is-on{color:var(--accent-deep);font-weight:600}
  .m__nav a.is-on .ind{opacity:1}
  .m__nav .ind{display:block;width:20px;height:3px;border-radius:100px;background:var(--accent);
    opacity:0;margin-bottom:1px}
  .m__nav i{display:block;width:22px;height:22px;position:relative}
  .m__nav svg{width:22px;height:22px;display:block}
  .m__nav .pto{position:absolute;top:-2px;right:-5px;min-width:17px;height:17px;border-radius:100px;
    background:var(--accent);color:var(--on-accent);font-size:10.5px;font-weight:700;font-style:normal;
    line-height:17px;text-align:center;border:2px solid var(--surface)}

  /* --- barra de accion fija --- */
  .m__pie{background:var(--surface);border-top:1px solid var(--line);position:sticky;bottom:0;z-index:20;
    padding:12px 16px;padding-bottom:calc(12px + env(safe-area-inset-bottom));display:flex;gap:10px}

  /* --- filtros --- */
  .m__filtros{display:flex;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;
    margin:0 -16px;padding:2px 16px 4px;scrollbar-width:none}
  .m__filtros::-webkit-scrollbar{display:none}
  .pill{flex:none;border:1px solid var(--line);background:var(--surface);border-radius:100px;
    padding:0 16px;min-height:44px;font-size:14px;font-weight:600;color:var(--ink-soft);
    display:inline-flex;align-items:center;gap:7px;cursor:pointer;
    transition:background .18s var(--ease),border-color .18s var(--ease),transform .18s var(--ease)}
  .pill:active{transform:scale(.96)}
  .pill.is-on{background:var(--accent-tint);border-color:#c3d8d3;color:var(--accent-deep)}
  .pill .n{font-variant-numeric:tabular-nums;background:var(--accent);color:var(--on-accent);
    border-radius:100px;font-size:11.5px;padding:1px 7px}
  .buscar input{min-height:48px}

  /* --- lista de tarjetas --- */
  .lista{display:flex;flex-direction:column;gap:10px}
  .item{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);
    box-shadow:var(--shadow-sm);padding:14px 16px;display:flex;flex-direction:column;gap:10px;
    transition:box-shadow .2s var(--ease),transform .2s var(--ease)}
  .item:active{transform:scale(.985);box-shadow:var(--shadow-md)}
  .item__fila{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
  .item__nom{font-size:16px;font-weight:600;line-height:1.3;display:block}
  .item__meta{font-size:13px;line-height:1.45;color:var(--ink-soft);display:block;margin-top:2px}
  .item__monto{font-size:17px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;line-height:1.3}
  .item__acc{display:flex;gap:10px;flex-wrap:wrap;padding-top:2px}
  .item__acc .btn{min-height:44px;padding:11px 16px;font-size:14px}
  .item .barra{margin:0}
  .item__pie{display:flex;align-items:center;justify-content:space-between;gap:10px;
    border-top:1px solid var(--line);margin:0 -16px -2px;padding:10px 16px 0}

  /* estados vacio */
  .vacio{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);
    box-shadow:var(--shadow-sm);padding:40px 24px;text-align:center;display:flex;
    flex-direction:column;align-items:center;gap:10px}
  .vacio svg{width:40px;height:40px;stroke:var(--accent);fill:none;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;opacity:.85}
  .vacio h3{font-size:17px}
  .vacio p{margin:0;font-size:14px;color:var(--ink-soft);max-width:34ch;line-height:1.55}

  /* esqueleto de carga */
  .sk{background:var(--bg-deep);border-radius:8px;height:13px;animation:sk 1.4s var(--ease) infinite}
  .sk--t{height:17px;width:58%} .sk--s{width:76%} .sk--m{width:34%;margin-left:auto}
  @keyframes sk{0%,100%{opacity:1}50%{opacity:.45}}

  .panel__t a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding-inline:6px}
  .m__seccion{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
    color:var(--ink-soft);margin:4px 0 -4px}
`;

const ico = {
  home: '<svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
  pac: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c.6-3.7 3.4-5.6 7-5.6s6.4 1.9 7 5.6"/></svg>',
  pro: '<svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 11h8M8 15h5"/></svg>',
  pag: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M6.5 14.5h3"/></svg>',
  lupa: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  wa: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-4A8 8 0 1 1 20 12z"/></svg>',
  waChico: '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-4A8 8 0 1 1 20 12z"/></svg>',
  atras: '<svg viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>',
  mas: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  buzon: '<svg viewBox="0 0 24 24"><path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.4 6.6 3 13v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5l-2.4-6.4A1.5 1.5 0 0 0 17.2 6H6.8a1.5 1.5 0 0 0-1.4.6z"/></svg>',
};

const nav = (on, badge = 3) => `
  <nav class="m__nav" aria-label="Secciones">
    <a href="#" class="${on === 'home' ? 'is-on' : ''}" ${on === 'home' ? 'aria-current="page"' : ''}><span class="ind"></span><i>${ico.home}</i>Inicio</a>
    <a href="#" class="${on === 'pac' ? 'is-on' : ''}" ${on === 'pac' ? 'aria-current="page"' : ''}><span class="ind"></span><i>${ico.pac}</i>Pacientes</a>
    <a href="#" class="${on === 'pro' ? 'is-on' : ''}" ${on === 'pro' ? 'aria-current="page"' : ''}><span class="ind"></span><i>${ico.pro}<em class="pto">${badge}</em></i>Prospectos</a>
    <a href="#" class="${on === 'pag' ? 'is-on' : ''}" ${on === 'pag' ? 'aria-current="page"' : ''}><span class="ind"></span><i>${ico.pag}</i>Pagos</a>
  </nav>`;

const buscar = (ph) => `<div class="buscar">${ico.lupa}<input type="search" placeholder="${ph}" aria-label="${ph}"></div>`;

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
writeFileSync('MobileHome.dc.html', doc(`
<div class="m">
  <header class="m__top">
    <div style="flex:1;min-width:0">
      <h1>Buen día, doctora</h1>
      <p class="m__sub">Jueves 4 de septiembre</p>
    </div>
    <button class="m__icono m__icono--pri" aria-label="Registrar pago">${ico.mas}</button>
  </header>

  <main class="m__main">
    <p class="m__seccion">Necesita tu atención</p>
    <div class="tiles" style="grid-template-columns:1fr 1fr;gap:10px">
      <div class="tile" style="padding:14px 16px;gap:2px"><span class="tile__k">Sin contactar</span><span class="tile__v" style="font-size:30px">3</span><span class="tile__d alta">Prospectos nuevos</span></div>
      <div class="tile" style="padding:14px 16px;gap:2px"><span class="tile__k">Vencido</span><span class="tile__v" style="font-size:30px">$9,800</span><span class="tile__d alta">4 cuotas</span></div>
    </div>

    <p class="m__seccion">El mes</p>
    <div class="tiles" style="grid-template-columns:1fr 1fr;gap:10px">
      <div class="tile" style="padding:13px 16px;gap:2px"><span class="tile__k">Cobrado</span><span class="tile__v" style="font-size:24px">$68,400</span><span class="tile__d ok">75% de $91,200</span></div>
      <div class="tile" style="padding:13px 16px;gap:2px"><span class="tile__k">Pacientes</span><span class="tile__v" style="font-size:24px">42</span><span class="tile__d">+2 este mes</span></div>
    </div>

    <section class="panel" style="padding:14px 16px">
      <div class="panel__t" style="margin-bottom:10px"><h2 style="font-size:17px">Sin contactar</h2><a href="#">Ver 3</a></div>
      <div class="lista">
        <div class="item" style="box-shadow:none;padding:12px 14px">
          <div class="item__fila">
            <div style="min-width:0"><span class="item__nom">Mariana Estrada</span><span class="item__meta">Alineadores · hoy 09:14</span></div>
            <button class="m__icono m__icono--wa" style="width:44px;height:44px" aria-label="Escribir a Mariana Estrada por WhatsApp">${ico.wa}</button>
          </div>
        </div>
        <div class="item" style="box-shadow:none;padding:12px 14px">
          <div class="item__fila">
            <div style="min-width:0"><span class="item__nom">Luis Fernando Cruz</span><span class="item__meta">Brackets estéticos · ayer</span></div>
            <button class="m__icono m__icono--wa" style="width:44px;height:44px" aria-label="Escribir a Luis Fernando Cruz por WhatsApp">${ico.wa}</button>
          </div>
        </div>
      </div>
    </section>

    <section class="panel" style="padding:14px 16px">
      <div class="panel__t" style="margin-bottom:10px"><h2 style="font-size:17px">Por cobrar</h2><a href="#">Ver pagos</a></div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom" style="font-size:15px">Jorge Palacios</span><span class="item__meta">Mensualidad 7 de 18</span></div>
          <div style="text-align:right"><span class="item__monto">$2,450</span><span class="item__meta" style="margin-top:4px"><span class="chip chip--vencida">Venció 15 ago</span></span></div>
        </div>
      </div>
    </section>
  </main>
  ${nav('home')}
</div>
`));

/* ---------- Pacientes ---------- */
writeFileSync('MobilePacientes.dc.html', doc(`
<div class="m">
  <header class="m__top">
    <div style="flex:1;min-width:0"><h1>Pacientes</h1><p class="m__sub">42 activos</p></div>
    <button class="m__icono m__icono--pri" aria-label="Nuevo paciente">${ico.mas}</button>
  </header>
  <main class="m__main">
    ${buscar('Buscar paciente')}
    <div class="m__filtros" role="group" aria-label="Filtros">
      <span class="pill is-on">Activos <span class="n">42</span></span>
      <span class="pill">Con adeudo <span class="n">4</span></span>
      <span class="pill">En retención</span>
      <span class="pill">Alta</span>
    </div>

    <div class="lista">
      <div class="item">
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom">Jorge Palacios</span><span class="item__meta">Brackets metálicos · mes 7 de 18</span></div>
          <span class="chip chip--vencida">Vencido</span>
        </div>
        <div class="barra"><i style="width:39%"></i></div>
        <div class="item__pie"><span class="item__meta" style="margin:0">Saldo</span><span class="item__monto">$27,000</span></div>
      </div>

      <div class="item">
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom">Paola Márquez</span><span class="item__meta">Alineadores invisibles · mes 3 de 24</span></div>
          <span class="chip chip--vencida">Vencido</span>
        </div>
        <div class="barra"><i style="width:12%"></i></div>
        <div class="item__pie"><span class="item__meta" style="margin:0">Saldo</span><span class="item__monto">$51,450</span></div>
      </div>

      <div class="item">
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom">Emiliano Ruiz</span><span class="item__meta">Brackets estéticos · mes 12 de 20</span></div>
          <span class="chip chip--agendada">Al corriente</span>
        </div>
        <div class="barra"><i style="width:60%"></i></div>
        <div class="item__pie"><span class="item__meta" style="margin:0">Saldo</span><span class="item__monto">$19,600</span></div>
      </div>

      <div class="item" aria-busy="true">
        <div class="item__fila" style="flex-direction:column;gap:9px;align-items:stretch">
          <div class="sk sk--t"></div><div class="sk sk--s"></div>
        </div>
        <div class="sk sk--m"></div>
      </div>
    </div>
  </main>
  ${nav('pac')}
</div>
`));

/* ---------- Prospectos ---------- */
writeFileSync('MobileProspectos.dc.html', doc(`
<div class="m">
  <header class="m__top">
    <div style="flex:1;min-width:0"><h1>Prospectos</h1><p class="m__sub">3 sin contactar · 57 en total</p></div>
  </header>
  <main class="m__main">
    ${buscar('Buscar por nombre o teléfono')}
    <div class="m__filtros" role="group" aria-label="Filtros">
      <span class="pill is-on">Nuevas <span class="n">3</span></span>
      <span class="pill">Contactadas</span>
      <span class="pill">Agendadas</span>
      <span class="pill">Descartadas</span>
      <span class="pill">Todas</span>
    </div>

    <div class="lista">
      <div class="item">
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom">Mariana Estrada</span><span class="item__meta">Alineadores invisibles</span><span class="item__meta">55 1234 5678 · hoy 09:14</span></div>
          <span class="chip chip--nueva">Nueva</span>
        </div>
        <div class="item__acc">
          <button class="btn btn--wa" style="flex:1;justify-content:center">${ico.waChico} WhatsApp</button>
          <button class="btn btn--ghost">Ver ficha</button>
        </div>
      </div>

      <div class="item">
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom">Luis Fernando Cruz</span><span class="item__meta">Brackets estéticos</span><span class="item__meta">55 9876 5432 · ayer 18:40</span></div>
          <span class="chip chip--nueva">Nueva</span>
        </div>
        <div class="item__acc">
          <button class="btn btn--wa" style="flex:1;justify-content:center">${ico.waChico} WhatsApp</button>
          <button class="btn btn--ghost">Ver ficha</button>
        </div>
      </div>

      <div class="item">
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom">Daniela Ibarra</span><span class="item__meta">Brackets metálicos</span><span class="item__meta">55 1010 2020 · 28 ago 12:31</span></div>
          <span class="chip chip--agendada">Agendada</span>
        </div>
        <div class="item__acc">
          <button class="btn" style="flex:1;justify-content:center">Convertir en paciente</button>
        </div>
      </div>
    </div>
  </main>
  ${nav('pro')}
</div>
`));

/* ---------- Prospectos: vacio ---------- */
writeFileSync('MobileVacio.dc.html', doc(`
<div class="m">
  <header class="m__top">
    <div style="flex:1;min-width:0"><h1>Prospectos</h1><p class="m__sub">Ninguna solicitud sin contactar</p></div>
  </header>
  <main class="m__main">
    ${buscar('Buscar por nombre o teléfono')}
    <div class="m__filtros" role="group" aria-label="Filtros">
      <span class="pill is-on">Nuevas</span>
      <span class="pill">Contactadas</span>
      <span class="pill">Agendadas</span>
      <span class="pill">Descartadas</span>
      <span class="pill">Todas</span>
    </div>

    <div class="vacio">
      ${ico.buzon}
      <h3>Todo contestado</h3>
      <p>No hay solicitudes nuevas. Las que llegan por el formulario del sitio aparecen aquí en cuanto se envían.</p>
      <button class="btn btn--ghost" style="min-height:44px;margin-top:6px">Ver las 57 solicitudes</button>
    </div>
  </main>
  ${nav('pro', 0).replace('<em class="pto">0</em>', '')}
</div>
`));

/* ---------- Pagos ---------- */
writeFileSync('MobilePagos.dc.html', doc(`
<div class="m">
  <header class="m__top">
    <div style="flex:1;min-width:0"><h1>Pagos</h1><p class="m__sub">Septiembre de 2026</p></div>
    <button class="m__icono m__icono--pri" aria-label="Registrar pago">${ico.mas}</button>
  </header>
  <main class="m__main">
    <div class="tiles" style="grid-template-columns:1fr 1fr;gap:10px">
      <div class="tile" style="padding:15px 16px;gap:4px"><span class="tile__k">Cobrado</span><span class="tile__v" style="font-size:27px">$68,400</span><span class="tile__d ok">75% de $91,200</span></div>
      <div class="tile" style="padding:15px 16px;gap:4px"><span class="tile__k">Vencido</span><span class="tile__v" style="font-size:27px">$9,800</span><span class="tile__d alta">4 cuotas</span></div>
    </div>

    <div class="m__filtros" role="group" aria-label="Filtros">
      <span class="pill is-on">Vencidos <span class="n">4</span></span>
      <span class="pill">Pendientes</span>
      <span class="pill">Pagados</span>
      <span class="pill">Cargos sueltos</span>
      <span class="pill">Todos</span>
    </div>

    <div class="lista">
      <div class="item">
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom">Jorge Palacios</span><span class="item__meta">Mensualidad 7 de 18</span></div>
          <div style="text-align:right"><span class="item__monto">$2,450</span><span class="item__meta" style="margin-top:4px"><span class="chip chip--vencida">Venció 15 ago</span></span></div>
        </div>
        <div class="item__pie"><span class="item__meta" style="margin:0">Sin método</span>
          <button class="btn btn--ghost" style="min-height:44px;padding:11px 18px;font-size:14px">Registrar pago</button></div>
      </div>

      <div class="item">
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom">Paola Márquez</span><span class="item__meta">Mensualidad 3 de 24</span></div>
          <div style="text-align:right"><span class="item__monto">$2,450</span><span class="item__meta" style="margin-top:4px"><span class="chip chip--vencida">Venció 28 ago</span></span></div>
        </div>
        <div class="item__pie"><span class="item__meta" style="margin:0">Sin método</span>
          <button class="btn btn--ghost" style="min-height:44px;padding:11px 18px;font-size:14px">Registrar pago</button></div>
      </div>

      <div class="item">
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom">Regina Ávalos</span><span class="item__meta">Mensualidad 2 de 18</span></div>
          <div style="text-align:right"><span class="item__monto">$2,900</span><span class="item__meta" style="margin-top:4px"><span class="chip chip--nueva">Vence 8 sep</span></span></div>
        </div>
        <div class="item__pie"><span class="item__meta" style="margin:0">Sin método</span>
          <button class="btn btn--ghost" style="min-height:44px;padding:11px 18px;font-size:14px">Registrar pago</button></div>
      </div>
    </div>
  </main>
  ${nav('pag')}
</div>
`));

/* ---------- Ficha de paciente ---------- */
writeFileSync('MobilePaciente.dc.html', doc(`
<div class="m">
  <header class="m__top">
    <button class="m__icono m__atras" aria-label="Volver a Pacientes">${ico.atras}</button>
    <div style="flex:1;min-width:0"><h1>Jorge Palacios</h1><p class="m__sub">Brackets metálicos · mes 7 de 18</p></div>
    <button class="m__icono m__icono--wa" aria-label="Escribir a Jorge Palacios por WhatsApp">${ico.wa}</button>
  </header>

  <main class="m__main">
    <div class="aviso aviso--error" style="font-size:13.5px;display:flex;align-items:center;gap:10px">
      <svg viewBox="0 0 24 24" style="width:19px;height:19px;flex:none;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round"><path d="M12 8v5M12 16.5v.1"/><circle cx="12" cy="12" r="9"/></svg>
      <span>Cuota vencida hace 20 días · <b>$2,450</b></span>
    </div>

    <section class="panel" style="padding:16px">
      <div class="panel__t" style="margin-bottom:12px"><h2 style="font-size:17px">Plan de tratamiento</h2><a href="#">Editar</a></div>
      <div class="tiles" style="grid-template-columns:1fr 1fr;gap:10px">
        <div class="tile" style="padding:14px;gap:3px;box-shadow:none;background:var(--bg)"><span class="tile__k">Total</span><span class="tile__v" style="font-size:23px">$49,000</span></div>
        <div class="tile" style="padding:14px;gap:3px;box-shadow:none;background:var(--bg)"><span class="tile__k">Saldo</span><span class="tile__v" style="font-size:23px">$27,000</span></div>
      </div>
      <div style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--ink-soft);margin-bottom:6px"><span>Mes 7 de 18</span><span>45%</span></div>
        <div class="barra"><i style="width:45%"></i></div>
      </div>
    </section>

    <section class="panel" style="padding:16px">
      <div class="panel__t" style="margin-bottom:12px"><h2 style="font-size:17px">Pagos</h2><a href="#">Ver todo</a></div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom" style="font-size:15px">Mensualidad 7 de 18</span><span class="item__meta">Vencía el 15 ago</span></div>
          <div style="text-align:right"><span class="item__monto" style="font-size:16px">$2,450</span><span class="item__meta" style="margin-top:4px"><span class="chip chip--vencida">Vencida</span></span></div>
        </div>
        <div style="height:1px;background:var(--line)"></div>
        <div class="item__fila">
          <div style="min-width:0"><span class="item__nom" style="font-size:15px">Retenedor extra</span><span class="item__meta">2 ago · efectivo</span></div>
          <div style="text-align:right"><span class="item__monto" style="font-size:16px">$1,800</span><span class="item__meta" style="margin-top:4px"><span class="chip chip--agendada">Pagado</span></span></div>
        </div>
      </div>
    </section>

    

    
  </main>

  <div class="m__pie">
    <button class="btn" style="flex:1;justify-content:center;min-height:50px">+ Registrar pago</button>
  </div>
</div>
`));

/* ---------- Registrar pago ---------- */
writeFileSync('MobileRegistrarPago.dc.html', doc(`
<div class="m">
  <header class="m__top">
    <button class="m__icono m__atras" aria-label="Cancelar y volver">${ico.atras}</button>
    <div style="flex:1;min-width:0"><h1>Registrar pago</h1><p class="m__sub">Jorge Palacios</p></div>
  </header>

  <main class="m__main" style="gap:13px">
    <div class="campo"><label for="mp">Paciente</label>
      <select id="mp" style="min-height:50px"><option>Jorge Palacios · Brackets metálicos</option><option>Paola Márquez · Alineadores invisibles</option></select></div>

    <div class="campo"><label for="mc">Concepto</label>
      <select id="mc" style="min-height:50px"><option>Mensualidad 7 de 18 — vencida ($2,450)</option><option>Mensualidad 8 de 18 — vence 15 sep</option><option>Cargo suelto</option></select>
    </div>

    <div class="campo"><label for="mm">Monto</label>
      <div style="position:relative">
        <span style="position:absolute;left:15px;top:50%;transform:translateY(-50%);color:var(--ink-soft);font-size:16px">$</span>
        <input id="mm" type="text" inputmode="decimal" value="2,450.00" style="width:100%;padding-left:30px;min-height:50px;font-variant-numeric:tabular-nums">
      </div>
    </div>

    <div class="campo"><label for="mf">Fecha del pago</label><input id="mf" type="date" value="2026-09-04" style="min-height:50px"></div>

    <div class="campo"><label id="lm">Método</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap" role="radiogroup" aria-labelledby="lm">
        <span class="pill is-on" role="radio" aria-checked="true">Efectivo</span>
        <span class="pill" role="radio" aria-checked="false">Transferencia</span>
        <span class="pill" role="radio" aria-checked="false">Tarjeta</span>
      </div>
    </div>

    <div class="campo"><label for="mn">Nota <span style="font-weight:400;color:var(--ink-soft)">(opcional)</span></label>
      <textarea id="mn" style="min-height:74px" placeholder="Abono parcial, acordado por WhatsApp…"></textarea></div>

    <div class="aviso aviso--info" style="font-size:13.5px">Saldo después de este pago: <b>$24,550</b> · quedan 11 mensualidades.</div>
  </main>

  <div class="m__pie">
    <button class="btn btn--ghost" style="min-height:50px;padding:14px 20px">Cancelar</button>
    <button class="btn" style="flex:1;justify-content:center;min-height:50px">Guardar pago</button>
  </div>
</div>
`));

console.log('movil ok — 7 pantallas');
