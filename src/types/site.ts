export interface DoctorConfig {
  name: string;
  initials: string;
  specialty: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
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
