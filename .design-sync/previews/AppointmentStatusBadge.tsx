import { AppointmentStatusBadge } from "@/components/AppointmentStatusBadge"

export function TodosOsEstados() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <AppointmentStatusBadge status="scheduled" />
      <AppointmentStatusBadge status="confirmed" />
      <AppointmentStatusBadge status="done" />
      <AppointmentStatusBadge status="no_show" />
      <AppointmentStatusBadge status="cancelled" />
    </div>
  )
}
