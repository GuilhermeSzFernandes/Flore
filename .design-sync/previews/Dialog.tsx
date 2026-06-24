import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function Confirmacao() {
  return (
    <Dialog defaultOpen modal={false}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar agendamento?</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A cliente Maria Helena será
            notificada do cancelamento da consulta de quinta-feira.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Manter</Button>
          <Button variant="destructive">Cancelar consulta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
