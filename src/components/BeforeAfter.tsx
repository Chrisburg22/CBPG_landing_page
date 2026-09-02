import { useState, useRef, useCallback, useEffect } from 'react';

export default function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const viewerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const rect = viewerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => { dragging.current = true; setFromClientX(e.clientX); };
  const onTouchStart = (e: React.TouchEvent) => { dragging.current = true; setFromClientX(e.touches[0]!.clientX); };

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) setFromClientX(e.clientX); };
    const onTouchMove = (e: TouchEvent) => {
      if (dragging.current) { setFromClientX(e.touches[0]!.clientX); if (e.cancelable) e.preventDefault(); }
    };
    const onUp = () => { dragging.current = false; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [setFromClientX]);

  return (
    <section className="section" id="resultados">
      <div className="wrap ba">
        <div className="reveal">
          <span className="eyebrow">Resultados reales</span>
          <h2 style={{ fontSize: 'clamp(30px,4.4vw,48px)', marginTop: 18 }}>
            Arrastra para ver la transformación.
          </h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 18, fontSize: 18 }}>
            Cada caso es único, pero el objetivo siempre es el mismo: una sonrisa funcional, sana
            y armónica. Estos son ejemplos del tipo de cambio que logramos.
          </p>
          <p style={{ color: 'var(--ink-soft)', marginTop: 14, fontSize: 15 }}>
            * Casos de muestra. Las imágenes reales de pacientes se incorporan con su consentimiento.
          </p>
        </div>

        <div
          ref={viewerRef}
          className="ba__viewer reveal"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          aria-label="Comparador antes y después — arrastra para revelar"
          role="img"
        >
          {/* Before layer */}
          <div className="ba__layer ba__layer--before">
            <div className="ph"><span className="ph__label">foto · antes</span></div>
            <span className="ba__tag ba__tag--before">Antes</span>
          </div>

          {/* After layer — clipped */}
          <div
            className="ba__layer ba__layer--after"
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          >
            <div className="ph" style={{ '--accent-tint': '#cfe0db' } as React.CSSProperties}>
              <span className="ph__label">foto · después</span>
            </div>
            <span className="ba__tag ba__tag--after">Después</span>
          </div>

          {/* Handle */}
          <div className="ba__handle" style={{ left: `${pos}%` }}>
            <span className="ba__knob" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6M9 6l6 6-6 6" opacity=".5"/>
                <path d="M8 12h8"/>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
