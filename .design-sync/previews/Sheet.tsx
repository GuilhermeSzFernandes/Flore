import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PainelLateral() {
  return (
    <Sheet defaultOpen modal={false}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Editar cliente</SheetTitle>
          <SheetDescription>Atualize os dados de contato de Maria Helena.</SheetDescription>
        </SheetHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label htmlFor="s-nome">Nome</Label>
            <Input id="s-nome" defaultValue="Maria Helena Costa" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label htmlFor="s-tel">Telefone</Label>
            <Input id="s-tel" defaultValue="(11) 98888-1234" />
          </div>
        </div>
        <SheetFooter>
          <Button>Salvar alterações</Button>
          <Button variant="outline">Cancelar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
