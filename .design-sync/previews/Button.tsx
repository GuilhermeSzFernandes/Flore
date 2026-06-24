import { Button } from "@/components/ui/button"
import { Plus, Trash2, MessageCircle, ArrowRight } from "lucide-react"

const row: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }

export function Variants() {
  return (
    <div style={row}>
      <Button>Agendar</Button>
      <Button variant="outline">Editar</Button>
      <Button variant="secondary">Detalhes</Button>
      <Button variant="ghost">Cancelar</Button>
      <Button variant="destructive">Excluir</Button>
      <Button variant="link">Saiba mais</Button>
    </div>
  )
}

export function Sizes() {
  return (
    <div style={row}>
      <Button size="xs">Extra pequeno</Button>
      <Button size="sm">Pequeno</Button>
      <Button size="default">Padrão</Button>
      <Button size="lg">Grande</Button>
    </div>
  )
}

export function WithIcon() {
  return (
    <div style={row}>
      <Button>
        <Plus /> Nova cliente
      </Button>
      <Button variant="outline">
        <MessageCircle /> Lembrar pelo WhatsApp
      </Button>
      <Button variant="ghost">
        Continuar <ArrowRight />
      </Button>
      <Button size="icon" variant="outline" aria-label="Excluir">
        <Trash2 />
      </Button>
    </div>
  )
}

export function Disabled() {
  return (
    <div style={row}>
      <Button disabled>Salvar</Button>
      <Button variant="outline" disabled>
        Fazer upgrade
      </Button>
    </div>
  )
}
