'use client'
import { useMemo, useRef, useState, useTransition } from 'react'
import { mediaUrl } from '@/lib/media'
import { setHeroSlots, setHomeFeatures } from '@/server/actions/homepage'

export type PickerRecord = { id: string; slug: string; title: string; holderName: string; imageKey: string | null }

type SaveFn = (ids: string[]) => Promise<{ ok: true; count: number } | { ok: false; error: string }>

function Thumb({ rec }: { rec: PickerRecord }) {
  const url = mediaUrl(rec.imageKey)
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-paper-200 ring-1 ring-paper-300">
      {url
        ? <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
        : <span className="text-[0.6rem] uppercase tracking-wide text-ink-muted">No photo</span>}
    </span>
  )
}

function ListEditor({
  title, help, catalog, initialIds, max, requireImage, draggable, onSave,
}: {
  title: string
  help: string
  catalog: PickerRecord[]
  initialIds: string[]
  max: number
  requireImage?: boolean
  draggable?: boolean
  onSave: SaveFn
}) {
  const byId = useMemo(() => new Map(catalog.map((r) => [r.id, r])), [catalog])
  const [ids, setIds] = useState<string[]>(() => initialIds.filter((id) => byId.has(id)))
  const [query, setQuery] = useState('')
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dragFrom = useRef<number | null>(null)

  const dirty = ids.join(',') !== initialIds.filter((id) => byId.has(id)).join(',')
  const selected = ids.map((id) => byId.get(id)!).filter(Boolean)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const chosen = new Set(ids)
    return catalog
      .filter((r) => !chosen.has(r.id))
      .filter((r) => (requireImage ? !!r.imageKey : true))
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.holderName.toLowerCase().includes(q))
      .slice(0, 12)
  }, [catalog, ids, query, requireImage])

  function mark() { setSaved(false); setError(null) }
  const add = (id: string) => { if (ids.length < max) { setIds([...ids, id]); mark() } }
  const remove = (id: string) => { setIds(ids.filter((x) => x !== id)); mark() }
  const move = (i: number, to: number) => {
    if (to < 0 || to >= ids.length) return
    const next = [...ids]; const [m] = next.splice(i, 1); next.splice(to, 0, m); setIds(next); mark()
  }
  const onDrop = (to: number) => {
    const from = dragFrom.current; dragFrom.current = null
    if (from === null || from === to) return
    const next = [...ids]; const [m] = next.splice(from, 1); next.splice(to, 0, m); setIds(next); mark()
  }

  const save = () => start(async () => {
    setError(null)
    const res = await onSave(ids)
    if (res.ok) setSaved(true)
    else setError(res.error)
  })

  return (
    <section className="rounded-2xl bg-white p-6 shadow-plate ring-1 ring-paper-200">
      <h2 className="font-serif text-2xl text-teal-700">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{help}</p>

      <ol className="mt-5 space-y-2">
        {selected.map((r, i) => (
          <li
            key={r.id}
            draggable={draggable}
            onDragStart={() => { if (draggable) dragFrom.current = i }}
            onDragOver={(e) => { if (draggable) e.preventDefault() }}
            onDrop={() => { if (draggable) onDrop(i) }}
            className="flex items-center gap-3 rounded-xl bg-paper-50 p-2.5 ring-1 ring-paper-200"
          >
            <span className="w-5 shrink-0 text-center font-display text-sm text-gold-600">{i + 1}</span>
            <Thumb rec={r} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-teal-700">{r.title}</span>
              <span className="block truncate text-xs text-ink-muted">{r.holderName}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}
                aria-label={`Move ${r.title} up`}
                className="grid h-8 w-8 place-items-center rounded-md ring-1 ring-paper-300 text-ink-soft hover:ring-gold-500 disabled:opacity-30">↑</button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === selected.length - 1}
                aria-label={`Move ${r.title} down`}
                className="grid h-8 w-8 place-items-center rounded-md ring-1 ring-paper-300 text-ink-soft hover:ring-gold-500 disabled:opacity-30">↓</button>
              <button type="button" onClick={() => remove(r.id)}
                aria-label={`Remove ${r.title}`}
                className="grid h-8 w-8 place-items-center rounded-md ring-1 ring-paper-300 text-red-700 hover:ring-red-400">✕</button>
            </span>
          </li>
        ))}
        {selected.length === 0 && (
          <li className="rounded-xl bg-paper-50 px-3 py-6 text-center text-sm text-ink-muted border border-dashed border-paper-300">
            Nothing chosen yet — the homepage uses its automatic default.
          </li>
        )}
      </ol>

      {ids.length < max ? (
        <div className="mt-4">
          <label className="label" htmlFor={`${title}-search`}>Add a record ({ids.length}/{max})</label>
          <input id={`${title}-search`} type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by record or holder…" className="field" autoComplete="off" />
          {query.trim() && (
            <ul className="mt-2 max-h-64 divide-y divide-paper-200 overflow-y-auto rounded-xl ring-1 ring-paper-200">
              {matches.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => add(r.id)}
                    className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-paper-100">
                    <Thumb rec={r} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-teal-700">{r.title}</span>
                      <span className="block truncate text-xs text-ink-muted">{r.holderName}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-gold-700">Add +</span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && <li className="p-3 text-center text-sm text-ink-muted">No matching records.</li>}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs text-ink-muted">Maximum of {max} reached. Remove one to add another.</p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending || !dirty}
          className="btn-gold disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        {saved && !dirty && <span role="status" className="text-sm font-medium text-emerald-700">Saved ✓</span>}
        {dirty && !pending && <span className="text-sm text-ink-muted">Unsaved changes</span>}
        {error && <span role="alert" className="text-sm text-red-700">{error}</span>}
      </div>
    </section>
  )
}

export function HomepageManager({
  catalog, heroIds, featureIds,
}: {
  catalog: PickerRecord[]
  heroIds: string[]
  featureIds: string[]
}) {
  return (
    <div className="space-y-8">
      <ListEditor
        title="Hero photos"
        help="The three photos shown beside the emblem at the top of the homepage. Pick published records with a photo; drag order is top-left to bottom. Leave empty to auto-show the latest."
        catalog={catalog}
        initialIds={heroIds}
        max={3}
        requireImage
        onSave={setHeroSlots}
      />
      <ListEditor
        title="Latest entries in the Book"
        help="Choose exactly which records appear in the homepage ‘latest entries’ and in what order (the first becomes the big lead story). Drag to reorder, or use the arrows. Leave empty to fall back to featured + newest."
        catalog={catalog}
        initialIds={featureIds}
        max={24}
        draggable
        onSave={setHomeFeatures}
      />
    </div>
  )
}
