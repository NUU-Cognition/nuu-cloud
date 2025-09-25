import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDocumentSchema, updateDocumentSchema, insertMediaAssetSchema, insertFolderSchema, folders } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Configure multer for image uploads
const uploadImage = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure multer for PDF uploads
const uploadPdf = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for PDFs
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Folders endpoints
  app.get('/api/v1/folders/:type', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type } = req.params;
      
      if (type !== 'documents' && type !== 'media') {
        return res.status(400).json({ message: "Invalid folder type" });
      }
      
      const folders = await storage.getFoldersByType(userId, type);
      res.json({ success: true, data: folders });
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post('/api/v1/folders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderData = insertFolderSchema.parse({
        ...req.body,
        userId,
      });
      
      // Check name uniqueness
      const isUnique = await storage.checkNameUniqueness(
        userId, 
        folderData.name, 
        'folder', 
        folderData.parentId
      );
      
      if (!isUnique) {
        return res.status(400).json({ 
          message: "A folder or document with this name already exists in this location" 
        });
      }
      
      const folder = await storage.createFolder(folderData);
      
      // Create activity record for folder creation
      await storage.createActivity({
        userId,
        type: 'created',
        itemType: 'folder',
        itemName: folder.name,
        itemId: folder.id,
      });
      
      res.json({ success: true, data: folder });
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  app.delete('/api/v1/folders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = req.params.id;
      
      // Get folder info before deletion for activity tracking
      const folder = await db.select().from(folders).where(and(eq(folders.id, folderId), eq(folders.userId, userId))).then(results => results[0]);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      const deleted = await storage.deleteFolder(folderId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      // Create activity record for folder deletion
      await storage.createActivity({
        userId,
        type: 'deleted',
        itemType: 'folder',
        itemName: folder.name,
        itemId: null,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // Document routes
  app.get('/api/v1/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getDocuments(userId);
      res.json({ success: true, data: documents });
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get('/api/v1/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id, userId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json({ success: true, data: document });
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post('/api/v1/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        userId,
      });
      
      // Check name uniqueness
      const isUnique = await storage.checkNameUniqueness(
        userId, 
        validatedData.title, 
        'document', 
        validatedData.folderId
      );
      
      if (!isUnique) {
        return res.status(400).json({ 
          message: "A document or folder with this name already exists in this location" 
        });
      }
      
      const document = await storage.createDocument(validatedData);
      
      // Create activity record for document creation
      await storage.createActivity({
        userId,
        type: 'created',
        itemType: 'document',
        itemName: document.title,
        itemId: document.id,
      });
      
      res.status(201).json({ success: true, data: document });
    } catch (error) {
      console.error("Error creating document:", error);
      if ((error as any)?.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", errors: (error as any).errors });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.put('/api/v1/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = updateDocumentSchema.parse(req.body);
      
      const document = await storage.updateDocument(req.params.id, userId, updates);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Create activity record for document editing
      await storage.createActivity({
        userId,
        type: 'edited',
        itemType: 'document',
        itemName: document.title,
        itemId: document.id,
      });
      
      res.json({ success: true, data: document });
    } catch (error) {
      console.error("Error updating document:", error);
      if ((error as any)?.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", errors: (error as any).errors });
      }
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete('/api/v1/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get document info before deletion for activity tracking
      const document = await storage.getDocument(req.params.id, userId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const deleted = await storage.deleteDocument(req.params.id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Create activity record for document deletion
      await storage.createActivity({
        userId,
        type: 'deleted',
        itemType: 'document',
        itemName: document.title,
        itemId: null, // Set to null since item is deleted
      });
      
      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Download endpoint for PDF documents
  app.get('/api/v1/documents/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id, userId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (document.contentType !== 'pdf' || !document.storageUrl) {
        return res.status(400).json({ message: "Document is not a downloadable PDF" });
      }
      
      // Serve the actual file
      const filePath = path.join(process.cwd(), document.storageUrl);
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Media routes
  app.get('/api/v1/media', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assets = await storage.getMediaAssets(userId);
      res.json({ success: true, data: assets });
    } catch (error) {
      console.error("Error fetching media assets:", error);
      res.status(500).json({ message: "Failed to fetch media assets" });
    }
  });

  app.get('/api/v1/media/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const asset = await storage.getMediaAsset(req.params.id, userId);
      
      if (!asset) {
        return res.status(404).json({ message: "Media asset not found" });
      }
      
      // Serve the actual file
      const filePath = path.join(process.cwd(), asset.storageUrl);
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error fetching media asset:", error);
      res.status(500).json({ message: "Failed to fetch media asset" });
    }
  });

  app.post('/api/v1/media', isAuthenticated, uploadImage.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check name uniqueness
      const isUnique = await storage.checkNameUniqueness(
        userId, 
        file.originalname, 
        'media'
      );
      
      if (!isUnique) {
        // Clean up uploaded file
        try {
          await fs.unlink(file.path);
        } catch {}
        return res.status(400).json({ 
          message: "A media file with this name already exists" 
        });
      }

      const assetData = {
        userId,
        documentId: req.body.documentId || null,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size.toString(),
        storageUrl: file.path,
      };

      const asset = await storage.createMediaAsset(assetData);
      
      // Create activity record for media upload
      await storage.createActivity({
        userId,
        type: 'uploaded',
        itemType: 'media',
        itemName: file.originalname,
        itemId: asset.id,
      });
      
      res.status(201).json({ 
        success: true, 
        data: asset,
        url: `/api/v1/media/${asset.id}`
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  app.delete('/api/v1/media/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const asset = await storage.getMediaAsset(req.params.id, userId);
      
      if (!asset) {
        return res.status(404).json({ message: "Media asset not found" });
      }

      // Delete file from filesystem
      try {
        await fs.unlink(path.join(process.cwd(), asset.storageUrl));
      } catch (error) {
        console.warn("Failed to delete file from filesystem:", error);
      }

      const deleted = await storage.deleteMediaAsset(req.params.id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Media asset not found" });
      }
      
      // Create activity record for media deletion
      await storage.createActivity({
        userId,
        type: 'deleted',
        itemType: 'media',
        itemName: asset.originalName,
        itemId: null, // Set to null since item is deleted
      });
      
      res.json({ success: true, message: "Media asset deleted successfully" });
    } catch (error) {
      console.error("Error deleting media asset:", error);
      res.status(500).json({ message: "Failed to delete media asset" });
    }
  });

  // PDF upload route - creates documents with contentType='pdf'
  app.post('/api/v1/pdfs', isAuthenticated, uploadPdf.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Remove .pdf extension from title
      const title = file.originalname.replace(/\.pdf$/i, '');
      
      // Check name uniqueness
      const isUnique = await storage.checkNameUniqueness(
        userId, 
        title, 
        'document',
        req.body.folderId || null
      );
      
      if (!isUnique) {
        // Clean up uploaded file
        try {
          await fs.unlink(file.path);
        } catch {}
        return res.status(400).json({ 
          message: "A document with this name already exists in this folder" 
        });
      }

      const documentData = {
        userId,
        folderId: req.body.folderId || null,
        title,
        contentType: 'pdf' as const,
        markdownContent: null,
        mimeType: file.mimetype,
        storageUrl: file.path,
        fileSize: file.size.toString(),
      };

      const document = await storage.createDocument(documentData);
      
      // Create activity record for PDF upload
      await storage.createActivity({
        userId,
        type: 'uploaded',
        itemType: 'pdf',
        itemName: file.originalname,
        itemId: document.id,
      });
      
      res.status(201).json({ 
        success: true, 
        data: document,
        url: `/api/v1/documents/${document.id}/download`
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
      res.status(500).json({ message: "Failed to upload PDF" });
    }
  });

  // Dashboard stats route
  app.get('/api/v1/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [documents, assets] = await Promise.all([
        storage.getDocuments(userId),
        storage.getMediaAssets(userId),
      ]);

      const totalSize = assets.reduce((sum, asset) => sum + parseInt(asset.fileSize), 0);
      
      res.json({
        success: true,
        data: {
          documents: documents.length,
          media: assets.length,
          storage: `${(totalSize / (1024 * 1024)).toFixed(1)} MB`,
        }
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Activity feed route
  app.get('/api/v1/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Get activities from the activities table
      const activities = await storage.getActivities(userId);
      
      // Transform activities for the frontend
      const transformedActivities = activities.map(activity => ({
        id: activity.id,
        type: activity.itemType,
        action: activity.type,
        title: activity.itemName,
        timestamp: activity.createdAt,
        icon: activity.type === 'uploaded' ? 'Upload' : 
              activity.type === 'deleted' ? 'Trash2' :
              activity.type === 'created' ? 'FileText' : 'Edit'
      }));

      res.json({
        success: true,
        data: transformedActivities
      });
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
