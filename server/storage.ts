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
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // LS-96: Medical documents operations for user profile system
  getUserMedicalDocuments(userId: string): Promise<MedicalDocument[]>;
  createMedicalDocument(document: InsertMedicalDocument): Promise<MedicalDocument>;
  deleteMedicalDocument(id: string): Promise<void>;
  deleteMedicalDocumentByOwner(userId: string, documentId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // LS-96: Medical documents operations for user profile system
  async getUserMedicalDocuments(userId: string): Promise<MedicalDocument[]> {
    return await db.select().from(medicalDocuments).where(eq(medicalDocuments.userId, userId));
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
}

export const storage = new DatabaseStorage();
