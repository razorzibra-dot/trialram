# 📌 Supabase Setup - Quick Reference Card

## ⚡ Get Started in 30 Seconds

```bash
# Terminal 1
supabase start

# Terminal 2  
npm run dev

# Browser
http://localhost:5000
```

---

## 📂 New Files Created

```
📄 GET_STARTED_SUPABASE.md          ← START HERE (3-step guide)
📄 SUPABASE_QUICK_SETUP.txt         ← Visual ASCII guide
📄 SUPABASE_SETUP_GUIDE.md          ← Comprehensive guide
📄 SUPABASE_SETUP_SUMMARY.md        ← This session summary
📄 SUPABASE_REFERENCE_CARD.md       ← Quick reference
🔧 start-supabase.ps1              ← PowerShell script
🔧 start-supabase.bat              ← Batch script
```

---

## 🔧 Fixed Issues

| Issue | File | Fix | Status |
|-------|------|-----|--------|
| Syntax Error | `src/services/supabase/authService.ts:87` | Changed destructuring | ✅ Fixed |

---

## 🎯 What's Ready

| Component | Status | How to Use |
|-----------|--------|-----------|
| Supabase Config | ✅ | Already in `.env` |
| Phase 4 Hooks | ✅ | `import { useSupabaseCustomers } from '@/hooks'` |
| Database | ✅ | 7 migrations auto-applied |
| Real-time | ✅ | Enabled by default |
| Dev Server | ✅ | `npm run dev` |

---

## 📍 Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5000 | http://localhost:5000 |
| Supabase API | 54321 | http://localhost:54321 |
| PostgreSQL | 54322 | postgresql://localhost |
| Studio | 54323 | http://localhost:54323 |

---

## 💻 Essential Commands

```bash
# Start services
supabase start          # Terminal 1 - Keep running
npm run dev            # Terminal 2

# Stop services
supabase stop

# Reset database
supabase db reset

# Open Supabase Studio (Data Explorer)
supabase studio

# Check status
supabase status
```

---

## 🎣 Using Phase 4 Hooks

### Customers
```typescript
import { useSupabaseCustomers } from '@/hooks';

const { customers, loading, error, create, update, delete: deleteCustomer, search } = useSupabaseCustomers();
```

### Sales
```typescript
import { useSupabaseSales } from '@/hooks';

const { sales, loading, error, getByStage, getByCustomer } = useSupabaseSales();
```

### Tickets
```typescript
import { useSupabaseTickets } from '@/hooks';

const { tickets, loading, error, getByStatus, getByPriority, getSLABreached } = useSupabaseTickets();
```

### Contracts
```typescript
import { useSupabaseContracts } from '@/hooks';

const { contracts, loading, error, getActive, getExpiringSoon } = useSupabaseContracts();
```

---

## 🔄 Switch Backend (No Code Change!)

Edit `.env`:
```bash
VITE_API_MODE=mock              # Mock data
VITE_API_MODE=real              # Real .NET API
VITE_API_MODE=supabase          # Supabase (current)
```

Restart: `npm run dev`

---

## ✅ Verify Setup

1. Check `.env`: `VITE_API_MODE=supabase` ✓
2. Start Supabase: `supabase start` ✓
3. Start Dev Server: `npm run dev` ✓
4. Open Browser: `http://localhost:5000` ✓
5. Check Console: Look for `🗄️  API Mode: supabase` ✓

---

## 📚 Documentation Order

1. This file (5 min read)
2. `GET_STARTED_SUPABASE.md` (5 min)
3. `SUPABASE_QUICK_SETUP.txt` (visual reference)
4. `PHASE_4_QUICK_START.md` (using hooks)
5. Full guides as needed

---

## 🚀 Ready to Start?

```bash
# Copy and paste these commands:

# Terminal 1
supabase start

# Terminal 2  
npm run dev

# Then open: http://localhost:5000
```

---

## 🆘 Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't start Supabase | Install CLI: `npm install -g supabase` |
| Connection refused | Make sure `supabase start` is running in Terminal 1 |
| Port in use | Kill process: `netstat -ano \| findstr :5000` |
| Empty data | Run: `supabase db reset` |
| Real-time not working | Check: `VITE_SUPABASE_ENABLE_REALTIME=true` |
| Module not found | Run: `npm install` |

---

## 📊 File Structure Reference

```
src/
├── hooks/                    ← Phase 4 hooks
│   ├── useSupabaseCustomers.ts
│   ├── useSupabaseSales.ts
│   ├── useSupabaseTickets.ts
│   ├── useSupabaseContracts.ts
│   └── index.ts
├── services/
│   ├── supabase/            ← Supabase services
│   │   ├── authService.ts
│   │   ├── customerService.ts
│   │   ├── salesService.ts
│   │   ├── ticketService.ts
│   │   └── contractService.ts
│   ├── api/
│   │   └── apiServiceFactory.ts  ← Smart router
│   └── index.ts
└── config/
    └── apiConfig.ts         ← Backend detection
```

---

## 🎓 Learning Path

### Day 1: Setup
- [ ] Read: `GET_STARTED_SUPABASE.md`
- [ ] Run: `supabase start && npm run dev`
- [ ] Test: Open http://localhost:5000

### Day 2: Components
- [ ] Read: `PHASE_4_QUICK_START.md`
- [ ] Create: Simple component using hooks
- [ ] Test: Real-time sync with 2 tabs

### Day 3: Advanced
- [ ] Read: `PHASE_4_SERVICE_ROUTER_INTEGRATION.md`
- [ ] Build: Complex component with filtering
- [ ] Deploy: Test with cloud Supabase

---

## 🎉 You're All Set!

Everything is configured and ready to use. Just:

1. Run `supabase start` (Terminal 1)
2. Run `npm run dev` (Terminal 2)
3. Visit http://localhost:5000

**The application will automatically use Supabase as the backend!** ✨

---

## 📞 Need Help?

| Question | Where to Look |
|----------|----------------|
| How do I start? | `GET_STARTED_SUPABASE.md` |
| Visual guide? | `SUPABASE_QUICK_SETUP.txt` |
| Using hooks? | `PHASE_4_QUICK_START.md` |
| Architecture? | `PHASE_4_SERVICE_ROUTER_INTEGRATION.md` |
| Something broken? | This file's troubleshooting section |

---

**Last Updated**: Just now  
**Status**: ✅ Ready to run  
**Backend**: 🗄️  Supabase (Local)  
**Version**: Phase 4 Complete