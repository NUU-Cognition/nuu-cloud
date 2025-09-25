import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table for Markdown and PDF content
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  folderId: varchar("folder_id").references(() => folders.id, { onDelete: "set null" }),
  title: varchar("title").notNull(),
  contentType: varchar("content_type").notNull().default("markdown"), // 'markdown' or 'pdf'
  markdownContent: text("markdown_content"), // nullable for PDFs
  mimeType: varchar("mime_type"), // for PDFs
  storageUrl: varchar("storage_url"), // for PDFs
  fileSize: varchar("file_size"), // for PDFs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Media assets table for images and files
export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  fileSize: varchar("file_size").notNull(),
  storageUrl: varchar("storage_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  mediaAssets: many(mediaAssets),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  mediaAssets: many(mediaAssets),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  user: one(users, {
    fields: [mediaAssets.userId],
    references: [users.id],
  }),
  document: one(documents, {
    fields: [mediaAssets.documentId],
    references: [documents.id],
  }),
}));

// Folders table for organizing documents and media
export const folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id"), // null for root folders
  type: varchar("type").notNull(), // 'documents' or 'media'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity table for tracking user actions
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // 'created', 'edited', 'uploaded', 'deleted'
  itemType: varchar("item_type").notNull(), // 'document', 'media', 'folder'
  itemName: varchar("item_name").notNull(),
  itemId: varchar("item_id"), // May be null if item is deleted
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const baseInsertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = baseInsertDocumentSchema.refine(
  (data) => {
    if (data.contentType === "markdown") {
      return data.markdownContent != null && data.markdownContent.trim() !== "";
    }
    if (data.contentType === "pdf") {
      return data.mimeType != null && data.storageUrl != null;
    }
    return false;
  },
  {
    message: "Markdown documents require markdownContent, PDF documents require mimeType and storageUrl",
  }
);

export const updateDocumentSchema = baseInsertDocumentSchema.partial();

export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({
  id: true,
  createdAt: true,
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
