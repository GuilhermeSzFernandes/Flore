import { Separator } from "@/components/ui/separator"

export function Horizontal() {
  return (
    <div style={{ width: 280 }}>
      <p style={{ fontWeight: 600 }}>Maria Helena</p>
      <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Cliente desde março de 2025</p>
      <Separator style={{ margin: "12px 0" }} />
      <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>12 consultas realizadas</p>
    </div>
  )
}

export function Vertical() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, height: 24 }}>
      <span>Agenda</span>
      <Separator orientation="vertical" />
      <span>Clientes</span>
      <Separator orientation="vertical" />
      <span>Configurações</span>
    </div>
  )
}
