import { StaticPage } from '@/components/content/StaticPage'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Rules, Terms & Conditions', alternates: { canonical: '/terms' } }

export default function Page() {
  return <StaticPage slug="terms" />
}
