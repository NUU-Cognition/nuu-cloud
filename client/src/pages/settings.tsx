import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [settings, setSettings] = useState({
    instanceName: "NUU Cloud Production",
    storageLimit: "5",
    userRegistration: true,
    rateLimit: "100",
    require2FA: false,
    auditLogging: true,
    backupFrequency: "Daily",
    autoCleanup: true,
    webhookUrl: "",
    enableWebhooks: false,
  });

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

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully",
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Settings" />
        
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Settings</h2>
            <p className="text-muted-foreground">Configure your NUU Cloud instance</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <Card>
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">General Settings</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="instanceName">Instance Name</Label>
                  <Input
                    id="instanceName"
                    value={settings.instanceName}
                    onChange={(e) => updateSetting('instanceName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="storageLimit">Default Storage Limit (GB)</Label>
                  <Input
                    id="storageLimit"
                    type="number"
                    value={settings.storageLimit}
                    onChange={(e) => updateSetting('storageLimit', e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="userRegistration">Enable User Registration</Label>
                  <Switch
                    id="userRegistration"
                    checked={settings.userRegistration}
                    onCheckedChange={(checked) => updateSetting('userRegistration', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Security Settings</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="rateLimit">API Rate Limit (requests/minute)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={settings.rateLimit}
                    onChange={(e) => updateSetting('rateLimit', e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="require2FA">Require 2FA</Label>
                  <Switch
                    id="require2FA"
                    checked={settings.require2FA}
                    onCheckedChange={(checked) => updateSetting('require2FA', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auditLogging">Enable Audit Logging</Label>
                  <Switch
                    id="auditLogging"
                    checked={settings.auditLogging}
                    onCheckedChange={(checked) => updateSetting('auditLogging', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Storage Settings */}
            <Card>
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Storage Settings</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select value={settings.backupFrequency} onValueChange={(value) => updateSetting('backupFrequency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoCleanup">Auto-cleanup old versions</Label>
                  <Switch
                    id="autoCleanup"
                    checked={settings.autoCleanup}
                    onCheckedChange={(checked) => updateSetting('autoCleanup', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Integration Settings */}
            <Card>
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Integration Settings</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://your-app.com/webhook"
                    value={settings.webhookUrl}
                    onChange={(e) => updateSetting('webhookUrl', e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableWebhooks">Enable Webhooks</Label>
                  <Switch
                    id="enableWebhooks"
                    checked={settings.enableWebhooks}
                    onCheckedChange={(checked) => updateSetting('enableWebhooks', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveSettings}>
              Save Changes
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
