'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { sendWhatsAppReminder } from '@/actions/appointments'
import { Check, MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Appointment } from '@/db/schema'

export function WhatsAppReminderButton({
  appointment,
  professionalName,
}: {
  appointment: Appointment
  professionalName: string
}) {
  const [sent, setSent] = useState(!!appointment.reminderSentAt)
  const [isPending, startTransition] = useTransition()

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="w-3.5 h-3.5 text-green-600" />
        Lembrete enviado
      </span>
    )
  }

  function handleClick() {
    startTransition(async () => {
      const result = await sendWhatsAppReminder(appointment.id)
      if (result.success && result.url) {
        setSent(true)
        window.open(result.url, '_blank')
      } else {
        toast.error(result.error ?? 'Erro ao enviar lembrete')
      }
    })
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 text-xs h-7"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <MessageCircle className="w-3 h-3" />
      )}
      Lembrar pelo WhatsApp
    </Button>
  )
}
