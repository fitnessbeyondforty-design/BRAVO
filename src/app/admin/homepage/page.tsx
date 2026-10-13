import { getHeroSlotIds, getHomeFeatureIds, getRecordPickerCatalog } from '@/server/db/queries'
import { HomepageManager } from '@/components/admin/HomepageManager'

export const dynamic = 'force-dynamic'

export default async function AdminHomepagePage() {
  const [catalog, heroIds, featureIds] = await Promise.all([
    getRecordPickerCatalog(),
    getHeroSlotIds(),
    getHomeFeatureIds(),
  ])
  return (
    <div>
      <h1 className="mb-2 font-serif text-3xl text-teal-700">Homepage</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink-muted">
        Curate what visitors see first. Only published records can be chosen. Changes go live as soon as you save.
      </p>
      <HomepageManager catalog={catalog} heroIds={heroIds} featureIds={featureIds} />
    </div>
  )
}
