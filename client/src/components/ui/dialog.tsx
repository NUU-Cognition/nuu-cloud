/**
 * Dialog Component
 * 
 * A reusable modal dialog component built on top of Radix UI Dialog primitives.
 * Provides consistent styling and behavior across the application.
 * 
 * Features:
 * - Modal overlay with grey background for better visibility
 * - Animated open/close transitions
 * - Responsive design with mobile-friendly sizing
 * - Built-in close button with keyboard navigation support
 * - Dark mode support
 */

"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Base dialog components from Radix UI
const Dialog = DialogPrimitive.Root              // Root container for dialog
const DialogTrigger = DialogPrimitive.Trigger    // Button that opens the dialog
const DialogPortal = DialogPrimitive.Portal      // Portal for rendering outside normal DOM
const DialogClose = DialogPrimitive.Close        // Button that closes the dialog

// Modal overlay that covers the entire screen
// Uses semi-transparent background for better visibility
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// Main dialog content container
// Centered on screen with grey background for visibility
// Includes built-in close button and smooth animations
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Positioning: centered on screen
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
        // Styling: bright white background, padding, border, shadow  
        "gap-4 border bg-white dark:bg-white p-6 shadow-lg duration-200 rounded-lg",
        // Animations: fade in/out, zoom, slide effects
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      {/* Built-in close button in top-right corner */}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

// Dialog header section - contains title and description
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

// Dialog footer section - contains action buttons
// Responsive layout: stacked on mobile, horizontal on desktop
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

// Dialog title component with proper accessibility
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

// Dialog description component for additional context
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// Export all dialog components for use throughout the application
export {
  Dialog,           // Root component
  DialogPortal,     // Portal for rendering
  DialogOverlay,    // Background overlay
  DialogClose,      // Close button trigger
  DialogTrigger,    // Open button trigger
  DialogContent,    // Main content container
  DialogHeader,     // Header section
  DialogFooter,     // Footer section
  DialogTitle,      // Title text
  DialogDescription,// Description text
}
