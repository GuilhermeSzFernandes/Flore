'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

interface PlaceResult {
  address: string
  latitude: number
  longitude: number
}

interface Props {
  defaultValue?: string
  onSelect: (data: PlaceResult) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

function loadMapsScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return
    if (window.google?.maps?.places) { resolve(); return }
    const existing = document.getElementById('gm-places-script')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }
    const script = document.createElement('script')
    script.id = 'gm-places-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=pt-BR&region=BR`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

export default function AddressAutocomplete({
  defaultValue = '',
  onSelect,
  disabled,
  className,
  placeholder = 'Rua, número — bairro, cidade',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    let autocomplete: google.maps.places.Autocomplete | undefined

    loadMapsScript().then(() => {
      if (!inputRef.current) return
      autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'br' },
        fields: ['formatted_address', 'geometry'],
        types: ['geocode', 'establishment'],
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete!.getPlace()
        if (!place.geometry?.location || !place.formatted_address) return
        const result: PlaceResult = {
          address:   place.formatted_address,
          latitude:  place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        }
        setValue(result.address)
        onSelect(result)
      })
    })

    return () => {
      if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete)
    }
  }, [onSelect])

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
      <Input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={`pl-9 h-10 ${className ?? ''}`}
      />
    </div>
  )
}
