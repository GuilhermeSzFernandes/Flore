interface Props {
  size?: number
  showText?: boolean
  textClassName?: string
  textColor?: string
}

export default function FloreLogo({
  size = 28,
  showText = true,
  textClassName = 'font-display italic text-xl tracking-tight',
  textColor,
}: Props) {
  return (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logotipo.png"
        alt="Flore"
        width={size}
        height={size}
        className="object-contain shrink-0"
      />
      {showText && (
        <span className={textClassName} style={textColor ? { color: textColor } : undefined}>
          Flore
        </span>
      )}
    </span>
  )
}
