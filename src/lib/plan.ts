export const PLAN_LIMITS = {
  beta:   { appointmentsPerMonth: 30, patients: 30 },
  free:   { appointmentsPerMonth: 30, patients: 30 },
  pro:    { appointmentsPerMonth: Infinity, patients: Infinity },
  clinic: { appointmentsPerMonth: Infinity, patients: Infinity },
} as const

export type Plan = keyof typeof PLAN_LIMITS

export function canCreateAppointment(plan: Plan, usedThisMonth: number): boolean {
  return usedThisMonth < PLAN_LIMITS[plan].appointmentsPerMonth
}

export function canAddPatient(plan: Plan, totalPatients: number): boolean {
  return totalPatients < PLAN_LIMITS[plan].patients
}
