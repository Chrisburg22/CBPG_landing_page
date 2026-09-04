import type { CaseStudy, DoctorConfig, TreatmentCard, FAQItem, LegalConfig, Testimonial, ProcessStep } from '@/types/site';

export const doctor: DoctorConfig = {
  name: 'Berenice Parada',
  initials: 'BP',
  specialty: 'Ortodoncia',
  email: 'cbparada03@gmail.com',
  phone: '+52 33 1951 4983',
  whatsapp: '523319514983', // E.164 sin '+': wa.me no acepta el signo
  schedule: 'Lun a Vie · 9:00 – 19:00 · Sáb · 9:00 – 13:00',
  instagram: '@berenice_parada_ortodoncia',
  yearsExperience: 12,
  patientsTreated: '2.400+',
  rating: '4.9★',
};

/**
 * PENDIENTE DE LA DOCTORA. Cada cadena vacía se marca en pantalla como
 * dato faltante en /aviso-de-privacidad. No publicar hasta completarlas.
 */
export const legal: LegalConfig = {
  responsable: '',
  domicilio: '',
  correoArco: '',
  cedulaLicenciatura: '',
  cedulaEspecialidad: '',
  ultimaActualizacion: '',
};

export const treatments: TreatmentCard[] = [
  {
    icon: 'aligners',
    title: 'Alineadores invisibles',
    description: 'Férulas transparentes y removibles, prácticamente imperceptibles. La opción más discreta para adultos.',
    tag: 'Lo más solicitado →',
  },
  {
    icon: 'brackets-aesthetic',
    title: 'Brackets estéticos',
    description: 'Brackets de cerámica del color del diente: corrigen con eficacia mientras pasan desapercibidos.',
    tag: 'Discreto y eficaz →',
  },
  {
    icon: 'brackets-metal',
    title: 'Brackets metálicos',
    description: 'La técnica clásica, hoy más pequeña y cómoda. Excelente relación entre resultados y costo.',
    tag: 'Mejor costo →',
  },
  {
    icon: 'kids',
    title: 'Ortopedia',
    description: 'Ortopedia y guía del crecimiento en edades tempranas para prevenir tratamientos más largos.',
    tag: 'Para los más peques →',
  },
  {
    icon: 'retainers',
    title: 'Retenedores',
    description: 'Mantén tu resultado para siempre. Retenedores fijos o removibles tras finalizar el tratamiento.',
    tag: 'Resultados duraderos →',
  },
];

export const faqs: FAQItem[] = [
  {
    question: '¿Cuánto dura un tratamiento de ortodoncia?',
    answer: 'Depende de cada caso, pero la mayoría se ubica entre 12 y 24 meses. En tu valoración te damos una estimación realista según tu diagnóstico.',
  },
  {
    question: '¿Los alineadores invisibles funcionan igual que los brackets?',
    answer: 'Para la mayoría de los casos, sí. Los alineadores son muy eficaces en correcciones leves a moderadas. Para casos complejos podemos recomendar brackets o un enfoque combinado.',
  },
  {
    question: '¿Hay opciones de pago a plazos?',
    answer: 'Sí. Ofrecemos planes de financiamiento flexibles para que tu tratamiento se ajuste a tu presupuesto. Lo conversamos sin compromiso en la primera cita.',
  },
  {
    question: '¿La ortodoncia duele?',
    answer: 'Puedes sentir una ligera presión los primeros días tras cada ajuste, totalmente normal y pasajera. Con las técnicas actuales la molestia es mínima.',
  },
  {
    question: '¿A partir de qué edad se puede empezar?',
    answer: 'Recomendamos una primera revisión alrededor de los 7 años para vigilar el crecimiento. Sin embargo, ¡la ortodoncia no tiene edad! Tratamos pacientes adultos con excelentes resultados.',
  },
];

export const testimonials: Testimonial[] = [
  {
    stars: 5,
    quote: 'Siempre tuve miedo de los brackets de adulta. Con los alineadores nadie notó nada y el resultado superó lo que imaginaba.',
    name: 'Laura M.',
    treatment: 'Alineadores invisibles',
  },
  {
    stars: 5,
    quote: 'La doctora explica todo con calma y te hace sentir en confianza. Mi hijo de 11 años va feliz a cada cita.',
    name: 'Andrés R.',
    treatment: 'Ortodoncia infantil',
  },
  {
    stars: 5,
    quote: 'Atención impecable y un trato muy humano. Por fin tengo la sonrisa que quería para mi boda.',
    name: 'Daniela P.',
    treatment: 'Brackets estéticos',
  },
];

/**
 * Caso clínico publicado en la sección de resultados.
 * Las fotos viven en src/assets/caso-01/ y las carga CaseStudy.astro.
 * Publicado con consentimiento firmado del paciente.
 *
 * BORRADOR: los textos describen lo que se ve en las fotos, pero los redactó
 * el desarrollador. La doctora debe revisarlos —  es quien puede afirmar algo
 * clínico— y rellenar `treatment` y `duration`, que se marcan en pantalla
 * mientras estén vacíos.
 */
export const caseStudy: CaseStudy = {
  treatment: '',
  duration: '',
  stages: [
    {
      id: 'antes',
      label: 'Antes',
      title: 'El punto de partida',
      description:
        'Los dientes se apiñan y giran sobre sí mismos, sin espacio suficiente en la arcada. Es uno de los motivos de consulta más frecuentes.',
      alt: 'Vista frontal de la dentadura antes del tratamiento: dientes apiñados y girados en ambas arcadas.',
    },
    {
      id: 'durante',
      label: 'Durante',
      title: 'El tratamiento en marcha',
      description:
        'Con la aparatología colocada, cada pieza se desplaza poco a poco hasta su sitio. El avance se revisa en cada cita.',
      alt: 'Vista frontal durante el tratamiento: brackets colocados en ambas arcadas y dientes ya en movimiento.',
    },
    {
      id: 'despues',
      label: 'Después',
      title: 'El resultado',
      description:
        'Las piezas quedan alineadas y la mordida encaja. A partir de aquí entran los retenedores, que son los que cuidan el resultado.',
      alt: 'Vista frontal al finalizar el tratamiento: dientes alineados y mordida corregida.',
    },
  ],
  arches: [
    {
      id: 'superior',
      label: 'Arcada superior',
      altAntes: 'Arcada superior antes del tratamiento, vista desde arriba: apiñamiento en el sector anterior.',
      altDespues: 'Arcada superior al finalizar, vista desde arriba: piezas alineadas siguiendo la curva de la arcada.',
    },
    {
      id: 'inferior',
      label: 'Arcada inferior',
      altAntes: 'Arcada inferior antes del tratamiento, vista desde arriba: incisivos apiñados y girados.',
      altDespues: 'Arcada inferior al finalizar, vista desde arriba: incisivos alineados.',
    },
  ],
};

export const processSteps: ProcessStep[] = [
  {
    title: 'Valoración',
    description: 'Conversamos sobre tus objetivos y revisamos tu caso con escaneo digital.',
  },
  {
    title: 'Plan a medida',
    description: 'Te mostramos la simulación de tu sonrisa y elegimos la mejor técnica.',
  },
  {
    title: 'Tratamiento',
    description: 'Citas cómodas y seguimiento cercano durante todo el proceso.',
  },
  {
    title: 'Tu nueva sonrisa',
    description: 'Retiramos el sistema y colocamos retenedores para cuidar el resultado.',
  },
];

/**
 * Versión del aviso de privacidad que se graba con cada solicitud, para poder
 * acreditar qué texto aceptó la paciente (LFPDPPP art. 8).
 *
 * Sale de `legal.ultimaActualizacion`. Mientras ese campo siga vacío —está
 * pendiente de la doctora— las filas quedan marcadas como 'sin-publicar', que
 * es la verdad: todavía no hay una versión publicada que citar.
 */
export const AVISO_VERSION: string = legal.ultimaActualizacion || 'sin-publicar';
