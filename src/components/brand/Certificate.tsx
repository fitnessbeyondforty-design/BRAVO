import { Seal } from './Seal'

/** Decorative sample certificate used in marketing sections. Not a real record. */
export function Certificate() {
  return (
    <div aria-hidden="true"
      className="relative rotate-[-3deg] rounded-md bg-paper-50 p-3 text-teal-700 shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)] transition duration-700 [transform-style:preserve-3d] hover:rotate-0 hover:[transform:rotateX(6deg)_rotateY(-8deg)]">
      <div className="relative rounded-sm border-2 border-gold-400 p-1">
        <div className="relative overflow-hidden rounded-sm border border-gold-400/60 bg-paper-grain px-6 py-10 text-center sm:px-10">
          <Seal className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" />
          <p className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-gold-700">Bravo International Book of World Records</p>
          <p className="mt-4 font-serif text-3xl italic sm:text-4xl">Certificate</p>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-ink-muted">of World Record</p>
          <div className="rule-ornament mx-auto my-5 max-w-[12rem] text-[0.5rem]"><span>◆</span></div>
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-ink-muted">This is to certify that</p>
          <p className="mt-2 font-serif text-2xl text-teal-700">Your Name Here</p>
          <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-ink-muted">
            has been recognised for an extraordinary achievement, verified by the Bravo adjudication team and entered in the registry.
          </p>
          <div className="mt-8 flex items-end justify-between gap-4">
            <div className="text-left">
              <div className="h-px w-24 bg-teal-700/40" />
              <p className="mt-1.5 text-[0.55rem] uppercase tracking-[0.2em] text-ink-muted">Adjudicator</p>
            </div>
            <div className="h-20 w-20 rounded-full bg-teal-700 p-1 shadow-plate">
              <Seal className="h-full w-full" spin />
            </div>
            <div className="text-right">
              <div className="ml-auto h-px w-24 bg-teal-700/40" />
              <p className="mt-1.5 text-[0.55rem] uppercase tracking-[0.2em] text-ink-muted">Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
