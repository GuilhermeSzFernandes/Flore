'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const terra = 'oklch(0.575 0.115 27)'

/**
 * Carrossel com loop infinito: o trilho renderiza 3 cópias das fotos
 * (anterior · atual · próxima) e recentraliza silenciosamente na cópia do
 * meio sempre que o scroll se aproxima das bordas — assim o usuário nunca
 * vê o "fim" da lista, só a sensação de repetição contínua.
 */
export default function GalleryCarousel({ urls, alt }: { urls: string[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const settleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loop = urls.length > 1
  const items = loop ? [...urls, ...urls, ...urls] : urls

  // Trava o scroll da página e permite fechar/navegar pelo teclado enquanto o
  // lightbox está aberto.
  useEffect(() => {
    if (lightboxIndex === null) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? i : (i - 1 + urls.length) % urls.length))
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? i : (i + 1) % urls.length))
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [lightboxIndex, urls.length])

  function step(track: HTMLDivElement) {
    const card = track.firstElementChild as HTMLElement | null
    const gap = 12
    return (card?.clientWidth ?? 0) + gap
  }

  const updateActive = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const s = step(track)
    if (!s) return
    const rawIndex = Math.round(track.scrollLeft / s)
    const index = ((rawIndex % urls.length) + urls.length) % urls.length
    setActive(index)
  }, [urls.length])

  // Centraliza na cópia do meio ao montar (instantâneo, sem animação)
  useEffect(() => {
    const track = trackRef.current
    if (!track || !loop) return
    const setWidth = track.scrollWidth / 3
    track.scrollLeft = setWidth
    updateActive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop])

  function handleScroll() {
    updateActive()
    if (!loop) return
    if (settleTimeout.current) clearTimeout(settleTimeout.current)
    settleTimeout.current = setTimeout(() => {
      const track = trackRef.current
      if (!track) return
      const setWidth = track.scrollWidth / 3
      if (track.scrollLeft < setWidth * 0.5) {
        track.scrollLeft += setWidth
      } else if (track.scrollLeft > setWidth * 2.5) {
        track.scrollLeft -= setWidth
      }
    }, 120)
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    track.addEventListener('scroll', handleScroll, { passive: true })
    return () => track.removeEventListener('scroll', handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function scrollByStep(direction: -1 | 1) {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * step(track), behavior: 'smooth' })
  }

  function scrollToDot(index: number) {
    const track = trackRef.current
    if (!track) return
    const s = step(track)
    const setWidth = loop ? track.scrollWidth / 3 : 0
    track.scrollTo({ left: setWidth + index * s, behavior: 'smooth' })
  }

  if (urls.length === 0) return null

  return (
    <div className="relative mx-auto max-w-2xl">
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => setLightboxIndex(i % urls.length)}
            className="h-48 w-[60%] shrink-0 snap-start overflow-hidden rounded-2xl sm:h-56 sm:w-[42%]"
            aria-label={`Ampliar foto ${(i % urls.length) + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${alt} — foto ${(i % urls.length) + 1}`}
              className="h-full w-full cursor-zoom-in object-cover transition-opacity hover:opacity-90"
              loading={i < urls.length ? 'eager' : 'lazy'}
            />
          </button>
        ))}
      </div>

      {urls.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md sm:flex"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByStep(1)}
            className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md sm:flex"
            aria-label="Próxima foto"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mt-3 flex justify-center gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToDot(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === active ? '1.25rem' : '0.375rem',
                  background: i === active ? terra : 'oklch(0.575 0.115 27 / 25%)',
                }}
                aria-label={`Ir para foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Lightbox — fundo escurecido, foto em destaque */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          {urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + urls.length) % urls.length) }}
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % urls.length) }}
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[lightboxIndex]}
            alt={`${alt} — foto ${lightboxIndex + 1} ampliada`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl animate-in zoom-in-95 duration-200 sm:max-w-[85vw]"
          />
        </div>
      )}
    </div>
  )
}
