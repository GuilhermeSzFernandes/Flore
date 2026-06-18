'use client'

import { useTransition } from 'react'
import { changeProfessionalPlan } from '@/actions/admin'
import { toast } from 'sonner'

type Plan = 'beta' | 'free' | 'pro' | 'clinic'

interface Props {
  professionalId: string
  currentPlan:    Plan
  planLabels:     Record<string, string>
  planColors:     Record<string, string>
}

const plans: Plan[] = ['beta', 'free', 'pro', 'clinic']

export function PlanSelector({ professionalId, currentPlan, planLabels, planColors }: Props) {
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const plan = e.target.value as Plan
    startTransition(async () => {
      const result = await changeProfessionalPlan(professionalId, plan)
      if (result.success) {
        toast.success(`Plano alterado para ${planLabels[plan]}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <select
      defaultValue={currentPlan}
      onChange={handleChange}
      disabled={pending}
      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer transition-opacity ${planColors[currentPlan]} ${pending ? 'opacity-50' : ''}`}
    >
      {plans.map(p => (
        <option key={p} value={p} className="text-foreground bg-background">
          {planLabels[p]}
        </option>
      ))}
    </select>
  )
}
