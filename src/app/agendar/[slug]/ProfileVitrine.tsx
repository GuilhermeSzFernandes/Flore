import { nowInApp } from '@/lib/datetime'
import { getDay } from 'date-fns'
import { MapPin, Clock, ArrowDown } from 'lucide-react'
import type { Service } from '@/db/schema'
import GalleryCarousel from './GalleryCarousel'

// ── Cores da marca (mesma convenção oklch do restante do app) ────────────────
const C = {
  paper:     'oklch(0.963 0.006 80)',   // pergaminho
  ink:       'oklch(0.155 0.015 155)',  // charcoal verde
  terra:     'oklch(0.575 0.115 27)',   // terracota
  sage:      'oklch(0.505 0.025 145)',  // sage
  hairline:  'oklch(0.88 0.012 80)',
  cream:     'oklch(0.93 0.012 82)',    // texto claro sobre ink
  creamDim:  'oklch(0.72 0.012 100)',
}

const SPECIALTY_LABELS: Record<string, string> = {
  manicure:    'Nail Design & Manicure',
  hairdresser: 'Cabelo & Beleza',
  massagist:   'Massoterapia & Corpo',
  esthetician: 'Estética & Cuidados de Pele',
  other:       'Bem-estar & Cuidado',
}

// ── Horários (parse local, sem acoplar ao módulo client do editor) ───────────
type DaySchedule = { open: string; close: string }
type WeekSchedule = Record<string, DaySchedule | null>

const DAYS = [
  { key: 'mon', short: 'Seg' },
  { key: 'tue', short: 'Ter' },
  { key: 'wed', short: 'Qua' },
  { key: 'thu', short: 'Qui' },
  { key: 'fri', short: 'Sex' },
  { key: 'sat', short: 'Sáb' },
  { key: 'sun', short: 'Dom' },
] as const

// getDay(): 0=Dom .. 6=Sáb → chave do schedule
const DOW_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function parseSchedule(raw: string | null): WeekSchedule | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw)
    if (typeof p === 'object' && p !== null && 'mon' in p) return p as WeekSchedule
  } catch {}
  return null
}

function groupHours(schedule: WeekSchedule) {
  const groups: { days: string[]; open: string; close: string }[] = []
  for (const { key, short } of DAYS) {
    const day = schedule[key]
    if (day == null) continue
    const last = groups[groups.length - 1]
    if (last && last.open === day.open && last.close === day.close) {
      last.days.push(short)
    } else {
      groups.push({ days: [short], open: day.open, close: day.close })
    }
  }
  return groups
}

function openStatus(schedule: WeekSchedule | null, now: Date): { open: boolean; label: string } {
  if (!schedule) return { open: false, label: 'Agende online' }
  const today = schedule[DOW_KEY[getDay(now)]]
  if (!today) return { open: false, label: 'Fechado hoje' }
  const mins = now.getHours() * 60 + now.getMinutes()
  const [oh, om] = today.open.split(':').map(Number)
  const [ch, cm] = today.close.split(':').map(Number)
  const isOpen = mins >= oh * 60 + om && mins < ch * 60 + cm
  return isOpen
    ? { open: true,  label: `Aberto até ${today.close}` }
    : { open: false, label: `Abre às ${today.open}` }
}

function money(cents: number | null): string | null {
  if (cents == null) return null
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

interface Props {
  professional: {
    displayName: string
    businessName: string | null
    businessDescription: string | null
    address: string | null
    specialty: string | null
    workingHours: string | null
    avatarUrl: string | null
    galleryUrls: string[] | null
  }
  services: Service[]
}

export default function ProfileVitrine({ professional, services }: Props) {
  const {
    displayName, businessName, businessDescription, address, specialty, workingHours, avatarUrl, galleryUrls,
  } = professional

  const now      = nowInApp()
  const schedule = parseSchedule(workingHours)
  const status   = openStatus(schedule, now)
  const groups   = schedule ? groupHours(schedule) : []
  const eyebrow  = (specialty && SPECIALTY_LABELS[specialty]) || 'Agendamento online'

  // Acima de ~6 serviços, o menu flui em duas colunas (como um cardápio impresso)
  const manyServices = services.length > 6

  const monogram = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div style={{ background: C.paper }}>
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden" style={{ background: C.ink }}>
        {/* marca-d'água botânica */}
        <Sprig
          className="pointer-events-none absolute -right-10 -top-16 h-[26rem] w-[26rem] opacity-[0.06]"
          style={{ color: C.cream }}
        />
        <Sprig
          className="pointer-events-none absolute -left-24 bottom-[-9rem] h-[22rem] w-[22rem] rotate-180 opacity-[0.05]"
          style={{ color: C.cream }}
        />

        <div className="relative mx-auto max-w-3xl px-6 pt-14 pb-16 sm:pt-20 sm:pb-20">
          {/* medalhão — foto de perfil ou monograma */}
          <div
            className="mx-auto mb-7 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full"
            style={{ border: `1px solid ${C.terra}`, background: 'oklch(0.575 0.115 27 / 14%)' }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-2xl italic" style={{ color: C.terra }}>
                {monogram || '✿'}
              </span>
            )}
          </div>

          <p
            className="text-center text-[0.7rem] font-semibold uppercase tracking-[0.32em]"
            style={{ color: C.terra }}
          >
            {eyebrow}
          </p>

          <h1
            className="mt-3 text-center font-display text-[2.6rem] italic leading-[1.05] sm:text-6xl"
            style={{ color: C.cream }}
          >
            {displayName}
          </h1>

          {businessName && businessName !== displayName && (
            <p className="mt-3 text-center text-sm tracking-wide" style={{ color: C.creamDim }}>
              {businessName}
            </p>
          )}

          {/* selo status + local */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
              style={{
                background: status.open ? 'oklch(0.505 0.075 155 / 22%)' : 'oklch(1 0 0 / 6%)',
                color: status.open ? 'oklch(0.82 0.09 155)' : C.creamDim,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: status.open ? 'oklch(0.72 0.14 155)' : C.creamDim }}
              />
              {status.label}
            </span>
            {address && (
              <span className="inline-flex items-center gap-1.5" style={{ color: C.creamDim }}>
                <MapPin className="h-3.5 w-3.5" />
                {address}
              </span>
            )}
          </div>

          <div className="mt-9 flex justify-center">
            <a
              href="#agendar"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: C.terra, color: 'white' }}
            >
              Agendar horário
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ── CORPO ───────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-6 py-14 md:py-20">

        {/* Galeria do espaço — carrossel infinito, contido na largura do conteúdo */}
        {galleryUrls && galleryUrls.length > 0 && (
          <div className="mb-14 md:mb-16">
            <GalleryCarousel urls={galleryUrls} alt={businessName || displayName} />
          </div>
        )}

        {/* Sobre — lead centralizado */}
        {businessDescription && (
          <section className="mx-auto max-w-2xl text-center">
            <Eyebrow>Sobre</Eyebrow>
            <p
              className="mt-4 text-[1.05rem] leading-relaxed"
              style={{ color: 'oklch(0.32 0.014 155)' }}
            >
              {businessDescription}
            </p>
          </section>
        )}

        {/* Menu de serviços — largura total, flui em colunas conforme a quantidade */}
        <section className={businessDescription ? 'mt-16' : ''}>
          <div className="mb-8 flex items-baseline gap-4">
            <Eyebrow>O que ofereço</Eyebrow>
            <span className="h-px flex-1 self-center" style={{ background: C.hairline }} />
            {services.length > 0 && (
              <span className="text-xs tabular-nums" style={{ color: C.sage }}>
                {services.length} {services.length === 1 ? 'serviço' : 'serviços'}
              </span>
            )}
          </div>

          {services.length === 0 ? (
            <p className="text-sm italic" style={{ color: C.sage }}>
              Os serviços aparecerão aqui em breve. Toque em “Agendar horário” para falar comigo.
            </p>
          ) : (
            <ul className={manyServices ? 'md:columns-2 md:gap-x-12' : 'space-y-6'}>
              {services.map((s) => {
                const price = money(s.priceInCents)
                return (
                  <li key={s.id} className={manyServices ? 'mb-6 break-inside-avoid' : ''}>
                    <div className="flex items-baseline gap-3">
                      <h3 className="font-display text-lg italic" style={{ color: C.ink }}>
                        {s.name}
                      </h3>
                      <span
                        className="mb-1 min-w-6 flex-1 self-end border-b border-dotted"
                        style={{ borderColor: 'oklch(0.575 0.115 27 / 35%)' }}
                        aria-hidden
                      />
                      {price && (
                        <span className="font-display text-lg tabular-nums" style={{ color: C.terra }}>
                          {price}
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-1 text-[0.7rem] font-medium uppercase tracking-[0.18em]"
                      style={{ color: C.sage }}
                    >
                      {s.durationMin} min
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Info prática — horários + endereço */}
        {(groups.length > 0 || address) && (
          <div
            className="mt-16 grid gap-10 border-t pt-10 sm:grid-cols-2"
            style={{ borderColor: C.hairline }}
          >
            {groups.length > 0 && (
              <section>
                <Eyebrow icon={<Clock className="h-3 w-3" />}>Horários</Eyebrow>
                <div className="mt-3 space-y-1.5">
                  {groups.map((g, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-6">
                      <span className="text-xs font-medium tracking-wide" style={{ color: C.sage }}>
                        {g.days[0]}
                        {g.days.length > 1 ? ` – ${g.days[g.days.length - 1]}` : ''}
                      </span>
                      <span
                        className="text-sm font-medium tabular-nums"
                        style={{ color: 'oklch(0.50 0.095 27)' }}
                      >
                        {g.open} – {g.close}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {address && (
              <section>
                <Eyebrow icon={<MapPin className="h-3 w-3" />}>Onde fica</Eyebrow>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'oklch(0.34 0.012 155)' }}>
                  {address}
                </p>
              </section>
            )}
          </div>
        )}

        {/* CTA final */}
        <div className="mt-14 text-center">
          <a
            href="#agendar"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: C.ink, color: C.cream }}
          >
            Escolher e agendar
            <ArrowDown className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* divisória botânica */}
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-6">
        <span className="h-px flex-1" style={{ background: C.hairline }} />
        <Sprig className="h-5 w-5" style={{ color: 'oklch(0.575 0.115 27 / 55%)' }} />
        <span className="h-px flex-1" style={{ background: C.hairline }} />
      </div>
    </div>
  )
}

// ── Auxiliares ────────────────────────────────────────────────────────────
function Eyebrow({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.24em]"
      style={{ color: 'oklch(0.575 0.115 27)' }}
    >
      {icon}
      {children}
    </span>
  )
}

function Sprig({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M50 92 C50 70 50 45 50 14" />
      {[68, 56, 44, 32].map((y, i) => (
        <g key={i}>
          <path d={`M50 ${y} C40 ${y - 4} 30 ${y - 2} 24 ${y - 12}`} />
          <path d={`M50 ${y} C60 ${y - 4} 70 ${y - 2} 76 ${y - 12}`} />
        </g>
      ))}
      <path d="M50 14 C46 8 48 2 50 0 C52 2 54 8 50 14 Z" />
    </svg>
  )
}
