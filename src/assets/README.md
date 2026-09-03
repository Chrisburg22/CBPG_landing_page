# Imágenes del sitio

Los componentes cargan estas fotos con `import.meta.glob`, así que **el sitio
compila aunque falten**: mientras no exista el archivo se muestra el marcador
rayado, y al copiarlo aparece solo, sin tocar código.

Archivos esperados:

    doctora-retrato.jpg        4:5   portada
    doctora-titulacion.jpg     5:6   sección «Sobre la doctora»
    caso-01/antes-frontal.jpg     ~2.27:1
    caso-01/durante-frontal.jpg   ~2.27:1
    caso-01/despues-frontal.jpg   ~2.27:1
    caso-01/antes-superior.jpg     1.25:1
    caso-01/despues-superior.jpg   1.25:1
    caso-01/antes-inferior.jpg     1.25:1
    caso-01/despues-inferior.jpg   1.25:1

No los generes a mano: los produce el script a partir de los originales.

    node scripts/preparar-imagenes.mjs --listar ~/fotos-cbpg
    node scripts/preparar-imagenes.mjs ~/fotos-cbpg

Las fotos de pacientes solo se publican con consentimiento firmado.
