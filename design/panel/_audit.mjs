import { readFileSync, writeFileSync } from 'node:fs';
const canvas = JSON.parse(readFileSync('canvas.json','utf8'));
const items = canvas.artboards.map(a => {
  const raw = readFileSync(a.file,'utf8');
  const style = (raw.match(/<helmet>\s*<style>([\s\S]*?)<\/style>/)||[])[1] || '';
  const body  = raw.slice(raw.indexOf('</helmet>')+9, raw.lastIndexOf('</x-dc>'));
  const srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{height:100%}${style}</style></head><body>${body}</body></html>`;
  return { file:a.file, page:a.page, title:a.title||a.file, w:a.w, h:a.h, srcdoc };
});
writeFileSync('_audit.html', `<!doctype html><html><head><meta charset="utf-8"><title>audit</title></head><body>
<div id="host"></div>
<script>
window.__items = ${JSON.stringify(items)};
window.__report = async function(){
  const host = document.getElementById('host'); host.innerHTML='';
  const out = [];
  for (const it of window.__items){
    const f = document.createElement('iframe');
    f.style.cssText = 'width:'+it.w+'px;height:'+it.h+'px;border:0;position:absolute;left:-99999px;top:0';
    f.srcdoc = it.srcdoc; host.appendChild(f);
    await new Promise(r=>{ f.onload=r; setTimeout(r,1500); });
    const d = f.contentDocument;
    const de = d.documentElement;
    const contentH = Math.max(de.scrollHeight, d.body.scrollHeight);
    const contentW = Math.max(de.scrollWidth, d.body.scrollWidth);
    // busca elementos que se salen por la derecha
    let overflowX = [];
    for (const el of d.querySelectorAll('body *')){
      const r = el.getBoundingClientRect();
      if (r.width>0 && r.right > it.w + 1.5 && el.scrollWidth <= el.clientWidth + 1) {
        const p = el.parentElement;
        if (!p || p.getBoundingClientRect().right <= it.w + 1.5) overflowX.push(el.tagName.toLowerCase()+'.'+(el.className||'').toString().split(' ')[0]);
      }
    }
    // targets tactiles pequenos
    let small = [];
    for (const el of d.querySelectorAll('button,a[href],input,select,textarea,[role=radio]')){
      const r = el.getBoundingClientRect();
      if (r.width===0 && r.height===0) continue;
      if (r.height < 43.5 || r.width < 43.5) small.push(el.tagName.toLowerCase()+'.'+(el.className||'').toString().split(' ')[0]+' '+Math.round(r.width)+'x'+Math.round(r.height));
    }
    out.push({file:it.file, page:it.page, w:it.w, h:it.h, contentH, contentW,
      clipY: contentH - it.h, clipX: contentW - it.w,
      overflowX:[...new Set(overflowX)].slice(0,6), small:[...new Set(small)].slice(0,10)});
    f.remove();
  }
  return out;
};
<\/script></body></html>`);
console.log('harness listo:', items.length, 'artboards');
