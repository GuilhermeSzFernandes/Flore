import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function ComCampo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 260 }}>
      <Label htmlFor="obs">Observações da consulta</Label>
      <Input id="obs" placeholder="Anotações rápidas" />
    </div>
  )
}

export function Sozinha() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Label>E-mail</Label>
      <Label>Data de nascimento</Label>
    </div>
  )
}
