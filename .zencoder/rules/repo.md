---
description: Repository Information Overview
alwaysApply: true
---

# PDS-CRM Application Information

## Summary
A modular CRM (Customer Relationship Management) application with a React frontend and multiple backend options including .NET Core and Supabase. The application follows a clean architecture pattern and is designed to manage customers, contracts, sales, tickets, and notifications in a multi-tenant environment.

## Structure
- **src/**: Frontend React application with modular architecture
  - **modules/**: Feature modules with self-contained functionality
  - **services/**: API services with mock, real, and Supabase implementations
  - **components/**: Reusable UI components
  - **contexts/**: React context providers
  - **hooks/**: Custom React hooks
  - **types/**: TypeScript type definitions
- **supabase/**: Supabase configuration and migrations
- **public/**: Static assets
- **docs/**: Documentation files

## Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: TypeScript 5.0.2
**Build System**: Vite 4.4.5
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React 18.2.0 with React Router 6.8.1
- Ant Design 5.27.5 for UI components
- TanStack React Query 5.90.2 for data fetching
- Supabase 2.38.0 for backend integration
- Tailwind CSS 3.3.0 for styling
- Zod 3.22.2 for schema validation
- Zustand 5.0.8 for state management

**Development Dependencies**:
- ESLint 8.45.0 for code linting
- Husky 8.0.3 for git hooks
- Vite 4.4.5 for development server and building

## Build & Installation
```bash
# Install dependencies
npm install

# Development with mock data
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker
**Configuration**: Docker Compose setup for local Supabase development
**Services**:
- PostgreSQL database (port 5432)
- Supabase API (port 54321)
- Supabase Studio (port 54323)
- Email testing (port 54324)

**Run Command**:
```bash
docker-compose -f docker-compose.local.yml up -d
```

## API Configuration
**Multiple Backend Options**:
- Mock/Static Data API (for development)
- .NET Core Backend API (production)
- Supabase PostgreSQL (real-time database)

**Switching Modes**:
```
# In .env file
VITE_API_MODE=mock|real|supabase
```

## Testing
**Framework**: ESLint for static analysis
**Configuration**: .eslintrc.js
**Run Command**:
```bash
# Run linter
npm run lint

# Validate code quality
npm run validate:code

# Run quality checks
npm run quality:check
```

## Architecture
**Frontend**: Modular architecture with feature modules
**State Management**: React Query and Context API
**Authentication**: JWT with Bearer tokens
**Database**: PostgreSQL via Supabase
**UI Library**: Ant Design with Tailwind CSS
**Design System**: Salesforce-inspired professional theme