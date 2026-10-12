/**
 * Guardian consent wording for under-18 record holders (DPDP Act 2023 s.9; DPDP Rules 2025 r.10).
 * The version string is stored on every submission with the consent timestamp, so if this
 * wording changes, bump the version — never edit the text under an existing version.
 */
export const GUARDIAN_CONSENT_VERSION = '2026-09-27'

export const GUARDIAN_CONSENT_TEXT =
  'I am the parent or legal guardian of the record holder named above and I am 18 or older. ' +
  'I consent to Bravo International Book of World Records processing my child’s personal data ' +
  'to review this claim and, if it is approved, to publish their name, achievement and age at the ' +
  'time of the record. I understand Bravo will not publish my child’s exact date of birth or their ' +
  'parents’ names, may contact me to verify that I am their guardian, and that I can withdraw this ' +
  'consent at any time by writing to Bravo.'

export const RELATIONSHIP_LABEL: Record<'PARENT' | 'LEGAL_GUARDIAN', string> = {
  PARENT: 'Parent',
  LEGAL_GUARDIAN: 'Legal guardian',
}
