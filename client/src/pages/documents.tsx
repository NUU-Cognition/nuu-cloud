import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Plus, Edit, Eye, Trash2, Upload, Download, Folder, Filter, FileIcon } from "lucide-react";

export default function Documents() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [uploadMethod, setUploadMethod] = useState("manual");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [nameError, setNameError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/v1/documents"],
    retry: false,
  });

  const { data: foldersResponse, isLoading: foldersLoading } = useQuery({
    queryKey: ["/api/v1/folders", "documents"],
    retry: false,
  });
  
  const folders = Array.isArray((foldersResponse as any)?.data) ? (foldersResponse as any).data : [];
  const documentsData = Array.isArray((documents as any)?.data) ? (documents as any).data : [];

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; markdownContent: string; folderId?: string; contentType: string }) => {
      await apiRequest("POST", "/api/v1/documents", data);
      return data; // Return the data so we can access title in onSuccess
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/activity"] });
      setIsCreateModalOpen(false);
      setNewDocTitle("");
      setNewDocContent("");
      toast({
        title: "Success",
        description: `Document '${data.title}' created successfully`,
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      if (error.message?.includes('already exists')) {
        toast({
          title: "Name Conflict",
          description: "A document or folder with this name already exists in this location",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create document",
          variant: "destructive",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await apiRequest("DELETE", `/api/v1/documents/${id}`);
      return { title };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/activity"] });
      toast({
        title: "Success",
        description: `Document '${data.title}' deleted successfully`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiRequest("DELETE", `/api/v1/folders/${id}`);
      return { name };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/folders", "documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/activity"] });
      toast({
        title: "Success",
        description: `Folder '${data.name}' deleted successfully`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; markdownContent: string }) => {
      await apiRequest("PUT", `/api/v1/documents/${data.id}`, {
        title: data.title,
        markdownContent: data.markdownContent,
        contentType: "markdown",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/activity"] });
      setIsEditModalOpen(false);
      setSelectedDoc(null);
      toast({
        title: "Success",
        description: `Document '${editTitle}' updated successfully`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    },
  });

  const uploadPdfMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', currentFolder || '');
      
      const response = await fetch('/api/v1/pdfs', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      const result = await response.json();
      return { ...result, fileName: file.name };
    },
    onSuccess: (data) => {
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/v1/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/activity"] });
      toast({
        title: "Success",
        description: `PDF '${data.fileName}' uploaded successfully`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Extract specific error message from server response
      let errorMessage = "Failed to upload PDF";
      if (error.message.includes("400:")) {
        const serverMessage = error.message.split("400: ")[1];
        if (serverMessage) {
          errorMessage = serverMessage;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      toast({
        title: "Error",
        description: "Only .md (Markdown) files are allowed",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const title = file.name.replace('.md', '');
      
      createMutation.mutate({
        title,
        markdownContent: content,
        folderId: currentFolder || undefined,
        contentType: "markdown",
      });
    };
    reader.readAsText(file);
  };

  const handlePdfUpload = (files: FileList) => {
    const file = files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Only PDF files are allowed",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 25MB",
          variant: "destructive",
        });
        return;
      }

      uploadPdfMutation.mutate(file);
    }
  };

  const handleCreateDocument = () => {
    if (uploadMethod === "file") {
      fileInputRef.current?.click();
      return;
    }
    
    if (uploadMethod === "pdf") {
      pdfInputRef.current?.click();
      return;
    }

    if (!newDocTitle.trim() || !newDocContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({
      title: newDocTitle,
      markdownContent: newDocContent,
      folderId: currentFolder || undefined,
      contentType: "markdown",
    });
  };

  const handleDeleteDocument = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate({ id, title });
    }
  };

  const handleDeleteFolder = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete folder "${name}"? This will also delete all documents inside it.`)) {
      deleteFolderMutation.mutate({ id, name });
    }
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDoc(doc);
    setIsViewModalOpen(true);
  };

  const handleEditDocument = (doc: any) => {
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditContent(doc.markdownContent);
    setIsEditModalOpen(true);
  };

  const handleUpdateDocument = () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({
      id: selectedDoc.id,
      title: editTitle,
      markdownContent: editContent,
    });
  };

  const handleDownloadDocument = (doc: any) => {
    const blob = new Blob([doc.markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: `Document '${doc.title}' downloaded successfully`,
    });
  };


  // Get media assets (including PDFs)
  const { data: mediaAssetsResponse, isLoading: mediaLoading } = useQuery({
    queryKey: ["/api/v1/media"],
    retry: false,
  });
  
  const mediaAssets = Array.isArray((mediaAssetsResponse as any)?.data) ? (mediaAssetsResponse as any).data : [];

  // Combine folders, documents, and PDFs for display
  const allItems = [
    // Only show folders that belong to the current folder
    ...folders.filter((folder: any) => {
      return currentFolder ? folder.parentId === currentFolder : !folder.parentId;
    }).map((folder: any) => ({ ...folder, type: 'folder' })),
    // Only show documents from current folder (both markdown and PDFs)
    ...documentsData.filter((doc: any) => {
      return currentFolder ? doc.folderId === currentFolder : !doc.folderId;
    }).map((doc: any) => ({ 
      ...doc, 
      type: doc.contentType === 'pdf' ? 'pdf' : 'markdown'
    }))
  ];

  // Apply search filter
  const filteredItems = allItems.filter((item: any) => {
    if (item.type === 'folder') {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (item.type === 'pdf') {
      return item.title.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.markdownContent && item.markdownContent.toLowerCase().includes(searchTerm.toLowerCase()));
    }
  });

  // Apply type filter
  const filteredAndTypedItems = filteredItems.filter((item: any) => {
    if (filterType === 'all') return true;
    if (filterType === 'folders') return item.type === 'folder';
    if (filterType === 'documents') return item.type === 'markdown';
    if (filterType === 'pdfs') return item.type === 'pdf';
    return true;
  });

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Documents" />
        
        <main className="p-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Documents</h2>
              {/* Breadcrumb */}
              {currentFolder && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <button 
                    onClick={() => setCurrentFolder(null)}
                    className="hover:text-foreground"
                    data-testid="breadcrumb-root"
                  >
                    Root
                  </button>
                  <span className="mx-2">/</span>
                  <span>{folders.find((f: any) => f.id === currentFolder)?.name || 'Folder'}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Dialog open={isCreateFolderModalOpen} onOpenChange={setIsCreateFolderModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Folder className="w-4 h-4" />
                    <span>New Folder</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folder-name">Folder Name</Label>
                      <Input
                        id="folder-name"
                        placeholder="Enter folder name..."
                        value={newFolderName}
                        onChange={(e) => {
                          setNewFolderName(e.target.value);
                          setNameError("");
                        }}
                        data-testid="input-folder-name"
                      />
                      {nameError && (
                        <p className="text-sm text-red-500 mt-1">{nameError}</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateFolderModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={async () => {
                        if (newFolderName.trim()) {
                          try {
                            await apiRequest("POST", "/api/v1/folders", {
                              name: newFolderName,
                              type: 'documents',
                              parentId: currentFolder
                            });
                            setIsCreateFolderModalOpen(false);
                            setNewFolderName("");
                            setNameError("");
                            queryClient.invalidateQueries({ queryKey: ["/api/v1/folders", "documents"] });
                            queryClient.invalidateQueries({ queryKey: ["/api/v1/activity"] });
                            toast({
                              title: "Success",
                              description: `Folder '${newFolderName}' created successfully`,
                            });
                          } catch (error: any) {
                            console.error('Folder creation error:', error);
                            if (error.message?.includes('already exists')) {
                              setNameError("A folder or document with this name already exists in this location");
                            } else {
                              toast({
                                title: "Error",
                                description: "Failed to create folder",
                                variant: "destructive",
                              });
                            }
                          }
                        }
                      }}
                      disabled={!newFolderName.trim() || !!nameError}
                    >
                      Create Folder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>New Document</span>
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                </DialogHeader>
                
                <Tabs value={uploadMethod} onValueChange={setUploadMethod} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="manual" className="flex items-center space-x-2">
                      <Edit className="w-4 h-4" />
                      <span>Write Markdown</span>
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload .md File</span>
                    </TabsTrigger>
                    <TabsTrigger value="pdf" className="flex items-center space-x-2">
                      <FileIcon className="w-4 h-4" />
                      <span>Upload PDF File</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="space-y-4">
                    <div>
                      <Label htmlFor="title">Document Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter document title..."
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Markdown Content</Label>
                      <Textarea
                        id="content"
                        rows={10}
                        className="font-mono text-sm"
                        placeholder="# Welcome to your new document

Start writing your markdown content here..."
                        value={newDocContent}
                        onChange={(e) => setNewDocContent(e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="file" className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground mb-2">Upload Markdown File</p>
                      <p className="text-muted-foreground mb-4">
                        Select a .md file to upload and create a new document
                      </p>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        Choose .md File
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="pdf" className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <FileIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground mb-2">Upload PDF File</p>
                      <p className="text-muted-foreground mb-4">
                        Select a PDF file to upload to your documents
                      </p>
                      <Button onClick={() => pdfInputRef.current?.click()}>
                        Choose PDF File
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && handlePdfUpload(e.target.files)}
                />

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDocument}
                    disabled={createMutation.isPending || uploadPdfMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : 
                     uploadMethod === "file" ? "Choose File" : 
                     uploadMethod === "pdf" ? (uploadPdfMutation.isPending ? "Uploading..." : "Choose File") : "Create Document"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      placeholder="Search documents..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="all">All Items</option>
                    <option value="folders">Folders Only</option>
                    <option value="documents">Markdown Only</option>
                    <option value="pdfs">PDFs Only</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Modified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documentsLoading || foldersLoading || mediaLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredAndTypedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    filteredAndTypedItems.map((item: any) => (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.type === 'folder' ? (
                              <Folder className="w-5 h-5 text-blue-500 mr-3" />
                            ) : item.type === 'pdf' ? (
                              <FileIcon className="w-5 h-5 text-red-500 mr-3" />
                            ) : (
                              <FileText className="w-5 h-5 text-muted-foreground mr-3" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {item.type === 'folder' ? (
                                  <button
                                    onClick={() => setCurrentFolder(item.id)}
                                    className="hover:text-blue-500 transition-colors"
                                    data-testid={`folder-${item.id}`}
                                  >
                                    {item.name}
                                  </button>
                                ) : (
                                  item.title
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground capitalize">
                            {item.type === 'markdown' ? 'Markdown' : item.type === 'pdf' ? 'PDF' : item.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {item.type === 'folder' ? (
                              'Folder'
                            ) : item.type === 'pdf' ? (
                              `${(parseInt(item.fileSize) / 1024).toFixed(1)} KB`
                            ) : (
                              `${((item.markdownContent?.length || 0) / 1024).toFixed(1)} KB`
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {item.type === 'markdown' ? (
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEditDocument(item)}
                                title="Edit document"
                                data-testid={`edit-document-${item.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleViewDocument(item)}
                                title="View document"
                                data-testid={`view-document-${item.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDownloadDocument(item)}
                                title="Download as .md file"
                                data-testid={`download-document-${item.id}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteDocument(item.id, item.title)}
                                disabled={deleteMutation.isPending}
                                title="Delete document"
                                data-testid={`delete-document-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : item.type === 'pdf' ? (
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `/api/v1/documents/${item.id}/download`;
                                  link.download = item.title + '.pdf';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                title="Download PDF"
                                data-testid={`download-pdf-${item.id}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteDocument(item.id, item.title)}
                                disabled={deleteMutation.isPending}
                                title="Delete PDF"
                                data-testid={`delete-pdf-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setCurrentFolder(item.id)}
                                title="Open folder"
                                data-testid={`open-folder-${item.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteFolder(item.id, item.name)}
                                disabled={deleteFolderMutation.isPending}
                                title="Delete folder"
                                data-testid={`delete-folder-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* View Document Modal */}
          <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>View Document: {selectedDoc?.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Document Title</Label>
                  <Input value={selectedDoc?.title || ""} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Markdown Content</Label>
                  <Textarea
                    value={selectedDoc?.markdownContent || ""}
                    readOnly
                    rows={20}
                    className="font-mono text-sm bg-muted"
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Created: {selectedDoc && new Date(selectedDoc.createdAt).toLocaleString()}</span>
                  <span>Modified: {selectedDoc && new Date(selectedDoc.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Document Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Document Title</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter document title..."
                  />
                </div>
                <div>
                  <Label htmlFor="edit-content">Markdown Content</Label>
                  <Textarea
                    id="edit-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                    placeholder="# Edit your document here..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateDocument}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
