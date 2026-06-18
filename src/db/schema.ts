import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core'
import type { AdapterAccountType } from 'next-auth/adapters'

// ── Auth.js tables ──────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:            text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:          text('name'),
  email:         text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image:         text('image'),
  role:          text('role', { enum: ['professional', 'patient', 'admin'] }).notNull().default('patient'),
  passwordHash:  text('password_hash'),
})

export const accounts = pgTable('accounts', {
  userId:            text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:              text('type').$type<AdapterAccountType>().notNull(),
  provider:          text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token:     text('refresh_token'),
  access_token:      text('access_token'),
  expires_at:        integer('expires_at'),
  token_type:        text('token_type'),
  scope:             text('scope'),
  id_token:          text('id_token'),
  session_state:     text('session_state'),
}, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })])

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId:       text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires:      timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token:      text('token').notNull(),
  expires:    timestamp('expires', { mode: 'date' }).notNull(),
}, (t) => [primaryKey({ columns: [t.identifier, t.token] })])

// ── Flore domain tables ──────────────────────────────────────────────────────

export const professionals = pgTable('professionals', {
  id:            text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:        text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  displayName:   text('display_name').notNull(),
  phone:         text('phone'),
  slug:          text('slug').notNull().unique(),
  plan:          text('plan', { enum: ['beta', 'free', 'pro', 'clinic'] }).notNull().default('free'),
  specialty:     text('specialty', { enum: ['manicure', 'hairdresser', 'massagist', 'esthetician', 'other'] }),
  monthlyVolume: text('monthly_volume', { enum: ['lt20', 'around50', 'around100'] }),
  teamSize:      text('team_size', { enum: ['solo', 'up_to_5', 'more_than_10'] }),
  homeVisits:          boolean('home_visits'),
  connectCode:         text('connect_code').unique(),
  businessName:        text('business_name'),
  businessDescription: text('business_description'),
  address:             text('address'),
  workingHours:        text('working_hours'),
  lunchBreak:          text('lunch_break'),    // JSON: {"start":"HH:MM","end":"HH:MM"} | null
  createdAt:           timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const patients = pgTable('patients', {
  id:             text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  professionalId: text('professional_id').notNull().references(() => professionals.id, { onDelete: 'cascade' }),
  userId:         text('user_id').references(() => users.id, { onDelete: 'set null' }),
  name:           text('name').notNull(),
  phone:          text('phone').notNull(),
  email:          text('email'),
  birthDate:      text('birth_date'),
  notes:          text('notes'),
  sensitivities:  text('sensitivities'),
  preferences:    text('preferences'),
  createdAt:      timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const restrictions = pgTable('restrictions', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  technique: text('technique').notNull(),
  reason:    text('reason'),
  active:    boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const appointments = pgTable('appointments', {
  id:             text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  professionalId: text('professional_id').notNull().references(() => professionals.id, { onDelete: 'cascade' }),
  patientId:      text('patient_id').references(() => patients.id, { onDelete: 'set null' }),
  patientName:    text('patient_name').notNull(),
  patientPhone:   text('patient_phone').notNull(),
  serviceName:    text('service_name').notNull(),
  startsAt:       timestamp('starts_at', { mode: 'date' }).notNull(),
  durationMin:    integer('duration_min').default(60).notNull(),
  status:         text('status', { enum: ['scheduled', 'confirmed', 'done', 'no_show', 'cancelled'] }).default('scheduled').notNull(),
  reminderSentAt: timestamp('reminder_sent_at', { mode: 'date' }),
  notes:          text('notes'),
  createdAt:      timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const sessionNotes = pgTable('session_notes', {
  id:             text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  appointmentId:  text('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }).unique(),
  whatWasDone:    text('what_was_done').notNull(),
  areasTreated:   text('areas_treated').array(),
  painBefore:     integer('pain_before'),
  painAfter:      integer('pain_after'),
  observations:   text('observations'),
  nextSessionTip: text('next_session_tip'),
  createdAt:      timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const services = pgTable('services', {
  id:             text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  professionalId: text('professional_id').notNull().references(() => professionals.id, { onDelete: 'cascade' }),
  name:           text('name').notNull(),
  durationMin:    integer('duration_min').default(60).notNull(),
  priceInCents:   integer('price_in_cents'),
  active:         boolean('active').default(true).notNull(),
})

export const blockedTimes = pgTable('blocked_times', {
  id:             text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  professionalId: text('professional_id').notNull().references(() => professionals.id, { onDelete: 'cascade' }),
  date:           text('date').notNull(),       // 'YYYY-MM-DD'
  startTime:      text('start_time'),           // 'HH:MM' — null = dia inteiro
  endTime:        text('end_time'),             // 'HH:MM' — null = dia inteiro
  reason:         text('reason'),
  createdAt:      timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

// ── Inferred types ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type Professional = typeof professionals.$inferSelect
export type Patient = typeof patients.$inferSelect
export type Restriction = typeof restrictions.$inferSelect
export type Appointment = typeof appointments.$inferSelect
export type SessionNote = typeof sessionNotes.$inferSelect
export type Service = typeof services.$inferSelect
export type BlockedTime = typeof blockedTimes.$inferSelect
