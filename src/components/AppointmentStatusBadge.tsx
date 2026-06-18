import type { Appointment } from '@/db/schema'

const config: Record<
  Appointment['status'],
  { label: string; className: string }
> = {
  scheduled: {
    label: 'Agendado',
    className: 'bg-secondary text-secondary-foreground border-border',
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  done: {
    label: 'Concluído',
    className: 'border-border',
    // uses inline style below for terracotta
  },
  no_show: {
    label: 'Falta',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-secondary text-muted-foreground border-border line-through',
  },
}

export function AppointmentStatusBadge({ status }: { status: Appointment['status'] }) {
  const { label, className } = config[status]

  if (status === 'done') {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
        style={{ background: 'oklch(0.575 0.115 27 / 10%)', color: 'oklch(0.575 0.115 27)', borderColor: 'oklch(0.575 0.115 27 / 25%)' }}
      >
        {label}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}
