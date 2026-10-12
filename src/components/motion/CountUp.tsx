'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Animated number that counts up once when scrolled into view.
 * Renders the final value on the server AND keeps showing it after hydration —
 * it only drops to 0 at the instant the count-up actually begins, so the number
 * is never left stuck at 0 when the element starts below the fold (the earlier
 * bug: an unconditional reset to 0 that only recovered via the IntersectionObserver).
 */
export function CountUp({ value, duration = 1800, suffix = '' }: { value: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(value)
  useEffect(() => {
    const el = ref.current
    const noMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!el || noMotion || typeof IntersectionObserver === 'undefined') {
      setShown(value) // guarantee the real value is shown
      return
    }
    let raf = 0
    let started = false
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started) return // still below the fold → keep the SSR value, keep observing
      started = true
      io.disconnect()
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        setShown(Math.round(value * (1 - Math.pow(1 - p, 4))))
        if (p < 1) raf = requestAnimationFrame(tick)
        else setShown(value) // land exactly on the real value
      }
      raf = requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [value, duration])
  return (
    <span ref={ref} aria-label={`${value.toLocaleString('en-IN')}${suffix}`}>
      <span aria-hidden="true">{shown.toLocaleString('en-IN')}{suffix}</span>
    </span>
  )
}
