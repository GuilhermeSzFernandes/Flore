'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { submitFeedback } from '@/actions/feedback'
import { toast } from 'sonner'
import { Send, CheckCircle2 } from 'lucide-react'

export default function SupportTicketForm() {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [sent, setSent] = useState(false)
  const [isPending, start] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) return

    const combined = `Assunto: ${subject.trim()}\n\n${description.trim()}`
    start(async () => {
      const result = await submitFeedback(combined, window.location.href)
      if (result.success) {
        setSent(true)
        setSubject('')
        setDescription('')
      } else {
        toast.error(result.error)
      }
    })
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="h-8 w-8" style={{ color: 'oklch(0.575 0.115 27)' }} />
        <p className="text-sm font-semibold text-foreground">Chamado enviado</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Recebemos sua mensagem e vamos te responder por e-mail em breve.
        </p>
        <Button type="button" variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setSent(false)}>
          Abrir outro chamado
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Assunto</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex: dúvida sobre meu plano"
          required
          className="h-10"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Descreva o que está acontecendo</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Conte com o máximo de detalhes possível — isso ajuda a gente a te ajudar mais rápido."
          rows={4}
          required
          className="resize-none text-sm"
        />
      </div>
      <Button type="submit" disabled={isPending || !subject.trim() || !description.trim()} className="gap-1.5">
        <Send className="h-3.5 w-3.5" />
        {isPending ? 'Enviando…' : 'Enviar chamado'}
      </Button>
    </form>
  )
}
