import type { DoctorConfig, TreatmentCard, FAQItem, Testimonial, ProcessStep } from '@/types/site';

export const doctor: DoctorConfig = {
  name: 'Berenice Parada',
  initials: 'BP',
  specialty: 'Ortodoncia',
  email: 'hola@bereniceparada.com',
  phone: '+00 000 000 000',
  whatsapp: '+00000000000',
  address: 'Av. Principal 1234, Torre Médica, Piso 4 — Consultorio 402',
  schedule: 'Lun a Vie · 9:00 – 19:00 · Sáb · 9:00 – 13:00',
  instagram: '@bereniceparada',
  yearsExperience: 12,
  patientsTreated: '2.400+',
  rating: '4.9★',
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
    title: 'Ortodoncia infantil',
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
