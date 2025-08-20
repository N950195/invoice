# Invoice Management System

## Overview

This is a full-stack invoice management system built with React/TypeScript frontend and Node.js/Express backend. The application allows users to create and manage invoices with features like logo uploads, payment terms configuration, and currency selection. The system uses a modern tech stack with shadcn/ui components for the frontend and PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: shadcn/ui components built on top of Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom configuration for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod for runtime type checking and validation
- **File Upload**: Multer middleware for handling image uploads (logos)
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)
- **Development**: Hot reload with Vite integration for seamless development experience

### Data Storage
- **Primary Database**: PostgreSQL hosted on Neon (serverless PostgreSQL)
- **ORM**: Drizzle ORM with TypeScript for type-safe database queries
- **Migrations**: Drizzle Kit for database schema migrations
- **Connection**: @neondatabase/serverless for optimized serverless connections
- **Fallback Storage**: In-memory storage implementation for development/testing

### Database Schema
The system uses a single `invoices` table with the following structure:
- **id**: UUID primary key (auto-generated)
- **invoiceNumber**: Unique text identifier for each invoice
- **paymentTerms**: Enum for payment terms (NET7, NET15, NET30, NET45, NET60, DUE_ON_RECEIPT)
- **issueDate/dueDate**: Text fields for date storage
- **currency**: Currency code with USD default
- **logoUrl**: Optional URL for uploaded company logos
- **status**: Invoice status (defaults to "draft")
- **timestamps**: Created and updated timestamps

### Authentication & Authorization
Currently implements a basic session-based approach with plans for future enhancement. The system uses:
- Express sessions for state management
- PostgreSQL session store for persistence
- Middleware for request logging and error handling

## External Dependencies

### Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect
- **File Storage**: Local file system for logo uploads (configured for future cloud storage)

### UI & Design System
- **Radix UI**: Headless component library for accessible UI primitives
- **shadcn/ui**: Pre-built components with consistent design system
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Lucide React**: Icon library for consistent iconography

### Development & Build Tools
- **Vite**: Fast build tool with HMR and optimized production builds
- **TypeScript**: Type safety across the entire stack
- **Replit Integration**: Development environment optimizations and error overlays

### Validation & Forms
- **Zod**: Schema validation library used across frontend and backend
- **React Hook Form**: Form state management with TypeScript integration
- **@hookform/resolvers**: Zod integration for form validation

### HTTP & API Layer
- **TanStack Query**: Server state management with caching and synchronization
- **Express.js**: Web framework for API endpoints and middleware
- **Multer**: File upload handling for invoice logos

The architecture follows a clear separation of concerns with shared types between frontend and backend, ensuring type safety and consistency across the application.