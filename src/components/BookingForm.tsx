import { useState, useCallback } from 'react';

interface FormState {
  nombre: string;
  telefono: string;
  email: string;
  tratamiento: string;
  mensaje: string;
}

interface FieldError {
  nombre?: string;
  telefono?: string;
  email?: string;
  tratamiento?: string;
}

interface BookingFormProps {
  whatsappNumber: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: FormState): FieldError {
  const errors: FieldError = {};
  if (!form.nombre.trim()) errors.nombre = 'Ingresa tu nombre.';
  if (!form.telefono.trim() || form.telefono.replace(/\D/g, '').length < 7)
    errors.telefono = 'Ingresa un teléfono válido.';
  if (!EMAIL_RE.test(form.email)) errors.email = 'Ingresa un correo válido.';
  if (!form.tratamiento) errors.tratamiento = 'Selecciona una opción.';
  return errors;
}

export default function BookingForm({ whatsappNumber }: BookingFormProps) {
  const [form, setForm] = useState<FormState>({
    nombre: '', telefono: '', email: '', tratamiento: '', mensaje: '',
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const blur = useCallback((field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate({ ...form }));
  }, [form]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = { nombre: true, telefono: true, email: true, tratamiento: true };
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="form">
        <div className="form__success show">
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

  const fieldClass = (field: keyof FieldError) =>
    `field${touched[field] && errors[field] ? ' invalid' : ''}`;

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
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              onBlur={() => blur('nombre')}
            />
            <span className="err">{errors.nombre}</span>
          </div>
          <div className={fieldClass('telefono')}>
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel" id="telefono" name="telefono" placeholder="+00 000 000 000" required
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
              onBlur={() => blur('telefono')}
            />
            <span className="err">{errors.telefono}</span>
          </div>
        </div>

        <div className={fieldClass('email')}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            type="email" id="email" name="email" placeholder="tucorreo@ejemplo.com" required
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => blur('email')}
          />
          <span className="err">{errors.email}</span>
        </div>

        <div className={fieldClass('tratamiento')}>
          <label htmlFor="tratamiento">¿Qué te interesa?</label>
          <select
            id="tratamiento" name="tratamiento" required
            value={form.tratamiento}
            onChange={(e) => set('tratamiento', e.target.value)}
            onBlur={() => blur('tratamiento')}
          >
            <option value="">Selecciona una opción</option>
            <option>Alineadores invisibles</option>
            <option>Brackets estéticos</option>
            <option>Brackets metálicos</option>
            <option>Ortodoncia infantil</option>
            <option>Aún no estoy seguro/a</option>
          </select>
          <span className="err">{errors.tratamiento}</span>
        </div>

        <div className="field">
          <label htmlFor="mensaje">Mensaje (opcional)</label>
          <textarea
            id="mensaje" name="mensaje" placeholder="Cuéntanos brevemente sobre tu caso…"
            value={form.mensaje}
            onChange={(e) => set('mensaje', e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn--primary btn--block">
          Solicitar valoración
        </button>

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
