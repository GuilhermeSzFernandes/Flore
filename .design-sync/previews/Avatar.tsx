import {
  Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount,
} from "@/components/ui/avatar"

const row: React.CSSProperties = { display: "flex", gap: 12, alignItems: "center" }

export function Tamanhos() {
  return (
    <div style={row}>
      <Avatar size="sm">
        <AvatarFallback>MH</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>MH</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>MH</AvatarFallback>
      </Avatar>
    </div>
  )
}

export function Iniciais() {
  return (
    <div style={row}>
      <Avatar>
        <AvatarFallback>AC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>RS</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>JP</AvatarFallback>
      </Avatar>
    </div>
  )
}

export function Grupo() {
  return (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>MH</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>AC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>RS</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+5</AvatarGroupCount>
    </AvatarGroup>
  )
}
