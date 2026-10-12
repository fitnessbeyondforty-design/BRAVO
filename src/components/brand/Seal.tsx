import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * The Bravo registry seal — an original emblem (laurel ring, star, rotating legend).
 * Pure SVG, decorative. `spin` rotates only the outer legend.
 */
export function Seal({ className, spin = false, legend = 'BRAVO INTERNATIONAL BOOK OF WORLD RECORDS • OFFICIALLY VERIFIED • ' }:
  { className?: string; spin?: boolean; legend?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const id = `seal-path-${uid}`
  const foil = `url(#seal-foil-${uid})`
  return (
    <svg viewBox="0 0 200 200" className={cn('text-gold-400', className)} aria-hidden="true" focusable="false">
      <defs>
        <path id={id} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        <linearGradient id={`seal-foil-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3E6CC" />
          <stop offset=".35" stopColor="#C89854" />
          <stop offset=".7" stopColor="#E6CD9C" />
          <stop offset="1" stopColor="#B98A49" />
        </linearGradient>
      </defs>
      <g className={spin ? 'origin-center animate-spin-slow [transform-box:fill-box]' : undefined}>
        <text fill={foil} fontSize="11.5" letterSpacing="3.2" fontFamily="var(--font-cinzel), Georgia, serif" fontWeight="600">
          <textPath href={`#${id}`}>{legend}</textPath>
        </text>
      </g>
      <circle cx="100" cy="100" r="92" fill="none" stroke={foil} strokeWidth="1.2" />
      <circle cx="100" cy="100" r="64" fill="none" stroke={foil} strokeWidth="1.2" />
      <circle cx="100" cy="100" r="60" fill="none" stroke={foil} strokeWidth=".5" strokeDasharray="1 3" />
      {/* Laurel */}
      <g fill={foil}>
        {Array.from({ length: 7 }).map((_, i) => {
          const a = 200 + i * 17
          return <ellipse key={`l${i}`} cx="100" cy="100" rx="3.2" ry="8" transform={`rotate(${a} 100 100) translate(0 -46) rotate(-30 100 100)`} />
        })}
        {Array.from({ length: 7 }).map((_, i) => {
          const a = 160 - i * 17
          return <ellipse key={`r${i}`} cx="100" cy="100" rx="3.2" ry="8" transform={`rotate(${a} 100 100) translate(0 -46) rotate(30 100 100)`} />
        })}
      </g>
      {/* Star */}
      <path fill={foil} d="M100 66 l7.1 14.4 15.9 2.3 -11.5 11.2 2.7 15.8 -14.2 -7.5 -14.2 7.5 2.7 -15.8 -11.5 -11.2 15.9 -2.3z" />
      <text x="100" y="128" textAnchor="middle" fill={foil} fontFamily="var(--font-cinzel), Georgia, serif" fontSize="14" fontWeight="700" letterSpacing="3">BRAVO</text>
      <text x="100" y="140" textAnchor="middle" fill={foil} fontFamily="var(--font-cinzel), Georgia, serif" fontSize="6" letterSpacing="2.5">WORLD RECORDS</text>
    </svg>
  )
}
