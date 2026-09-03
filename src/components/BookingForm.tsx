import { useCallback, useState } from 'react';
import { LIMITES, TRATAMIENTOS, validate } from '@/lib/validate';
import type { BookingErrors, BookingPayload } from '@/lib/validate';

interface BookingFormProps {
  whatsappNumber: string;
}

type Status = 'idle' | 'sending' | 'ok' | 'error';

const EMPTY: BookingPayload = {
  nombre: '', telefono: '', email: '', tratamiento: '', mensaje: '', consentimiento: false,
};

export default function BookingForm({ whatsappNumber }: BookingFormProps) {
  const [form, setForm] = useState<BookingPayload>(EMPTY);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof BookingPayload, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  // Trampa para bots: un humano nunca ve ni llena este campo.
  const [honeypot, setHoneypot] = useState('');

  const set = useCallback(<K extends keyof BookingPayload>(field: K, value: BookingPayload[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const blur = useCallback((field: keyof BookingPayload) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(form));
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nombre: true, telefono: true, email: true, tratamiento: true, consentimiento: true });
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus('sending');
    setServerError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, empresa: honeypot }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setServerError(data.message ?? 'No pudimos enviar tu solicitud. Inténtalo de nuevo.');
        setStatus('error');
        return;
      }

      setStatus('ok');
    } catch {
      setServerError('Parece que no hay conexión. Revisa tu internet e inténtalo otra vez.');
      setStatus('error');
    }
  };

  if (status === 'ok') {
    return (
      <div className="form">
        <div className="form__success show" role="status">
          <span className="check">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </span>
          <h3>¡Solicitud enviada!</h3>
          <p>Gracias por escribirnos. Te contactaremos muy pronto para confirmar tu cita.</p>
        </div>
      </div>
    );
  }

  const showErr = (field: keyof BookingErrors) => Boolean(touched[field] && errors[field]);
  const fieldClass = (field: keyof BookingErrors) => `field${showErr(field) ? ' invalid' : ''}`;
  const describedBy = (field: keyof BookingErrors) => (showErr(field) ? `${field}-error` : undefined);
  const sending = status === 'sending';

  return (
    <div className="form">
      <h3>Reserva tu valoración</h3>
      <p className="form__desc">Completa el formulario y te contactamos en menos de 24 h.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field row">
          <div className={fieldClass('nombre')}>
            <label htmlFor="nombre">Nombre completo</label>
            <input
              type="text" id="nombre" name="nombre" placeholder="Tu nombre" required
              autoComplete="name" maxLength={LIMITES.nombre}
              aria-invalid={showErr('nombre')}
              aria-describedby={describedBy('nombre')}
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              onBlur={() => blur('nombre')}
            />
            <span className="err" id="nombre-error" role="alert">{showErr('nombre') ? errors.nombre : ''}</span>
          </div>
          <div className={fieldClass('telefono')}>
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel" id="telefono" name="telefono" placeholder="55 1234 5678" required
              autoComplete="tel" maxLength={LIMITES.telefono}
              aria-invalid={showErr('telefono')}
              aria-describedby={describedBy('telefono')}
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
              onBlur={() => blur('telefono')}
            />
            <span className="err" id="telefono-error" role="alert">{showErr('telefono') ? errors.telefono : ''}</span>
          </div>
        </div>

        <div className={fieldClass('email')}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            type="email" id="email" name="email" placeholder="tucorreo@ejemplo.com" required
            autoComplete="email" maxLength={LIMITES.email}
            aria-invalid={showErr('email')}
            aria-describedby={describedBy('email')}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => blur('email')}
          />
          <span className="err" id="email-error" role="alert">{showErr('email') ? errors.email : ''}</span>
        </div>

        <div className={fieldClass('tratamiento')}>
          <label htmlFor="tratamiento">¿Qué te interesa?</label>
          <select
            id="tratamiento" name="tratamiento" required
            aria-invalid={showErr('tratamiento')}
            aria-describedby={describedBy('tratamiento')}
            value={form.tratamiento}
            onChange={(e) => set('tratamiento', e.target.value)}
            onBlur={() => blur('tratamiento')}
          >
            <option value="">Selecciona una opción</option>
            {TRATAMIENTOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="err" id="tratamiento-error" role="alert">{showErr('tratamiento') ? errors.tratamiento : ''}</span>
        </div>

        <div className="field">
          <label htmlFor="mensaje">Mensaje (opcional)</label>
          <textarea
            id="mensaje" name="mensaje" placeholder="Cuéntanos brevemente sobre tu caso…"
            maxLength={LIMITES.mensaje}
            value={form.mensaje}
            onChange={(e) => set('mensaje', e.target.value)}
          />
        </div>

        {/* Honeypot: oculto para personas, irresistible para bots. */}
        <div className="hp" aria-hidden="true">
          <label htmlFor="empresa">Empresa</label>
          <input
            type="text" id="empresa" name="empresa" tabIndex={-1} autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className={`field consent${showErr('consentimiento') ? ' invalid' : ''}`}>
          <label htmlFor="consentimiento">
            <input
              type="checkbox" id="consentimiento" name="consentimiento"
              aria-invalid={showErr('consentimiento')}
              aria-describedby={describedBy('consentimiento')}
              checked={form.consentimiento}
              onChange={(e) => set('consentimiento', e.target.checked)}
              onBlur={() => blur('consentimiento')}
            />
            <span>
              He leído y acepto el <a href="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer">Aviso de Privacidad</a> y autorizo el tratamiento de mis datos para agendar mi cita.
            </span>
          </label>
          <span className="err" id="consentimiento-error" role="alert">{showErr('consentimiento') ? errors.consentimiento : ''}</span>
        </div>

        <button type="submit" className="btn btn--primary btn--block" disabled={sending}>
          {sending ? 'Enviando…' : 'Solicitar valoración'}
        </button>

        <p className="form__error" role="alert">{status === 'error' ? serverError : ''}</p>

        <p className="form__note">
          o escríbenos por{' '}
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-deep)', fontWeight: 600 }}
          >
            WhatsApp
          </a>{' '}
          para una respuesta inmediata.
        </p>
      </form>
    </div>
  );
}
