import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Pencil, CalendarClock, Trash2 } from "lucide-react"

export function Acoes() {
  return (
    <DropdownMenu defaultOpen modal={false}>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm">Ações</Button>} />
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Agendamento</DropdownMenuLabel>
          <DropdownMenuItem>
            <Pencil /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CalendarClock /> Reagendar
            <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash2 /> Cancelar consulta
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
