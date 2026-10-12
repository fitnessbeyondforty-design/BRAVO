import { StaticPage } from '@/components/content/StaticPage'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contact Us', alternates: { canonical: '/contact' } }

export default function Page() {
  return <StaticPage slug="contact" />
}
