'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, UserPlus, Check, ChevronDown, X } from 'lucide-react'

interface Patient {
  id: string
  name: string
  phone: string
}

type Mode = 'idle' | 'open' | 'existing' | 'new'

interface Props {
  patients: Patient[]
  disabled?: boolean
}

export default function PatientCombobox({ patients, disabled }: Props) {
  const [mode, setMode]             = useState<Mode>('idle')
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Patient | null>(null)
  const [newName, setNewName]       = useState('')
  const [newPhone, setNewPhone]     = useState('')
  const containerRef                = useRef<HTMLDivElement>(null)

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.replace(/\D/g, '').includes(search.replace(/\D/g, ''))
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (mode === 'open') setMode('idle')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mode])

  function selectPatient(p: Patient) {
    setSelected(p)
    setMode('existing')
    setSearch('')
  }

  function chooseNew() {
    setSelected(null)
    setMode('new')
    setSearch('')
  }

  function reset() {
    setSelected(null)
    setNewName('')
    setNewPhone('')
    setMode('idle')
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Trigger / selecionado */}
      {(mode === 'idle' || mode === 'open') && (
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setMode(mode === 'open' ? 'idle' : 'open')}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-left flex items-center justify-between gap-2 hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            <span className="text-muted-foreground">Selecionar cliente...</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>

          {mode === 'open' && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border border-border bg-popover shadow-md overflow-hidden">
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou telefone..."
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>

              {/* Lista */}
              <div className="max-h-48 overflow-y-auto">
                {filtered.length === 0 && search && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Nenhuma cliente encontrada</p>
                )}
                {filtered.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => selectPatient(p)}
                    className="w-full px-3 py-2.5 text-left hover:bg-accent flex items-center gap-2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')}
                      </p>
                    </div>
                  </button>
                ))}

                {/* Nova cliente */}
                <button
                  type="button"
                  onMouseDown={chooseNew}
                  className="w-full px-3 py-2.5 text-left hover:bg-accent flex items-center gap-2 transition-colors border-t border-border"
                >
                  <UserPlus className="w-4 h-4 shrink-0" style={{ color: 'oklch(0.575 0.115 27)' }} />
                  <span className="text-sm font-medium" style={{ color: 'oklch(0.575 0.115 27)' }}>
                    Nova cliente
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cliente existente selecionada */}
      {mode === 'existing' && selected && (
        <>
          <input type="hidden" name="patientId"    value={selected.id} />
          <input type="hidden" name="patientName"  value={selected.name} />
          <input type="hidden" name="patientPhone" value={selected.phone} />
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                {selected.phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')}
              </p>
            </div>
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <button
              type="button"
              onClick={reset}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </>
      )}

      {/* Nova cliente */}
      {mode === 'new' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              Nova cliente
            </p>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Selecionar existente
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Input
                name="patientName"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nome *"
                disabled={disabled}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Input
                name="patientPhone"
                required
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="Telefone *"
                type="tel"
                disabled={disabled}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
