# Sales Module - Quick Verification Guide

## 🚀 Quick Start

After the data layer fix, test these three areas:

---

## 1️⃣ Expected Close Date on Grid

**What to do:**
1. Navigate to Sales Dashboard
2. Look at the "Expected Close" column

**What you should see:**
```
Deal Name                    Expected Close
─────────────────────────────────────────
Enterprise Software License  2/15/2024  ✅
Manufacturing Equipment      2/28/2024  ✅
Startup Package             3/10/2024  ✅
Retail Integration Platform 1/30/2024  ✅
Cloud Migration Services    4/15/2024  ✅
```

**Browser Console Check:**
Open DevTools → Console tab, look for logs like:
```
[SalesPage Grid] Expected Close Date Debug: {
  field: 'expected_close_date',
  value: '2024-02-15',
  dealId: '1',
  dealTitle: 'Enterprise Software License',
  allRecordFields: ['id', 'title', 'value', 'stage', ..., 'expected_close_date', 'source', 'campaign', 'notes', ...]
}
```

---

## 2️⃣ View Details Panel (Optional Fields)

**What to do:**
1. Click "View" button on any deal row
2. A right sidebar should open showing "Deal Details"

**What you should see:**

### Basic Section:
- Deal Title ✓
- Deal Value (formatted currency) ✓
- Stage (with color tag) ✓
- Status (open/won/lost) ✓
- Probability (%) ✓
- **Expected Close Date** (formatted date) ✓
- **Actual Close Date** (if present) ✓
- **Source** (e.g., "direct_sales") ✓
- **Campaign** (e.g., "Q1_Enterprise_Push") ✓
- **Notes** (deal context text) ✓
- Description ✓

### Example View for Deal #1:
```
Deal Information
─────────────────────────────────────────
Deal Title: Enterprise Software License
Deal Value: $150,000
Stage: NEGOTIATION
Status: OPEN
Probability: 75%
Expected Close Date: 2/15/2024
Source: direct_sales                    ← Should appear
Campaign: Q1_Enterprise_Push            ← Should appear
Notes: High-value prospect with strong... ← Should appear
Description: Annual enterprise software...
```

**Browser Console Check:**
```
[SalesDealDetailPanel] 👀 Displaying deal: {
  id: '1',
  title: 'Enterprise Software License',
  expected_close_date: '2024-02-15',
  actual_close_date: '',
  status: 'open',
  source: 'direct_sales',              ← Check this appears
  campaign: 'Q1_Enterprise_Push',      ← Check this appears
  notes: 'High-value prospect...',     ← Check this appears
  allFields: ['id', 'title', 'value', ..., 'source', 'campaign', 'notes', ...],
  allValues: { ... entire deal object ... }
}
```

---

## 3️⃣ Edit Form Panel (No "Failed to load" Error)

**What to do:**
1. Click "Edit" button on any deal row
2. Form drawer should open for editing

**What you should see:**
- ✅ NO error toast saying "Failed to load customers"
- Form with all fields pre-filled:
  - Title
  - Customer dropdown (populates from server)
  - Value
  - Stage
  - **Expected Close Date** (date picker with date)
  - Probability
  - Status
  - **Source** (e.g., "direct_sales")
  - **Campaign** (e.g., "Q1_Enterprise_Push") 
  - **Notes** (textarea with content)
  - Description

### Example Form for Deal #1:
```
┌─ Edit Deal Form ────────────────────┐
│                                     │
│ Title: Enterprise Software License  │
│ Customer: TechCorp Solutions [v]    │
│ Value: 150,000                      │
│ Stage: negotiation [v]              │
│ Expected Close Date: 2024-02-15 [📅]│
│ Probability: 75 %                   │
│ Status: open [v]                    │
│ Source: direct_sales [v]            ← Should be filled
│ Campaign: Q1_Enterprise_Push [v]    ← Should be filled
│ Notes: [High-value prospect...]     ← Should be filled
│ Description: [Annual enterprise...] │
│                                     │
│ [Cancel]  [Save Changes]            │
└─────────────────────────────────────┘
```

**Browser Console Check:**
For successful load:
```
[SalesDealFormPanel] loadCustomers - Starting to load customers...
[SalesDealFormPanel] loadCustomers - Received result: {
  data: [Customer[], ...],
  total: X,
  page: 1,
  pageSize: 1000
}
[SalesDealFormPanel] Setting customers: 4 items
```

OR for initialization state (NOT an error):
```
[SalesDealFormPanel] ℹ️ Auth context initializing - customer list will be empty temporarily
```

---

## 📊 Expected Mock Data Values

All 5 deals should have complete data:

| Deal | Expected Close | Source | Campaign | Status |
|------|---|---|---|---|
| Enterprise Software License | 2/15/2024 | direct_sales | Q1_Enterprise_Push | open |
| Manufacturing Equipment | 2/28/2024 | partner_referral | Equipment_Sales_2024 | open |
| Startup Package | 3/10/2024 | event | Startup_Week_2024 | open |
| Retail Integration Platform | 1/30/2024 | inbound_lead | Retail_Solutions | won |
| Cloud Migration Services | 4/15/2024 | existing_customer | Cloud_Migration_Q2 | open |

---

## 🔍 Debugging Tips

### If grid shows "-" for Expected Close Date
1. Check browser console for grid debug logs
2. Look for `expected_close_date: null` or `undefined` in the object
3. Verify mock data has values in `/src/services/salesService.ts` lines 20, 48, 76, 104, 132

### If Detail Panel shows "No data"
1. Check if the detail panel opened (right sidebar appeared)
2. Look for console logs at lines 101-113
3. Check if deal object has all fields by looking at `allValues` in console

### If Edit Form shows error
1. It should NOT show "Failed to load customers"
2. If it does, check console for the actual error message
3. Empty customer list is OK during initialization
4. Form should be editable even with empty customer list

### If Edit Form shows empty Source/Campaign/Notes
1. Check that mock deal has values in lines 25-27, 53-55, 81-83, 109-111, 137-139
2. Verify form is loading the deal properly (should see logs at line 153)
3. Check `deal.source`, `deal.campaign`, `deal.notes` in the console log

---

## ✅ Success Criteria

| Issue | Before | After | Status |
|-------|--------|-------|--------|
| Expected Close Date on Grid | Not visible (shows "-") | Displays formatted date (e.g., "2/15/2024") | ✅ Fixed |
| View Panel Optional Fields | Empty/missing | Shows source, campaign, notes | ✅ Fixed |
| Edit Form Loading | "Failed to load customers" error | No error, form loads properly | ✅ Fixed |
| Data Completeness | Missing optional fields | All fields present in mock data | ✅ Fixed |

---

## 📝 Notes

- **Mock data is in:** `/src/services/salesService.ts` lines 8-149
- **Grid renders from:** React Query data (`dealsData?.data`)
- **Detail panel displays:** All deal fields with conditional rendering
- **Form pre-fills:** All fields including optional ones
- **Build status:** ✅ Successful (exit code 0)

If you see any different behavior, check:
1. Browser console for debug logs
2. Network tab to verify API calls succeed
3. React DevTools to inspect component state