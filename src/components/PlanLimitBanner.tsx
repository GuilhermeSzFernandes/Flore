import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import type { Plan } from '@/lib/plan'

const planLabels: Record<Plan, string> = {
  beta:   'Beta',
  free:   'Gratuito',
  pro:    'Pro',
  clinic: 'Clínica',
}

export function PlanLimitBanner({ feature, currentPlan }: { feature: string; currentPlan: Plan }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[oklch(0.98_0.04_80)] border border-[oklch(0.85_0.06_80)] rounded-lg text-sm">
      <AlertTriangle className="w-4 h-4 shrink-0 text-[oklch(0.60_0.10_60)]" />
      <p className="flex-1 text-[oklch(0.40_0.05_60)]">
        Limite de <strong>{feature}</strong> atingido no plano <strong>{planLabels[currentPlan]}</strong>.
      </p>
      <Button size="sm" variant="outline" disabled className="shrink-0 text-xs">
        Fazer upgrade
      </Button>
    </div>
  )
}
