# Overview

This is a modern AI-powered trading platform built as a full-stack web application. The system provides automated trading capabilities, portfolio management, and market analysis tools. It features a React-based frontend with a sophisticated dark-themed trading interface, an Express backend with RESTful APIs, and PostgreSQL database integration. The platform supports both manual and AI-driven trading strategies, real-time portfolio tracking, and comprehensive risk analysis.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development builds
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent dark-themed trading interface
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling for accessibility and consistency
- **Charts**: Recharts for portfolio performance visualization
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with TypeScript using ES modules
- **Framework**: Express.js for RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas shared between frontend and backend
- **Development**: Hot reloading with tsx and custom Vite integration
- **Build**: esbuild for production bundling

## Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations with shared TypeScript schemas
- **Core Tables**:
  - Users: Authentication and account balance management
  - Portfolios: Portfolio-level metrics and P&L tracking
  - Positions: Individual stock positions with real-time valuations
  - Trades: Trade execution history with AI/manual classification
  - Strategies: AI trading strategy configurations
  - Market Data: Real-time stock price information
  - Transactions: Deposit/withdrawal tracking

## Key Features
- **AI Trading**: Automated strategy execution with configurable risk parameters
- **Portfolio Management**: Real-time position tracking and performance analytics
- **Risk Analysis**: VaR calculations, asset allocation monitoring, and Sharpe ratio metrics
- **Market Data**: Live price feeds with change indicators
- **Transaction Management**: Deposit/withdrawal functionality with validation

## Authentication & Authorization
- Session-based authentication using connect-pg-simple for PostgreSQL session storage
- User-specific portfolio and trading data isolation
- Demo mode initialization for development and testing

## Development Tools
- **TypeScript**: Strict type checking across the entire stack
- **Hot Reloading**: Development server with instant updates
- **Path Aliases**: Clean imports using @ and @shared prefixes
- **Code Quality**: ESLint and PostCSS for code formatting and optimization

# External Dependencies

## Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Frontend Libraries
- **Radix UI**: Comprehensive set of accessible UI primitives
- **TanStack Query**: Server state management with caching and synchronization
- **Recharts**: React charting library for data visualization
- **date-fns**: Date manipulation and formatting utilities
- **Tailwind CSS**: Utility-first CSS framework

## Backend Dependencies
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL support
- **Express**: Web application framework for Node.js
- **Zod**: TypeScript-first schema validation library

## Development Tools
- **Vite**: Fast build tool and development server
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution engine for development
- **Replit Integration**: Development environment plugins for seamless cloud development