# PDS-CRM Application

A modular CRM (Customer Relationship Management) application with a React frontend and .NET Core backend. The application follows a clean architecture pattern and is designed to manage customers, contracts, sales, tickets, and notifications in a multi-tenant environment.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- .NET 7.0 SDK (for backend)
- PostgreSQL (for backend database)

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
dotnet restore
```

### Running the Application

#### Option 1: Development with Mock Data (Recommended for Frontend Development)

```bash
# 1. Ensure .env is configured for mock mode
# VITE_USE_MOCK_API=true

# 2. Start development server
npm run dev

# 3. Open browser at http://localhost:5173
```

#### Option 2: Development with Real Backend

```bash
# 1. Start the backend
cd backend
dotnet run --project CrmPortal.API/CrmPortal.API.csproj

# 2. In another terminal, configure .env for real API
# VITE_USE_MOCK_API=false
# VITE_API_BASE_URL=http://localhost:5137/api/v1

# 3. Start frontend development server
npm run dev

# 4. Open browser at http://localhost:5173
```

## 🔄 API Mode Switching

This application supports **two API modes**:

1. **Mock/Static Data API** - Uses local static data (for development/testing)
2. **Real .NET Core Backend API** - Connects to actual backend server

### How to Switch

Edit `.env` file:

```env
# For Mock/Static Data
VITE_USE_MOCK_API=true

# For Real .NET Core Backend
VITE_USE_MOCK_API=false
```

Then restart the development server.

**For detailed guide, see:** [docs/API_SWITCHING_GUIDE.md](./docs/API_SWITCHING_GUIDE.md)

## 📚 Documentation

### Quick Links

#### API & Architecture
- **[Quick Reference Card](./docs/QUICK_REFERENCE.md)** - ⚡ Fast lookup for common tasks
- **[API Switching Guide](./docs/API_SWITCHING_GUIDE.md)** - 📖 Complete guide for API modes
- **[Developer Checklist](./docs/DEVELOPER_CHECKLIST.md)** - ✅ Step-by-step consistency checklist
- **[Architecture Diagrams](./docs/ARCHITECTURE_DIAGRAM.md)** - 📊 Visual flow charts

#### UI/UX Design System
- **[UI Quick Start Guide](./docs/UI_QUICK_START.md)** - 🎨 Get started with the design system
- **[UI Design System](./docs/UI_DESIGN_SYSTEM.md)** - 📐 Complete design system documentation
- **[UI Implementation Summary](./docs/UI_IMPLEMENTATION_SUMMARY.md)** - 📋 Implementation overview

#### General
- **[Documentation Hub](./docs/README.md)** - 📚 All documentation

### Architecture Overview
- **Frontend:** React 18.2.0 with TypeScript, Vite, TailwindCSS, Ant Design
- **UI Library:** Ant Design (Enterprise-grade components)
- **Design System:** Salesforce-inspired professional theme
- **Backend:** .NET 7.0 with Clean Architecture, CQRS, Entity Framework Core
- **Database:** PostgreSQL
- **Authentication:** JWT with Bearer tokens
- **State Management:** React Query and Context API

For detailed architecture, see [.zencoder/rules/repo.md](./.zencoder/rules/repo.md)

## 🛠️ Development

### Project Structure

```
PDS-CRM-Application/
├── src/                        # Frontend React application
│   ├── modules/                # Feature modules
│   ├── services/               # API services (mock & real)
│   ├── components/             # Reusable components
│   ├── config/                 # Configuration files
│   └── types/                  # TypeScript type definitions
├── backend/                    # .NET Core backend
│   ├── CrmPortal.API/          # API controllers
│   ├── CrmPortal.Application/  # Application services
│   ├── CrmPortal.Domain/       # Domain entities
│   └── CrmPortal.Infrastructure/ # Data access
├── docs/                       # Documentation
└── public/                     # Static assets
```

### Key Principles

1. **Always import services from central index:**
   ```typescript
   // ✅ Correct
   import { customerService } from '@/services';
   
   // ❌ Wrong
   import { customerService } from '@/services/customerService';
   ```

2. **Implement both mock and real versions** of every service

3. **Test both API modes** before committing

4. **Follow the developer checklist** when adding new features

### Adding New Services

See [docs/DEVELOPER_CHECKLIST.md](./docs/DEVELOPER_CHECKLIST.md) for step-by-step guide.

Quick overview:
1. Define interface in `src/services/api/apiServiceFactory.ts`
2. Create mock service in `src/services/[service]Service.ts`
3. Create real service in `src/services/real/[service]Service.ts`
4. Register in factory
5. Export from `src/services/index.ts`
6. Test both modes

## 🧪 Testing

```bash
# Run linter
npm run lint

# Validate code quality
npm run validate:code

# Run quality checks
npm run quality:check
```

### Testing Both API Modes

1. **Test with Mock API:**
   - Set `VITE_USE_MOCK_API=true`
   - Restart dev server
   - Test all features

2. **Test with Real API:**
   - Start backend server
   - Set `VITE_USE_MOCK_API=false`
   - Restart dev server
   - Test all features

## 🏗️ Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run validate:code    # Validate code quality
npm run quality:check    # Run quality checks
```

## 🌍 Environment Configuration

### Development (Mock Data)
```env
VITE_USE_MOCK_API=true
VITE_API_ENVIRONMENT=development
```

### Development (Real Backend)
```env
VITE_USE_MOCK_API=false
VITE_API_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:5137/api/v1
```

### Production
```env
VITE_USE_MOCK_API=false
VITE_API_ENVIRONMENT=production
VITE_API_BASE_URL=https://api.yourcompany.com/api/v1
```

See `.env.example` for all configuration options.

## 🔐 Authentication

The application uses JWT authentication with Bearer tokens. Demo accounts are available in mock mode:

- **Super Admin:** superadmin@demo.com / password
- **Admin:** admin@demo.com / password
- **Manager:** manager@demo.com / password
- **Sales Rep:** sales@demo.com / password

## 🎯 Features

- **Customer Management** - Manage customer information, tags, and relationships
- **Sales Pipeline** - Track deals through sales stages
- **Ticket System** - Handle customer support tickets
- **Contract Management** - Manage service and product contracts
- **Dashboard** - Real-time metrics and analytics
- **User Management** - Role-based access control
- **Multi-tenant** - Support for multiple organizations
- **Notifications** - In-app and email notifications
- **Audit Logs** - Track all system changes

## 🤝 Contributing

1. Read the [Developer Checklist](./docs/DEVELOPER_CHECKLIST.md)
2. Follow the [API Switching Guide](./docs/API_SWITCHING_GUIDE.md)
3. Implement both mock and real versions of services
4. Test both API modes
5. Update documentation
6. Submit pull request

## 📞 Support

- **Documentation:** [docs/README.md](./docs/README.md)
- **Quick Reference:** [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)
- **Troubleshooting:** [docs/API_SWITCHING_GUIDE.md#troubleshooting](./docs/API_SWITCHING_GUIDE.md#troubleshooting)

## 📄 License

[Your License Here]

## 👥 Team

[Your Team Information Here]

---

## 🎉 Recent Updates

### Enterprise UI/UX Design System (2024)

We've implemented a comprehensive enterprise-grade design system with Ant Design:

- ✅ **Professional Design:** Salesforce-inspired clean, modern interface
- ✅ **Ant Design Integration:** 40+ themed enterprise components
- ✅ **Consistent Styling:** Uniform look across all pages (Admin, Super Admin, Users)
- ✅ **Reusable Components:** PageHeader, StatCard, DataTable, EmptyState, EnterpriseLayout
- ✅ **Comprehensive Theme:** Colors, typography, spacing, shadows all defined
- ✅ **Responsive Design:** Mobile-first approach, works on all devices
- ✅ **Complete Documentation:** Design system guide, quick start, templates
- ✅ **Developer Friendly:** Easy to use, well-documented, type-safe

**Get Started:** See [UI Quick Start Guide](./docs/UI_QUICK_START.md)

### API Consistency Implementation (2024)

We've implemented a comprehensive system for maintaining consistency between Mock/Static Data API and Real .NET Core Backend API:

- ✅ Easy switching between API modes via environment variable
- ✅ Comprehensive documentation (5 new guides)
- ✅ Developer checklists for consistency
- ✅ Visual architecture diagrams
- ✅ Enhanced configuration with clear instructions
- ✅ Automatic API mode detection and logging

**See [docs/IMPLEMENTATION_SUMMARY.md](./docs/IMPLEMENTATION_SUMMARY.md) for details.**

---

**Built with ❤️ using React, TypeScript, and .NET Core**