import { Badge } from "@/components/ui/badge"
import { Check, Clock, Leaf } from "lucide-react"

const row: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }

export function Variants() {
  return (
    <div style={row}>
      <Badge>Confirmado</Badge>
      <Badge variant="secondary">Agendado</Badge>
      <Badge variant="destructive">Falta</Badge>
      <Badge variant="outline">Pendente</Badge>
      <Badge variant="ghost">Rascunho</Badge>
    </div>
  )
}

export function ComIcone() {
  return (
    <div style={row}>
      <Badge>
        <Check /> Pago
      </Badge>
      <Badge variant="secondary">
        <Clock /> Em espera
      </Badge>
      <Badge variant="outline">
        <Leaf /> Plano Beta
      </Badge>
    </div>
  )
}
