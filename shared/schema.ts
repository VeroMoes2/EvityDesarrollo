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
// LS-110: Added phoneNumber field for user contact information
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  gender: varchar("gender"), // 'M', 'F', 'Other', 'Prefer not to say'
  phoneNumber: varchar("phone_number"), // LS-110: User's phone number
  password: varchar("password").notNull(), // Hashed password
  profileImageUrl: varchar("profile_image_url"),
  isEmailVerified: varchar("is_email_verified").default("false"), // 'true' or 'false'
  isAdmin: varchar("is_admin").default("false"), // 'true' or 'false' - admin privileges
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  lastLoginAt: timestamp("last_login_at"),
  questionnaireCompleted: varchar("questionnaire_completed").default("false"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LS-96: Medical documents storage for user profile system
// LS-128: Enhanced with unified document categories for better organization
export const medicalDocuments = pgTable("medical_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  fileType: varchar("file_type").notNull(), // 'study', 'lab', 'prescription', 'imaging', 'report', 'insurance', 'other'
  category: varchar("category").notNull().default("Documentos Médicos"), // LS-128: User-friendly category display name with default
  subcategory: varchar("subcategory"), // LS-128: Optional subcategory for better organization
  description: varchar("description"), // LS-128: Optional user description
  mimeType: varchar("mime_type").notNull(),
  fileSize: varchar("file_size").notNull(),
  fileData: text("file_data"), // Store file content as base64 or use external storage
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  deletedAt: timestamp("deleted_at"), // LS-103: Soft delete timestamp for tracking eliminated files
});

// Medical questionnaire table for storing patient medical history
export const medicalQuestionnaire = pgTable("medical_questionnaire", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull().default(sql`'{}'::jsonb`),
  currentQuestion: varchar("current_question").default("1"),
  isCompleted: varchar("is_completed").default("false"),
  longevityPoints: varchar("longevity_points"), // Calculated longevity score
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LS-108: Security audit log table for tracking administrative actions
export const securityAuditLog = pgTable("security_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  userEmail: varchar("user_email").notNull(), // Store email for better tracking
  action: varchar("action").notNull(), // e.g., "LOGIN", "PROFILE_UPDATE", "DOCUMENT_DELETE", "ADMIN_ACCESS"
  resource: varchar("resource"), // What was affected (user ID, document ID, etc.)
  details: jsonb("details"), // Additional context (IP, user agent, changes made, etc.)
  outcome: varchar("outcome").notNull(), // "SUCCESS", "FAILURE", "ERROR"
  riskLevel: varchar("risk_level").notNull().default("LOW"), // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  sessionId: varchar("session_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});


// LS-101: Unified gender enum for consistency across the system
export const genderEnum = z.enum(["masculino", "femenino", "otro", "prefiero_no_decir"], {
  errorMap: () => ({ message: "Selecciona una opción válida" })
});

// LS-101: Gender mapping for legacy values 
export const genderLegacyMap = {
  "M": "masculino",
  "F": "femenino", 
  "Other": "otro",
  "Prefer not to say": "prefiero_no_decir"
} as const;

// Helper function to normalize gender values
export function normalizeGender(gender: string | undefined | null): string | undefined {
  if (!gender) return undefined;
  
  // If it's already a modern value, return as-is
  if (["masculino", "femenino", "otro", "prefiero_no_decir"].includes(gender)) {
    return gender;
  }
  
  // Map legacy values to modern ones
  return genderLegacyMap[gender as keyof typeof genderLegacyMap] || gender;
}

// LS-110: Phone number validation for Mexican and US formats
export const phoneNumberSchema = z.string()
  .refine((value) => {
    if (!value || value.trim() === '') return true; // Optional field
    
    // Remove all spaces, dashes, parentheses, and dots for validation
    const cleanNumber = value.replace(/[\s\-\(\)\.\+]/g, '');
    
    // Mexican format: +52 followed by 10 digits or just 10 digits starting with non-zero
    const mexicanPattern = /^(52)?[1-9]\d{9}$/;
    
    // US format: +1 followed by 10 digits or just 10 digits
    const usPattern = /^(1)?[2-9]\d{9}$/;
    
    return mexicanPattern.test(cleanNumber) || usPattern.test(cleanNumber);
  }, {
    message: "Ingresa un número válido. Formatos: +52 5551234567 (México) o +1 5551234567 (EE.UU.)"
  })
  .optional();

// Create schemas for the tables
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "Nombre es requerido"),
  lastName: z.string().min(1, "Apellido es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  gender: genderEnum.optional(),
  phoneNumber: phoneNumberSchema, // LS-110: Phone number validation
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

// LS-101: Schema for updating user profile
export const updateUserProfileSchema = z.object({
  firstName: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "El nombre solo puede contener letras y espacios")
    .optional(),
  lastName: z.string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "El apellido solo puede contener letras y espacios")
    .optional(),
  email: z.string()
    .email("Ingresa un email válido")
    .min(1, "El email es requerido")
    .max(100, "El email no puede exceder 100 caracteres")
    .optional(),
  gender: genderEnum.optional(),
  phoneNumber: phoneNumberSchema, // LS-110: Phone number update validation
});

export const loginUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña es requerida"),
});

// LS-128: Document categories for unified document management
export const documentCategories = {
  study: { label: "Estudios Médicos", icon: "FileText", subcategories: ["Rayos X", "Resonancia", "Tomografía", "Ecografía", "Otro"] },
  lab: { label: "Análisis de Laboratorio", icon: "Activity", subcategories: ["Sangre", "Orina", "Heces", "Cultivos", "Otro"] },
  prescription: { label: "Recetas Médicas", icon: "Pill", subcategories: ["Medicamentos", "Tratamientos", "Otro"] },
  imaging: { label: "Imágenes Médicas", icon: "Camera", subcategories: ["Endoscopía", "Fotografías", "Otro"] },
  report: { label: "Reportes Médicos", icon: "FileText", subcategories: ["Consultas", "Diagnósticos", "Historia Clínica", "Otro"] },
  insurance: { label: "Seguros Médicos", icon: "Shield", subcategories: ["Pólizas", "Reembolsos", "Autorizaciones", "Otro"] },
  other: { label: "Otros Documentos", icon: "File", subcategories: ["Certificados", "Constancias", "Otro"] }
} as const;

export const documentCategoryKeys = Object.keys(documentCategories) as Array<keyof typeof documentCategories>;

export const insertMedicalDocumentSchema = createInsertSchema(medicalDocuments).omit({
  id: true,
  uploadedAt: true,
  deletedAt: true,
});


export const insertQuestionnaireSchema = createInsertSchema(medicalQuestionnaire).omit({
  id: true,
  startedAt: true,
  updatedAt: true,
  completedAt: true,
}).extend({
  answers: z.record(z.string(), z.any()).default({}),
  currentQuestion: z.string().default("1"),
  isCompleted: z.enum(["true", "false"]).default("false"),
});

export const updateQuestionnaireSchema = z.object({
  answers: z.record(z.string(), z.any()).optional(),
  currentQuestion: z.string().optional(),
  isCompleted: z.enum(["true", "false"]).optional(),
  longevityPoints: z.string().optional(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type InsertMedicalDocument = z.infer<typeof insertMedicalDocumentSchema>;
export type MedicalDocument = typeof medicalDocuments.$inferSelect;
export type MedicalQuestionnaire = typeof medicalQuestionnaire.$inferSelect;
export type InsertQuestionnaire = z.infer<typeof insertQuestionnaireSchema>;
export type UpdateQuestionnaire = z.infer<typeof updateQuestionnaireSchema>;
