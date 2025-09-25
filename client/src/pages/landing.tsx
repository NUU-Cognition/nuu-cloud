import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cloud, FileText, Image, Users, Code, Settings } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">NUU Cloud</h1>
          </div>
          <Button onClick={handleLogin}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Your Knowledge, <span className="text-primary">Unified</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              NUU Cloud is the foundational data storage and synchronization service for the NUU ecosystem.
              Store, manage, and retrieve Markdown documents and media with enterprise-grade security.
            </p>
            <Button size="lg" onClick={handleLogin} className="text-lg px-8 py-3">
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything you need for data management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for the NUU ecosystem with local-first architecture and cloud convenience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Markdown First</h3>
                <p className="text-muted-foreground">
                  Store and manage your knowledge in portable Markdown format with full version control.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Image className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Media Management</h3>
                <p className="text-muted-foreground">
                  Upload, organize, and securely serve images and media assets with automatic optimization.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">User Isolation</h3>
                <p className="text-muted-foreground">
                  Enterprise-grade security ensures users can only access their own data and files.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">RESTful API</h3>
                <p className="text-muted-foreground">
                  Complete API for CRUD operations, perfect for integration with NUU applications.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6 text-ring" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Local-First Ready</h3>
                <p className="text-muted-foreground">
                  Designed for future local synchronization while providing cloud convenience today.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Cloud className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Ecosystem Ready</h3>
                <p className="text-muted-foreground">
                  Powers NUU Surf, NUU Capture, and the entire NUU knowledge management ecosystem.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the NUU ecosystem and take control of your knowledge management
          </p>
          <Button onClick={handleLogin} variant="secondary" size="lg" className="text-lg px-8 py-3">
            Sign In Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground">
            © 2025 NUU Cloud. Part of the NUU Cognition ecosystem.
          </p>
        </div>
      </footer>
    </div>
  );
}
