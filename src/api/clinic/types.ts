export type Localized = { en: string; ar: string };

export type Doctor = { id: string; name: Localized; specialty: Localized };
export type Insurer = { id: string; name: Localized };
export type Allergy = 'penicillin' | 'latex' | 'peanuts' | 'aspirin' | 'pollen';

export type Patient = {
  id: string;
  mrn: string;
  name: Localized;
  sex: 'female' | 'male';
  dob: string;
  phone: string;
  email: string | null;
  insurerId: string | null;
  policyNumber: string | null;
  allergies: Allergy[];
  primaryDoctorId: string;
  createdAt: string;
};

/** A patient with figures joined from visits and invoices (what list and profile pages show). */
export type PatientSummary = Patient & { lastVisit: string | null; nextVisit: string | null; balance: number };

export type VisitType = 'consultation' | 'follow-up' | 'procedure' | 'check-up';
export type VisitStatus = 'scheduled' | 'arrived' | 'completed' | 'no-show' | 'cancelled';
export type Visit = {
  id: string;
  patientId: string;
  doctorId: string;
  start: string;
  end: string;
  type: VisitType;
  status: VisitStatus;
  notes: string | null;
};

export type LeaveDay = { id: string; doctorId: string; date: string; reason: 'leave' | 'conference' };

export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid' | 'void';
export type PaymentMethod = 'cash' | 'card' | 'insurance';
export type InvoiceLine = { id: string; service: VisitType; quantity: number; unitPrice: number };
export type Payment = { id: string; amount: number; method: PaymentMethod; date: string };
export type Invoice = {
  id: string;
  number: string;
  patientId: string;
  visitId: string | null;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  payments: Payment[];
};

export type DailyMetric = {
  date: string;
  visits: number;
  completed: number;
  noShows: number;
  newPatients: number;
  revenue: number;
  revenueByDoctor: Record<string, number>;
  insured: number;
  selfPay: number;
};

export type ClinicData = {
  version: 1;
  seededOn: string;
  doctors: Doctor[];
  insurers: Insurer[];
  patients: Patient[];
  visits: Visit[];
  leave: LeaveDay[];
  invoices: Invoice[];
  metrics: DailyMetric[];
};
