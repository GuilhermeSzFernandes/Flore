import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ConsultaCard() {
  return (
    <Card style={{ width: 340 }}>
      <CardHeader>
        <CardTitle>Consulta de retorno</CardTitle>
        <CardDescription>Maria Helena · Quinta, 26 de junho às 14h30</CardDescription>
        <CardAction>
          <Badge>Confirmado</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p style={{ color: "var(--muted-foreground)" }}>
          Avaliação de evolução do tratamento facial. Trazer registro fotográfico
          das últimas duas semanas.
        </p>
      </CardContent>
      <CardFooter style={{ gap: 8 }}>
        <Button size="sm">Confirmar</Button>
        <Button size="sm" variant="outline">
          Reagendar
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ResumoSimples() {
  return (
    <Card size="sm" style={{ width: 280 }}>
      <CardHeader>
        <CardTitle>Atendimentos do mês</CardTitle>
        <CardDescription>Junho de 2026</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ fontSize: 28, fontWeight: 600 }}>18 / 30</p>
        <p style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
          agendamentos usados no plano Beta
        </p>
      </CardContent>
    </Card>
  )
}
