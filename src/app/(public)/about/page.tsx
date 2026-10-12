import { StaticPage } from '@/components/content/StaticPage'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'About Bravo', alternates: { canonical: '/about' } }

export default function Page() {
  return <StaticPage slug="about" />
}
