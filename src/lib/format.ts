const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
const shortFmt = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })

/** Dates before 2000 are WordPress data-entry errors (e.g. year 0202) — hide rather than print nonsense. */
const valid = (d: Date | null | undefined): d is Date => !!d && d.getUTCFullYear() >= 2000

export const formatDate = (d: Date | null | undefined) => (valid(d) ? dateFmt.format(d) : null)
export const formatMonth = (d: Date | null | undefined) => (valid(d) ? shortFmt.format(d) : null)
