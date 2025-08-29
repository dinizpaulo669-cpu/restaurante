# RestaurantePro

## Overview

RestaurantePro is a comprehensive restaurant management platform built with React, Node.js, and PostgreSQL. The application serves as a multi-tenant SaaS solution that allows restaurant owners to manage their operations digitally, including product catalogs, order management, and business analytics. The platform features a public-facing restaurant discovery interface for customers and a comprehensive dashboard for restaurant owners to manage their businesses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Routing**: Wouter for lightweight client-side routing with authentication-based route protection
- **State Management**: TanStack Query for server state management, eliminating the need for complex global state
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js following RESTful API design patterns
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Authentication**: Replit Auth integration with OpenID Connect for secure user sessions
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple
- **API Structure**: Resource-based routing with middleware for authentication and error handling

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless hosting for scalability
- **Schema Management**: Drizzle Kit for migrations and schema versioning
- **Key Tables**: 
  - Users (supports both customers and restaurant owners)
  - Restaurants with owner relationships
  - Products with categorization and variations
  - Orders with itemized tracking
  - Sessions for authentication state

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect protocol
- **Session Strategy**: Server-side session storage in PostgreSQL
- **Role-Based Access**: User roles (customer/restaurant_owner) determine interface and permissions
- **Route Protection**: Client-side guards redirect unauthenticated users to login flow

### Payment Integration
- **Provider**: Stripe for subscription billing and payment processing
- **Implementation**: Stripe Elements for secure payment forms with PCI compliance
- **Subscription Model**: Tiered pricing (Basic, Pro, Enterprise) with feature differentiation
- **Webhook Handling**: Server-side processing of payment events for account updates

## External Dependencies

- **Database Hosting**: Neon PostgreSQL serverless platform for managed database infrastructure
- **Authentication Service**: Replit Auth for user identity and session management
- **Payment Processing**: Stripe for subscription billing, payment forms, and transaction handling
- **UI Component Library**: Radix UI for accessible, unstyled component primitives
- **Email Service**: Integrated through Replit infrastructure for notifications
- **Font Loading**: Google Fonts API for Inter, Architects Daughter, DM Sans, and Geist Mono typefaces
- **Development Tools**: Replit-specific plugins for runtime error handling and debugging