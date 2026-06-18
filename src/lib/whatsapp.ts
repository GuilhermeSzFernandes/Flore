export function buildWhatsAppReminderUrl({
  phone,
  patientName,
  serviceName,
  professionalName,
  startsAt,
}: {
  phone: string
  patientName: string
  serviceName: string
  professionalName: string
  startsAt: Date
}): string {
  const hora = startsAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })

  const text = `Olá ${patientName}! 😊 Passando para confirmar sua sessão de *${serviceName}* hoje às *${hora}* com ${professionalName}. Confirma sua presença?`

  const digits = phone.replace(/\D/g, '')
  const number = digits.startsWith('55') ? digits : `55${digits}`

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}
