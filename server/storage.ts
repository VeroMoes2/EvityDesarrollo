import {
  users,
  medicalDocuments,
  type User,
  type UpsertUser,
  type MedicalDocument,
  type InsertMedicalDocument,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
  setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void>;
  clearPasswordResetToken(userId: string): Promise<void>;
  
  // LS-96: Medical documents operations for user profile system
  getUserMedicalDocuments(userId: string): Promise<MedicalDocument[]>;
  getMedicalDocumentByOwner(documentId: string, userId: string): Promise<MedicalDocument | undefined>;
  createMedicalDocument(document: InsertMedicalDocument): Promise<MedicalDocument>;
  deleteMedicalDocument(id: string): Promise<void>;
  deleteMedicalDocumentByOwner(userId: string, documentId: string): Promise<number>;

  // Admin operations
  getAllUsers(): Promise<Array<User & { documentsCount: number }>>;
  getAllMedicalDocuments(): Promise<Array<Omit<MedicalDocument, 'fileData'> & { userEmail: string | null; userName: string }>>;
  getMedicalDocumentById(documentId: string): Promise<MedicalDocument | undefined>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalDocuments: number;
    documentsToday: number;
    usersToday: number;
    storageUsed: string;
  }>;
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

  // Security: Delete document only if owned by user
  async deleteMedicalDocumentByOwner(userId: string, documentId: string): Promise<number> {
    const { and } = await import("drizzle-orm");
    
    const result = await db
      .delete(medicalDocuments)
      .where(
        and(
          eq(medicalDocuments.id, documentId),
          eq(medicalDocuments.userId, userId)
        )
      )
      .returning({ id: medicalDocuments.id });
    
    return result.length;
  }

  // Admin operations
  async getAllUsers(): Promise<Array<User & { documentsCount: number }>> {
    const { count, sql } = await import("drizzle-orm");
    
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        gender: users.gender,
        password: users.password,
        profileImageUrl: users.profileImageUrl,
        isEmailVerified: users.isEmailVerified,
        isAdmin: users.isAdmin,
        passwordResetToken: users.passwordResetToken,
        passwordResetExpires: users.passwordResetExpires,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        documentsCount: count(medicalDocuments.id)
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
    const { sql } = await import("drizzle-orm");
    
    const result = await db
      .select({
        id: medicalDocuments.id,
        userId: medicalDocuments.userId,
        filename: medicalDocuments.filename,
        originalName: medicalDocuments.originalName,
        fileType: medicalDocuments.fileType,
        mimeType: medicalDocuments.mimeType,
        fileSize: medicalDocuments.fileSize,
        // fileData: REMOVED for security - don't expose file content in lists
        uploadedAt: medicalDocuments.uploadedAt,
        userEmail: users.email,
        userName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`
      })
      .from(medicalDocuments)
      .innerJoin(users, eq(medicalDocuments.userId, users.id))
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
}

export const storage = new DatabaseStorage();
