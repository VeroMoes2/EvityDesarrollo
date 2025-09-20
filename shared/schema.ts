import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// LS-98: Enhanced user authentication with complete profile information
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  gender: varchar("gender"), // 'M', 'F', 'Other', 'Prefer not to say'
  password: varchar("password").notNull(), // Hashed password
  profileImageUrl: varchar("profile_image_url"),
  isEmailVerified: varchar("is_email_verified").default("false"), // 'true' or 'false'
  isAdmin: varchar("is_admin").default("false"), // 'true' or 'false' - admin privileges
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LS-96: Medical documents storage for user profile system
export const medicalDocuments = pgTable("medical_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  fileType: varchar("file_type").notNull(), // 'study' or 'lab'
  mimeType: varchar("mime_type").notNull(),
  fileSize: varchar("file_size").notNull(),
  fileData: text("file_data"), // Store file content as base64 or use external storage
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Create schemas for the tables
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "Nombre es requerido"),
  lastName: z.string().min(1, "Apellido es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  gender: z.enum(["M", "F", "Other", "Prefer not to say"]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordResetToken: true,
  passwordResetExpires: true,
  emailVerificationToken: true,
  emailVerificationExpires: true,
  lastLoginAt: true,
});

export const loginUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña es requerida"),
});

export const insertMedicalDocumentSchema = createInsertSchema(medicalDocuments).omit({
  id: true,
  uploadedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type InsertMedicalDocument = z.infer<typeof insertMedicalDocumentSchema>;
export type MedicalDocument = typeof medicalDocuments.$inferSelect;
