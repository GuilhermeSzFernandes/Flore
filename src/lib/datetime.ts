import { TZDate } from '@date-fns/tz'

// Fuso oficial do app. Timestamps são gravados em UTC no banco, mas todas as
// fronteiras de dia/mês, comparações de calendário, parsing de horário digitado
// e formatação de exibição no servidor devem ser feitas no fuso do Brasil —
// senão, no servidor em UTC (ex: Vercel), um atendimento às 22h de SP cairia no
// dia seguinte e horários apareceriam 3h deslocados.
export const APP_TZ = 'America/Sao_Paulo'

// "Agora" no fuso do app. Use como base para startOfDay/startOfMonth/etc. do
// date-fns — as funções preservam o fuso do TZDate.
export function nowInApp(): TZDate {
  return TZDate.tz(APP_TZ)
}

// Converte um instante (Date/ISO com offset/epoch) para o fuso do app, para
// comparações de calendário (isSameDay/getHours) e formatação refletirem o
// horário local do Brasil.
export function toAppTz(instant: Date | string | number): TZDate {
  return new TZDate(+new Date(instant), APP_TZ)
}

// Interpreta uma string de relógio de parede SEM fuso ("YYYY-MM-DD" ou
// "YYYY-MM-DDTHH:MM", como a de um <input type="datetime-local">) como horário
// do Brasil e devolve o instante correto. Use no lugar de `new Date(str)` para
// esses campos — `new Date` interpretaria no fuso do servidor (UTC).
export function parseAppDateTime(local: string): TZDate {
  const [datePart, timePart = '00:00'] = local.trim().split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  return new TZDate(y, (m ?? 1) - 1, d ?? 1, hh || 0, mm || 0, 0, APP_TZ)
}

// Data-calendário no fuso do app como "YYYY-MM-DD". Use para comparar com
// colunas de data (ex: blockedTimes.date) e para o "hoje" do app.
export function appDateString(instant: Date | string | number = Date.now()): string {
  const z = toAppTz(instant)
  const y = z.getFullYear()
  const m = String(z.getMonth() + 1).padStart(2, '0')
  const d = String(z.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Instante correspondente a HH:MM (relógio de parede SP) no dia-calendário SP
// de `instant`. Use para montar janelas de dia e pausas (almoço) a partir de um
// horário já conhecido.
export function appTimeOnDay(instant: Date | string | number, hh: number, mm: number): TZDate {
  const z = toAppTz(instant)
  z.setHours(hh, mm, 0, 0)
  return z
}
