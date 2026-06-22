'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Users } from 'lucide-react'

interface Props {
  code: string
  link: string
  count: number
}

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

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-5">
      {/* Contagem */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'oklch(0.575 0.115 27 / 10%)' }}>
          <Users className="w-5 h-5" style={{ color: 'oklch(0.575 0.115 27)' }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{count}</p>
          <p className="text-xs text-muted-foreground">
            {count === 1 ? 'profissional indicada' : 'profissionais indicadas'}
          </p>
        </div>
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
    </div>
  )
}
