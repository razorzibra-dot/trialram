# PDS-CRM Documentation

Welcome to the PDS-CRM application documentation.

## 📚 Documentation Index

### 🚀 Getting Started
- **[Quick Reference](./QUICK_REFERENCE.md)** - ⚡ Quick reference card (print and keep handy!)
- **[API Switching Guide](./API_SWITCHING_GUIDE.md)** - 📖 Complete guide for API mode switching

### 🏗️ Architecture
- **[Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)** - 📊 Visual diagrams and flow charts
- Service Architecture - See [repo.md](../.zencoder/rules/repo.md#api-architecture--switching)
- Frontend Structure - See [repo.md](../.zencoder/rules/repo.md#frontend)
- Backend Structure - See [repo.md](../.zencoder/rules/repo.md#backend)

### 👨‍💻 Development Guides
- **[Developer Checklist](./DEVELOPER_CHECKLIST.md)** - ✅ Step-by-step checklist for consistency
- **[API Switching Guide](./API_SWITCHING_GUIDE.md)** - 📖 Comprehensive guide
- Adding New Services - See [API Switching Guide - Adding New Services](./API_SWITCHING_GUIDE.md#adding-new-services)
- Testing Both API Modes - See [API Switching Guide - Testing](./API_SWITCHING_GUIDE.md#testing-both-modes)

### 📋 Quick Links
- [Quick Reference Card](./QUICK_REFERENCE.md) - Fast lookup for common tasks
- [Troubleshooting](./API_SWITCHING_GUIDE.md#troubleshooting) - Common issues and solutions
- [Best Practices](./API_SWITCHING_GUIDE.md#best-practices) - Coding standards

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Mode
Edit `.env` file:
```env
# For development with mock data
VITE_USE_MOCK_API=true

# For production with real backend
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:5137/api/v1
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Start Backend (if using Real API)
```bash
cd backend
dotnet run --project CrmPortal.API/CrmPortal.API.csproj
```

## 🔑 Key Concepts

### API Modes

The application supports two API modes:

| Mode | Use Case | Configuration |
|------|----------|---------------|
| **Mock/Static** | Development, Testing, Demo | `VITE_USE_MOCK_API=true` |
| **Real Backend** | Production, Integration Testing | `VITE_USE_MOCK_API=false` |

### Service Import Pattern

**Always import services from the central index:**

```typescript
// ✅ Correct
import { customerService, authService } from '@/services';

// ❌ Wrong
import { customerService } from '@/services/customerService';
```

### Automatic Switching

The application automatically switches between mock and real services based on the `.env` configuration. No code changes required!

## 📖 Documentation Files

- **[API_SWITCHING_GUIDE.md](./API_SWITCHING_GUIDE.md)** - Complete guide for API switching
- **[repo.md](../.zencoder/rules/repo.md)** - Repository overview and architecture

## 🛠️ Common Tasks

### Switch to Mock API
1. Open `.env`
2. Set `VITE_USE_MOCK_API=true`
3. Restart dev server

### Switch to Real API
1. Open `.env`
2. Set `VITE_USE_MOCK_API=false`
3. Ensure backend is running
4. Restart dev server

### Add New Service
1. Define interface in `src/services/api/apiServiceFactory.ts`
2. Create mock service in `src/services/[service]Service.ts`
3. Create real service in `src/services/real/[service]Service.ts`
4. Register in factory
5. Export from `src/services/index.ts`
6. Test both modes

See [API Switching Guide - Adding New Services](./API_SWITCHING_GUIDE.md#adding-new-services) for detailed steps.

## 🐛 Troubleshooting

### API mode not switching?
- Restart development server completely
- Clear browser cache and localStorage
- Check console for API configuration log

### CORS errors?
- Ensure backend CORS is configured
- Verify backend is running on correct port
- Check `VITE_API_BASE_URL` in `.env`

### Authentication not working?
- Check token storage in localStorage
- Verify backend JWT configuration
- Review `src/services/api/baseApiService.ts`

See [API Switching Guide - Troubleshooting](./API_SWITCHING_GUIDE.md#troubleshooting) for more solutions.

## 📞 Support

For questions or issues:
1. Check the [API Switching Guide](./API_SWITCHING_GUIDE.md)
2. Review console logs for API configuration
3. Verify `.env` settings
4. Check backend API is running (for real mode)

## 🔄 Updates

When updating the application:
- Always implement both mock and real versions of new services
- Test both API modes before merging
- Update documentation
- Maintain backward compatibility

---

**Last Updated:** 2024
**Version:** 1.0