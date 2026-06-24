import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function ComLabel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 300 }}>
      <Label htmlFor="anotacoes">Anotações clínicas</Label>
      <Textarea
        id="anotacoes"
        rows={4}
        defaultValue="Cliente relatou melhora na sensibilidade. Manter protocolo atual por mais duas semanas e reavaliar."
      />
    </div>
  )
}

export function Placeholder() {
  return (
    <div style={{ width: 300 }}>
      <Textarea rows={3} placeholder="Descreva o que aconteceu e a página onde ocorreu…" />
    </div>
  )
}
