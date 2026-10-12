export const dynamic = 'force-static'

export async function GET() {
  const body = `# Bravo International Book of World Records

> Registry recognizing verified extraordinary human achievements across
> arts, academics, sports, social work, and extraordinary skills.

## Core entities
- Record: a verified achievement (title, holder, category, media, date)
- Category: taxonomy of record types
- Submission: an application under review for record status

## Key pages
- /records: registry of all published records (paginated: ?page=N)
- /records?category={slug}: records within a category
- /apply: submit a record for review (sign-in required)
- /about, /contact, /terms: organisation, contact details, record rules

## Endpoints
- /sitemap.xml: full URL index
- /records/{slug}: canonical record detail (JSON-LD CreativeWork)
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
