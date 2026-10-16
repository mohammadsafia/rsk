import { createRandom, type Random } from './rng';
import { dayKey, isFriday, shiftDay, wallTime } from './time';
import { invoiceTotal } from './calc';
import type { Allergy, ClinicData, DailyMetric, Doctor, Insurer, Invoice, LeaveDay, Patient, Visit, VisitStatus, VisitType } from './types';

export const SERVICE_PRICES: Record<VisitType, number> = { consultation: 40, 'follow-up': 25, procedure: 120, 'check-up': 35 };
const DURATIONS: Record<VisitType, number> = { consultation: 30, 'follow-up': 30, procedure: 60, 'check-up': 45 };
const VISIT_TYPES: VisitType[] = ['consultation', 'follow-up', 'follow-up', 'procedure', 'check-up'];
const WINDOWS = [
  [8 * 60, 12 * 60],
  [13 * 60, 17 * 60],
] as const;
/** Friday is a half day: mornings only, so the schedule is never empty on any day. */
const FRIDAY_WINDOWS = [WINDOWS[0]] as const;

const DOCTORS: Doctor[] = [
  { id: 'dr-haddad', name: { en: 'Dr. Lina Haddad', ar: 'د. لينا حداد' }, specialty: { en: 'General practice', ar: 'طب عام' } },
  { id: 'dr-khalil', name: { en: 'Dr. Omar Khalil', ar: 'د. عمر خليل' }, specialty: { en: 'Pediatrics', ar: 'طب الأطفال' } },
  { id: 'dr-nasser', name: { en: 'Dr. Rania Nasser', ar: 'د. رانيا ناصر' }, specialty: { en: 'Cardiology', ar: 'أمراض القلب' } },
  { id: 'dr-odeh', name: { en: 'Dr. Sami Odeh', ar: 'د. سامي عودة' }, specialty: { en: 'Dermatology', ar: 'الأمراض الجلدية' } },
];

const INSURERS: Insurer[] = [
  { id: 'al-noor', name: { en: 'Al-Noor Insurance', ar: 'النور للتأمين' } },
  { id: 'petra', name: { en: 'Petra Health', ar: 'البتراء الصحية' } },
  { id: 'levant', name: { en: 'Levant Mutual', ar: 'المشرق التبادلي' } },
];

const FIRST: { en: string; ar: string; sex: 'female' | 'male' }[] = [
  { en: 'Sara', ar: 'سارة', sex: 'female' },
  { en: 'Omar', ar: 'عمر', sex: 'male' },
  { en: 'Lina', ar: 'لينا', sex: 'female' },
  { en: 'Yousef', ar: 'يوسف', sex: 'male' },
  { en: 'Maya', ar: 'مايا', sex: 'female' },
  { en: 'Rami', ar: 'رامي', sex: 'male' },
  { en: 'Hala', ar: 'هالة', sex: 'female' },
  { en: 'Khaled', ar: 'خالد', sex: 'male' },
  { en: 'Noor', ar: 'نور', sex: 'female' },
  { en: 'Ahmad', ar: 'أحمد', sex: 'male' },
  { en: 'Dana', ar: 'دانا', sex: 'female' },
  { en: 'Tariq', ar: 'طارق', sex: 'male' },
  { en: 'Rasha', ar: 'رشا', sex: 'female' },
  { en: 'Faris', ar: 'فارس', sex: 'male' },
  { en: 'Jana', ar: 'جنى', sex: 'female' },
  { en: 'Zaid', ar: 'زيد', sex: 'male' },
];
const LAST: { en: string; ar: string }[] = [
  { en: 'Haddad', ar: 'حداد' },
  { en: 'Khalil', ar: 'خليل' },
  { en: 'Nasser', ar: 'ناصر' },
  { en: 'Amin', ar: 'أمين' },
  { en: 'Saleh', ar: 'صالح' },
  { en: 'Odeh', ar: 'عودة' },
  { en: 'Fares', ar: 'فارس' },
  { en: 'Majali', ar: 'المجالي' },
  { en: 'Qasem', ar: 'قاسم' },
  { en: 'Zoubi', ar: 'الزعبي' },
  { en: 'Hijazi', ar: 'حجازي' },
  { en: 'Shami', ar: 'الشامي' },
];
const ALLERGIES: Allergy[] = ['penicillin', 'latex', 'peanuts', 'aspirin', 'pollen'];

const pad = (value: number, length: number) => String(value).padStart(length, '0');

function createPatients(rng: Random, today: string): Patient[] {
  return Array.from({ length: 60 }, (_, index) => {
    const first = rng.pick(FIRST);
    const last = rng.pick(LAST);
    const insured = rng.chance(0.7);
    const allergies = ALLERGIES.filter(() => rng.chance(0.15)).slice(0, 2);
    return {
      id: `pt-${pad(index + 1, 3)}`,
      mrn: `MRN-${10001 + index}`,
      name: { en: `${first.en} ${last.en}`, ar: `${first.ar} ${last.ar}` },
      sex: first.sex,
      dob: `${rng.int(1950, 2020)}-${pad(rng.int(1, 12), 2)}-${pad(rng.int(1, 28), 2)}`,
      phone: `+962 7${rng.pick([7, 8, 9])} ${pad(100 + index, 3)} ${pad(rng.int(1000, 9999), 4)}`,
      email: rng.chance(0.6) ? `${first.en.toLowerCase()}.${last.en.toLowerCase()}${index + 1}@example.com` : null,
      insurerId: insured ? rng.pick(INSURERS).id : null,
      policyNumber: insured ? `POL-${rng.int(100000, 999999)}` : null,
      allergies,
      primaryDoctorId: rng.pick(DOCTORS).id,
      createdAt: wallTime(shiftDay(today, -rng.int(1, 400)), 10 * 60),
    };
  });
}

function createLeave(today: string): LeaveDay[] {
  const workday = (offset: number) => {
    let key = shiftDay(today, offset);
    while (isFriday(key)) key = shiftDay(key, 1);
    return key;
  };
  return [
    { id: 'leave-1', doctorId: 'dr-khalil', date: workday(3), reason: 'leave' },
    { id: 'leave-2', doctorId: 'dr-odeh', date: workday(-5), reason: 'conference' },
  ];
}

function statusFor(rng: Random, start: string, end: string, now: Date): VisitStatus {
  if (Date.parse(start) > now.getTime()) return 'scheduled';
  if (Date.parse(end) > now.getTime()) return 'arrived';
  const roll = rng.next();
  return roll < 0.85 ? 'completed' : roll < 0.95 ? 'no-show' : 'cancelled';
}

function createVisits(rng: Random, today: string, now: Date, patients: Patient[], leave: LeaveDay[]): Visit[] {
  const visits: Visit[] = [];
  for (let offset = -21; offset <= 21; offset += 1) {
    const key = shiftDay(today, offset);
    const windows = isFriday(key) ? FRIDAY_WINDOWS : WINDOWS;
    for (const doctor of DOCTORS) {
      if (leave.some((day) => day.doctorId === doctor.id && day.date === key)) continue;
      const wanted = Math.abs(offset) <= 7 ? rng.int(2, 4) : rng.int(0, 1);
      const taken: [number, number][] = [];
      for (let attempt = 0; attempt < 20 && taken.length < wanted; attempt += 1) {
        const type = rng.pick(VISIT_TYPES);
        const [from, to] = rng.pick(windows);
        const start = from + rng.int(0, (to - from - DURATIONS[type]) / 15) * 15;
        const end = start + DURATIONS[type];
        if (taken.some(([a, b]) => start < b && end > a)) continue;
        taken.push([start, end]);
        const startIso = wallTime(key, start);
        const endIso = wallTime(key, end);
        visits.push({
          id: `vs-${pad(visits.length + 1, 4)}`,
          patientId: rng.pick(patients).id,
          doctorId: doctor.id,
          start: startIso,
          end: endIso,
          type,
          status: statusFor(rng, startIso, endIso, now),
          notes: null,
        });
      }
    }
  }
  return visits.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

function createInvoices(rng: Random, today: string, visits: Visit[], patients: Patient[]): Invoice[] {
  const invoices: Invoice[] = [];
  for (const visit of visits.filter((v) => v.status === 'completed')) {
    const issuedAt = visit.start.slice(0, 10);
    const dueAt = shiftDay(issuedAt, 14);
    const lines = [{ id: `ln-${invoices.length + 1}-1`, service: visit.type, quantity: 1, unitPrice: SERVICE_PRICES[visit.type] }];
    if (rng.chance(0.25)) lines.push({ id: `ln-${invoices.length + 1}-2`, service: 'procedure', quantity: 1, unitPrice: 80 });
    const invoice: Invoice = {
      id: `inv-${pad(invoices.length + 1, 4)}`,
      number: '',
      patientId: visit.patientId,
      visitId: visit.id,
      issuedAt,
      dueAt,
      status: 'sent',
      lines,
      payments: [],
    };
    const insured = !!patients.find((p) => p.id === visit.patientId)?.insurerId;
    const method = insured ? 'insurance' : rng.pick(['cash', 'card'] as const);
    const roll = rng.next();
    if (issuedAt >= shiftDay(today, -2) && roll < 0.5) invoice.status = 'draft';
    else if (roll < 0.04) invoice.status = 'void';
    else if (roll < 0.62) {
      invoice.status = 'paid';
      invoice.payments.push({ id: `pay-${invoice.id}`, amount: invoiceTotal(invoice), method, date: shiftDay(issuedAt, rng.int(0, 10)) });
    } else {
      if (rng.chance(0.25))
        invoice.payments.push({
          id: `pay-${invoice.id}`,
          amount: Math.floor(invoiceTotal(invoice) / 2),
          method,
          date: shiftDay(issuedAt, 3),
        });
      invoice.status = dueAt < today ? 'overdue' : 'sent';
    }
    invoices.push(invoice);
  }
  invoices.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt) || a.id.localeCompare(b.id));
  invoices.forEach((invoice, index) => (invoice.number = `INV-${invoice.issuedAt.slice(0, 4)}-${pad(index + 1, 4)}`));
  return invoices;
}

function createMetrics(rng: Random, today: string): DailyMetric[] {
  return Array.from({ length: 90 }, (_, index) => {
    const daysAgo = 90 - index;
    const trend = Math.floor(index / 15);
    const visits = rng.int(18, 30) + trend;
    const noShows = rng.int(0, 4);
    const completed = visits - noShows;
    const revenueByDoctor = Object.fromEntries(DOCTORS.map((doctor) => [doctor.id, rng.int(30, 90) * 5 + trend * 10]));
    const insured = Math.round(completed * (0.5 + rng.next() * 0.25));
    return {
      date: shiftDay(today, -daysAgo),
      visits,
      completed,
      noShows,
      newPatients: rng.int(0, 4),
      revenue: Object.values(revenueByDoctor).reduce((sum, value) => sum + value, 0),
      revenueByDoctor,
      insured,
      selfPay: completed - insured,
    };
  });
}

/** The whole clinic, generated around `now` from a fixed seed: the same date always gives the same data. */
export function createClinicSeed(now: Date, seed = 20261016): ClinicData {
  const rng = createRandom(seed);
  const today = dayKey(now);
  const patients = createPatients(rng, today);
  const leave = createLeave(today);
  const visits = createVisits(rng, today, now, patients, leave);
  const invoices = createInvoices(rng, today, visits, patients);
  return {
    version: 1,
    seededOn: today,
    doctors: DOCTORS,
    insurers: INSURERS,
    patients,
    visits,
    leave,
    invoices,
    metrics: createMetrics(rng, today),
  };
}
