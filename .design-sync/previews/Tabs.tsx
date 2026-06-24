import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export function Navegacao() {
  return (
    <Tabs defaultValue="agenda" style={{ width: 360 }}>
      <TabsList>
        <TabsTrigger value="agenda">Agenda</TabsTrigger>
        <TabsTrigger value="clientes">Clientes</TabsTrigger>
        <TabsTrigger value="ficha">Ficha</TabsTrigger>
      </TabsList>
      <TabsContent value="agenda">
        <p style={{ color: "var(--muted-foreground)" }}>
          3 consultas hoje · próxima às 14h30 com Maria Helena.
        </p>
      </TabsContent>
      <TabsContent value="clientes">
        <p style={{ color: "var(--muted-foreground)" }}>48 clientes ativas.</p>
      </TabsContent>
      <TabsContent value="ficha">
        <p style={{ color: "var(--muted-foreground)" }}>Selecione uma cliente para ver a ficha.</p>
      </TabsContent>
    </Tabs>
  )
}

export function Linha() {
  return (
    <Tabs defaultValue="mes" style={{ width: 360 }}>
      <TabsList variant="line">
        <TabsTrigger value="semana">Semana</TabsTrigger>
        <TabsTrigger value="mes">Mês</TabsTrigger>
        <TabsTrigger value="ano">Ano</TabsTrigger>
      </TabsList>
      <TabsContent value="mes">
        <p style={{ color: "var(--muted-foreground)" }}>18 atendimentos em junho de 2026.</p>
      </TabsContent>
    </Tabs>
  )
}
