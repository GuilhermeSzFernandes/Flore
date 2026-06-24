import {
  Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export function Detalhes() {
  return (
    <Popover defaultOpen modal={false}>
      <PopoverTrigger render={<Button variant="outline">Ver detalhes</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Consulta de retorno</PopoverTitle>
          <PopoverDescription>Quinta, 26 de junho às 14h30</PopoverDescription>
        </PopoverHeader>
        <p style={{ color: "var(--muted-foreground)" }}>
          Avaliação de evolução do tratamento facial. Duração estimada de 50 minutos.
        </p>
      </PopoverContent>
    </Popover>
  )
}
