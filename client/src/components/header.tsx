/**
 * Header Component
 * 
 * Top navigation bar for the application containing:
 * - Page title display
 * - Theme toggle (light/dark mode)
 * - Notification bell with dropdown
 * 
 * Features:
 * - Responsive design
 * - Click-outside behavior for notifications
 * - Grey dropdown background for visibility
 * - Dark mode support
 */

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";
import { Bell, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  // Theme management hook for dark/light mode switching
  const { theme, setTheme } = useTheme();
  
  // State for notification dropdown visibility
  const [showNotifications, setShowNotifications] = useState(false);

  // Close notification dropdown when clicking outside
  // This provides better UX by allowing users to dismiss dropdowns intuitively
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="flex items-center space-x-4 relative">
        <div className="relative notification-dropdown">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-4 h-4" />
          </Button>
          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 z-50 bg-white dark:bg-white border rounded-lg shadow-xl">
              <div className="p-4">
                <h3 className="font-medium mb-2 text-black dark:text-black">Notifications</h3>
                <p className="text-sm text-gray-600 dark:text-gray-600">No new notifications</p>
              </div>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={toggleTheme}>
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
}
