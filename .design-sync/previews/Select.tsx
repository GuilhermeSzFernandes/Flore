import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel,
} from "@/components/ui/select"

export function Periodo() {
  return (
    <Select defaultValue="tarde" defaultOpen>
      <SelectTrigger style={{ width: 220 }}>
        <SelectValue placeholder="Selecione o período" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Período do dia</SelectLabel>
          <SelectItem value="manha">Manhã (08h–12h)</SelectItem>
          <SelectItem value="tarde">Tarde (13h–18h)</SelectItem>
          <SelectItem value="noite">Noite (18h–21h)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
