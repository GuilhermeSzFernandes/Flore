import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, width: 260 }

export function CampoComLabel() {
  return (
    <div style={field}>
      <Label htmlFor="nome">Nome da cliente</Label>
      <Input id="nome" placeholder="Ex: Maria Helena" defaultValue="Maria Helena Costa" />
    </div>
  )
}

export function Placeholder() {
  return (
    <div style={field}>
      <Label htmlFor="tel">Telefone</Label>
      <Input id="tel" type="tel" placeholder="(11) 99999-0000" />
    </div>
  )
}

export function Estados() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 260 }}>
      <Input placeholder="Desabilitado" disabled />
      <Input placeholder="E-mail inválido" defaultValue="maria@" aria-invalid />
    </div>
  )
}
