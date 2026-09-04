export interface DoctorConfig {
  name: string;
  initials: string;
  specialty: string;
  phone: string;
  whatsapp: string;
  schedule: string;
  instagram: string;
  yearsExperience: number;
  patientsTreated: string;
  rating: string;
}

export interface TreatmentCard {
  icon: string;
  title: string;
  description: string;
  tag: string;
  highlight?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Testimonial {
  stars: number;
  quote: string;
  name: string;
  treatment: string;
}

export interface ProcessStep {
  title: string;
  description: string;
}

/**
 * Datos legales obligatorios en México (LFPDPPP).
 * Un campo vacío significa "pendiente de la doctora": la página lo señala
 * en pantalla para que no se publique por descuido.
 */
export interface LegalConfig {
  /** Persona física o moral que responde por los datos personales. */
  responsable: string;
  /** Domicilio del responsable, para el aviso de privacidad. */
  domicilio: string;
  /** Correo donde los pacientes ejercen sus derechos ARCO. */
  correoArco: string;
  /** Cédula profesional de licenciatura. */
  cedulaLicenciatura: string;
  /** Cédula profesional de la especialidad en ortodoncia. */
  cedulaEspecialidad: string;
  /** Fecha de la última actualización del aviso, formato AAAA-MM-DD. */
  ultimaActualizacion: string;
}

/** Una de las tres etapas de la secuencia de tratamiento. */
export interface CaseStage {
  /** Coincide con el prefijo del archivo en src/assets/caso-01/. */
  id: 'antes' | 'durante' | 'despues';
  label: string;
  title: string;
  description: string;
  /** Texto alternativo de la foto frontal. Describe lo que se ve, no el archivo. */
  alt: string;
}

/** Comparación de una misma arcada entre el inicio y el final. */
export interface CaseArch {
  id: 'superior' | 'inferior';
  label: string;
  altAntes: string;
  altDespues: string;
}

export interface CaseStudy {
  /** Tratamiento aplicado. Vacío = pendiente de confirmar por la doctora. */
  treatment: string;
  /** Duración real del caso. Vacío = pendiente. */
  duration: string;
  stages: CaseStage[];
  arches: CaseArch[];
}
