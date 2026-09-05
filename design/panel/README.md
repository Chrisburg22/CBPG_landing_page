# Canvas de diseño del panel

Fuentes del diseño aprobado del panel `/admin`, publicado como
[canvas](https://claude.ai/code/artifact/0734c5e6-8045-4b41-9c4e-c66dcc76277d):
23 artboards en cuatro páginas (Escritorio 1440, Tablet 768, Móvil 390, y los
diagramas de flujo y el modelo de datos).

## Qué es cada cosa

| Archivo | Qué es |
|---|---|
| `*.dc.html` | Un artboard cada uno. Es el entregable: HTML autónomo con estilos en línea. |
| `canvas.json` | Posiciones, páginas y notas del lienzo. |
| `_gen.mjs` | Genera los artboards de escritorio. **Tiene el CSS común** que los otros dos generadores reutilizan leyéndolo de aquí. |
| `_gen3.mjs` | Genera los siete de móvil. Sobrescribe `MobileHome.dc.html` que `_gen.mjs` escribe primero: correr `_gen.mjs` antes. |
| `_gen4.mjs` | Genera los seis de tablet. |
| `_audit.mjs` | Escribe `_audit.html`, un arnés que monta cada artboard en un iframe de su tamaño real y mide recorte, desbordamiento horizontal, áreas táctiles menores de 44px y contraste. Se abre en un navegador y se llama a `window.__report()`. |

`panel-ortodoncia.html` (el archivo sembrado que se publica) no se versiona: son
~2,7 MB del editor empaquetado y se regenera con `seed-canvas.mjs` del skill
`design`.

## Regenerar

```bash
node _gen.mjs && node _gen3.mjs && node _gen4.mjs
```

El orden importa por lo de `MobileHome.dc.html`.

## Ojo

Los artboards son **maquetas**, no la implementación. Sus clases están en inglés
corto (`.item`, `.tile`); el panel real usa las del repo, en español
(`.metrica`, `.nav-panel__enlace`). Al portar algo, se copian los valores
—colores, radios, tamaños—, no los nombres.
