import {
  users,
  medicalDocuments,
  medicalQuestionnaire,
  questionnaireResults,
  securityAuditLog,
  labAnalytes,
  analyteComments,
  waitlist,
  type User,
  type UpsertUser,
  type MedicalDocument,
  type InsertMedicalDocument,
  type MedicalQuestionnaire,
  type InsertQuestionnaire,
  type UpdateQuestionnaire,
  type QuestionnaireResult,
  type InsertQuestionnaireResult,
  type LabAnalyte,
  type InsertLabAnalyte,
  type AnalyteComment,
  type Waitlist,
  type InsertWaitlist,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, desc } from "drizzle-orm";
// LS-108: Import encryption for sensitive data
import { encryptSensitiveFields, decryptSensitiveFields } from "./encryption";

// Interface for storage operations
export interface IStorage {
  // User operations
  // LS-98: Enhanced user operations for local authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(userData: Omit<UpsertUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  upsertUser(userData: UpsertUser): Promise<User>;
  updateUserLastLogin(userId: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  updateUserProfile(userId: string, profileData: { 
    firstName?: string; 
    lastName?: string; 
    email?: string; 
    gender?: string; 
    isEmailVerified?: string; 
    emailVerificationToken?: string | null; 
    emailVerificationExpires?: Date | null; 
    profileImageUrl?: string;
  }): Promise<User>;
  setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void>;
  clearPasswordResetToken(userId: string): Promise<void>;
  
  // LS-96: Medical documents operations for user profile system
  getUserMedicalDocuments(userId: string): Promise<MedicalDocument[]>;
  // LS-102: Enhanced method with pagination and search for medical documents listing
  getUserMedicalDocumentsPaginated(userId: string, options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    documents: Omit<MedicalDocument, 'fileData'>[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
  }>;
  getMedicalDocumentByOwner(documentId: string, userId: string): Promise<MedicalDocument | undefined>;
  createMedicalDocument(document: InsertMedicalDocument): Promise<MedicalDocument>;
  deleteMedicalDocument(id: string): Promise<void>;
  deleteMedicalDocumentByOwner(userId: string, documentId: string): Promise<number>;


  // Admin operations
  getAllUsers(): Promise<Array<User & { documentsCount: number; deletedDocumentsCount: number }>>;
  getAllMedicalDocuments(): Promise<Array<Omit<MedicalDocument, 'fileData'> & { userEmail: string | null; userName: string }>>;
  getMedicalDocumentById(documentId: string): Promise<MedicalDocument | undefined>;
  getMedicalDocumentsByType(userId: string, fileType: string): Promise<MedicalDocument[]>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalDocuments: number;
    documentsToday: number;
    usersToday: number;
    storageUsed: string;
  }>;

  // LS-108: Security audit log operations
  createAuditLog(entry: {
    userId?: string | null;
    userEmail: string;
    action: string;
    resource?: string | null;
    details?: any;
    outcome: string;
    riskLevel: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    sessionId?: string | null;
    timestamp: Date;
  }): Promise<void>;
  
  getAuditLogs(options?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    riskLevel?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    logs: Array<{
      id: string;
      userId: string | null;
      userEmail: string;
      action: string;
      resource: string | null;
      details: any;
      outcome: string;
      riskLevel: string;
      ipAddress: string | null;
      userAgent: string | null;
      sessionId: string | null;
      timestamp: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
  }>;

  // Medical Questionnaire operations
  getUserQuestionnaire(userId: string): Promise<MedicalQuestionnaire | undefined>;
  createQuestionnaire(data: InsertQuestionnaire): Promise<MedicalQuestionnaire>;
  updateQuestionnaire(userId: string, data: UpdateQuestionnaire): Promise<MedicalQuestionnaire>;
  markQuestionnaireComplete(userId: string): Promise<void>;
  deleteQuestionnaire(userId: string): Promise<void>;

  // Questionnaire Results operations
  saveQuestionnaireResult(data: InsertQuestionnaireResult): Promise<QuestionnaireResult>;
  getUserQuestionnaireResults(userId: string): Promise<QuestionnaireResult[]>;
  getAllQuestionnaireResults(): Promise<Array<QuestionnaireResult & { userEmail: string; userName: string }>>;
  updateLatestQuestionnaireResult(userId: string, data: { personalizedSummary?: string }): Promise<void>;

  // Lab Analytes operations (OCR results)
  saveLabAnalytesBatch(userId: string, analytes: Array<{
    analyteName: string;
    valueNumeric: string;
    unit: string;
    referenceMin?: string | null;
    referenceMax?: string | null;
    referenceText?: string | null;
    collectedAt?: Date | null;
    sourceDocumentId?: string | null;
  }>): Promise<LabAnalyte[]>;
  getUserLabAnalytes(userId: string): Promise<LabAnalyte[]>;
  getAnalyteHistory(userId: string, analyteName: string): Promise<LabAnalyte[]>;
  getLatestAnalytesForUser(userId: string): Promise<LabAnalyte[]>;
  
  // Analyte Comments operations
  getAnalyteComments(userId: string, analyteName: string): Promise<AnalyteComment[]>;
  createAnalyteComment(userId: string, analyteName: string, comment: string): Promise<AnalyteComment>;
  deleteAnalyteComment(userId: string, commentId: string): Promise<void>;

  // Waitlist operations
  createWaitlistEntry(data: InsertWaitlist): Promise<Waitlist>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.email, // Handle email conflicts
          set: {
            // DON'T update id - it breaks foreign key constraints!
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error: any) {
      console.error('Error in upsertUser:', error);
      
      // If it's still a constraint error, try to update by email without changing ID
      if (error.code === '23505' || error.code === '23503') {
        console.log('Attempting to update existing user by email (without ID change):', userData.email);
        const [existingUser] = await db
          .update(users)
          .set({
            // DON'T update id - preserve existing ID to maintain foreign key integrity
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email!))
          .returning();
        
        if (existingUser) {
          return existingUser;
        }
      }
      
      throw error;
    }
  }

  // LS-98: Enhanced user operations for local authentication
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // LS-101: Update user profile information
  async updateUserProfile(userId: string, profileData: { 
    firstName?: string; 
    lastName?: string; 
    email?: string; 
    gender?: string;
    isEmailVerified?: string;
    emailVerificationToken?: string | null;
    emailVerificationExpires?: Date | null;
    profileImageUrl?: string;
  }): Promise<User> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (profileData.firstName !== undefined) updateData.firstName = profileData.firstName;
    if (profileData.lastName !== undefined) updateData.lastName = profileData.lastName;
    if (profileData.email !== undefined) updateData.email = profileData.email;
    if (profileData.gender !== undefined) updateData.gender = profileData.gender;
    if (profileData.isEmailVerified !== undefined) updateData.isEmailVerified = profileData.isEmailVerified;
    if (profileData.emailVerificationToken !== undefined) updateData.emailVerificationToken = profileData.emailVerificationToken;
    if (profileData.emailVerificationExpires !== undefined) updateData.emailVerificationExpires = profileData.emailVerificationExpires;
    if (profileData.profileImageUrl !== undefined) updateData.profileImageUrl = profileData.profileImageUrl;

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // LS-99: Email verification functionality
  async setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return result[0] || null;
  }

  async verifyEmail(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        isEmailVerified: "true",
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // LS-96: Medical documents operations for user profile system
  async getUserMedicalDocuments(userId: string): Promise<MedicalDocument[]> {
    return await db.select().from(medicalDocuments).where(eq(medicalDocuments.userId, userId));
  }

  // LS-102: Enhanced method with pagination and search for medical documents listing
  async getUserMedicalDocumentsPaginated(userId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{
    documents: Omit<MedicalDocument, 'fileData'>[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
  }> {
    const { ilike, and, count, desc, isNull } = await import("drizzle-orm");
    
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20)); // Max 50, default 20
    const offset = (page - 1) * limit;
    
    // Build where conditions - only show non-deleted documents
    let whereConditions = and(
      eq(medicalDocuments.userId, userId),
      isNull(medicalDocuments.deletedAt)
    );
    
    if (options.search) {
      const searchPattern = `%${options.search}%`;
      whereConditions = and(
        whereConditions,
        ilike(medicalDocuments.originalName, searchPattern)
      );
    }
    
    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(medicalDocuments)
      .where(whereConditions);
    
    const total = totalResult.count;
    
    // Get paginated documents (excluding fileData for performance)
    const documents = await db
      .select({
        id: medicalDocuments.id,
        userId: medicalDocuments.userId,
        filename: medicalDocuments.filename,
        originalName: medicalDocuments.originalName,
        fileType: medicalDocuments.fileType,
        category: medicalDocuments.category,
        subcategory: medicalDocuments.subcategory,
        description: medicalDocuments.description,
        mimeType: medicalDocuments.mimeType,
        fileSize: medicalDocuments.fileSize,
        uploadedAt: medicalDocuments.uploadedAt,
        deletedAt: medicalDocuments.deletedAt,
      })
      .from(medicalDocuments)
      .where(whereConditions)
      .orderBy(desc(medicalDocuments.uploadedAt))
      .limit(limit)
      .offset(offset);
    
    const hasNext = offset + limit < total;
    
    return {
      documents,
      total,
      page,
      limit,
      hasNext
    };
  }

  async getMedicalDocumentByOwner(documentId: string, userId: string): Promise<MedicalDocument | undefined> {
    const { and } = await import("drizzle-orm");
    
    const [document] = await db
      .select()
      .from(medicalDocuments)
      .where(
        and(
          eq(medicalDocuments.id, documentId),
          eq(medicalDocuments.userId, userId)
        )
      );
    
    return document;
  }

  // Admin method: Get any medical document by ID (no user filtering)
  async getMedicalDocumentById(documentId: string): Promise<MedicalDocument | undefined> {
    const [document] = await db
      .select()
      .from(medicalDocuments)
      .where(eq(medicalDocuments.id, documentId));
    
    return document;
  }

  // Get all medical documents of a specific type for a user
  async getMedicalDocumentsByType(userId: string, fileType: string): Promise<MedicalDocument[]> {
    const { and, isNull } = await import("drizzle-orm");
    
    const documents = await db
      .select()
      .from(medicalDocuments)
      .where(
        and(
          eq(medicalDocuments.userId, userId),
          eq(medicalDocuments.fileType, fileType),
          isNull(medicalDocuments.deletedAt)
        )
      );
    
    return documents;
  }

  async createMedicalDocument(document: InsertMedicalDocument): Promise<MedicalDocument> {
    const [createdDocument] = await db
      .insert(medicalDocuments)
      .values(document)
      .returning();
    return createdDocument;
  }

  async deleteMedicalDocument(id: string): Promise<void> {
    await db.delete(medicalDocuments).where(eq(medicalDocuments.id, id));
  }

  // Security: Soft delete document only if owned by user (LS-103)
  async deleteMedicalDocumentByOwner(userId: string, documentId: string): Promise<number> {
    const { and, isNull } = await import("drizzle-orm");
    
    const result = await db
      .update(medicalDocuments)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(medicalDocuments.id, documentId),
          eq(medicalDocuments.userId, userId),
          isNull(medicalDocuments.deletedAt) // Only delete active documents
        )
      )
      .returning({ id: medicalDocuments.id });
    
    return result.length;
  }

  // Admin operations - LS-103: Include deleted documents count
  async getAllUsers(): Promise<Array<User & { documentsCount: number; deletedDocumentsCount: number }>> {
    const { count, sql, isNull, isNotNull } = await import("drizzle-orm");
    
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        gender: users.gender,
        dateOfBirth: users.dateOfBirth,
        phoneNumber: users.phoneNumber,
        password: users.password,
        profileImageUrl: users.profileImageUrl,
        isEmailVerified: users.isEmailVerified,
        isAdmin: users.isAdmin,
        passwordResetToken: users.passwordResetToken,
        passwordResetExpires: users.passwordResetExpires,
        emailVerificationToken: users.emailVerificationToken,
        emailVerificationExpires: users.emailVerificationExpires,
        lastLoginAt: users.lastLoginAt,
        questionnaireCompleted: users.questionnaireCompleted,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        documentsCount: sql<number>`COUNT(CASE WHEN ${medicalDocuments.deletedAt} IS NULL THEN 1 END)`,
        deletedDocumentsCount: sql<number>`COUNT(CASE WHEN ${medicalDocuments.deletedAt} IS NOT NULL THEN 1 END)`
      })
      .from(users)
      .leftJoin(medicalDocuments, eq(users.id, medicalDocuments.userId))
      .groupBy(users.id)
      .orderBy(sql`${users.createdAt} DESC`);
    
    return result;
  }

  async makeUserAdmin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isAdmin: "true",
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async removeUserAdmin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isAdmin: "false",
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getAllMedicalDocuments(): Promise<Array<Omit<MedicalDocument, 'fileData'> & { userEmail: string | null; userName: string }>> {
    const { sql, isNull } = await import("drizzle-orm");
    
    const result = await db
      .select({
        id: medicalDocuments.id,
        userId: medicalDocuments.userId,
        filename: medicalDocuments.filename,
        originalName: medicalDocuments.originalName,
        fileType: medicalDocuments.fileType,
        category: medicalDocuments.category,
        subcategory: medicalDocuments.subcategory,
        description: medicalDocuments.description,
        mimeType: medicalDocuments.mimeType,
        fileSize: medicalDocuments.fileSize,
        // fileData: REMOVED for security - don't expose file content in lists
        uploadedAt: medicalDocuments.uploadedAt,
        deletedAt: medicalDocuments.deletedAt,
        userEmail: users.email,
        userName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`
      })
      .from(medicalDocuments)
      .innerJoin(users, eq(medicalDocuments.userId, users.id))
      .where(isNull(medicalDocuments.deletedAt)) // Only show active documents
      .orderBy(sql`${medicalDocuments.uploadedAt} DESC`);
    
    return result;
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalDocuments: number;
    documentsToday: number;
    usersToday: number;
    storageUsed: string;
  }> {
    const { count, sql, gte } = await import("drizzle-orm");
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [userStats] = await db
      .select({
        totalUsers: count(users.id),
        usersToday: sql<number>`COUNT(CASE WHEN ${users.createdAt} >= ${today.toISOString()} THEN 1 END)`
      })
      .from(users);
    
    const [documentStats] = await db
      .select({
        totalDocuments: count(medicalDocuments.id),
        documentsToday: sql<number>`COUNT(CASE WHEN ${medicalDocuments.uploadedAt} >= ${today.toISOString()} THEN 1 END)`,
        totalSizeBytes: sql<number>`SUM(CAST(${medicalDocuments.fileSize} AS BIGINT))`
      })
      .from(medicalDocuments);
    
    // Convert bytes to human readable format
    const totalBytes = Number(documentStats.totalSizeBytes) || 0;
    let storageUsed = "0 bytes";
    if (totalBytes > 0) {
      const units = ['bytes', 'KB', 'MB', 'GB'];
      let size = totalBytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      storageUsed = `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    
    return {
      totalUsers: userStats.totalUsers,
      totalDocuments: documentStats.totalDocuments,
      documentsToday: Number(documentStats.documentsToday),
      usersToday: Number(userStats.usersToday),
      storageUsed
    };
  }

  // LS-108: Security audit log implementation with encryption
  async createAuditLog(entry: {
    userId?: string | null;
    userEmail: string;
    action: string;
    resource?: string | null;
    details?: any;
    outcome: string;
    riskLevel: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    sessionId?: string | null;
    timestamp: Date;
  }): Promise<void> {
    try {
      // Encrypt sensitive fields
      const encryptedEntry = encryptSensitiveFields(entry, ['userEmail', 'ipAddress', 'userAgent']);
      
      await db.insert(securityAuditLog).values({
        userId: encryptedEntry.userId,
        userEmail: encryptedEntry.userEmail,
        action: encryptedEntry.action,
        resource: encryptedEntry.resource,
        details: encryptedEntry.details,
        outcome: encryptedEntry.outcome,
        riskLevel: encryptedEntry.riskLevel,
        ipAddress: encryptedEntry.ipAddress,
        userAgent: encryptedEntry.userAgent,
        sessionId: encryptedEntry.sessionId,
        timestamp: encryptedEntry.timestamp,
      });
    } catch (error) {
      console.error('Failed to create audit log entry:', error);
      throw error;
    }
  }

  async getAuditLogs(options: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    riskLevel?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    logs: Array<{
      id: string;
      userId: string | null;
      userEmail: string;
      action: string;
      resource: string | null;
      details: any;
      outcome: string;
      riskLevel: string;
      ipAddress: string | null;
      userAgent: string | null;
      sessionId: string | null;
      timestamp: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
  }> {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    if (options.userId) {
      conditions.push(eq(securityAuditLog.userId, options.userId));
    }
    if (options.action) {
      conditions.push(eq(securityAuditLog.action, options.action));
    }
    if (options.riskLevel) {
      conditions.push(eq(securityAuditLog.riskLevel, options.riskLevel));
    }
    // Note: Date filtering would need additional imports for gte/lte, simplified for now

    try {
      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(securityAuditLog);
      const total = totalResult[0]?.count || 0;

      // Get paginated logs
      const logs = await db
        .select()
        .from(securityAuditLog)
        .limit(limit)
        .offset(offset)
        .orderBy(sql`${securityAuditLog.timestamp} DESC`);

      return {
        logs: logs.map(log => {
          // Decrypt sensitive fields for admin viewing
          const decryptedLog = decryptSensitiveFields(log, ['userEmail', 'ipAddress', 'userAgent']);
          return {
            id: decryptedLog.id!,
            userId: decryptedLog.userId,
            userEmail: decryptedLog.userEmail,
            action: decryptedLog.action,
            resource: decryptedLog.resource,
            details: decryptedLog.details,
            outcome: decryptedLog.outcome,
            riskLevel: decryptedLog.riskLevel,
            ipAddress: decryptedLog.ipAddress,
            userAgent: decryptedLog.userAgent,
            sessionId: decryptedLog.sessionId,
            timestamp: decryptedLog.timestamp!,
          };
        }),
        total,
        page,
        limit,
        hasNext: offset + limit < total,
      };
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  async getUserQuestionnaire(userId: string): Promise<MedicalQuestionnaire | undefined> {
    const [questionnaire] = await db
      .select()
      .from(medicalQuestionnaire)
      .where(eq(medicalQuestionnaire.userId, userId));
    return questionnaire;
  }

  async createQuestionnaire(data: InsertQuestionnaire): Promise<MedicalQuestionnaire> {
    const [questionnaire] = await db
      .insert(medicalQuestionnaire)
      .values({
        ...data,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return questionnaire;
  }

  async updateQuestionnaire(userId: string, data: UpdateQuestionnaire): Promise<MedicalQuestionnaire> {
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };
    
    if (data.answers !== undefined) updateData.answers = data.answers;
    if (data.currentQuestion !== undefined) updateData.currentQuestion = data.currentQuestion;
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;
    if (data.longevityPoints !== undefined) updateData.longevityPoints = data.longevityPoints;
    if (data.healthStatus !== undefined) updateData.healthStatus = data.healthStatus;
    if (data.sectionScores !== undefined) updateData.sectionScores = data.sectionScores;
    if (data.sectionInterpretations !== undefined) updateData.sectionInterpretations = data.sectionInterpretations;
    
    const [questionnaire] = await db
      .update(medicalQuestionnaire)
      .set(updateData)
      .where(eq(medicalQuestionnaire.userId, userId))
      .returning();
    return questionnaire;
  }

  async markQuestionnaireComplete(userId: string): Promise<void> {
    await db
      .update(medicalQuestionnaire)
      .set({
        isCompleted: "true",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(medicalQuestionnaire.userId, userId));

    await db
      .update(users)
      .set({
        questionnaireCompleted: "true",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async deleteQuestionnaire(userId: string): Promise<void> {
    await db
      .delete(medicalQuestionnaire)
      .where(eq(medicalQuestionnaire.userId, userId));
  }

  async saveQuestionnaireResult(data: InsertQuestionnaireResult): Promise<QuestionnaireResult> {
    const [result] = await db
      .insert(questionnaireResults)
      .values({
        ...data,
        completedAt: new Date(),
      })
      .returning();
    return result;
  }

  async getUserQuestionnaireResults(userId: string): Promise<QuestionnaireResult[]> {
    const results = await db
      .select()
      .from(questionnaireResults)
      .where(eq(questionnaireResults.userId, userId))
      .orderBy(sql`${questionnaireResults.completedAt} DESC`);
    return results;
  }

  async getAllQuestionnaireResults(): Promise<Array<QuestionnaireResult & { userEmail: string; userName: string }>> {
    const results = await db
      .select({
        id: questionnaireResults.id,
        userId: questionnaireResults.userId,
        answers: questionnaireResults.answers,
        longevityPoints: questionnaireResults.longevityPoints,
        healthStatus: questionnaireResults.healthStatus,
        sectionScores: questionnaireResults.sectionScores,
        sectionInterpretations: questionnaireResults.sectionInterpretations,
        completedAt: questionnaireResults.completedAt,
        userEmail: users.email,
        userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(questionnaireResults)
      .leftJoin(users, eq(questionnaireResults.userId, users.id))
      .orderBy(sql`${questionnaireResults.completedAt} DESC`);
    
    return results.map(r => ({
      ...r,
      userEmail: r.userEmail || '',
      userName: r.userName || 'Usuario desconocido',
    }));
  }

  async updateLatestQuestionnaireResult(userId: string, data: { personalizedSummary?: string }): Promise<void> {
    // Get the most recent questionnaire result for this user
    const latestResults = await db
      .select()
      .from(questionnaireResults)
      .where(eq(questionnaireResults.userId, userId))
      .orderBy(sql`${questionnaireResults.completedAt} DESC`)
      .limit(1);

    if (latestResults.length === 0) {
      throw new Error('No questionnaire results found for user');
    }

    const latestResult = latestResults[0];

    // Update the latest result with the personalized summary
    await db
      .update(questionnaireResults)
      .set({
        personalizedSummary: data.personalizedSummary,
      })
      .where(eq(questionnaireResults.id, latestResult.id));
  }

  // Lab Analytes operations (OCR results storage)
  async saveLabAnalytesBatch(userId: string, analytes: Array<{
    analyteName: string;
    valueNumeric: string;
    unit: string;
    referenceMin?: string | null;
    referenceMax?: string | null;
    referenceText?: string | null;
    collectedAt?: Date | null;
    sourceDocumentId?: string | null;
  }>): Promise<LabAnalyte[]> {
    if (analytes.length === 0) {
      return [];
    }

    const insertData = analytes.map(a => ({
      userId,
      analyteName: a.analyteName,
      valueNumeric: a.valueNumeric,
      unit: a.unit,
      referenceMin: a.referenceMin || null,
      referenceMax: a.referenceMax || null,
      referenceText: a.referenceText || null,
      collectedAt: a.collectedAt || null,
      sourceDocumentId: a.sourceDocumentId || null,
    }));

    const results = await db
      .insert(labAnalytes)
      .values(insertData)
      .returning();

    return results;
  }

  async getUserLabAnalytes(userId: string): Promise<LabAnalyte[]> {
    const results = await db
      .select()
      .from(labAnalytes)
      .where(eq(labAnalytes.userId, userId))
      .orderBy(sql`${labAnalytes.collectedAt} DESC NULLS LAST, ${labAnalytes.createdAt} DESC`);
    return results;
  }

  async getAnalyteHistory(userId: string, analyteName: string): Promise<LabAnalyte[]> {
    const results = await db
      .select()
      .from(labAnalytes)
      .where(sql`${labAnalytes.userId} = ${userId} AND LOWER(${labAnalytes.analyteName}) = LOWER(${analyteName})`)
      .orderBy(sql`${labAnalytes.collectedAt} DESC NULLS LAST, ${labAnalytes.createdAt} DESC`);
    return results;
  }

  async getLatestAnalytesForUser(userId: string): Promise<LabAnalyte[]> {
    // Get the most recent value for each unique analyte name using raw SQL with proper column aliases
    const results = await db.execute(sql`
      SELECT DISTINCT ON (LOWER(analyte_name)) 
        id,
        user_id AS "userId",
        analyte_name AS "analyteName",
        value_numeric AS "valueNumeric",
        unit,
        reference_min AS "referenceMin",
        reference_max AS "referenceMax",
        reference_text AS "referenceText",
        collected_at AS "collectedAt",
        source_document_id AS "sourceDocumentId",
        notes,
        created_at AS "createdAt"
      FROM lab_analytes
      WHERE user_id = ${userId}
      ORDER BY LOWER(analyte_name), collected_at DESC NULLS LAST, created_at DESC
    `);
    return results.rows as LabAnalyte[];
  }

  // Analyte Comments operations
  async getAnalyteComments(userId: string, analyteName: string): Promise<AnalyteComment[]> {
    const results = await db
      .select()
      .from(analyteComments)
      .where(and(
        eq(analyteComments.userId, userId),
        sql`LOWER(${analyteComments.analyteName}) = LOWER(${analyteName})`
      ))
      .orderBy(desc(analyteComments.createdAt));
    return results;
  }

  async createAnalyteComment(userId: string, analyteName: string, comment: string): Promise<AnalyteComment> {
    const [result] = await db
      .insert(analyteComments)
      .values({
        userId,
        analyteName,
        comment,
      })
      .returning();
    return result;
  }

  async deleteAnalyteComment(userId: string, commentId: string): Promise<void> {
    await db
      .delete(analyteComments)
      .where(and(
        eq(analyteComments.id, commentId),
        eq(analyteComments.userId, userId)
      ));
  }

  // Waitlist operations
  async createWaitlistEntry(data: InsertWaitlist): Promise<Waitlist> {
    const [result] = await db
      .insert(waitlist)
      .values(data)
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
