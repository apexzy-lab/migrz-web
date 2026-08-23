import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  countryResidence: text("country_residence").notNull(),
  preferredPlan: text("preferred_plan").notNull().default("standard"),
  emailVerifiedAt: integer("email_verified_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [uniqueIndex("idx_users_email").on(table.email)]);

export const loginCodes = sqliteTable("login_codes", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), codeHash: text("code_hash").notNull(),
  expiresAt: integer("expires_at").notNull(), attempts: integer("attempts").notNull().default(0),
  consumedAt: integer("consumed_at"), ipHash: text("ip_hash"), createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_login_codes_user_created").on(table.userId, table.createdAt)]);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), tokenHash: text("token_hash").notNull(),
  expiresAt: integer("expires_at").notNull(), createdAt: integer("created_at").notNull(), revokedAt: integer("revoked_at"),
}, (table) => [uniqueIndex("idx_sessions_token").on(table.tokenHash), index("idx_sessions_user").on(table.userId)]);

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), plan: text("plan").notNull(),
  provider: text("provider").notNull(), amountMinor: integer("amount_minor").notNull(), currency: text("currency").notNull(),
  status: text("status").notNull(), providerReference: text("provider_reference"), checkoutUrl: text("checkout_url"),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(), paidAt: integer("paid_at"),
}, (table) => [uniqueIndex("idx_payments_provider_reference").on(table.provider, table.providerReference), index("idx_payments_user_created").on(table.userId, table.createdAt)]);

export const entitlements = sqliteTable("entitlements", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), paymentId: text("payment_id").notNull(),
  plan: text("plan").notNull(), status: text("status").notNull(), activatedAt: integer("activated_at").notNull(),
}, (table) => [uniqueIndex("idx_entitlements_payment").on(table.paymentId), index("idx_entitlements_user_status").on(table.userId, table.status)]);

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), status: text("status").notNull(),
  currentSection: integer("current_section").notNull().default(1), answersJson: text("answers_json").notNull().default("{}"),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(), submittedAt: integer("submitted_at"),
}, (table) => [uniqueIndex("idx_applications_user").on(table.userId), index("idx_applications_status").on(table.status)]);

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), applicationId: text("application_id").notNull(),
  r2Key: text("r2_key").notNull(), fileName: text("file_name").notNull(), contentType: text("content_type").notNull(),
  size: integer("size").notNull(), status: text("status").notNull(), createdAt: integer("created_at").notNull(),
}, (table) => [uniqueIndex("idx_documents_r2_key").on(table.r2Key), index("idx_documents_user_created").on(table.userId, table.createdAt)]);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(), event: text("event").notNull(), actorUserId: text("actor_user_id"),
  entityType: text("entity_type").notNull(), entityId: text("entity_id"), metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_audit_events_entity_created").on(table.entityType, table.entityId, table.createdAt)]);
