# replit.md

## Overview

NUU Cloud is a foundational data storage and synchronization service built as a full-stack web application. It serves as the core infrastructure for the NUU ecosystem, providing secure storage and management of Markdown documents and media assets. The application features a modern React frontend with a comprehensive admin dashboard, backed by an Express.js server with PostgreSQL database integration through Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Built with React 18 using TypeScript for type safety
- **UI Framework**: Implements shadcn/ui component library with Radix UI primitives for consistent, accessible components
- **Styling**: Uses Tailwind CSS with custom CSS variables for theming and responsive design
- **State Management**: TanStack Query for server state management with optimistic updates and caching
- **Routing**: Client-side routing with wouter for lightweight navigation
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Express.js Server**: RESTful API with middleware for logging, error handling, and request processing
- **Authentication**: Replit OAuth integration with session management using PostgreSQL session store
- **File Upload**: Multer middleware for handling media asset uploads with file type validation
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Development Setup**: Vite middleware integration for seamless full-stack development

### Database Design
- **Users Table**: Stores user profiles from OAuth with timestamps
- **Documents Table**: Markdown content storage with user relationships and CRUD operations
- **Media Assets Table**: File metadata with user ownership and cascade deletion
- **Sessions Table**: Secure session storage for authentication state

### API Structure
- **RESTful Endpoints**: Organized under `/api/v1/` namespace with consistent JSON responses
- **Authentication Routes**: OAuth flow management with user profile endpoints
- **CRUD Operations**: Full create, read, update, delete operations for documents and media
- **Error Handling**: Centralized error middleware with structured error responses

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **Connection Management**: Pool-based connections for scalability

### Authentication
- **Replit OAuth**: OpenID Connect integration for user authentication
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **Security**: HTTPS-only cookies with configurable expiration

### UI Components
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component library with consistent design system
- **Lucide Icons**: Comprehensive icon library for UI elements
- **TailwindCSS**: Utility-first CSS framework with custom theme variables

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Fast build tool with development server and HMR
- **ESBuild**: High-performance JavaScript bundler for production builds
- **Replit Integration**: Development environment optimization and error handling