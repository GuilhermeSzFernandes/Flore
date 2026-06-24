import { PlanLimitBanner } from "@/components/PlanLimitBanner"

export function Agendamentos() {
  return (
    <div style={{ width: 460 }}>
      <PlanLimitBanner feature="agendamentos" currentPlan="beta" />
    </div>
  )
}

export function Pacientes() {
  return (
    <div style={{ width: 460 }}>
      <PlanLimitBanner feature="pacientes" currentPlan="free" />
    </div>
  )
}
