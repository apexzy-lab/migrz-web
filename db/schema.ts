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
  publicId: text("public_id"), reviewStatus: text("review_status").notNull().default("draft"), assignedAdminId: text("assigned_admin_id"),
  currentSection: integer("current_section").notNull().default(1), answersJson: text("answers_json").notNull().default("{}"),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(), submittedAt: integer("submitted_at"), adminUpdatedAt: integer("admin_updated_at"),
  reviewDueAt: integer("review_due_at"), reportPublishedAt: integer("report_published_at"),
  casevaultStatus: text("casevault_status").notNull().default("not_ready"), casevaultReference: text("casevault_reference"),
  retentionUntil: integer("retention_until"),
}, (table) => [uniqueIndex("idx_applications_user").on(table.userId), uniqueIndex("idx_applications_public_id").on(table.publicId), index("idx_applications_status").on(table.status), index("idx_applications_review_status").on(table.reviewStatus)]);

export const admins = sqliteTable("admins", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), role: text("role").notNull().default("admin"),
  status: text("status").notNull().default("active"), createdAt: integer("created_at").notNull(),
}, (table) => [uniqueIndex("idx_admins_user").on(table.userId), index("idx_admins_status").on(table.status)]);

export const applicationNotes = sqliteTable("application_notes", {
  id: text("id").primaryKey(), applicationId: text("application_id").notNull(), adminUserId: text("admin_user_id").notNull(),
  note: text("note").notNull(), createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_application_notes_application_created").on(table.applicationId, table.createdAt)]);

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

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), type: text("type").notNull(),
  title: text("title").notNull(), message: text("message").notNull(), actionLabel: text("action_label"),
  actionView: text("action_view"), entityType: text("entity_type"), entityId: text("entity_id"),
  readAt: integer("read_at"), createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_notifications_user_created").on(table.userId, table.createdAt), index("idx_notifications_user_unread").on(table.userId, table.readAt)]);

export const appointmentRequests = sqliteTable("appointment_requests", {
  id: text("id").primaryKey(), publicId: text("public_id").notNull(), applicationId: text("application_id").notNull(),
  userId: text("user_id").notNull(), requestedStart: integer("requested_start").notNull(), durationMinutes: integer("duration_minutes").notNull().default(60),
  timezone: text("timezone").notNull(), applicantNote: text("applicant_note").notNull().default(""), status: text("status").notNull().default("requested"),
  confirmedStart: integer("confirmed_start"), meetingUrl: text("meeting_url"), adminNote: text("admin_note").notNull().default(""),
  provider: text("provider").notNull().default("manual"), providerEventUri: text("provider_event_uri"), providerInviteeUri: text("provider_invitee_uri"),
  cancelUrl: text("cancel_url"), rescheduleUrl: text("reschedule_url"), completedAt: integer("completed_at"),
  completionNotificationSentAt: integer("completion_notification_sent_at"), completionNotificationAttempts: integer("completion_notification_attempts").notNull().default(0),
  reminder24hSentAt: integer("reminder_24h_sent_at"), reminder1hSentAt: integer("reminder_1h_sent_at"), noShowFollowupSentAt: integer("no_show_followup_sent_at"),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
}, (table) => [uniqueIndex("idx_appointment_application").on(table.applicationId), uniqueIndex("idx_appointment_public_id").on(table.publicId), index("idx_appointment_status_start").on(table.status, table.requestedStart)]);

export const serviceMessages = sqliteTable("service_messages", {
  id: text("id").primaryKey(), applicationId: text("application_id").notNull(), userId: text("user_id").notNull(),
  senderUserId: text("sender_user_id").notNull(), senderRole: text("sender_role").notNull(), kind: text("kind").notNull().default("message"),
  subject: text("subject").notNull().default(""), body: text("body").notNull(), status: text("status").notNull().default("open"),
  dueAt: integer("due_at"), resolvedAt: integer("resolved_at"), readByApplicantAt: integer("read_by_applicant_at"), readByAdminAt: integer("read_by_admin_at"),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
}, (table) => [index("idx_service_messages_application_created").on(table.applicationId, table.createdAt), index("idx_service_messages_user_status").on(table.userId, table.status)]);

export const assessmentReports = sqliteTable("assessment_reports", {
  id: text("id").primaryKey(), applicationId: text("application_id").notNull(), userId: text("user_id").notNull(),
  version: integer("version").notNull().default(1), r2Key: text("r2_key").notNull(), fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(), size: integer("size").notNull(), status: text("status").notNull().default("draft"),
  summary: text("summary").notNull().default(""), createdBy: text("created_by").notNull(), createdAt: integer("created_at").notNull(), publishedAt: integer("published_at"),
}, (table) => [uniqueIndex("idx_assessment_reports_r2_key").on(table.r2Key), index("idx_assessment_reports_application_status").on(table.applicationId, table.status)]);

export const emailDeliveries = sqliteTable("email_deliveries", {
  id: text("id").primaryKey(), userId: text("user_id"), applicationId: text("application_id"), category: text("category").notNull(),
  recipient: text("recipient").notNull(), subject: text("subject").notNull(), status: text("status").notNull().default("queued"),
  attempts: integer("attempts").notNull().default(0), lastError: text("last_error"), createdAt: integer("created_at").notNull(), sentAt: integer("sent_at"),
}, (table) => [index("idx_email_deliveries_status_created").on(table.status, table.createdAt), index("idx_email_deliveries_application").on(table.applicationId, table.createdAt)]);
