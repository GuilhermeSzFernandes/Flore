import { RestrictionChip } from "@/components/RestrictionChip"

export function Restricoes() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <RestrictionChip technique="Peeling químico" />
      <RestrictionChip technique="Microagulhamento" />
      <RestrictionChip technique="Laser ablativo" />
    </div>
  )
}
