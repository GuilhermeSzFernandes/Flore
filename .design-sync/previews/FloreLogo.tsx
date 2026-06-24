import FloreLogo from "@/components/FloreLogo"

export function Padrao() {
  return <FloreLogo size={32} />
}

export function Tamanhos() {
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
      <FloreLogo size={20} />
      <FloreLogo size={32} />
      <FloreLogo size={48} />
    </div>
  )
}

export function SoSimbolo() {
  return <FloreLogo size={40} showText={false} />
}

export function SobreEscuro() {
  return (
    <div
      style={{
        background: "var(--sidebar)",
        padding: "20px 28px",
        borderRadius: 12,
        display: "inline-block",
      }}
    >
      <FloreLogo size={32} textColor="var(--sidebar-foreground)" />
    </div>
  )
}
