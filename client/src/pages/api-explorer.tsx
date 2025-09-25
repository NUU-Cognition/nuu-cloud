import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

const documentEndpoints = [
  {
    method: 'GET',
    path: '/api/v1/documents',
    description: 'List all documents (markdown and PDFs)',
    color: 'bg-green-600 text-white',
  },
  {
    method: 'POST',
    path: '/api/v1/documents',
    description: 'Upload document (markdown or PDF)',
    color: 'bg-blue-600 text-white',
  },
  {
    method: 'GET',
    path: '/api/v1/documents/{id}',
    description: 'Download document by ID',
    color: 'bg-green-600 text-white',
  },
  {
    method: 'DELETE',
    path: '/api/v1/documents/{id}',
    description: 'Delete document by ID',
    color: 'bg-red-600 text-white',
  },
];

// PDFs are now handled through the Documents API above

const mediaEndpoints = [
  {
    method: 'GET',
    path: '/api/v1/media',
    description: 'List all media (images)',
    color: 'bg-green-600 text-white',
  },
  {
    method: 'POST',
    path: '/api/v1/media',
    description: 'Upload media (images)',
    color: 'bg-blue-600 text-white',
  },
  {
    method: 'GET',
    path: '/api/v1/media/{id}',
    description: 'Download media by ID',
    color: 'bg-green-600 text-white',
  },
  {
    method: 'DELETE',
    path: '/api/v1/media/{id}',
    description: 'Delete media by ID',
    color: 'bg-red-600 text-white',
  },
];

export default function ApiExplorer() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [apiResponse, setApiResponse] = useState('');

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

  const testEndpoint = async (method: string, path: string) => {
    try {
      let url = path;
      let options: RequestInit = {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Replace {id} with sample IDs for demonstration
      if (path.includes('{id}')) {
        // For demonstration, we'll just show what the response would look like
        setApiResponse(JSON.stringify({
          status: "info",
          message: "Replace {id} with an actual document or media ID to test this endpoint",
          example_usage: path.replace('{id}', 'doc_12345')
        }, null, 2));
        return;
      }

      // Add sample data for POST requests
      if (method === 'POST' && path === '/api/v1/documents') {
        options.body = JSON.stringify({
          title: "Sample Document",
          markdownContent: "# Sample Document\n\nThis is a test document created via API."
        });
      }

      // Handle PDF testing
      if (path.startsWith('/api/v1/pdfs')) {
        if (method === 'POST') {
          setApiResponse(JSON.stringify({
            status: "info",
            message: "PDF upload requires multipart/form-data with a file field. Use the Python client or a tool like Postman for file uploads.",
            endpoint: path,
            required_fields: ["file (PDF)", "documentId (optional)"]
          }, null, 2));
          return;
        } else if (path.includes('{id}')) {
          setApiResponse(JSON.stringify({
            status: "info",
            message: "Replace {id} with an actual PDF ID to test this endpoint. Note: PDFs are stored as media assets, so this actually calls the media endpoint.",
            example_usage: path.replace('{id}', 'pdf_12345'),
            note: "This is a conceptual endpoint - actual implementation uses /api/v1/media/{id}"
          }, null, 2));
          return;
        }
      }

      // Handle image upload testing
      if (method === 'POST' && path === '/api/v1/media') {
        setApiResponse(JSON.stringify({
          status: "info",
          message: "Image upload requires multipart/form-data with a file field. Use the Python client or a tool like Postman for file uploads.",
          endpoint: path,
          required_fields: ["file (image)", "documentId (optional)"]
        }, null, 2));
        return;
      }

      const response = await fetch(url, options);
      const data = await response.json();
      
      setApiResponse(JSON.stringify({
        status: response.ok ? "success" : "error",
        status_code: response.status,
        data: data
      }, null, 2));

    } catch (error) {
      setApiResponse(JSON.stringify({
        status: "error",
        message: (error as Error).message
      }, null, 2));
    }
  };

  const renderEndpointSection = (endpoints: any[], title: string, description: string) => (
    <Card>
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <CardContent className="p-6">
        <div className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-4">
                <Badge className={endpoint.color}>
                  {endpoint.method}
                </Badge>
                <code className="text-sm font-mono text-foreground">
                  {endpoint.path}
                </code>
                <span className="text-sm text-muted-foreground">
                  {endpoint.description}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => testEndpoint(endpoint.method, endpoint.path)}
                data-testid={`button-test-${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
              >
                <Play className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="API Explorer" />
        
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">API Explorer</h2>
            <p className="text-muted-foreground">Explore and test NUU Cloud API endpoints</p>
          </div>

          <div className="space-y-6">
            {/* Documents API */}
            {renderEndpointSection(
              documentEndpoints,
              "Documents API",
              "Manage documents (Markdown and PDFs) with full CRUD operations."
            )}

            {/* Media API */}
            {renderEndpointSection(
              mediaEndpoints,
              "Media API",
              "Upload and manage media files (images) - exclusively for visual media assets"
            )}

            {/* Response Preview */}
            <Card>
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Response Preview</h3>
              </div>
              <CardContent className="p-6">
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm font-mono text-foreground whitespace-pre-wrap">
                    {apiResponse || JSON.stringify({
                      "status": "success",
                      "data": {
                        "documents": [
                          {
                            "id": "doc_12345",
                            "title": "Getting Started Guide",
                            "markdownContent": "# Welcome to NUU Cloud...",
                            "createdAt": "2024-01-15T10:30:00Z",
                            "updatedAt": "2024-01-15T14:22:00Z"
                          }
                        ]
                      }
                    }, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
