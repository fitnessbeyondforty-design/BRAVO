import { Seal } from '@/components/brand/Seal'

/** Ivory masthead used by content pages. */
export function PageMasthead({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-paper-200 bg-paper-100 bg-paper-grain">
      <Seal className="pointer-events-none absolute -right-32 -top-32 h-[30rem] w-[30rem] opacity-[0.06]" spin />
      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="eyebrow animate-rise-in text-gold-700">{eyebrow}</p>
        <h1 className="mt-4 animate-rise-in font-serif text-4xl font-medium text-teal-700 [animation-delay:100ms] sm:text-6xl">{title}</h1>
        <div className="rule-ornament mx-auto mt-8 max-w-xs text-[0.6rem]" aria-hidden="true"><span>◆</span></div>
        {lead && <p className="mx-auto mt-6 max-w-2xl animate-rise-in text-lg text-ink-muted [animation-delay:200ms]">{lead}</p>}
      </div>
    </section>
  )
}
