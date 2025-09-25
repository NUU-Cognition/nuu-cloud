import {
  users,
  documents,
  mediaAssets,
  folders,
  activities,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type MediaAsset,
  type InsertMediaAsset,
  type Folder,
  type InsertFolder,
  type Activity,
  type InsertActivity,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, ne } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Document operations
  getDocuments(userId: string): Promise<Document[]>;
  getDocumentsByFolder(userId: string, folderId: string | null): Promise<Document[]>;
  getDocument(id: string, userId: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, userId: string, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string, userId: string): Promise<boolean>;
  
  // Media asset operations
  getMediaAssets(userId: string): Promise<MediaAsset[]>;
  getMediaAsset(id: string, userId: string): Promise<MediaAsset | undefined>;
  createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset>;
  deleteMediaAsset(id: string, userId: string): Promise<boolean>;

  // Folder operations
  getFoldersByType(userId: string, type: string): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  deleteFolder(id: string, userId: string): Promise<boolean>;
  checkNameUniqueness(userId: string, name: string, type: 'document' | 'folder' | 'media', folderId?: string | null, excludeId?: string): Promise<boolean>;

  // Activity operations
  getActivities(userId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class DatabaseStorage implements IStorage {
  // User operations
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

  // Document operations
  async getDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.updatedAt));
  }

  async getDocumentsByFolder(userId: string, folderId: string | null): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.userId, userId),
        folderId ? eq(documents.folderId, folderId) : isNull(documents.folderId)
      ))
      .orderBy(desc(documents.updatedAt));
  }

  async getDocument(id: string, userId: string): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [created] = await db
      .insert(documents)
      .values(document)
      .returning();
    return created;
  }

  async updateDocument(id: string, userId: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .returning();
    return updated;
  }

  async deleteDocument(id: string, userId: string): Promise<boolean> {
    // First get the document to check if it has a file to delete
    const document = await this.getDocument(id, userId);
    
    if (!document) {
      return false;
    }

    // Delete the file from filesystem if it's a PDF with a storage URL
    if (document.contentType === 'pdf' && document.storageUrl) {
      try {
        const path = await import('path');
        const fs = await import('fs/promises');
        await fs.unlink(path.join(process.cwd(), document.storageUrl));
      } catch (error) {
        console.warn("Failed to delete PDF file from filesystem:", error);
        // Continue with database deletion even if file deletion fails
      }
    }

    const result = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Media asset operations
  async getMediaAssets(userId: string): Promise<MediaAsset[]> {
    return await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.userId, userId))
      .orderBy(desc(mediaAssets.createdAt));
  }

  async getMediaAsset(id: string, userId: string): Promise<MediaAsset | undefined> {
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, id), eq(mediaAssets.userId, userId)));
    return asset;
  }

  async createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset> {
    const [created] = await db
      .insert(mediaAssets)
      .values(asset)
      .returning();
    return created;
  }

  async deleteMediaAsset(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(mediaAssets)
      .where(and(eq(mediaAssets.id, id), eq(mediaAssets.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Folder operations
  async getFoldersByType(userId: string, type: string): Promise<Folder[]> {
    return await db
      .select()
      .from(folders)
      .where(and(eq(folders.userId, userId), eq(folders.type, type)))
      .orderBy(desc(folders.createdAt));
  }

  async createFolder(folder: InsertFolder): Promise<Folder> {
    const [created] = await db
      .insert(folders)
      .values(folder)
      .returning();
    return created;
  }

  async deleteFolder(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async checkNameUniqueness(userId: string, name: string, type: 'document' | 'folder' | 'media', folderId?: string | null, excludeId?: string): Promise<boolean> {
    const nameLower = name.toLowerCase();
    
    // Check folders in the same parent
    const folderCheck = await db
      .select({ id: folders.id })
      .from(folders)
      .where(and(
        eq(folders.userId, userId),
        eq(folders.type, type === 'media' ? 'media' : 'documents'),
        folderId ? eq(folders.parentId, folderId) : isNull(folders.parentId),
        excludeId ? ne(folders.id, excludeId) : undefined
      ))
      .then(results => results.some(f => f.id !== excludeId));
    
    if (type === 'document') {
      // Check documents in the same folder
      const docCheck = await db
        .select({ id: documents.id, title: documents.title })
        .from(documents)
        .where(and(
          eq(documents.userId, userId),
          folderId ? eq(documents.folderId, folderId) : isNull(documents.folderId),
          excludeId ? ne(documents.id, excludeId) : undefined
        ))
        .then(results => results.some(d => d.title.toLowerCase() === nameLower && d.id !== excludeId));
      
      if (docCheck) return false;
    }
    
    if (type === 'media') {
      // Check media in the same folder  
      const mediaCheck = await db
        .select({ id: mediaAssets.id, originalName: mediaAssets.originalName })
        .from(mediaAssets)
        .where(and(
          eq(mediaAssets.userId, userId),
          excludeId ? ne(mediaAssets.id, excludeId) : undefined
        ))
        .then(results => results.some(m => m.originalName.toLowerCase() === nameLower && m.id !== excludeId));
      
      if (mediaCheck) return false;
    }
    
    // Check folder names in the same scope
    const folderNameCheck = await db
      .select({ id: folders.id, name: folders.name })
      .from(folders)
      .where(and(
        eq(folders.userId, userId),
        eq(folders.type, type === 'media' ? 'media' : 'documents'),
        folderId ? eq(folders.parentId, folderId) : isNull(folders.parentId),
        excludeId ? ne(folders.id, excludeId) : undefined
      ))
      .then(results => results.some(f => f.name.toLowerCase() === nameLower && f.id !== excludeId));
    
    return !folderNameCheck;
  }

  // Activity operations
  async getActivities(userId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(50);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
