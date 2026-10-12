import sanitizeHtml from 'sanitize-html'

const STORAGE_HOST = 'rgqtuucwqqlpqoupdqri.supabase.co'

/**
 * Sanitize migrated / CMS HTML before rendering. Allow-list only: no scripts, styles,
 * iframes, event handlers or inline CSS. <h1> is demoted to <h2> so the
 * page keeps a single <h1>. Images may only come from our Supabase Storage.
 */
export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) return ''
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'h4', 'blockquote', 'figure', 'figcaption', 'img', 'sup', 'sub', 'span'],
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
    },
    allowedSchemes: ['https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !frame.attribs.src?.startsWith(`https://${STORAGE_HOST}/storage/v1/object/public/`),
    transformTags: {
      h1: 'h2', h5: 'h4', h6: 'h4',
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy', decoding: 'async', alt: attribs.alt ?? '' } }),
      a: (tagName, attribs) => {
        const href = (attribs.href ?? '').replace(/^https?:\/\/(www\.)?bravoworldrecords\.com/i, '') || '/'
        const external = /^https?:\/\//i.test(href)
        const out: Record<string, string> = external ? { href, rel: 'noopener noreferrer nofollow ugc', target: '_blank' } : { href }
        return { tagName, attribs: out }
      },
    },
  })
}
