/**
 * Dashboard Page Component
 * 
 * Main dashboard interface providing overview of user's content and activity.
 * Displays key metrics, comprehensive activity feed, and quick actions for content management.
 * 
 * Features:
 * - Statistics overview (documents, media, storage usage)
 * - Comprehensive activity feed with specific action types (created, edited, uploaded, deleted)
 * - Scrollable activity list showing all user activities
 * - Quick action buttons for creating new content
 * - Responsive design with card-based layout
 * - Real-time data updates via React Query
 * 
 * Authentication:
 * - Redirects to login if user is not authenticated
 * - All data fetching requires valid user session
 * 
 * Activity Types:
 * - Documents: created, edited
 * - Media: uploaded, deleted
 * - Folders: created
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Image, 
  HardDrive, 
  Plus, 
  Upload, 
  Edit,
  Trash2,
  Folder,
  Activity as ActivityIcon,
  Code,
  UserPlus
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/v1/stats"],
    retry: false,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/v1/activity"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Dashboard" />
        
        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : (stats as any)?.data?.documents || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Media Assets</p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : (stats as any)?.data?.media || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Image className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Activity</p>
                    <p className="text-2xl font-bold text-foreground">
                      {activityLoading ? "..." : ((activityData as any)?.data?.length || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <ActivityIcon className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : (stats as any)?.data?.storage || "0 MB"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <HardDrive className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ActivityIcon className="w-5 h-5" />
                  <span>All Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-80">
                  <div className="p-6 space-y-3">
                    {activityLoading ? (
                      <p className="text-sm text-muted-foreground">Loading activity...</p>
                    ) : ((activityData as any)?.data || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No activity yet</p>
                    ) : (
                      ((activityData as any)?.data || []).map((activity: any) => {
                        const getIcon = () => {
                          switch (activity.icon) {
                            case 'FileText': return <FileText className="w-4 h-4" />;
                            case 'Edit': return <Edit className="w-4 h-4" />;
                            case 'Upload': return <Upload className="w-4 h-4" />;
                            case 'Trash2': return <Trash2 className="w-4 h-4" />;
                            case 'Folder': return <Folder className="w-4 h-4" />;
                            default: return <ActivityIcon className="w-4 h-4" />;
                          }
                        };

                        const getActionColor = () => {
                          switch (activity.action) {
                            case 'created': return 'text-green-600 dark:text-green-400';
                            case 'edited': return 'text-blue-600 dark:text-blue-400';
                            case 'uploaded': return 'text-purple-600 dark:text-purple-400';
                            case 'deleted': return 'text-red-600 dark:text-red-400';
                            default: return 'text-gray-600 dark:text-gray-400';
                          }
                        };

                        return (
                          <div key={activity.id} className="flex items-start space-x-3 group hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActionColor().replace('text-', 'bg-').replace('600', '100').replace('400', '900/20')}`}>
                              <div className={getActionColor()}>
                                {getIcon()}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">
                                <span className="font-medium">{activity.title}</span>
                                {' was '}
                                <span className={`font-medium ${getActionColor()}`}>
                                  {activity.action}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" asChild className="p-4 h-auto flex-col space-y-2">
                    <Link href="/documents">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-medium text-foreground">New Document</h4>
                        <p className="text-xs text-muted-foreground">Create markdown file</p>
                      </div>
                    </Link>
                  </Button>

                  <Button variant="outline" asChild className="p-4 h-auto flex-col space-y-2">
                    <Link href="/media">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <Upload className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-medium text-foreground">Upload Media</h4>
                        <p className="text-xs text-muted-foreground">Add images/files</p>
                      </div>
                    </Link>
                  </Button>

                  <Button variant="outline" asChild className="p-4 h-auto flex-col space-y-2">
                    <Link href="/api">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <Code className="w-5 h-5 text-success" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-medium text-foreground">API Docs</h4>
                        <p className="text-xs text-muted-foreground">View endpoints</p>
                      </div>
                    </Link>
                  </Button>

                  <Button variant="outline" asChild className="p-4 h-auto flex-col space-y-2">
                    <Link href="/users">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-warning" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-medium text-foreground">Manage Users</h4>
                        <p className="text-xs text-muted-foreground">User administration</p>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
