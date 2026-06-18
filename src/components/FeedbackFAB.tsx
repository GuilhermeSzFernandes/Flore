'use client'

import { useState, useTransition } from 'react'
import { submitFeedback } from '@/actions/feedback'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { MessageSquareWarning, X, Send } from 'lucide-react'

export default function FeedbackFAB() {
  const [open, setOpen]       = useState(false)
  const [text, setText]       = useState('')
  const [pending, start]      = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    start(async () => {
      const result = await submitFeedback(text, window.location.href)
      if (result.success) {
        toast.success('Obrigado! O problema foi registrado.')
        setText('')
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      {/* Popover */}
      {open && (
        <div
          className="fixed bottom-[5.5rem] sm:bottom-20 right-5 z-50 w-72 rounded-2xl shadow-xl border border-border bg-card p-4 space-y-3"
          style={{ boxShadow: '0 8px 32px oklch(0.155 0.015 155 / 18%)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Reportar problema</p>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Encontrou algo errado? Descreva o que aconteceu e a página onde ocorreu.
          </p>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Ex: o botão de confirmar não está funcionando na tela de agendamento..."
              rows={3}
              className="resize-none text-sm"
              autoFocus
              disabled={pending}
            />
            <Button
              type="submit"
              size="sm"
              className="w-full gap-1.5 h-8 text-xs font-medium"
              disabled={pending || !text.trim()}
            >
              <Send className="w-3.5 h-3.5" />
              {pending ? 'Enviando…' : 'Enviar feedback'}
            </Button>
          </form>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Reportar problema"
        className="fixed bottom-20 sm:bottom-5 right-5 z-50 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          background: open ? 'oklch(0.155 0.015 155)' : 'oklch(0.575 0.115 27)',
          color: 'white',
          boxShadow: '0 4px 16px oklch(0.575 0.115 27 / 40%)',
        }}
      >
        {open
          ? <X className="w-4.5 h-4.5" />
          : <MessageSquareWarning className="w-4.5 h-4.5" />
        }
      </button>
    </>
  )
}
