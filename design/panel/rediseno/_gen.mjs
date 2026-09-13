// Generador de los artboards del rediseño V1.1 del panel.
// Maquetas estáticas: los valores salen de src/styles/global.css y admin.css,
// más la paleta ampliada aprobada (arcilla, pizarra, estados). Correr desde
// esta carpeta: node _gen.mjs
import { writeFileSync } from 'node:fs';

const CSS = `
:root{
  --bg:#f5f1ea;--bg-deep:#efe9df;--surface:#fffdf9;--ink:#26221d;--ink-soft:#6f675c;
  --line:#e3dccf;--line-strong:#8f8574;
  --teal-50:#eef4f2;--teal-100:#e2ebe7;--teal-200:#c3d8d3;--teal-500:#2f7d75;--teal-600:#245f59;--teal-800:#173f3b;--on-accent:#fbfaf6;
  --clay-50:#f8ece5;--clay-200:#e8c7b5;--clay-500:#b8694a;--clay-700:#8a4a30;
  --slate-50:#e4ebf2;--slate-200:#c5d3e0;--slate-700:#3b5a78;
  --ok-50:#e4efdf;--ok-200:#c9debf;--ok-700:#3f6b32;
  --warn-50:#fdf1dc;--warn-200:#ecd9b0;--warn-700:#8a5c15;
  --bad-50:#f8e7e2;--bad-200:#eccfc6;--bad-700:#b4452e;
  --neutral-50:#efece7;
  --font-display:"Newsreader",Georgia,serif;--font-body:"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif;
  --radius:18px;--radius-sm:12px;
  --shadow-sm:0 1px 2px rgba(38,34,29,.04),0 6px 18px rgba(38,34,29,.05);
  --shadow-md:0 4px 12px rgba(38,34,29,.06),0 24px 48px rgba(38,34,29,.09);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg-deep);color:var(--ink);font-family:var(--font-body);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:var(--teal-600);text-decoration:none;font-weight:600} a:hover{color:var(--teal-500)}
h1,h2,h3{margin:0;font-family:var(--font-display);font-weight:500;line-height:1.12;letter-spacing:-.005em}
p{margin:0}
svg.i{width:20px;height:20px;flex:none;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
svg.i16{width:16px;height:16px}

/* marco */
.shell{display:grid;grid-template-columns:248px minmax(0,1fr);min-height:100vh}
.shell--rail{grid-template-columns:84px minmax(0,1fr)}
.side{background:var(--surface);border-right:1px solid var(--line);padding:18px 14px;display:flex;flex-direction:column;gap:18px}
.side__marca{font-family:var(--font-display);font-size:21px;padding:4px 12px 6px;display:flex;align-items:center;gap:10px}
.side__marca i{width:30px;height:30px;border-radius:9px;background:var(--teal-500);color:var(--on-accent);display:grid;place-items:center;font-style:normal;font-size:15px;font-family:var(--font-body);font-weight:700}
.nav{display:flex;flex-direction:column;gap:4px}
.nav a{display:flex;align-items:center;gap:12px;min-height:46px;padding:0 12px;border-radius:var(--radius-sm);color:var(--ink);font-weight:500;font-size:15px}
.nav a.on{background:var(--teal-100);color:var(--teal-600);font-weight:600}
.nav a .n{margin-left:auto;font-size:12px;font-weight:700;background:var(--clay-500);color:#fff;border-radius:100px;padding:1px 8px}
.rail{background:var(--surface);border-right:1px solid var(--line);padding:14px 8px;display:flex;flex-direction:column;gap:6px;align-items:stretch}
.rail a{display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 2px;border-radius:var(--radius-sm);font-size:11.5px;font-weight:500;color:var(--ink);position:relative}
.rail a.on{background:var(--teal-100);color:var(--teal-600);font-weight:600}
.rail a .n{position:absolute;top:4px;right:14px;font-size:10.5px;font-weight:700;background:var(--clay-500);color:#fff;border-radius:100px;padding:0 6px;border:2px solid var(--surface)}
.col{display:flex;flex-direction:column;min-width:0}
.top{background:var(--surface);border-bottom:1px solid var(--line);min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 30px}
.top__t{font-family:var(--font-display);font-size:21px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.top__t span{color:var(--ink-soft)}
.top__d{display:flex;align-items:center;gap:12px;font-size:13.5px;color:var(--ink-soft)}
.rol{font-size:12.5px;font-weight:600;padding:3px 10px;border-radius:100px;background:var(--teal-100);color:var(--teal-600)}
.main{padding:28px 30px 60px;display:flex;flex-direction:column;gap:20px}
.head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.head h1{font-size:38px}
.head p{margin-top:6px;color:var(--ink-soft);font-size:14.5px}
.row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.grid2{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:20px;align-items:start}
.stack{display:flex;flex-direction:column;gap:20px}
.stack--12{gap:12px}

/* superficies: tres niveles, no todo es la misma tarjeta */
.panel{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:24px 26px;box-shadow:var(--shadow-sm)}
.panel--flush{padding:22px 0 6px}
.panel--flush>.ph{padding:0 26px}
.panel--tinta{background:var(--teal-50);border-color:var(--teal-200);box-shadow:none}
.panel--plano{background:transparent;border:1px dashed var(--line);box-shadow:none}
.ph{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}
.ph h2{font-size:22px}
.ph a{font-size:14px;min-height:44px;display:inline-flex;align-items:center}
.eyebrow{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}
.sec{display:block;font-size:13px;color:var(--ink-soft);margin-top:2px}
.num{font-variant-numeric:tabular-nums}

/* botones */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:100px;border:1px solid transparent;font:inherit;font-weight:600;font-size:16px;padding:15px 26px;white-space:nowrap;cursor:pointer}
.btn--chico{padding:9px 16px;font-size:14px;min-height:40px}
.btn--pri{background:var(--teal-500);color:var(--on-accent);box-shadow:0 8px 22px -10px var(--teal-500)}
.btn--gho{background:transparent;color:var(--ink);border-color:var(--line-strong)}
.btn--sua{background:var(--teal-100);color:var(--teal-600)}
.btn--peligro{background:transparent;color:var(--bad-700);border-color:var(--bad-200)}
.btn--dis{background:var(--neutral-50);color:#9d948a;box-shadow:none;cursor:not-allowed}
.btn--block{width:100%}
.icbtn{width:40px;height:40px;border-radius:100px;border:1px solid var(--line-strong);display:grid;place-items:center;color:var(--ink);background:transparent}

/* segmentado y chips de filtro */
.seg{display:inline-flex;background:var(--bg-deep);border-radius:100px;padding:4px;gap:2px}
.seg span{padding:8px 16px;border-radius:100px;font-size:14px;font-weight:600;color:var(--ink-soft);min-height:36px;display:inline-flex;align-items:center}
.seg span.on{background:var(--surface);color:var(--ink);box-shadow:var(--shadow-sm)}
.fchip{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 14px;border-radius:100px;border:1px solid var(--line);background:var(--surface);font-size:14px;font-weight:500;color:var(--ink)}
.fchip b{font-weight:700;color:var(--ink-soft);font-size:12.5px}
.fchip.on{background:var(--ink);border-color:var(--ink);color:var(--on-accent)}
.fchip.on b{color:#d9d2c6}
.fchip--bad{border-color:var(--bad-200);color:var(--bad-700);background:var(--bad-50)}

/* chips de estado: color + punto + texto, nunca color solo */
.chip{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;padding:3px 10px;border-radius:100px;border:1px solid transparent;white-space:nowrap}
.chip::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.85}
.c-teal{background:var(--teal-100);color:var(--teal-600);border-color:var(--teal-200)}
.c-clay{background:var(--clay-50);color:var(--clay-700);border-color:var(--clay-200)}
.c-slate{background:var(--slate-50);color:var(--slate-700);border-color:var(--slate-200)}
.c-ok{background:var(--ok-50);color:var(--ok-700);border-color:var(--ok-200)}
.c-warn{background:var(--warn-50);color:var(--warn-700);border-color:var(--warn-200)}
.c-bad{background:var(--bad-50);color:var(--bad-700);border-color:var(--bad-200)}
.c-neu{background:var(--neutral-50);color:var(--ink-soft);border-color:var(--line)}
.c-ink{background:var(--ink);color:var(--on-accent);border-color:var(--ink)}

/* campos */
.campo{display:flex;flex-direction:column;gap:7px}
.campo label{font-size:14px;font-weight:600}
.inp{font:inherit;font-size:16px;min-height:48px;padding:12px 15px;border:1px solid var(--line-strong);border-radius:var(--radius-sm);background:var(--surface);color:var(--ink);display:flex;align-items:center;gap:10px}
.inp--foco{border-color:var(--teal-500);box-shadow:0 0 0 3px var(--teal-100)}
.inp--error{border-color:var(--bad-700)}
.inp--dis{background:var(--neutral-50);color:#9d948a;border-color:var(--line)}
.inp .ph-t{color:#8b8276}
.ayuda{font-size:12.5px;color:var(--ink-soft)}
.err{font-size:13px;color:var(--bad-700);font-weight:600;display:flex;gap:6px;align-items:center}
.campos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 18px}

/* avisos */
.aviso{display:flex;align-items:center;gap:12px;border-radius:var(--radius-sm);padding:12px 16px;font-size:14.5px;border:1px solid}
.aviso .grow{flex:1}
.a-ok{background:var(--ok-50);border-color:var(--ok-200);color:var(--ok-700)}
.a-warn{background:var(--warn-50);border-color:var(--warn-200);color:var(--warn-700)}
.a-bad{background:var(--bad-50);border-color:var(--bad-200);color:var(--bad-700)}
.a-info{background:var(--slate-50);border-color:var(--slate-200);color:var(--slate-700)}

/* tabla */
.tabla{width:100%;border-collapse:collapse;font-size:14.5px}
.tabla th,.tabla td{text-align:left;padding:13px 26px;border-bottom:1px solid var(--line);vertical-align:middle}
.tabla th{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);white-space:nowrap;padding-top:6px}
.tabla tr:last-child td{border-bottom:0}
.tabla td.r,.tabla th.r{text-align:right}
.tabla .nom{font-weight:600;color:var(--ink)}
.tabla tr.sel{background:var(--teal-50)}
.tabla--compacta th,.tabla--compacta td{padding:11px 14px}
.tabla--media th,.tabla--media td{padding:13px 14px}
.tabla--media th:first-child,.tabla--media td:first-child{padding-left:26px}
.tabla--media th:last-child,.tabla--media td:last-child{padding-right:26px}

/* cola de hoy */
.cola{display:flex;flex-direction:column}
.cola__g{padding:14px 26px 6px;display:flex;align-items:center;gap:10px}
.cola__g .eyebrow{flex:1}
.fila{display:flex;align-items:center;gap:14px;padding:12px 26px;border-top:1px solid var(--line)}
.fila__ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:none}
.fila__q{flex:1;min-width:0}
.fila__q b{font-weight:600}
.fila__m{font-size:13px;color:var(--ink-soft);white-space:nowrap;text-align:right}
.ic-clay{background:var(--clay-50);color:var(--clay-700)}
.ic-teal{background:var(--teal-100);color:var(--teal-600)}
.ic-slate{background:var(--slate-50);color:var(--slate-700)}
.ic-bad{background:var(--bad-50);color:var(--bad-700)}
.ic-ok{background:var(--ok-50);color:var(--ok-700)}

/* embudo */
.embudo{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;align-items:end}
.paso{display:flex;flex-direction:column;gap:8px;padding:0 14px;position:relative}
.paso+.paso{border-left:1px solid var(--line)}
.paso__v{font-size:34px;font-weight:600;letter-spacing:-.02em;line-height:1}
.paso__k{font-size:13.5px;color:var(--ink-soft);font-weight:500}
.paso__bar{height:10px;border-radius:100px;background:var(--bg-deep);overflow:hidden}
.paso__bar i{display:block;height:100%;border-radius:100px;background:var(--teal-500)}
.paso__tasa{font-size:12.5px;font-weight:600;color:var(--teal-600);display:flex;align-items:center;gap:4px}
.kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0}
.kpi{padding:4px 18px;display:flex;flex-direction:column;gap:4px}
.kpi+.kpi{border-left:1px solid var(--line)}
.kpi__v{font-size:28px;font-weight:600;letter-spacing:-.02em;line-height:1.05}
.barra{height:8px;border-radius:100px;background:var(--bg-deep);overflow:hidden}
.barra i{display:block;height:100%;border-radius:100px;background:var(--teal-500)}
.barra--bad i{background:var(--bad-700)}

/* agenda */
.rej{display:grid;position:relative}
.rej__horas{position:relative}
.rej__h{position:absolute;right:10px;transform:translateY(-8px);font-size:12px;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.rej__col{position:relative;border-left:1px solid var(--line);
  background-image:linear-gradient(to bottom,var(--line) 1px,transparent 1px),linear-gradient(to bottom,rgba(227,220,207,.55) 1px,transparent 1px);
  background-size:100% var(--hora),100% calc(var(--hora) / 2)}
.cerrado{position:absolute;left:0;right:0;bottom:0;background:repeating-linear-gradient(135deg,rgba(239,236,231,.9) 0 6px,rgba(255,253,249,.6) 6px 12px);display:flex;align-items:flex-start;justify-content:center;padding-top:10px;font-size:12px;color:var(--ink-soft);font-weight:600}
.blk{position:absolute;left:6px;right:6px;border-radius:10px;padding:6px 10px;border:1px solid;overflow:hidden;font-size:13px;line-height:1.28}
.blk b{display:block;color:var(--ink);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.blk .t{font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;display:flex;align-items:center;gap:5px}
.blk .s{font-size:12px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.b-val{background:var(--clay-50);border-color:var(--clay-200);color:var(--clay-700)}
.b-ctl{background:var(--teal-50);border-color:var(--teal-200);color:var(--teal-800)}
.b-noa{background:var(--bad-50);border-color:var(--bad-200);color:var(--bad-700)}
.b-can{background:repeating-linear-gradient(135deg,var(--neutral-50) 0 6px,var(--surface) 6px 12px);border-color:var(--line);color:var(--ink-soft)}
.b-can b{text-decoration:line-through;color:var(--ink-soft)}
.blk--linea{display:flex;align-items:center;gap:6px;padding:0 10px}
.blk--linea .t{flex:none}
.blk--linea b{display:inline;min-width:0}
.blk.sel{box-shadow:0 0 0 2px var(--teal-600),var(--shadow-md)}
.ahora{position:absolute;left:-6px;right:0;height:0;border-top:2px solid var(--bad-700);z-index:3}
.ahora::before{content:"";position:absolute;left:-4px;top:-6px;width:10px;height:10px;border-radius:50%;background:var(--bad-700)}
.ahora span{position:absolute;left:-58px;top:-10px;font-size:11.5px;font-weight:700;color:var(--bad-700);background:var(--surface);padding:0 4px}
.dias{display:grid}
.dia{padding:10px 8px;text-align:center;border-left:1px solid var(--line);font-size:13px;color:var(--ink-soft)}
.dia b{display:block;font-family:var(--font-display);font-size:22px;color:var(--ink);font-weight:500;line-height:1.1}
.dia.hoy b{color:var(--on-accent);background:var(--teal-500);border-radius:100px;width:36px;height:36px;display:grid;place-items:center;margin:2px auto 0;font-size:18px}

/* línea de tiempo */
.tl{display:flex;flex-direction:column}
.tl__i{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:14px;padding:12px 0;position:relative}
.tl__i+.tl__i{border-top:1px solid var(--line)}
.tl__i time{font-size:13px;color:var(--ink-soft);white-space:nowrap}

/* plegables */
.pleg{border-top:1px solid var(--line);padding:0}
.pleg summary{list-style:none;display:flex;align-items:center;justify-content:space-between;min-height:52px;font-weight:600;font-size:15px;cursor:pointer}
.pleg summary::-webkit-details-marker{display:none}
.pleg summary em{font-style:normal;font-weight:500;font-size:13.5px;color:var(--ink-soft)}

.dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:9px 18px;font-size:14.5px;margin:0}
.dl dt{color:var(--ink-soft);font-size:13.5px}
.dl dd{margin:0}
.tabs{display:flex;gap:26px;border-bottom:1px solid var(--line)}
.tabs span{padding:12px 2px;font-weight:600;font-size:15px;color:var(--ink-soft);border-bottom:2px solid transparent;margin-bottom:-1px;display:flex;align-items:center;gap:7px}
.tabs span.on{color:var(--ink);border-color:var(--teal-500)}
.tabs span b{font-size:12px;background:var(--bg-deep);border-radius:100px;padding:0 7px;color:var(--ink-soft)}
.avatar{width:56px;height:56px;border-radius:50%;background:var(--clay-50);color:var(--clay-700);display:grid;place-items:center;font-family:var(--font-display);font-size:22px;flex:none;border:1px solid var(--clay-200)}
.avatar--teal{background:var(--teal-100);color:var(--teal-600);border-color:var(--teal-200)}

/* móvil */
.m{width:390px;min-height:100vh;background:var(--bg-deep);display:flex;flex-direction:column;position:relative}
.m .top{padding:0 16px}
.m .main{padding:18px 16px 110px;gap:16px}
.m .head h1{font-size:30px}
.m .panel{padding:18px}
.m .panel--flush{padding:16px 0 4px}
.m .panel--flush>.ph{padding:0 18px}
.m .fila{padding:12px 18px;flex-wrap:wrap}
.m .cola__g{padding:12px 18px 4px}
.tabbar{position:absolute;left:0;right:0;bottom:0;background:var(--surface);border-top:1px solid var(--line);padding:6px 6px 22px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
.tabbar a{display:flex;flex-direction:column;align-items:center;gap:3px;min-height:52px;justify-content:center;border-radius:12px;font-size:11px;font-weight:500;color:var(--ink);position:relative}
.tabbar a.on{background:var(--teal-100);color:var(--teal-600);font-weight:600}
.tabbar a .n{position:absolute;top:3px;right:16px;font-size:10px;font-weight:700;background:var(--clay-500);color:#fff;border-radius:100px;padding:0 5px;border:2px solid var(--surface)}
.tarjeta{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.scrollx{display:flex;gap:8px;flex-wrap:wrap}
.swatch{border-radius:12px;border:1px solid var(--line);overflow:hidden;background:var(--surface)}
.swatch div{height:54px}
.swatch p{font-size:12px;padding:6px 10px;color:var(--ink-soft);line-height:1.35}
.swatch p b{color:var(--ink);font-size:12.5px}
`;

const doc = (body, bg = 'var(--bg-deep)') => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>${CSS}
body{background:${bg}}</style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;

const P = (d) => `<svg class="i" viewBox="0 0 24 24">${d}</svg>`;
const P16 = (d) => `<svg class="i i16" viewBox="0 0 24 24">${d}</svg>`;
const D = {
  inicio: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  agenda: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/>',
  pros: '<path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 11h8M8 15h5"/>',
  pac: '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c.6-3.7 3.4-5.6 7-5.6s6.4 1.9 7 5.6"/>',
  pag: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M6.5 14.5h3"/>',
  wa: '<path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-4A8 8 0 1 1 20 12z"/><path d="M9 10c.5 2 2 3.5 5 5"/>',
  tel: '<path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5L16 14l4 1.5V19a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  ok: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  reloj: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>',
  izq: '<path d="m14.5 6-6 6 6 6"/>',
  der: '<path d="m9.5 6 6 6-6 6"/>',
  lupa: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  alerta: '<path d="M12 4 3 19.5h18z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  sync: '<path d="M19 8a7.5 7.5 0 0 0-13.3-1.5M5 16a7.5 7.5 0 0 0 13.3 1.5"/><path d="M19 3.5V8h-4.5M5 20.5V16h4.5"/>',
  dinero: '<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
  usuMas: '<circle cx="10" cy="8" r="3.4"/><path d="M3.5 20c.6-3.7 3-5.6 6.5-5.6 1.6 0 3 .4 4 1.1M18 13v6M15 16h6"/>',
  nota: '<path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M8.5 9h7M8.5 12.5h4"/>',
  flecha: '<path d="M5 12h13M13 6.5 18.5 12 13 17.5"/>',
  chevAb: '<path d="m6 9.5 6 6 6-6"/>',
  mapa: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21z"/><circle cx="12" cy="10" r="2.3"/>',
  campana: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  x: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
  filtro: '<path d="M4 6h16M7 12h10M10 18h4"/>',
};
const I = (n) => P(D[n]);
const I16 = (n) => P16(D[n]);

const NAV = [
  ['inicio', 'Inicio'],
  ['agenda', 'Agenda'],
  ['pros', 'Prospectos'],
  ['pac', 'Pacientes'],
  ['pag', 'Pagos'],
];

const side = (on) => `
<aside class="side">
  <div class="side__marca"><i>BP</i>Panel</div>
  <nav class="nav">
    ${NAV.map(([id, t]) => `<a href="#" class="${id === on ? 'on' : ''}">${I(id)}${t}${id === 'pros' ? '<span class="n">5</span>' : ''}</a>`).join('')}
  </nav>
</aside>`;

const rail = (on) => `
<aside class="rail">
  ${NAV.map(([id, t]) => `<a href="#" class="${id === on ? 'on' : ''}">${I(id)}${t}${id === 'pros' ? '<span class="n">5</span>' : ''}</a>`).join('')}
</aside>`;

const tabbar = (on) => `
<nav class="tabbar">
  ${NAV.map(([id, t]) => `<a href="#" class="${id === on ? 'on' : ''}">${I(id)}${t}${id === 'pros' ? '<span class="n">5</span>' : ''}</a>`).join('')}
</nav>`;

const top = (t, extra = '') => `
<header class="top">
  <div class="top__t">${t}</div>
  <div class="top__d">${extra}<span class="rol">Doctora</span><span>doctora@[DOMINIO]</span><span class="btn btn--gho btn--chico">Salir</span></div>
</header>`;

const topM = (t) => `
<header class="top">
  <div class="top__t">${t}</div>
  <div class="top__d"><span class="rol">Doctora</span><span class="btn btn--gho btn--chico">Salir</span></div>
</header>`;

const escritorio = (on, titulo, cuerpo, extraTop = '') =>
  doc(`<div class="shell">${side(on)}<div class="col">${top(titulo, extraTop)}<main class="main">${cuerpo}</main></div></div>`);
const tablet = (on, titulo, cuerpo) =>
  doc(`<div class="shell shell--rail">${rail(on)}<div class="col">${top(titulo)}<main class="main" style="padding:24px 24px 60px">${cuerpo}</main></div></div>`);
const movil = (on, titulo, cuerpo) =>
  doc(`<div class="m">${topM(titulo)}<main class="main">${cuerpo}</main>${tabbar(on)}</div>`);

/* ------------------------------------------------------------ agenda */
const HORA = 80;
const INICIO = 9;
const pos = (h, hora = HORA) => (h - INICIO) * hora;
const hh = (h) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

const CITAS_HOY = [
  { ini: 9, dur: 45, tipo: 'val', estado: 'confirmada', nom: 'Mariana Estrada', tel: '55 1234 5678' },
  { ini: 10, dur: 30, tipo: 'ctl', estado: 'atendida', nom: 'Jorge Palacios', tel: '55 4411 2200' },
  { ini: 10.5, dur: 30, tipo: 'ctl', estado: 'no_asistio', nom: 'Paola Márquez', tel: '55 7788 1122' },
  { ini: 12, dur: 45, tipo: 'val', estado: 'atendida', nom: 'Luis Fernando Cruz', tel: '55 9876 5432', sel: true },
  { ini: 13.5, dur: 30, tipo: 'ctl', estado: 'cancelada', nom: 'Emiliano Ruiz', tel: '55 3322 9900' },
  { ini: 16.5, dur: 45, tipo: 'val', estado: 'confirmada', nom: 'Ana Sofía Rentería', tel: '81 2233 4455' },
  { ini: 17.5, dur: 30, tipo: 'ctl', estado: 'programada', nom: 'Regina Ávalos', tel: '81 5566 3344' },
];
const ESTADO_CHIP = {
  programada: ['c-teal', 'Programada'],
  confirmada: ['c-slate', 'Confirmada'],
  atendida: ['c-ok', 'Atendida'],
  no_asistio: ['c-bad', 'No asistió'],
  cancelada: ['c-neu', 'Cancelada'],
};
const bloque = (c, { hora = HORA, compacto = false } = {}) => {
  const clase =
    c.estado === 'cancelada' ? 'b-can' : c.estado === 'no_asistio' ? 'b-noa' : c.tipo === 'val' ? 'b-val' : 'b-ctl';
  const alto = (c.dur / 60) * hora - 3;
  const fin = c.ini + c.dur / 60;
  const marca =
    c.estado === 'atendida' ? I16('ok') : c.estado === 'confirmada' ? I16('ok') : c.estado === 'no_asistio' ? I16('x') : '';
  const etiqueta = ESTADO_CHIP[c.estado][1];
  if (alto < 50) {
    return `<div class="blk blk--linea ${clase}${c.sel ? ' sel' : ''}" style="top:${pos(c.ini, hora) + 2}px;height:${alto}px">
    <span class="t">${marca}${hh(c.ini)}</span><b>${c.nom}</b>${compacto ? '' : `<span class="s">· ${etiqueta}</span>`}
  </div>`;
  }
  return `<div class="blk ${clase}${c.sel ? ' sel' : ''}" style="top:${pos(c.ini, hora) + 2}px;height:${alto}px">
    <div class="t">${marca}${hh(c.ini)}${compacto ? '' : `–${hh(fin)} · ${etiqueta}`}</div>
    <b>${c.nom}</b>
    ${compacto || alto < 64 ? '' : `<div class="s">${c.tipo === 'val' ? 'Valoración' : 'Control'} · ${c.tel}</div>`}
  </div>`;
};
const horasCol = (desde, hasta, hora = HORA) =>
  `<div class="rej__horas" style="height:${(hasta - desde) * hora}px">${Array.from({ length: hasta - desde + 1 }, (_, i) => `<span class="rej__h" style="top:${i * hora}px">${desde + i}:00</span>`).join('')}</div>`;

/* ================================================================ SISTEMA */
const familia = (nombre, uso, tonos) => `
<div class="stack stack--12">
  <div><b style="font-size:15px">${nombre}</b><span class="sec">${uso}</span></div>
  <div style="display:grid;grid-template-columns:repeat(${tonos.length},minmax(0,1fr));gap:10px">
    ${tonos.map(([hex, rol, extra = '']) => `<div class="swatch"><div style="background:${hex}"></div><p><b>${hex}</b><br>${rol}${extra ? `<br>${extra}` : ''}</p></div>`).join('')}
  </div>
</div>`;

writeFileSync('Sistema.dc.html', doc(`
<div style="padding:48px 56px 64px;display:flex;flex-direction:column;gap:36px;background:var(--bg)">
  <div class="stack stack--12">
    <span class="eyebrow">Panel · V1.1</span>
    <h1 style="font-size:48px">Sistema del panel</h1>
    <p style="color:var(--ink-soft);max-width:760px">Misma marca que el sitio —crema, verde azulado, Newsreader para títulos— con tres familias nuevas para que cada tipo de dato tenga su color: arcilla para prospectos y valoraciones, pizarra para lo informativo y confirmado, y una escala de estados. Todo texto sobre su fondo pasa AA (≥ 4.5:1); los bordes de campo pasan 3:1.</p>
  </div>

  <section class="panel stack" style="gap:26px">
    <div class="ph" style="margin:0"><h2>Paleta</h2><span class="sec">Contraste del texto de cada familia sobre su fondo</span></div>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px 36px">
      ${familia('Base', 'Superficies y tinta: lo que ya usa el sitio', [['#f5f1ea', 'Fondo'], ['#efe9df', 'Fondo hondo'], ['#fffdf9', 'Superficie'], ['#26221d', 'Tinta', '15.5:1'], ['#6f675c', 'Tinta suave', '5.5:1']])}
      ${familia('Verde azulado · marca', 'Acción principal, activo, seleccionado, citas de control', [['#eef4f2', '50'], ['#e2ebe7', '100'], ['#c3d8d3', '200 · borde'], ['#2f7d75', '500 · botón', '4.7:1'], ['#245f59', '600 · texto', '6.1:1']])}
      ${familia('Arcilla · nueva', 'Prospectos, valoraciones, contadores de pendiente', [['#f8ece5', '50'], ['#e8c7b5', '200 · borde'], ['#b8694a', '500 · punto'], ['#8a4a30', '700 · texto', '5.8:1']])}
      ${familia('Pizarra · nueva', 'Confirmado, informativo, avisos neutros', [['#e4ebf2', '50'], ['#c5d3e0', '200 · borde'], ['#3b5a78', '700 · texto', '6.0:1']])}
      ${familia('Estados', 'Siempre con texto o icono al lado: el color nunca va solo', [['#e4efdf', 'Éxito'], ['#3f6b32', 'Éxito · texto', '5.3:1'], ['#fdf1dc', 'Aviso'], ['#8a5c15', 'Aviso · texto', '5.2:1'], ['#f8e7e2', 'Peligro'], ['#b4452e', 'Peligro · texto', '4.6:1']])}
      ${familia('Líneas', 'Separadores decorativos y bordes de controles', [['#e3dccf', 'Separador'], ['#8f8574', 'Borde de campo', '3.6:1'], ['#efece7', 'Neutro · cerrado']])}
    </div>
  </section>

  <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:start">
    <section class="panel stack" style="gap:18px">
      <div class="ph" style="margin:0"><h2>Tipografía</h2></div>
      <div><span class="eyebrow">Título de página · Newsreader 38</span><h1 style="font-size:38px;margin-top:6px">Buenas tardes, doctora</h1></div>
      <div><span class="eyebrow">Título de panel · Newsreader 22</span><h2 style="font-size:22px;margin-top:6px">Próxima acción</h2></div>
      <div><span class="eyebrow">Cifra · Hanken 34 tabular</span><div class="paso__v num" style="margin-top:6px">$68,400</div></div>
      <div><span class="eyebrow">Cuerpo · Hanken 16 / 1.55</span><p style="margin-top:6px">Mariana pidió valoración para alineadores. Agenda para el jueves por la tarde.</p></div>
      <div><span class="eyebrow">Etiqueta · 12 mayúsculas</span><p class="sec">Secundario · 13 tinta suave</p></div>
    </section>

    <section class="panel stack" style="gap:18px">
      <div class="ph" style="margin:0"><h2>Controles</h2></div>
      <div class="row"><span class="btn btn--pri">Guardar cita</span><span class="btn btn--gho">Cancelar</span><span class="btn btn--dis">Guardando…</span></div>
      <div class="row"><span class="btn btn--pri btn--chico">${I16('mas')} Registrar pago</span><span class="btn btn--gho btn--chico">${I16('wa')} WhatsApp</span><span class="btn btn--sua btn--chico">${I16('ok')} Hecho</span><span class="btn btn--peligro btn--chico">Cancelar cita</span></div>
      <div class="row"><span class="seg"><span class="on">Día</span><span>Semana</span></span><span class="fchip on">Todas <b>32</b></span><span class="fchip">Nuevas <b>5</b></span><span class="fchip fchip--bad">${I16('alerta')} Seguimiento vencido <b>3</b></span></div>
      <div class="campos">
        <div class="campo"><label>Nombre</label><div class="inp">Mariana Estrada</div></div>
        <div class="campo"><label>Teléfono</label><div class="inp inp--foco">55 1234 56|</div><span class="ayuda">Diez dígitos; se asume México.</span></div>
        <div class="campo"><label>Fecha y hora</label><div class="inp inp--error">31/02/2026 10:00</div><span class="err">${I16('alerta')} Esa fecha no existe. Revisa el día.</span></div>
        <div class="campo"><label>Paciente</label><div class="inp inp--dis">Viene del prospecto</div></div>
      </div>
    </section>
  </div>

  <div style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:24px;align-items:start">
    <section class="panel stack" style="gap:16px">
      <div class="ph" style="margin:0"><h2>Estados</h2><span class="sec">Una familia por significado, en todas las pantallas</span></div>
      <div class="stack stack--12">
        <div class="row"><span class="eyebrow" style="width:110px">Prospecto</span><span class="chip c-clay">Nueva</span><span class="chip c-warn">Contactada</span><span class="chip c-teal">Agendada</span><span class="chip c-neu">Descartada</span><span class="chip c-ink">Terminado</span></div>
        <div class="row"><span class="eyebrow" style="width:110px">Cita</span><span class="chip c-teal">Programada</span><span class="chip c-slate">Confirmada</span><span class="chip c-ok">Atendida</span><span class="chip c-bad">No asistió</span><span class="chip c-neu">Cancelada</span></div>
        <div class="row"><span class="eyebrow" style="width:110px">Cuota</span><span class="chip c-neu">Pendiente</span><span class="chip c-warn">Parcial</span><span class="chip c-ok">Pagada</span><span class="chip c-bad">Vencida</span></div>
        <div class="row"><span class="eyebrow" style="width:110px">Paciente</span><span class="chip c-ok">Activo</span><span class="chip c-teal">En retención</span><span class="chip c-warn">Pausado</span><span class="chip c-neu">Alta</span></div>
        <div class="row"><span class="eyebrow" style="width:110px">Google</span><span class="chip c-ok">Sincronizada</span><span class="chip c-warn">Sin sincronizar</span><span class="chip c-neu">Sin calendario</span></div>
      </div>
      <div class="stack stack--12" style="margin-top:6px">
        <div class="aviso a-ok" role="status">${I('ok')}<span class="grow">Cita guardada y copiada a Google Calendar.</span></div>
        <div class="aviso a-warn">${I('sync')}<span class="grow">La cita está guardada, pero todavía no está en Google Calendar.</span><span class="btn btn--gho btn--chico">Reintentar</span></div>
        <div class="aviso a-bad" role="alert">${I('alerta')}<span class="grow">No se pudo guardar. Revisa tu conexión e inténtalo otra vez.</span></div>
        <div class="aviso a-info">${I('campana')}<span class="grow">Esa sección es solo de la doctora.</span></div>
      </div>
    </section>

    <section class="panel stack" style="gap:18px">
      <div class="ph" style="margin:0"><h2>Piezas</h2></div>
      <div>
        <span class="eyebrow">Fila de la cola · una sola acción</span>
        <div style="border:1px solid var(--line);border-radius:14px;margin-top:10px;overflow:hidden">
          <div class="fila" style="border-top:0"><span class="fila__ic ic-clay">${I('pros')}</span><div class="fila__q"><b>Mariana Estrada</b><span class="sec">Alineadores invisibles · sitio web</span></div><span class="fila__m">hace 2 h</span><span class="btn btn--pri btn--chico">${I16('wa')} Contactar</span></div>
        </div>
      </div>
      <div>
        <span class="eyebrow">Bloque de agenda · alto = duración</span>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px">
          ${[['val', 'confirmada', 'Valoración'], ['ctl', 'programada', 'Control'], ['ctl', 'no_asistio', 'No asistió'], ['ctl', 'cancelada', 'Cancelada']]
            .map(([tipo, estado, t]) => `<div style="position:relative;height:84px">${bloque({ ini: 9, dur: 75, tipo, estado, nom: t === 'Valoración' || t === 'Control' ? 'Ana Sofía R.' : 'Jorge P.', tel: '81 2233 4455' }, { hora: 64 }).replace('left:6px;right:6px', '').replace('class="blk', 'style="left:0;right:0" class="blk')}<span class="sec" style="position:absolute;bottom:-20px">${t}</span></div>`)
            .join('')}
        </div>
      </div>
      <div style="margin-top:14px">
        <span class="eyebrow">Superficies · tres niveles</span>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px">
          <div class="panel" style="padding:14px"><b style="font-size:14px">Panel</b><span class="sec">Contenido principal</span></div>
          <div class="panel panel--tinta" style="padding:14px"><b style="font-size:14px">Tinta</b><span class="sec">Lo que toca ahora</span></div>
          <div class="panel panel--plano" style="padding:14px"><b style="font-size:14px">Plano</b><span class="sec">Secundario, vacío</span></div>
        </div>
      </div>
    </section>
  </div>
</div>`, 'var(--bg)'));

/* ================================================================ INICIO */
const colaEscritorio = `
<section class="panel panel--flush">
  <div class="ph"><h2>Hoy <span style="font-family:var(--font-body);font-size:15px;color:var(--ink-soft);font-weight:500">· 9 por atender</span></h2><a href="#">Ver agenda</a></div>
  <div class="cola">
    <div class="cola__g"><span class="eyebrow">Sin contestar</span><a href="#" style="font-size:13.5px">Todos los prospectos</a></div>
    <div class="fila"><span class="fila__ic ic-clay">${I('pros')}</span><div class="fila__q"><b>Mariana Estrada</b><span class="sec">Alineadores invisibles · Sitio web</span></div><span class="fila__m">hace 2 h</span><span class="btn btn--pri btn--chico">${I16('wa')} Contactar</span></div>
    <div class="fila"><span class="fila__ic ic-clay">${I('pros')}</span><div class="fila__q"><b>Carlos Méndez</b><span class="sec">Brackets estéticos · Instagram</span></div><span class="fila__m">ayer 18:40</span><span class="btn btn--pri btn--chico">${I16('wa')} Contactar</span></div>

    <div class="cola__g"><span class="eyebrow">Seguimiento</span></div>
    <div class="fila"><span class="fila__ic ic-bad">${I('tel')}</span><div class="fila__q"><b>Sofía Guerrero</b><span class="sec">Llamar · «preguntar si ya lo habló en casa»</span></div><span class="fila__m" style="color:var(--bad-700);font-weight:600">venció ayer</span><span class="btn btn--gho btn--chico">${I16('ok')} Hecho</span></div>
    <div class="fila"><span class="fila__ic ic-teal">${I('wa')}</span><div class="fila__q"><b>Diego Ramírez</b><span class="sec">Escribir por WhatsApp · enviar presupuesto</span></div><span class="fila__m">hoy 17:00</span><span class="btn btn--gho btn--chico">${I16('ok')} Hecho</span></div>

    <div class="cola__g"><span class="eyebrow">Por confirmar hoy</span></div>
    <div class="fila"><span class="fila__ic ic-slate">${I('agenda')}</span><div class="fila__q"><b>Regina Ávalos</b><span class="sec">Control · 17:30</span></div><span class="fila__m">programada</span><span class="btn btn--gho btn--chico">${I16('wa')} Confirmar</span></div>

    <div class="cola__g"><span class="eyebrow">Cuotas vencidas</span><a href="#" style="font-size:13.5px">Ir a pagos</a></div>
    <div class="fila"><span class="fila__ic ic-bad">${I('dinero')}</span><div class="fila__q"><b>Jorge Palacios</b><span class="sec">Mensualidad 7 de 18 · $2,450 · sin recordar</span></div><span class="fila__m" style="color:var(--bad-700);font-weight:600">hace 27 días</span><span class="btn btn--gho btn--chico">${I16('wa')} Cobrar</span></div>
    <div class="fila"><span class="fila__ic ic-bad">${I('dinero')}</span><div class="fila__q"><b>Paola Márquez</b><span class="sec">Mensualidad 3 de 24 · $2,450 · recordada hace 2 días</span></div><span class="fila__m">hace 14 días</span><span class="btn btn--gho btn--chico">Ver ficha</span></div>
  </div>
</section>`;

const miniAgenda = `
<section class="panel">
  <div class="ph"><h2>Agenda de hoy</h2><span class="chip c-ok">Google al día</span></div>
  <div class="tl">
    ${[
      ['9:00', 'Mariana Estrada', 'Valoración', 'c-slate', 'Confirmada'],
      ['10:00', 'Jorge Palacios', 'Control', 'c-ok', 'Atendida'],
      ['10:30', 'Paola Márquez', 'Control', 'c-bad', 'No asistió'],
      ['12:00', 'Luis Fernando Cruz', 'Valoración', 'c-ok', 'Atendida'],
    ].map(([h, n, t, c, e]) => `<div class="tl__i" style="grid-template-columns:52px minmax(0,1fr) auto;align-items:center;opacity:.72"><time class="num">${h}</time><div><b style="font-weight:600">${n}</b><span class="sec">${t}</span></div><span class="chip ${c}">${e}</span></div>`).join('')}
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;color:var(--bad-700);font-size:12px;font-weight:700"><span style="width:8px;height:8px;border-radius:50%;background:var(--bad-700)"></span>AHORA · 16:20<span style="flex:1;border-top:2px solid var(--bad-700)"></span></div>
    ${[
      ['16:30', 'Ana Sofía Rentería', 'Valoración', 'c-slate', 'Confirmada'],
      ['17:30', 'Regina Ávalos', 'Control', 'c-teal', 'Programada'],
    ].map(([h, n, t, c, e]) => `<div class="tl__i" style="grid-template-columns:52px minmax(0,1fr) auto;align-items:center"><time class="num" style="color:var(--ink);font-weight:600">${h}</time><div><b style="font-weight:600">${n}</b><span class="sec">${t}</span></div><span class="chip ${c}">${e}</span></div>`).join('')}
  </div>
</section>`;

const embudoPanel = (compacto = false) => `
<section class="panel">
  <div class="ph" style="flex-wrap:wrap"><h2>Cómo va la captación</h2><span class="seg"><span>7 días</span><span class="on">30 días</span><span>Este mes</span><span>90 días</span></span></div>
  <div class="embudo" style="${compacto ? 'grid-template-columns:repeat(2,minmax(0,1fr));row-gap:22px' : ''}">
    ${[
      ['24', 'Solicitudes', 100, ''],
      ['18', 'Contactadas', 75, '75% contestadas'],
      ['11', 'Agendadas', 46, '61% con cita'],
      ['6', 'Convertidas', 25, '55% aceptaron'],
    ].map(([v, k, w, t], i) => `<div class="paso" style="${compacto && i % 2 === 0 ? 'border-left:0' : ''}"><span class="paso__v num">${v}</span><span class="paso__k">${k}</span><div class="paso__bar"><i style="width:${w}%"></i></div><span class="paso__tasa">${t ? `${I16('flecha')} ${t}` : '<span style="color:var(--ink-soft);font-weight:500">Punto de partida</span>'}</span></div>`).join('')}
  </div>
  <div style="border-top:1px solid var(--line);margin-top:22px;padding-top:18px" class="kpis">
    <div class="kpi" style="padding-left:0"><span class="eyebrow">Citas atendidas</span><span class="kpi__v num">31</span><span class="sec">4 no asistieron · 11%</span></div>
    <div class="kpi"><span class="eyebrow">Cobrado</span><span class="kpi__v num">$68,400</span><div class="barra" style="margin-top:4px"><i style="width:75%"></i></div><span class="sec">de $91,200 esperado</span></div>
    <div class="kpi"><span class="eyebrow">Vencido hoy</span><span class="kpi__v num" style="color:var(--bad-700)">$9,800</span><span class="sec">4 cuotas · 2 sin recordar</span></div>
  </div>
</section>`;

writeFileSync('Main.dc.html', escritorio('inicio', 'Inicio', `
<div class="head">
  <div><h1>Buenas tardes, doctora</h1><p>Viernes, 11 de septiembre · 7 citas hoy, 2 por delante</p></div>
  <div class="row"><span class="btn btn--gho btn--chico">${I16('agenda')} Nueva cita</span><span class="btn btn--pri btn--chico">${I16('mas')} Registrar pago</span></div>
</div>
<div class="grid2">${colaEscritorio}<div class="stack">${miniAgenda}</div></div>
${embudoPanel()}
`));

writeFileSync('TabletInicio.dc.html', tablet('inicio', 'Inicio', `
<div class="head">
  <div><h1 style="font-size:32px">Buenas tardes, doctora</h1><p>Viernes, 11 de septiembre · 7 citas hoy</p></div>
  <span class="btn btn--pri btn--chico">${I16('mas')} Registrar pago</span>
</div>
${colaEscritorio.replace('panel panel--flush', 'panel panel--flush')}
${embudoPanel(true)}
`));

writeFileSync('MovilInicio.dc.html', movil('inicio', 'Inicio', `
<div class="head"><div><h1>Buenas tardes</h1><p>Vie 11 sep · 9 por atender</p></div></div>
<div class="panel panel--tinta" style="padding:16px 18px;display:flex;align-items:center;gap:14px">
  <span class="fila__ic ic-slate" style="background:var(--surface)">${I('reloj')}</span>
  <div style="flex:1"><span class="eyebrow">Siguiente cita · 16:30</span><b style="display:block;font-weight:600">Ana Sofía Rentería</b><span class="sec">Valoración · confirmada</span></div>
  <span class="icbtn">${I('der')}</span>
</div>
<section class="panel panel--flush">
  <div class="ph"><h2 style="font-size:20px">Hoy</h2><a href="#">Agenda</a></div>
  <div class="cola">
    <div class="cola__g"><span class="eyebrow">Sin contestar · 2</span></div>
    <div class="fila"><span class="fila__ic ic-clay">${I('pros')}</span><div class="fila__q"><b>Mariana Estrada</b><span class="sec">Alineadores · hace 2 h</span></div><span class="btn btn--pri btn--chico" style="width:100%">${I16('wa')} Contactar</span></div>
    <div class="cola__g"><span class="eyebrow">Seguimiento · 2</span></div>
    <div class="fila"><span class="fila__ic ic-bad">${I('tel')}</span><div class="fila__q"><b>Sofía Guerrero</b><span class="sec" style="color:var(--bad-700);font-weight:600">Llamar · venció ayer</span></div><span class="btn btn--gho btn--chico">${I16('ok')} Hecho</span></div>
    <div class="cola__g"><span class="eyebrow">Cuotas vencidas · 4</span></div>
    <div class="fila"><span class="fila__ic ic-bad">${I('dinero')}</span><div class="fila__q"><b>Jorge Palacios</b><span class="sec">Mensualidad 7 · $2,450</span></div><span class="btn btn--gho btn--chico">${I16('wa')} Cobrar</span></div>
  </div>
</section>
<section class="panel">
  <div class="ph" style="margin-bottom:10px"><h2 style="font-size:20px">Captación · 30 días</h2></div>
  <div class="stack stack--12">
    ${[['Solicitudes', 24, 100], ['Contactadas', 18, 75], ['Agendadas', 11, 46], ['Convertidas', 6, 25]].map(([k, v, w]) => `<div style="display:grid;grid-template-columns:96px minmax(0,1fr) 28px;align-items:center;gap:10px;font-size:14px"><span>${k}</span><div class="paso__bar"><i style="width:${w}%"></i></div><b class="num" style="text-align:right">${v}</b></div>`).join('')}
  </div>
</section>
`));

/* ================================================================ AGENDA */
const barraAgenda = (vista) => `
<div class="row" style="justify-content:space-between">
  <div class="row">
    <span class="icbtn">${I('izq')}</span><span class="btn btn--gho btn--chico">Hoy</span><span class="icbtn">${I('der')}</span>
    <span class="seg" style="margin-left:6px"><span class="${vista === 'dia' ? 'on' : ''}">Día</span><span class="${vista === 'semana' ? 'on' : ''}">Semana</span></span>
  </div>
  <div class="row">
    <span class="fchip on">Todas <b>8</b></span><span class="fchip">Programadas <b>1</b></span><span class="fchip">Confirmadas <b>2</b></span><span class="fchip">Atendidas <b>2</b></span><span class="fchip">No asistió <b>1</b></span>
    <span class="fchip">${I16('pac')} Solo las mías</span>
  </div>
</div>`;

const rejillaDia = (hora = HORA, horasW = 64, conAhora = true) => `
<div class="rej" style="grid-template-columns:${horasW}px minmax(0,1fr);--hora:${hora}px">
  ${horasCol(9, 19, hora)}
  <div class="rej__col" style="height:${10 * hora}px">
    ${CITAS_HOY.map((c) => bloque(c, { hora })).join('')}
    ${conAhora ? `<div class="ahora" style="top:${pos(16 + 20 / 60, hora)}px"><span>16:20</span></div>` : ''}
  </div>
</div>`;

const detalleCita = `
<aside class="stack" style="position:sticky;top:0">
  <section class="panel">
    <div class="row" style="justify-content:space-between;margin-bottom:12px"><span class="chip c-ok">Atendida</span><span class="icbtn">${I('x')}</span></div>
    <h2 style="font-size:26px">Luis Fernando Cruz</h2>
    <p class="sec" style="font-size:14px;margin-top:4px">Valoración · 12:00–12:45 · 45 min</p>
    <dl class="dl" style="margin-top:16px">
      <dt>Teléfono</dt><dd>55 9876 5432</dd>
      <dt>De quién</dt><dd><a href="#">Prospecto · Brackets estéticos</a></dd>
      <dt>Registró</dt><dd>Recepción</dd>
      <dt>Google</dt><dd><span class="chip c-ok">Sincronizada</span></dd>
      <dt>Nota</dt><dd>Viene con su mamá</dd>
    </dl>
    <div class="row" style="margin-top:18px"><span class="btn btn--gho btn--chico">${I16('wa')} WhatsApp</span><span class="btn btn--gho btn--chico">Reprogramar</span></div>
  </section>
  <section class="panel panel--tinta">
    <span class="eyebrow" style="color:var(--teal-600)">Siguiente paso</span>
    <h2 style="font-size:22px;margin-top:6px">¿Aceptó el tratamiento?</h2>
    <p style="font-size:14.5px;color:var(--ink-soft);margin:8px 0 16px">La valoración quedó como atendida. Si decide empezar, crea su ficha: el prospecto pasa a terminado sin perder su historial.</p>
    <span class="btn btn--pri btn--block">${I('usuMas')} Convertir en paciente</span>
    <span class="btn btn--gho btn--chico btn--block" style="margin-top:8px">Todavía no · poner seguimiento</span>
  </section>
</aside>`;

writeFileSync('AgendaDia.dc.html', escritorio('agenda', 'Agenda', `
<div class="head">
  <div><h1>Viernes, 11 de septiembre</h1><p>8 citas · 2 atendidas · 1 no asistió · huecos libres de 14:00 a 16:30</p></div>
  <div class="row"><span class="btn btn--gho btn--chico">${I16('sync')} Google Calendar · al día</span><span class="btn btn--pri btn--chico">${I16('mas')} Nueva cita</span></div>
</div>
${barraAgenda('dia')}
<div style="display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:20px;align-items:start">
  <div class="stack" style="gap:12px">
    <section class="panel" style="padding:20px 22px 22px 8px">${rejillaDia()}</section>
    <div class="aviso a-info">${I('reloj')}<span class="grow"><b>Fuera de horario</b> · 19:30 Control · Héctor Nava</span><a href="#">Abrir</a></div>
    <div class="row" style="gap:16px;font-size:13px;color:var(--ink-soft);padding:0 4px">
      <span class="row" style="gap:6px"><span style="width:14px;height:14px;border-radius:4px;background:var(--clay-50);border:1px solid var(--clay-200)"></span>Valoración</span>
      <span class="row" style="gap:6px"><span style="width:14px;height:14px;border-radius:4px;background:var(--teal-50);border:1px solid var(--teal-200)"></span>Control</span>
      <span class="row" style="gap:6px"><span style="width:14px;height:14px;border-radius:4px;background:var(--bad-50);border:1px solid var(--bad-200)"></span>No asistió</span>
      <span class="row" style="gap:6px"><span style="width:14px;height:14px;border-radius:4px;background:repeating-linear-gradient(135deg,var(--neutral-50) 0 3px,var(--surface) 3px 6px);border:1px solid var(--line)"></span>Cancelada</span>
    </div>
  </div>
  ${detalleCita}
</div>
`));

const SEMANA = {
  0: [{ ini: 9.5, dur: 45, tipo: 'val', estado: 'atendida', nom: 'Iván Torres' }, { ini: 11, dur: 30, tipo: 'ctl', estado: 'atendida', nom: 'Héctor Nava' }, { ini: 17, dur: 30, tipo: 'ctl', estado: 'no_asistio', nom: 'Karla Soto' }],
  1: [{ ini: 10, dur: 30, tipo: 'ctl', estado: 'atendida', nom: 'Emiliano Ruiz' }, { ini: 12.5, dur: 45, tipo: 'val', estado: 'atendida', nom: 'Daniela Ibarra' }, { ini: 16, dur: 30, tipo: 'ctl', estado: 'atendida', nom: 'Regina Ávalos' }, { ini: 18, dur: 30, tipo: 'ctl', estado: 'cancelada', nom: 'Paola Márquez' }],
  2: [{ ini: 9, dur: 30, tipo: 'ctl', estado: 'atendida', nom: 'Jorge Palacios' }, { ini: 13, dur: 60, tipo: 'val', estado: 'atendida', nom: 'Rosa Villalobos' }],
  3: [{ ini: 11.5, dur: 30, tipo: 'ctl', estado: 'atendida', nom: 'Andrea Luna' }, { ini: 15, dur: 45, tipo: 'val', estado: 'no_asistio', nom: 'Marco Pérez' }, { ini: 17.5, dur: 30, tipo: 'ctl', estado: 'atendida', nom: 'Iván Torres' }],
  4: CITAS_HOY.map((c) => ({ ...c, sel: false })),
  5: [{ ini: 9.5, dur: 45, tipo: 'val', estado: 'programada', nom: 'Fernanda Ochoa' }, { ini: 11, dur: 30, tipo: 'ctl', estado: 'confirmada', nom: 'Diego Ramírez' }],
};
const rejillaSemana = (hora, horasW, dias) => `
<div class="dias" style="grid-template-columns:${horasW}px repeat(6,minmax(0,1fr))">
  <div></div>
  ${dias.map(([d, n], i) => `<div class="dia${i === 4 ? ' hoy' : ''}">${d}<b>${n}</b></div>`).join('')}
</div>
<div class="rej" style="grid-template-columns:${horasW}px repeat(6,minmax(0,1fr));--hora:${hora}px;border-top:1px solid var(--line)">
  ${horasCol(9, 19, hora)}
  ${[0, 1, 2, 3, 4, 5].map((i) => `<div class="rej__col" style="height:${10 * hora}px">
    ${(SEMANA[i] ?? []).map((c) => bloque(c, { hora, compacto: true })).join('')}
    ${i === 5 ? `<div class="cerrado" style="top:${pos(13, hora)}px">Cerrado</div>` : ''}
    ${i === 4 ? `<div class="ahora" style="top:${pos(16 + 20 / 60, hora)}px;left:0"></div>` : ''}
  </div>`).join('')}
</div>`;

writeFileSync('AgendaSemana.dc.html', escritorio('agenda', 'Agenda', `
<div class="head">
  <div><h1>Semana del 7 de septiembre</h1><p>22 citas · 13 atendidas · 3 no asistieron · martes con más huecos</p></div>
  <div class="row"><span class="btn btn--gho btn--chico">${I16('sync')} Google Calendar · al día</span><span class="btn btn--pri btn--chico">${I16('mas')} Nueva cita</span></div>
</div>
${barraAgenda('semana')}
<section class="panel" style="padding:8px 18px 20px 8px">
  ${rejillaSemana(72, 64, [['lun', 7], ['mar', 8], ['mié', 9], ['jue', 10], ['vie', 11], ['sáb', 12]])}
</section>
`));

writeFileSync('TabletAgenda.dc.html', tablet('agenda', 'Agenda', `
<div class="head"><div><h1 style="font-size:30px">Semana del 7 sep</h1><p>22 citas · 3 no asistieron</p></div><span class="btn btn--pri btn--chico">${I16('mas')} Nueva cita</span></div>
<div class="row" style="justify-content:space-between"><div class="row"><span class="icbtn">${I('izq')}</span><span class="btn btn--gho btn--chico">Hoy</span><span class="icbtn">${I('der')}</span></div><span class="seg"><span>Día</span><span class="on">Semana</span></span></div>
<section class="panel" style="padding:6px 12px 16px 4px">${rejillaSemana(64, 46, [['lun', 7], ['mar', 8], ['mié', 9], ['jue', 10], ['vie', 11], ['sáb', 12]])}</section>
`));

writeFileSync('MovilAgenda.dc.html', movil('agenda', 'Agenda', `
<div class="row" style="justify-content:space-between"><h1 style="font-size:26px">Vie 11 sep</h1><span class="btn btn--pri btn--chico">${I16('mas')} Cita</span></div>
<div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px">
  ${[['lun', 7, 3], ['mar', 8, 4], ['mié', 9, 2], ['jue', 10, 3], ['vie', 11, 8], ['sáb', 12, 2]].map(([d, n, c], i) => `<div style="min-height:62px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-size:12px;${i === 4 ? 'background:var(--teal-500);color:var(--on-accent)' : 'background:var(--surface);border:1px solid var(--line);color:var(--ink-soft)'}"><span>${d}</span><b style="font-size:18px;font-family:var(--font-display);font-weight:500;${i === 4 ? '' : 'color:var(--ink)'}">${n}</b><span style="font-size:10.5px">${c} citas</span></div>`).join('')}
</div>
<section class="panel" style="padding:12px 12px 14px 0">${rejillaDia(64, 46)}</section>
<div class="aviso a-info" style="font-size:14px">${I('reloj')}<span class="grow">Fuera de horario · 19:30 Héctor Nava</span></div>
`));

/* ================================================================ NUEVA CITA */
writeFileSync('NuevaCita.dc.html', escritorio('agenda', 'Agenda <span>/ Nueva cita</span>', `
<div class="head"><div><h1>Nueva cita</h1><p>Se guarda en el panel aunque Google no conteste; la copia al calendario va después.</p></div></div>
<div style="display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:20px;align-items:start">
  <div class="stack">
    <section class="panel stack" style="gap:18px">
      <div class="row" style="justify-content:space-between"><h2 style="font-size:22px">¿Quién viene?</h2><span class="seg"><span class="on">Prospecto</span><span>Paciente</span><span>Sin ficha</span></span></div>
      <div class="inp">${I('lupa')}<span class="ph-t">Buscar por nombre o teléfono</span></div>
      <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--teal-200);background:var(--teal-50);border-radius:14px">
        <span class="avatar" style="width:44px;height:44px;font-size:18px">MC</span>
        <div style="flex:1"><b style="font-weight:600">Mariana Estrada</b><span class="sec">55 1234 5678 · Alineadores invisibles · <span class="chip c-warn" style="padding:1px 8px">Contactada</span></span></div>
        <a href="#">Cambiar</a>
      </div>
      <p class="ayuda">Nombre y teléfono se copian a la cita: recepción los ve sin abrir la ficha.</p>
    </section>

    <section class="panel stack" style="gap:18px">
      <h2 style="font-size:22px">¿Cuándo?</h2>
      <div class="campos" style="grid-template-columns:repeat(3,minmax(0,1fr))">
        <div class="campo"><label>Fecha</label><div class="inp">${I('agenda')} Lun 14 sep 2026</div></div>
        <div class="campo"><label>Hora</label><div class="inp inp--foco">${I('reloj')} 16:30</div><span class="ayuda">Hora de Ciudad de México</span></div>
        <div class="campo"><label>Tipo</label><span class="seg" style="width:100%;justify-content:stretch"><span class="on" style="flex:1;justify-content:center">Valoración</span><span style="flex:1;justify-content:center">Control</span></span></div>
      </div>
      <div class="campo"><label>Duración</label><div class="row">${['15', '30', '45', '60', '90'].map((m) => `<span class="fchip${m === '45' ? ' on' : ''}">${m} min</span>`).join('')}<span class="fchip">Otra</span></div></div>
      <div>
        <div class="row" style="justify-content:space-between;margin-bottom:8px"><label style="font-size:14px;font-weight:600">Lunes 14 · ocupación</label><span class="sec">9:00 – 19:00</span></div>
        <div style="position:relative;height:44px;border-radius:10px;background:var(--bg-deep);overflow:hidden">
          ${[[9.5, 0.75], [11, 0.5], [13, 1], [17, 0.5]].map(([h, d]) => `<span style="position:absolute;top:0;bottom:0;left:${((h - 9) / 10) * 100}%;width:${(d / 10) * 100}%;background:var(--line-strong);opacity:.35"></span>`).join('')}
          <span style="position:absolute;top:4px;bottom:4px;left:${((16.5 - 9) / 10) * 100}%;width:${(0.75 / 10) * 100}%;background:var(--clay-500);border-radius:6px"></span>
          ${[9, 11, 13, 15, 17, 19].map((h) => `<span style="position:absolute;bottom:2px;left:calc(${((h - 9) / 10) * 100}% + 3px);font-size:10.5px;color:var(--ink-soft)">${h}</span>`).join('')}
        </div>
        <p class="ayuda" style="margin-top:6px">Gris: ya ocupado. Arcilla: la cita que estás creando. No choca con nada.</p>
      </div>
      <div class="campo"><label>Nota para la agenda <span style="font-weight:400;color:var(--ink-soft)">(opcional)</span></label><div class="inp" style="min-height:76px;align-items:flex-start"><span class="ph-t">Solo lo necesario para recibirla. Nada de historia clínica.</span></div></div>
    </section>
  </div>

  <aside class="stack">
    <section class="panel panel--tinta">
      <span class="eyebrow" style="color:var(--teal-600)">Resumen</span>
      <h2 style="font-size:24px;margin-top:6px">Valoración de Mariana</h2>
      <p style="margin-top:6px;font-size:15px">Lunes 14 de septiembre<br><b class="num">16:30 – 17:15</b></p>
      <div class="stack stack--12" style="margin-top:16px;font-size:14px">
        <span class="row" style="gap:8px">${I16('ok')} El prospecto pasa a <span class="chip c-teal">Agendada</span></span>
        <span class="row" style="gap:8px">${I16('sync')} Se copia a «Consultorio BP»</span>
        <span class="row" style="gap:8px">${I16('nota')} Queda en su historial</span>
      </div>
      <span class="btn btn--pri btn--block" style="margin-top:20px">Guardar cita</span>
      <span class="btn btn--gho btn--chico btn--block" style="margin-top:8px">Cancelar</span>
    </section>
    <div class="aviso a-warn" style="font-size:14px">${I('whatsapp' in D ? 'wa' : 'wa')}<span class="grow">Después de guardar puedes mandarle la confirmación por WhatsApp.</span></div>
  </aside>
</div>
`));

/* ================================================================ PROSPECTOS */
const filasPros = [
  ['Mariana Estrada', '55 1234 5678', 'Alineadores invisibles', ['c-clay', 'Sitio web'], null, 'Hoy 09:14', ['c-clay', 'Nueva'], true],
  ['Carlos Méndez', '55 2211 8899', 'Brackets estéticos', ['c-slate', 'Instagram'], null, 'Ayer 18:40', ['c-clay', 'Nueva'], true],
  ['Sofía Guerrero', '33 4455 6677', 'Ortodoncia infantil', ['c-clay', 'Sitio web'], ['bad', 'Llamar · ayer 10:00'], '8 sep', ['c-warn', 'Contactada'], false],
  ['Diego Ramírez', '55 9090 1212', 'Alineadores invisibles', ['c-neu', 'Recomendación'], ['teal', 'WhatsApp · hoy 17:00'], '6 sep', ['c-warn', 'Contactada'], false],
  ['Luis Fernando Cruz', '55 9876 5432', 'Brackets estéticos', ['c-clay', 'Sitio web'], null, '2 sep', ['c-teal', 'Agendada'], false],
  ['Fernanda Ochoa', '81 3030 4040', 'Retenedores', ['c-slate', 'Instagram'], ['teal', 'Cita · sáb 9:30'], '1 sep', ['c-teal', 'Agendada'], false],
  ['Rosa Villalobos', '55 6060 7070', 'Brackets metálicos', ['c-clay', 'Sitio web'], null, '28 ago', ['c-ink', 'Terminado'], false],
  ['Marco Pérez', '55 1313 1414', 'Alineadores invisibles', ['c-neu', 'Otro'], null, '25 ago', ['c-neu', 'Descartada'], false],
];

writeFileSync('Prospectos.dc.html', escritorio('pros', 'Prospectos', `
<div class="head">
  <div><h1>Prospectos</h1><p>32 solicitudes · 5 sin atender · 3 con seguimiento vencido</p></div>
  <div class="inp" style="min-width:320px">${I('lupa')}<span class="ph-t">Nombre o teléfono</span></div>
</div>
<div class="row" style="justify-content:space-between">
  <div class="row"><span class="fchip on">Todas <b>32</b></span><span class="fchip">Nuevas <b>5</b></span><span class="fchip">Contactadas <b>9</b></span><span class="fchip">Agendadas <b>6</b></span><span class="fchip">Descartadas <b>8</b></span><span class="fchip">Terminadas <b>4</b></span></div>
  <div class="row"><span class="fchip fchip--bad">${I16('alerta')} Seguimiento vencido <b>3</b></span><span class="fchip">${I16('filtro')} Origen: todos ${I16('chevAb')}</span></div>
</div>
<section class="panel panel--flush">
  <table class="tabla">
    <thead><tr><th>Prospecto</th><th>Tratamiento</th><th>Próxima acción</th><th>Recibida</th><th>Estado</th><th class="r"><span style="position:absolute;left:-9999px">Acción</span></th></tr></thead>
    <tbody>
      ${filasPros.map(([n, t, tr, [oc, o], seg, r, [ec, e], nueva]) => `<tr${nueva ? ' style="background:rgba(248,236,229,.35)"' : ''}>
        <td><span class="nom">${n}</span><span class="sec">${t}</span></td>
        <td>${tr}<span class="sec" style="margin-top:5px"><span class="chip ${oc}" style="font-size:11.5px;padding:1px 8px">${o}</span></span></td>
        <td>${seg ? `<span class="chip ${seg[0] === 'bad' ? 'c-bad' : 'c-teal'}">${seg[0] === 'bad' ? '' : ''}${seg[1]}</span>` : '<span class="sec">—</span>'}</td>
        <td class="num" style="color:var(--ink-soft)">${r}</td>
        <td><span class="chip ${ec}">${e}</span></td>
        <td class="r">${e === 'Terminado' ? '<a href="#">Ver paciente</a>' : e === 'Descartada' ? '' : `<span class="btn ${nueva ? 'btn--pri' : 'btn--gho'} btn--chico">${I16('wa')} ${nueva ? 'Contactar' : 'WhatsApp'}</span>`}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</section>
`));

writeFileSync('MovilProspectos.dc.html', movil('pros', 'Prospectos', `
<div class="head" style="align-items:center"><div><h1>Prospectos</h1><p>32 · 5 sin atender</p></div></div>
<div class="inp">${I('lupa')}<span class="ph-t">Nombre o teléfono</span></div>
<div class="scrollx"><span class="fchip on">Todas <b>32</b></span><span class="fchip fchip--bad">${I16('alerta')} Vencidos <b>3</b></span><span class="fchip">Nuevas <b>5</b></span><span class="fchip">Contactadas</span></div>
${filasPros.slice(0, 4).map(([n, t, tr, [oc, o], seg, r, [ec, e], nueva]) => `<div class="tarjeta">
  <div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap"><div><b style="font-weight:600">${n}</b><span class="sec">${tr} · ${o}</span></div><span class="chip ${ec}">${e}</span></div>
  ${seg ? `<div class="row" style="gap:6px;font-size:13.5px;font-weight:600;color:${seg[0] === 'bad' ? 'var(--bad-700)' : 'var(--teal-600)'}">${I16(seg[0] === 'bad' ? 'alerta' : 'reloj')} ${seg[1]}</div>` : ''}
  <div class="row" style="justify-content:space-between"><span class="sec" style="margin:0">Recibida ${r}</span><span class="btn ${nueva ? 'btn--pri' : 'btn--gho'} btn--chico">${I16('wa')} ${nueva ? 'Contactar' : 'WhatsApp'}</span></div>
</div>`).join('')}
`));

/* ------------------------------------------------------ ficha de prospecto */
const lineaTiempo = `
<div class="tl">
  ${[
    ['ic-slate', 'agenda', 'Cita agendada', 'Valoración · jue 17 sep, 16:30 · <span class="chip c-teal">Programada</span>', 'Hoy 11:02 · Recepción'],
    ['ic-teal', 'tel', 'Llamada', 'Quedó en revisarlo con su esposo', 'Ayer 10:15 · Doctora'],
    ['ic-ok', 'wa', 'WhatsApp', 'Primer contacto desde el panel', '8 sep 09:40 · Recepción'],
    ['ic-clay', 'pros', 'Solicitud recibida', 'Formulario del sitio · aviso de privacidad v2026-02-01', '8 sep 08:52'],
  ].map(([ic, i, t, d, w]) => `<div class="tl__i"><span class="fila__ic ${ic}" style="width:36px;height:36px">${I16(i)}</span><div><b style="font-weight:600">${t}</b><span class="sec">${d}</span></div><time>${w}</time></div>`).join('')}
</div>`;

const cabeceraProspecto = (grande = true) => `
<section class="panel" style="display:flex;flex-direction:column;gap:18px">
  <div class="row" style="justify-content:space-between;align-items:flex-start">
    <div class="row" style="gap:16px;align-items:center;flex-wrap:nowrap">
      <span class="avatar">SG</span>
      <div><h1 style="font-size:${grande ? 34 : 28}px">Sofía Guerrero</h1><div class="row" style="margin-top:8px;gap:8px"><span class="chip c-warn">Contactada</span><span class="chip c-clay">Sitio web</span><span class="sec" style="margin:0">Ortodoncia infantil · recibida el 8 sep</span></div></div>
    </div>
    <span class="btn btn--gho btn--chico">Cambiar estado ${I16('chevAb')}</span>
  </div>
  <div class="row"><span class="btn btn--pri btn--chico">${I16('wa')} WhatsApp</span><span class="btn btn--gho btn--chico">${I16('tel')} Llamar</span><span class="btn btn--gho btn--chico">${I16('nota')} Anotar llamada</span><span class="btn btn--gho btn--chico">${I16('agenda')} Agendar cita</span></div>
</section>`;

const proximaAccion = `
<section class="panel" style="border-color:var(--bad-200);background:var(--bad-50);box-shadow:none">
  <div class="row" style="justify-content:space-between"><span class="eyebrow" style="color:var(--bad-700)">Próxima acción · vencida</span>${I('alerta').replace('class="i"', 'class="i" style="color:var(--bad-700)"')}</div>
  <h2 style="font-size:24px;margin-top:8px">Llamar</h2>
  <p style="margin-top:4px;font-size:15px"><b class="num">Ayer, 10:00</b> · «preguntar si ya lo habló en casa»</p>
  <div class="row" style="margin-top:16px"><span class="btn btn--pri btn--chico">${I16('ok')} Hecho</span><span class="btn btn--gho btn--chico">Posponer</span><span class="btn btn--gho btn--chico">Editar</span></div>
</section>`;

const plegablesProspecto = `
<section class="panel" style="padding-top:6px;padding-bottom:6px">
  <details class="pleg" style="border-top:0"><summary>Mensaje del formulario <em>1 párrafo</em></summary></details>
  <details class="pleg"><summary>Origen <em>Sitio web</em></summary></details>
  <details class="pleg" open><summary>Notas <em>Solo para el consultorio</em></summary><div class="inp" style="min-height:92px;align-items:flex-start;margin-bottom:14px">Su hija tiene 9 años. Prefiere tardes.</div></details>
  <details class="pleg"><summary>Consentimiento <em>Aceptado 8 sep</em></summary></details>
</section>`;

writeFileSync('ProspectoFicha.dc.html', escritorio('pros', 'Prospectos <span>/ Sofía Guerrero</span>', `
${cabeceraProspecto()}
<div class="grid2">
  <div class="stack">
    <section class="panel">
      <div class="ph"><h2>Historial</h2><span class="sec">Citas y contactos, lo más reciente arriba</span></div>
      ${lineaTiempo}
    </section>
  </div>
  <div class="stack">
    ${proximaAccion}
    <section class="panel panel--tinta">
      <h2 style="font-size:20px">Convertir en paciente</h2>
      <p style="font-size:14.5px;color:var(--ink-soft);margin:6px 0 14px">Cuando acepte el tratamiento. Se crea su ficha y esta solicitud queda como historia.</p>
      <span class="btn btn--gho btn--chico btn--block" style="border-color:var(--teal-500);color:var(--teal-600)">${I16('usuMas')} Convertir</span>
    </section>
    ${plegablesProspecto}
  </div>
</div>
`));

writeFileSync('TabletProspecto.dc.html', tablet('pros', 'Sofía Guerrero', `
${cabeceraProspecto(false)}
${proximaAccion}
<section class="panel"><div class="ph"><h2>Historial</h2></div>${lineaTiempo}</section>
${plegablesProspecto}
`));

writeFileSync('MovilProspecto.dc.html', movil('pros', 'Sofía Guerrero', `
<div class="row" style="gap:12px;flex-wrap:nowrap"><span class="avatar" style="width:48px;height:48px;font-size:19px">SG</span><div><h1 style="font-size:26px">Sofía Guerrero</h1><div class="row" style="gap:6px;margin-top:6px"><span class="chip c-warn">Contactada</span><span class="chip c-clay">Sitio web</span></div></div></div>
<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">
  <span class="btn btn--pri btn--chico" style="flex-direction:column;gap:2px;min-height:64px;border-radius:14px">${I('wa')}WhatsApp</span>
  <span class="btn btn--gho btn--chico" style="flex-direction:column;gap:2px;min-height:64px;border-radius:14px">${I('tel')}Llamar</span>
  <span class="btn btn--gho btn--chico" style="flex-direction:column;gap:2px;min-height:64px;border-radius:14px">${I('agenda')}Agendar</span>
</div>
${proximaAccion.replace('font-size:24px', 'font-size:22px')}
<section class="panel"><div class="ph"><h2 style="font-size:20px">Historial</h2></div>${lineaTiempo.replaceAll('grid-template-columns:40px', 'grid-template-columns:36px')}</section>
`));

/* ================================================================ PACIENTES */
writeFileSync('Pacientes.dc.html', escritorio('pac', 'Pacientes', `
<div class="head">
  <div><h1>Pacientes</h1><p>42 activos · 7 en retención · 4 con cuota vencida</p></div>
  <div class="row"><div class="inp" style="min-width:300px">${I('lupa')}<span class="ph-t">Nombre o teléfono</span></div><span class="btn btn--pri btn--chico">${I16('mas')} Nuevo paciente</span></div>
</div>
<div class="row"><span class="fchip on">Activos <b>42</b></span><span class="fchip">En retención <b>7</b></span><span class="fchip">Pausados <b>2</b></span><span class="fchip">Alta <b>11</b></span><span class="fchip fchip--bad">${I16('alerta')} Con adeudo vencido <b>4</b></span></div>
<section class="panel panel--flush">
  <table class="tabla">
    <thead><tr><th>Paciente</th><th>Avance</th><th>Próxima cita</th><th class="r">Saldo</th><th>Pagos</th></tr></thead>
    <tbody>
      ${[
        ['Jorge Palacios', 'Brackets metálicos', 7, 18, 'Vie 18 sep · 10:00', '$27,000', ['c-bad', 'Vencida hace 27 días']],
        ['Paola Márquez', 'Alineadores invisibles', 3, 24, 'Sin cita', '$51,450', ['c-bad', 'Vencida hace 14 días']],
        ['Emiliano Ruiz', 'Brackets estéticos', 12, 20, 'Mar 22 sep · 16:00', '$19,600', ['c-ok', 'Al corriente']],
        ['Regina Ávalos', 'Ortodoncia infantil', 2, 18, 'Hoy · 17:30', '$46,400', ['c-ok', 'Al corriente']],
        ['Daniela Ibarra', 'Brackets metálicos', 1, 18, 'Jue 1 oct · 12:30', '$38,500', ['c-warn', 'Parcial']],
        ['Héctor Nava', 'Alineadores invisibles', 20, 20, 'Hoy · 19:30', '$0', ['c-ok', 'Liquidado']],
      ].map(([n, t, m, tot, c, s, [pc, p]]) => `<tr>
        <td><span class="nom">${n}</span><span class="sec">${t}</span></td>
        <td style="min-width:180px"><div class="row" style="justify-content:space-between;font-size:13px;color:var(--ink-soft);margin-bottom:6px"><span>Mes ${m} de ${tot}</span><span>${Math.round((m / tot) * 100)}%</span></div><div class="barra"><i style="width:${(m / tot) * 100}%"></i></div></td>
        <td>${c === 'Sin cita' ? '<a href="#">+ Agendar</a>' : `<span class="num">${c}</span>`}</td>
        <td class="r num">${s}</td>
        <td><span class="chip ${pc}">${p}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>
</section>
`));

const cabeceraPaciente = (compacto = false) => `
<section class="panel" style="display:flex;flex-direction:column;gap:20px">
  <div class="row" style="justify-content:space-between;align-items:flex-start">
    <div class="row" style="gap:16px;flex-wrap:nowrap">
      <span class="avatar avatar--teal">JP</span>
      <div><h1 style="font-size:${compacto ? 28 : 34}px">Jorge Palacios</h1><div class="row" style="gap:8px;margin-top:8px"><span class="chip c-ok">Activo</span><span class="sec" style="margin:0">Brackets metálicos · desde el 12 feb 2026 · vino por el sitio</span></div></div>
    </div>
    <div class="row"><span class="btn btn--gho btn--chico">${I16('wa')} WhatsApp</span><span class="btn btn--gho btn--chico">${I16('agenda')} Agendar cita</span><span class="btn btn--pri btn--chico">${I16('mas')} Registrar pago</span></div>
  </div>
  <div style="display:grid;grid-template-columns:${compacto ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))'};gap:0;border-top:1px solid var(--line);padding-top:18px">
    <div class="kpi" style="padding-left:0"><span class="eyebrow">Costo total</span><span class="kpi__v num">$49,000</span></div>
    <div class="kpi"><span class="eyebrow">Pagado</span><span class="kpi__v num">$22,000</span><span class="sec">Enganche + 6 cuotas</span></div>
    <div class="kpi" style="${compacto ? 'border-left:0;padding-left:0;margin-top:14px' : ''}"><span class="eyebrow">Saldo</span><span class="kpi__v num">$27,000</span><span class="sec" style="color:var(--bad-700);font-weight:600">1 cuota vencida · $2,450</span></div>
    <div class="kpi" style="${compacto ? 'margin-top:14px' : ''}"><span class="eyebrow">Avance</span><span class="kpi__v num">Mes 7 <span style="font-size:16px;color:var(--ink-soft);font-weight:500">de 18</span></span><div class="barra" style="margin-top:4px"><i style="width:39%"></i></div></div>
  </div>
</section>`;

const mensualidades = `
<section class="panel panel--flush">
  <div class="ph"><h2>Mensualidades</h2><a href="#">Editar plan</a></div>
  <table class="tabla tabla--media">
    <thead><tr><th>Cuota</th><th>Vence</th><th class="r">Falta</th><th class="r"><span style="position:absolute;left:-9999px">Acciones</span></th></tr></thead>
    <tbody>
      <tr style="background:rgba(248,231,226,.45)"><td><span class="nom" style="white-space:nowrap">Mensualidad 7</span><span class="sec">Sin recordar</span></td><td><span class="chip c-bad">Venció 15 ago</span></td><td class="r num">$2,450</td><td class="r"><div class="row" style="justify-content:flex-end;flex-wrap:nowrap"><span class="btn btn--gho btn--chico">${I16('wa')} Cobrar</span><span class="btn btn--sua btn--chico">${I16('ok')} Enviado</span></div></td></tr>
      <tr><td><span class="nom" style="white-space:nowrap">Mensualidad 8</span></td><td><span class="chip c-neu">15 sep</span></td><td class="r num">$2,450</td><td class="r"><a href="#">Registrar</a></td></tr>
      <tr><td><span class="nom" style="white-space:nowrap">Mensualidad 9</span></td><td><span class="chip c-neu">15 oct</span></td><td class="r num">$2,450</td><td class="r"></td></tr>
      <tr><td><span class="nom" style="white-space:nowrap">Mensualidad 6</span><span class="sec">Recordada 12 jul</span></td><td><span class="chip c-ok">Pagada</span></td><td class="r num" style="color:var(--ink-soft)">$0</td><td class="r"></td></tr>
    </tbody>
  </table>
</section>`;

const citasPaciente = `
<section class="panel">
  <div class="ph"><h2>Citas</h2><a href="#">+ Agendar</a></div>
  <div class="panel panel--tinta" style="padding:14px 16px;display:flex;gap:14px;align-items:center">
    <span class="fila__ic ic-slate" style="background:var(--surface)">${I('agenda')}</span>
    <div style="flex:1"><span class="eyebrow">Próxima</span><b style="display:block;font-weight:600">Vie 18 sep · 10:00</b><span class="sec">Control · 30 min</span></div>
    <span class="chip c-slate">Confirmada</span>
  </div>
  <div class="tl" style="margin-top:8px">
    ${[['11 sep', 'Control', 'c-ok', 'Atendida'], ['14 ago', 'Control', 'c-bad', 'No asistió'], ['17 jul', 'Control', 'c-ok', 'Atendida']].map(([d, t, c, e]) => `<div class="tl__i" style="grid-template-columns:64px minmax(0,1fr) auto;align-items:center"><time class="num">${d}</time><span style="font-size:14.5px">${t}</span><span class="chip ${c}">${e}</span></div>`).join('')}
  </div>
</section>`;

writeFileSync('PacienteFicha.dc.html', escritorio('pac', 'Pacientes <span>/ Jorge Palacios</span>', `
${cabeceraPaciente()}
<div class="tabs"><span class="on">Resumen</span><span>Mensualidades <b>18</b></span><span>Pagos <b>7</b></span><span>Citas <b>9</b></span><span>Datos y notas</span></div>
<div class="grid2">
  <div class="stack">${mensualidades}
    <section class="panel panel--flush">
      <div class="ph"><h2>Últimos pagos</h2><a href="#">Ver los 7</a></div>
      <table class="tabla"><tbody>
        ${[['Retenedor extra', '2 ago', 'Efectivo', '$1,800'], ['Mensualidad 6', '15 jul', 'Transferencia', '$2,450'], ['Mensualidad 5', '14 jun', 'Tarjeta', '$2,450']].map(([c, f, m, v]) => `<tr><td><span class="nom">${c}</span><span class="sec">${m}</span></td><td class="num" style="color:var(--ink-soft)">${f}</td><td class="r num">${v}</td></tr>`).join('')}
      </tbody></table>
    </section>
  </div>
  <div class="stack">${citasPaciente}
    <section class="panel">
      <div class="ph" style="margin-bottom:6px"><h2 style="font-size:20px">Datos</h2><a href="#">Editar</a></div>
      <dl class="dl"><dt>Teléfono</dt><dd>55 4411 2200</dd><dt>Inicio</dt><dd>12 feb 2026</dd><dt>Origen</dt><dd><a href="#">Solicitud del sitio</a></dd></dl>
      <details class="pleg" style="margin-top:14px"><summary>Notas clínicas <em>Solo doctora</em></summary></details>
    </section>
  </div>
</div>
`));

writeFileSync('TabletPaciente.dc.html', tablet('pac', 'Jorge Palacios', `
${cabeceraPaciente(true)}
<div class="tabs"><span class="on">Resumen</span><span>Cuotas</span><span>Pagos</span><span>Citas</span></div>
${citasPaciente}
${mensualidades.replace('<th>Recordatorio</th>', '<th>Recordado</th>').replace('class="tabla"', 'class="tabla tabla--compacta"')}
`));

writeFileSync('MovilPaciente.dc.html', movil('pac', 'Jorge Palacios', `
<div class="row" style="gap:12px;flex-wrap:nowrap"><span class="avatar avatar--teal" style="width:48px;height:48px;font-size:19px">JP</span><div><h1 style="font-size:26px">Jorge Palacios</h1><div class="row" style="gap:6px;margin-top:6px"><span class="chip c-ok">Activo</span><span class="sec" style="margin:0">Brackets · mes 7/18</span></div></div></div>
<section class="panel" style="padding:16px 18px">
  <div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Saldo</span><div class="kpi__v num">$27,000</div></div><div style="text-align:right"><span class="eyebrow">Pagado</span><div class="num" style="font-weight:600">$22,000 / $49,000</div></div></div>
  <div class="barra" style="margin-top:12px"><i style="width:45%"></i></div>
</section>
<div class="aviso a-bad" style="flex-wrap:wrap">${I('dinero')}<span class="grow"><b>Mensualidad 7 vencida</b><br>$2,450 · desde el 15 ago · sin recordar</span><div class="row" style="width:100%"><span class="btn btn--gho btn--chico" style="flex:1;background:var(--surface)">${I16('wa')} Cobrar</span><span class="btn btn--pri btn--chico" style="flex:1">Registrar pago</span></div></div>
<section class="panel" style="padding:16px 18px">
  <div class="ph" style="margin-bottom:8px"><h2 style="font-size:20px">Citas</h2><a href="#">+ Agendar</a></div>
  <div class="row" style="flex-wrap:nowrap;gap:12px"><span class="fila__ic ic-slate">${I('agenda')}</span><div style="flex:1"><b style="font-weight:600">Vie 18 sep · 10:00</b><span class="sec">Control · confirmada</span></div></div>
</section>
<div class="tabs" style="gap:18px;overflow:hidden"><span class="on">Cuotas</span><span>Pagos</span><span>Citas</span><span>Datos</span></div>
${['8 de 18 · vence 15 sep', '9 de 18 · vence 15 oct'].map((t) => `<div class="tarjeta" style="flex-direction:row;align-items:center;justify-content:space-between"><div><b style="font-weight:600">Mensualidad ${t.split(' · ')[0]}</b><span class="sec">${t.split(' · ')[1]}</span></div><b class="num">$2,450</b></div>`).join('')}
`));

/* ================================================================ PAGOS */
const porCobrarFilas = [
  ['Jorge Palacios', '7 de 18', 'Venció 15 ago', 'c-bad', '$2,450', 'Sin recordar', false],
  ['Paola Márquez', '3 de 24', 'Venció 28 ago', 'c-bad', '$2,450', 'Recordada hace 2 días', true],
  ['Karla Soto', '10 de 12', 'Venció 1 sep', 'c-bad', '$2,450', 'Sin recordar', false],
  ['Iván Torres', '4 de 18', 'Venció 5 sep', 'c-warn', '$1,200 de $2,450', 'Recordado hoy', true],
  ['Emiliano Ruiz', '13 de 20', '15 sep', 'c-neu', '$2,450', '—', false],
];

writeFileSync('Pagos.dc.html', escritorio('pag', 'Pagos', `
<div class="head">
  <div><h1>Pagos</h1><p>Septiembre 2026</p></div>
  <div class="row"><span class="fchip">${I16('agenda')} Septiembre 2026 ${I16('chevAb')}</span><span class="btn btn--pri btn--chico">${I16('mas')} Registrar pago</span></div>
</div>
<section class="panel">
  <div class="kpis" style="grid-template-columns:1.4fr 1fr 1fr">
    <div class="kpi" style="padding-left:0"><span class="eyebrow">Cobrado en septiembre</span><span class="kpi__v num" style="font-size:34px">$68,400</span><div class="barra" style="margin-top:6px"><i style="width:75%"></i></div><span class="sec">75% de $91,200 esperado · 27 movimientos</span></div>
    <div class="kpi"><span class="eyebrow">Vencido</span><span class="kpi__v num" style="color:var(--bad-700)">$9,800</span><span class="sec">4 cuotas · 3 pacientes</span></div>
    <div class="kpi"><span class="eyebrow">Sin recordar</span><span class="kpi__v num">2</span><span class="sec">de las 4 vencidas</span></div>
  </div>
</section>
<section class="panel panel--flush">
  <div class="ph"><h2>Por cobrar</h2><span class="seg"><span class="on">Vencidas y próximas</span><span>Solo vencidas</span></span></div>
  <table class="tabla tabla--media">
    <thead><tr><th>Paciente</th><th>Vence</th><th class="r">Falta</th><th>Recordatorio</th><th class="r"><span style="position:absolute;left:-9999px">Acciones</span></th></tr></thead>
    <tbody>
      ${porCobrarFilas.map(([n, c, v, vc, f, r, recordado]) => `<tr>
        <td><span class="nom" style="white-space:nowrap">${n}</span><span class="sec" style="white-space:nowrap">Mensualidad ${c}</span></td>
        <td><span class="chip ${vc}">${v}</span></td>
        <td class="r num" style="white-space:nowrap">${f}</td>
        <td>${recordado ? `<span class="row" style="gap:6px;flex-wrap:nowrap;white-space:nowrap;font-size:13.5px;color:var(--ok-700);font-weight:600">${I16('ok')} ${r}</span>` : `<span class="sec" style="margin:0">${r}</span>`}</td>
        <td class="r"><div class="row" style="justify-content:flex-end;flex-wrap:nowrap;gap:8px">${vc === 'c-neu' ? '' : `<span class="btn btn--gho btn--chico">${I16('wa')} WhatsApp</span>${recordado ? '' : `<span class="btn btn--sua btn--chico">${I16('ok')} Marcar enviado</span>`}`}<a href="#" style="padding:0 6px">Registrar</a></div></td>
      </tr>`).join('')}
    </tbody>
  </table>
</section>
<section class="panel panel--flush">
  <div class="ph"><h2>Movimientos</h2><div class="row"><span class="fchip on">Todos</span><span class="fchip">Mensualidades</span><span class="fchip">Enganches</span><span class="fchip">Cargos sueltos</span></div></div>
  <table class="tabla">
    <thead><tr><th>Paciente</th><th>Concepto</th><th>Fecha</th><th class="r">Monto</th><th class="r"></th></tr></thead>
    <tbody>
      ${[['Emiliano Ruiz', 'Mensualidad 12', 'Transferencia', '11 sep', '$2,450'], ['Daniela Ibarra', 'Enganche', 'Tarjeta', '4 sep', '$10,000'], ['Regina Ávalos', 'Mensualidad 2', 'Efectivo', '3 sep', '$2,900']].map(([n, c, m, f, v]) => `<tr><td><span class="nom">${n}</span></td><td>${c}<span class="sec">${m}</span></td><td class="num" style="color:var(--ink-soft)">${f}</td><td class="r num" style="font-weight:600">${v}</td><td class="r"><a href="#" style="color:var(--ink-soft);font-weight:500">Quitar</a></td></tr>`).join('')}
    </tbody>
  </table>
</section>
`));

writeFileSync('TabletPagos.dc.html', tablet('pag', 'Pagos', `
<div class="head"><div><h1 style="font-size:32px">Pagos</h1><p>Septiembre 2026</p></div><span class="btn btn--pri btn--chico">${I16('mas')} Registrar pago</span></div>
<section class="panel"><div class="kpis"><div class="kpi" style="padding-left:0"><span class="eyebrow">Cobrado</span><span class="kpi__v num">$68,400</span><span class="sec">75% esperado</span></div><div class="kpi"><span class="eyebrow">Vencido</span><span class="kpi__v num" style="color:var(--bad-700)">$9,800</span><span class="sec">4 cuotas</span></div><div class="kpi"><span class="eyebrow">Sin recordar</span><span class="kpi__v num">2</span></div></div></section>
<section class="panel panel--flush">
  <div class="ph"><h2>Por cobrar</h2></div>
  ${porCobrarFilas.slice(0, 4).map(([n, c, v, vc, f, r, recordado]) => `<div class="fila" style="flex-wrap:wrap"><div class="fila__q" style="min-width:220px"><b>${n}</b><span class="sec">Mensualidad ${c} · ${f}</span></div><span class="chip ${vc}">${v}</span><span class="sec" style="margin:0;min-width:150px;${recordado ? 'color:var(--ok-700);font-weight:600' : ''}">${r}</span><div class="row">${recordado ? '' : `<span class="btn btn--sua btn--chico">${I16('ok')} Enviado</span>`}<span class="btn btn--gho btn--chico">${I16('wa')}</span><span class="btn btn--gho btn--chico">Registrar</span></div></div>`).join('')}
</section>
`));

writeFileSync('MovilPagos.dc.html', movil('pag', 'Pagos', `
<div class="head" style="align-items:center"><div><h1>Por cobrar</h1><p>$9,800 vencido · 2 sin recordar</p></div></div>
<div class="scrollx"><span class="fchip on">Vencidas <b>4</b></span><span class="fchip">Próximas <b>6</b></span><span class="fchip">Movimientos</span></div>
${porCobrarFilas.slice(0, 3).map(([n, c, v, vc, f, r, recordado]) => `<div class="tarjeta">
  <div class="row" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start"><div><b style="font-weight:600">${n}</b><span class="sec">Mensualidad ${c}</span></div><b class="num" style="font-size:18px">${f}</b></div>
  <div class="row" style="justify-content:space-between"><span class="chip ${vc}">${v}</span><span style="font-size:13px;${recordado ? 'color:var(--ok-700);font-weight:600' : 'color:var(--ink-soft)'}">${r}</span></div>
  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">${recordado ? `<span class="btn btn--gho btn--chico">Ver ficha</span>` : `<span class="btn btn--gho btn--chico">${I16('wa')} Cobrar</span>`}<span class="btn ${recordado ? 'btn--pri' : 'btn--sua'} btn--chico">${recordado ? 'Registrar pago' : `${I16('ok')} Marcar enviado`}</span></div>
</div>`).join('')}
<span class="btn btn--pri btn--block">${I('mas')} Registrar pago</span>
`));

writeFileSync('RegistrarPago.dc.html', escritorio('pag', 'Pagos <span>/ Registrar pago</span>', `
<div class="head"><div><h1>Registrar pago</h1><p>Lo que entró hoy. Se aplica a una mensualidad o queda como cargo suelto.</p></div></div>
<div style="display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:20px;align-items:start;max-width:1120px">
  <section class="panel stack" style="gap:22px">
    <div class="campo"><label>Paciente</label>
      <div style="display:flex;align-items:center;gap:14px;padding:12px 16px;border:1px solid var(--line-strong);border-radius:14px"><span class="avatar avatar--teal" style="width:40px;height:40px;font-size:16px">JP</span><div style="flex:1"><b style="font-weight:600">Jorge Palacios</b><span class="sec">Brackets metálicos · saldo $27,000</span></div><a href="#">Cambiar</a></div>
    </div>
    <div class="campo"><label>¿A qué corresponde?</label>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">
        <div style="border:2px solid var(--teal-500);background:var(--teal-50);border-radius:14px;padding:12px 14px"><div class="row" style="justify-content:space-between"><b style="font-weight:600">Mensualidad 7</b>${I16('ok')}</div><span class="chip c-bad" style="margin-top:6px">Vencida</span><div class="num" style="margin-top:6px;font-weight:600">$2,450</div></div>
        <div style="border:1px solid var(--line);border-radius:14px;padding:12px 14px"><b style="font-weight:600">Mensualidad 8</b><span class="chip c-neu" style="margin-top:6px">15 sep</span><div class="num" style="margin-top:6px;color:var(--ink-soft)">$2,450</div></div>
        <div style="border:1px dashed var(--line-strong);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;justify-content:center"><b style="font-weight:600">Otro</b><span class="sec">Enganche o cargo suelto</span></div>
      </div>
    </div>
    <div class="campo"><label>Importe</label>
      <div class="inp inp--foco" style="min-height:76px;font-family:var(--font-display);font-size:40px;padding:8px 20px"><span style="color:var(--ink-soft)">$</span><span class="num">2,450.00</span></div>
      <span class="ayuda">Completa la mensualidad 7. Si pagó menos, la cuota queda como parcial.</span>
    </div>
    <div class="campos">
      <div class="campo"><label>Método</label><span class="seg" style="width:100%"><span class="on" style="flex:1;justify-content:center">Transferencia</span><span style="flex:1;justify-content:center">Efectivo</span><span style="flex:1;justify-content:center">Tarjeta</span></span></div>
      <div class="campo"><label>Fecha</label><div class="inp">${I('agenda')} Hoy, 11 sep 2026</div></div>
    </div>
    <div class="campo"><label>Nota <span style="font-weight:400;color:var(--ink-soft)">(opcional)</span></label><div class="inp"><span class="ph-t">Referencia de la transferencia</span></div></div>
  </section>
  <aside class="stack">
    <section class="panel panel--tinta">
      <span class="eyebrow" style="color:var(--teal-600)">Después de este pago</span>
      <div class="stack stack--12" style="margin-top:14px;font-size:15px">
        <div class="row" style="justify-content:space-between"><span>Saldo</span><span class="num"><s style="color:var(--ink-soft)">$27,000</s> → <b>$24,550</b></span></div>
        <div class="row" style="justify-content:space-between"><span>Mensualidad 7</span><span class="chip c-ok">Pagada</span></div>
        <div class="row" style="justify-content:space-between"><span>Cuotas vencidas</span><b class="num">0</b></div>
        <div class="row" style="justify-content:space-between"><span>Siguiente</span><span class="num">15 sep · $2,450</span></div>
      </div>
      <span class="btn btn--pri btn--block" style="margin-top:20px">Registrar $2,450.00</span>
      <span class="btn btn--gho btn--chico btn--block" style="margin-top:8px">Cancelar</span>
    </section>
  </aside>
</div>
`));

/* ================================================================ LIENZO */
const G = 120;
const fila = (items, page, y, gap) => {
  let x = 0;
  return items.map(([file, w, h, title]) => {
    const a = { file, page, x, y, w, h, title };
    x += w + gap;
    return a;
  });
};
const artboards = [
  ...fila([['Sistema.dc.html', 1440, 2260, 'Sistema del panel']], 'p-sistema', 0, 120),
  ...fila([['Main.dc.html', 1440, 1480, 'Inicio'], ['AgendaDia.dc.html', 1440, 1250, 'Agenda · día'], ['AgendaSemana.dc.html', 1440, 1140, 'Agenda · semana'], ['NuevaCita.dc.html', 1440, 1140, 'Nueva cita']], 'p-escritorio', 0, G),
  ...fila([['Prospectos.dc.html', 1440, 1080, 'Prospectos'], ['ProspectoFicha.dc.html', 1440, 1140, 'Ficha de prospecto'], ['Pacientes.dc.html', 1440, 900, 'Pacientes'], ['PacienteFicha.dc.html', 1440, 1320, 'Ficha de paciente']], 'p-escritorio', 1680, G),
  ...fila([['Pagos.dc.html', 1440, 1480, 'Pagos'], ['RegistrarPago.dc.html', 1440, 1000, 'Registrar pago']], 'p-escritorio', 3200, G),
  ...fila([['TabletInicio.dc.html', 768, 1700, 'Inicio'], ['TabletAgenda.dc.html', 768, 1040, 'Agenda · semana'], ['TabletProspecto.dc.html', 768, 1460, 'Ficha de prospecto'], ['TabletPaciente.dc.html', 768, 1500, 'Ficha de paciente'], ['TabletPagos.dc.html', 768, 1024, 'Pagos']], 'p-tablet', 0, 100),
  ...fila([['MovilInicio.dc.html', 390, 1180, 'Inicio'], ['MovilAgenda.dc.html', 390, 1070, 'Agenda · día'], ['MovilProspectos.dc.html', 390, 1090, 'Prospectos'], ['MovilProspecto.dc.html', 390, 1180, 'Ficha de prospecto'], ['MovilPaciente.dc.html', 390, 1120, 'Ficha de paciente'], ['MovilPagos.dc.html', 390, 1100, 'Cobranza']], 'p-movil', 0, 90),
];

writeFileSync('canvas.json', JSON.stringify({
  pages: [
    { id: 'p-sistema', name: 'Sistema' },
    { id: 'p-escritorio', name: 'Escritorio 1440' },
    { id: 'p-tablet', name: 'Tablet 768' },
    { id: 'p-movil', name: 'Móvil 390' },
  ],
  artboards,
  annotations: [
    { id: 'nota-sistema', page: 'p-sistema', x: 1540, y: 0, w: 320, text: 'Misma marca, más colores.\nArcilla = prospectos y valoraciones.\nPizarra = confirmado e informativo.\nEstados siempre con texto al lado.' },
    { id: 'nota-escritorio', page: 'p-escritorio', x: 0, y: -170, w: 520, text: 'Maquetas estáticas para revisar antes de programar. Nombres y cifras son de ejemplo.\nFila 1: Inicio y agenda · Fila 2: prospectos y pacientes · Fila 3: pagos.' },
    { id: 'nota-agenda', page: 'p-escritorio', x: 1560, y: -170, w: 520, text: 'Agenda por horas: el alto del bloque es la duración. Al hacer clic se abre el detalle a la derecha; una valoración atendida ofrece convertir, nunca convierte sola.' },
    { id: 'nota-movil', page: 'p-movil', x: 0, y: -150, w: 420, text: 'Móvil: tablas pasan a tarjetas, acciones de 44 px o más, barra de pestañas fija abajo como hoy.' },
  ],
  launch: { view: 'canvas', page: 'p-escritorio' },
}, null, 2));

console.log(`${artboards.length} artboards`);
