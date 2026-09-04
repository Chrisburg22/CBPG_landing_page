import { useCallback, useEffect, useRef, useState } from 'react';

interface Foto {
  src: string;
  srcset: string;
}

interface Props {
  antes: Foto;
  despues: Foto;
  altAntes: string;
  altDespues: string;
  /** Proporción del visor, en formato CSS (`ancho / alto`). */
  ratio?: string;
  /** Atributo `sizes` de las fotos: cuánto ocupa el visor en pantalla. */
  sizes?: string;
  etiquetas?: boolean;
  pista?: boolean;
  /** Se usa en la etiqueta accesible: "Comparar <nombre>". */
  nombre?: string;
}

/**
 * Comparador de antes y después: dos fotos superpuestas y una línea que revela
 * una u otra al arrastrarla.
 *
 * Las dos fotos frontales del caso comparten encuadre (proporción 725/346), así
 * que se apilan sin desalinearse. Si en el futuro entran fotos con otra
 * proporción hay que recortarlas antes: aquí `object-fit: cover` las ajusta,
 * pero cada una por su lado, y la comparación deja de ser honesta.
 */
export default function BeforeAfter({
  antes,
  despues,
  altAntes,
  altDespues,
  ratio = '725 / 346',
  sizes = '100vw',
  etiquetas = true,
  pista = true,
  nombre = 'antes y después',
}: Props) {
  const [pos, setPos] = useState(50);
  const viewer = useRef<HTMLDivElement>(null);
  const arrastrando = useRef(false);

  const posDesdeX = useCallback((clientX: number) => {
    const caja = viewer.current?.getBoundingClientRect();
    if (!caja || caja.width === 0) return;
    const pct = ((clientX - caja.left) / caja.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    arrastrando.current = true;
    posDesdeX(e.clientX);
  };

  // El seguimiento va en `window` y no en el visor: así el arrastre continúa
  // aunque el cursor se salga de la foto y se suelte fuera. El
  // `touch-action: pan-y` del CSS deja el scroll vertical a la página.
  useEffect(() => {
    const soltar = () => { arrastrando.current = false; };
    const mover = (e: PointerEvent) => {
      if (!arrastrando.current) return;
      // Si el botón ya no está pulsado es que se soltó fuera de la ventana y no
      // nos llegó el `pointerup`. Sin esto la línea se queda pegada al cursor.
      if (e.pointerType === 'mouse' && e.buttons === 0) return soltar();
      posDesdeX(e.clientX);
    };

    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    window.addEventListener('blur', soltar);
    return () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
      window.removeEventListener('blur', soltar);
    };
  }, [posDesdeX]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const paso = e.shiftKey ? 10 : 4;
    const mover = (delta: number) => {
      e.preventDefault();
      setPos((p) => Math.max(0, Math.min(100, p + delta)));
    };
    if (e.key === 'ArrowLeft') mover(-paso);
    else if (e.key === 'ArrowRight') mover(paso);
    else if (e.key === 'Home') { e.preventDefault(); setPos(0); }
    else if (e.key === 'End') { e.preventDefault(); setPos(100); }
  };

  return (
    <>
      <div
        ref={viewer}
        className="ba__viewer"
        style={{ aspectRatio: ratio }}
        onPointerDown={onPointerDown}
      >
        <div className="ba__layer">
          <img src={antes.src} srcSet={antes.srcset} sizes={sizes} alt={altAntes} draggable={false} loading="lazy" decoding="async" />
          {etiquetas && <span className="ba__tag ba__tag--before">Antes</span>}
        </div>

        {/* La capa de después se recorta desde la izquierda: lo que queda a la
            derecha de la línea es el resultado. */}
        <div className="ba__layer" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <img src={despues.src} srcSet={despues.srcset} sizes={sizes} alt={altDespues} draggable={false} loading="lazy" decoding="async" />
          {etiquetas && <span className="ba__tag ba__tag--after">Después</span>}
        </div>

        <div className="ba__handle" style={{ left: `${pos}%` }}>
          <button
            type="button"
            className="ba__knob"
            role="slider"
            aria-label={`Comparar ${nombre}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={`${Math.round(pos)} % del antes visible`}
            onKeyDown={onKeyDown}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6M9 6l6 6-6 6" opacity=".5" />
              <path d="M8 12h8" />
            </svg>
          </button>
        </div>
      </div>

      {pista && <p className="ba__hint">Arrastra la línea o usa las flechas del teclado.</p>}
    </>
  );
}
