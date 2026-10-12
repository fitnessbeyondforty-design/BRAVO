const PUBLIC_BASE = 'https://rgqtuucwqqlpqoupdqri.supabase.co/storage/v1/object/public/record-media/'

/** Public URL for an object in the `record-media` bucket. */
export function mediaUrl(key: string | null | undefined): string | null {
  return key ? PUBLIC_BASE + key.split('/').map(encodeURIComponent).join('/') : null
}

export const MEDIA_PUBLIC_BASE = PUBLIC_BASE
