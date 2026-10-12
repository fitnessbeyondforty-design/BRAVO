import Link from 'next/link'
import Image from 'next/image'
import { mediaUrl } from '@/lib/media'
import { formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

type Props = {
  slug: string
  title: string
  holderName: string
  description: string
  imageKey?: string | null
  categoryName?: string | null
  publishedAt?: Date | null
  /** Position in a grid — staggers the reveal animation. */
  index?: number
  headingLevel?: 'h2' | 'h3'
}

export function RecordCard({ slug, title, holderName, imageKey, categoryName, publishedAt, index = 0, headingLevel = 'h3' }: Props) {
  const img = mediaUrl(imageKey)
  const H = headingLevel
  const when = formatMonth(publishedAt)
  const showHolder = holderName.trim().toLowerCase() !== title.trim().toLowerCase()
  return (
    <article data-reveal style={{ ['--d' as string]: `${(index % 3) * 90}ms` }} className="group relative flex flex-col">
      <div className="zoom-img relative aspect-[4/5] overflow-hidden rounded-2xl bg-teal-700 shadow-plate">
        {img ? (
          // next/image: the migrated featured images are up to 2560px but cards render at ~300px —
          // this resizes + serves AVIF/WebP, with a responsive srcset for mobile.
          <Image src={img} alt="" fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 400px" className="object-cover object-[center_20%]" />
        ) : (
          <div className="flex h-full items-center justify-center bg-guilloche font-display text-3xl tracking-[0.3em] text-gold-400/50" aria-hidden="true">BRAVO</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-teal-900/70 via-transparent to-transparent opacity-80 transition duration-700 group-hover:opacity-100" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-paper-50/90 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-teal-700 backdrop-blur">
          <svg viewBox="0 0 16 16" className="h-3 w-3 text-gold-600" aria-hidden="true"><path fill="currentColor" d="M8 0l2 2.3 3-.4.4 3L16 8l-2.3 2 .4 3-3 .4L8 16l-2-2.3-3 .4-.4-3L0 8l2.3-2-.4-3 3-.4z"/><path d="M5 8.2l2 2 4-4" fill="none" stroke="#fff" strokeWidth="1.6"/></svg>
          Verified
        </span>
        <p className="absolute inset-x-4 bottom-4 truncate font-display text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-200">
          {categoryName ?? 'World Record'}
        </p>
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <H className="font-serif text-xl leading-snug text-teal-700 transition-colors group-hover:text-gold-700">
          <Link href={`/records/${slug}`} className="line-clamp-3 after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-gold-500">
            {title}
          </Link>
        </H>
        <p className={cn('mt-2 text-sm text-ink-muted')}>
          {showHolder && <span className="font-medium text-ink-soft">{holderName}</span>}
          {showHolder && when && <span aria-hidden="true" className="mx-2 text-gold-500">·</span>}
          {when}
        </p>
      </div>
    </article>
  )
}
