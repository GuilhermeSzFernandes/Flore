import { db } from '@/db'
import { feedbackReports } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquareWarning } from 'lucide-react'

const roleLabels: Record<string, string> = {
  professional: 'Profissional',
  patient:      'Cliente',
  admin:        'Admin',
}

const roleColors: Record<string, string> = {
  professional: 'bg-violet-100 text-violet-700',
  patient:      'bg-blue-100 text-blue-700',
  admin:        'bg-zinc-100 text-zinc-600',
}

export default async function AdminFeedbackPage() {
  const reports = await db
    .select()
    .from(feedbackReports)
    .orderBy(desc(feedbackReports.createdAt))

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Feedback dos usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Problemas reportados durante o acesso beta — {reports.length} registro{reports.length !== 1 ? 's' : ''}
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center gap-3 text-center">
          <MessageSquareWarning className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum problema reportado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[r.userRole ?? ''] ?? 'bg-zinc-100 text-zinc-600'}`}>
                    {roleLabels[r.userRole ?? ''] ?? 'Anônimo'}
                  </span>
                  {r.userEmail && (
                    <span className="text-xs text-muted-foreground">{r.userEmail}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(r.createdAt, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{r.description}</p>

              {r.url && (
                <p className="text-xs text-muted-foreground font-mono truncate">{r.url}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
