'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Gift, Sparkles } from 'lucide-react'
import ProLaunchCountdown from './ProLaunchCountdown'

interface Props {
  code: string
  link: string
  count: number
  /** mantido para compatibilidade; o progresso é derivado de `count` (1 indicação = 1 semana) */
  proWeeks?: number
}

const MAX_PRO_WEEKS = 5
const terracota = 'oklch(0.575 0.115 27)'
const terracotaSoft = 'oklch(0.575 0.115 27 / 8%)'

export default function ReferralCodeCard({ code, link, count }: Props) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  function copy(text: string, which: 'code' | 'link') {
    navigator.clipboard.writeText(text)
    if (which === 'code') {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } else {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const earned = Math.min(count, MAX_PRO_WEEKS)
  const remaining = Math.max(0, MAX_PRO_WEEKS - earned)

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
      {/* Benefício — chamada principal */}
      <div
        className="rounded-xl p-5 flex gap-4"
        style={{ background: terracotaSoft, border: `1px solid oklch(0.575 0.115 27 / 18%)` }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: terracota, color: 'white' }}
        >
          <Gift className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Indique e ganhe Pro grátis</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            A cada profissional que criar conta com o seu código, você ganha{' '}
            <span className="font-semibold" style={{ color: terracota }}>1 semana do plano Pro</span> — até{' '}
            <span className="font-semibold" style={{ color: terracota }}>{MAX_PRO_WEEKS} semanas grátis</span>.
            Os créditos são aplicados automaticamente quando o Pro for lançado.
          </p>
        </div>
      </div>

      {/* Progresso rumo às 5 semanas */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Semanas de Pro acumuladas
          </span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {earned}<span className="text-muted-foreground font-normal">/{MAX_PRO_WEEKS}</span>
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: MAX_PRO_WEEKS }).map((_, i) => (
            <div
              key={i}
              className="h-2 flex-1 rounded-full transition-colors"
              style={{ background: i < earned ? terracota : 'oklch(0.928 0.007 80)' }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          {remaining > 0 ? (
            <>
              <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: terracota }} />
              {count > 0
                ? `${count} ${count === 1 ? 'profissional já indicada' : 'profissionais já indicadas'} · indique mais ${remaining} para chegar ao máximo.`
                : `Indique ${remaining} profissionais para desbloquear todas as ${MAX_PRO_WEEKS} semanas.`}
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              Máximo de {MAX_PRO_WEEKS} semanas atingido — obrigada por divulgar o Flore! 🎉
            </>
          )}
        </p>
      </div>

      {/* Código */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seu código</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 rounded-lg border border-border bg-secondary/40 flex items-center justify-center">
            <span className="font-mono text-lg font-bold tracking-[0.3em] text-foreground">{code}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-3 shrink-0"
            onClick={() => copy(code, 'code')}
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Link */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Link de indicação</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 rounded-lg border border-border bg-secondary/40 px-3 flex items-center overflow-hidden">
            <span className="text-xs text-muted-foreground truncate font-mono">{link}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-3 shrink-0"
            onClick={() => copy(link, 'link')}
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Quem se cadastrar por este link fica vinculada ao seu código automaticamente.
        </p>
      </div>

      {/* Contagem regressiva para o lançamento do Pro — rodapé */}
      <ProLaunchCountdown />
    </div>
  )
}
