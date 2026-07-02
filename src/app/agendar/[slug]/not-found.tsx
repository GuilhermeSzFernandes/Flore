import Link from 'next/link'
import { SearchX, ArrowLeft } from 'lucide-react'
import FloreLogo from '@/components/FloreLogo'

export default function ProfessionalNotFound() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center"
      style={{ background: 'oklch(0.963 0.006 80)' }}
    >
      <FloreLogo
        size={22}
        textClassName="text-xs font-semibold uppercase tracking-widest"
        textColor="oklch(0.575 0.115 27)"
      />

      <div
        className="mt-8 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'oklch(0.575 0.115 27 / 10%)' }}
      >
        <SearchX className="h-7 w-7" style={{ color: 'oklch(0.575 0.115 27)' }} />
      </div>

      <h1
        className="mt-6 max-w-sm font-display text-2xl italic leading-snug"
        style={{ color: 'oklch(0.155 0.015 155)' }}
      >
        Não encontramos essa página de agendamento
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: 'oklch(0.45 0.010 155)' }}>
        O link pode estar incompleto ou a profissional pode ter alterado o nome de usuário da vitrine.
        Confira o endereço com quem te enviou o link.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'oklch(0.575 0.115 27)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o início
      </Link>
    </div>
  )
}
