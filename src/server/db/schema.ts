import { pgTable, pgEnum, uuid, text, timestamp, integer, smallint, boolean, jsonb, index, primaryKey } from 'drizzle-orm/pg-core'

export const role = pgEnum('role', ['SUPER_ADMIN', 'MODERATOR', 'RECORD_HOLDER', 'PUBLIC_USER'])
export const submissionStatus = pgEnum('submission_status', ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CHANGES', 'APPROVED', 'REJECTED', 'PUBLISHED'])
export const paymentStatus = pgEnum('payment_status', ['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
export const mediaType = pgEnum('media_type', ['IMAGE', 'VIDEO', 'DOCUMENT'])
export const guardianRelationship = pgEnum('guardian_relationship', ['PARENT', 'LEGAL_GUARDIAN'])
export const guardianConsentStatus = pgEnum('guardian_consent_status', ['NOT_REQUIRED', 'PENDING_VERIFICATION', 'VERIFIED'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  role: role('role').notNull().default('PUBLIC_USER'),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  parentId: uuid('parent_id'),
  legacyWpId: integer('legacy_wp_id').unique(),
})

export const records = pgTable('records', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  /** Rich body (migrated from WordPress). Always sanitized at render — see lib/sanitize.ts. */
  bodyHtml: text('body_html'),
  holderName: text('holder_name').notNull(),
  holderId: uuid('holder_id').references(() => users.id),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  achievedOn: timestamp('achieved_on', { withTimezone: true }),
  viewCount: integer('view_count').notNull().default(0),
  featured: boolean('featured').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  legacyWpId: integer('legacy_wp_id').unique(),
}, (t) => ({
  catPub: index('rec_cat_pub_idx').on(t.categoryId, t.publishedAt),
  trending: index('rec_trending_idx').on(t.viewCount),
}))

/** Records can sit in several categories (WordPress categories kept as-is, MASTER-BRIEF §2b). */
export const recordCategories = pgTable('record_categories', {
  recordId: uuid('record_id').notNull().references(() => records.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.recordId, t.categoryId] }) }))

/**
 * Admin-curated homepage hero: which records' photos fill the three plates beside the
 * seal (MASTER-BRIEF §8 item: "replace the hero section photos"). Empty => the homepage
 * falls back to auto-picking the latest records with an image. Writes go through the
 * server-side postgres connection; public has read-only RLS.
 */
export const heroSlots = pgTable('hero_slots', {
  position: smallint('position').primaryKey(),
  recordId: uuid('record_id').notNull().references(() => records.id, { onDelete: 'cascade' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Admin-curated "latest entries in the Book" order (MASTER-BRIEF §8 item: choose which
 * post appears where / sequence). Lower position shows first. Empty => the homepage falls
 * back to the `featured` flag + newest-first.
 */
export const homeFeatures = pgTable('home_features', {
  recordId: uuid('record_id').primaryKey().references(() => records.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

/** CMS-style static pages (about, contact, terms). */
export const pages = pgTable('pages', {
  slug: text('slug').primaryKey(),
  title: text('title').notNull(),
  bodyHtml: text('body_html').notNull(),
  legacyWpId: integer('legacy_wp_id').unique(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicantId: uuid('applicant_id').notNull().references(() => users.id),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  proposedTitle: text('proposed_title').notNull(),
  claimDetails: text('claim_details').notNull(),
  status: submissionStatus('status').notNull().default('DRAFT'),
  reviewerId: uuid('reviewer_id').references(() => users.id),
  reviewNotes: text('review_notes'),
  holderName: text('holder_name').notNull(),
  /**
   * Under-18 record holder => guardian consent required (DPDP Act 2023 s.9, MASTER-BRIEF §2).
   * DB check constraints enforce: full guardian record when minor, none when adult;
   * VERIFIED only with verifier + time; APPROVED/PUBLISHED only once VERIFIED.
   */
  holderIsMinor: boolean('holder_is_minor').notNull().default(false),
  guardianName: text('guardian_name'),
  guardianRelationship: guardianRelationship('guardian_relationship'),
  guardianConsentAt: timestamp('guardian_consent_at', { withTimezone: true }),
  guardianConsentVersion: text('guardian_consent_version'),
  guardianConsentStatus: guardianConsentStatus('guardian_consent_status').notNull().default('NOT_REQUIRED'),
  guardianVerifiedBy: uuid('guardian_verified_by').references(() => users.id),
  guardianVerifiedAt: timestamp('guardian_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ queue: index('sub_queue_idx').on(t.status, t.createdAt) }))

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: mediaType('type').notNull(),
  storageKey: text('storage_key').notNull(),
  submissionId: uuid('submission_id').references(() => submissions.id),
  recordId: uuid('record_id').references(() => records.id),
  /** Intrinsic pixel dimensions (backfilled from the WordPress originals) — used by next/image to size and avoid layout shift. */
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id).unique(),
  provider: text('provider').notNull(),
  providerRef: text('provider_ref').notNull().unique(),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull().default('INR'),
  status: paymentStatus('status').notNull().default('PENDING'),
  gstInvoiceNo: text('gst_invoice_no'),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ entity: index('audit_entity_idx').on(t.entityType, t.entityId) }))
