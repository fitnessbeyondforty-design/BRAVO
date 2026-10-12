'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * One observer for the whole app: any element with `data-reveal` fades/slides in when it
 * enters the viewport. Content stays visible without JS (the hidden state is scoped to `.js`,
 * which an inline script in <head> sets) and under prefers-reduced-motion (see globals.css).
 */
export function RevealObserver() {
  const pathname = usePathname()
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    const scan = () => document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [pathname])
  return null
}
