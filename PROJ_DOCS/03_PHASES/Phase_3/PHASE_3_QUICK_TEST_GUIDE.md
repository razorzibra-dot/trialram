# Phase 3: Quick Test Guide

## 🚀 How to Test Phase 3 Features

### Prerequisites
```bash
# Ensure all dependencies installed
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173` (or your configured port)

---

## 🧪 Manual Testing Steps

### 1. Access Service Contracts Page

1. Login to the application
2. Navigate to **Service Contracts** from the main menu
3. You should see a list of service contracts with stats cards

### 2. Open a Contract Detail Page

1. Click on any contract in the list (click the customer name or contract number)
2. You should be taken to the **Service Contract Detail** page
3. Verify:
   - [ ] Page loads without errors
   - [ ] Contract information displays correctly
   - [ ] Metrics cards show data (value, service level, days until end, progress)
   - [ ] Contract details card shows all information
   - [ ] Activity timeline shows creation event
   - [ ] Invoices are generated and listed

### 3. Test Edit Functionality

1. Click the **Edit** button (primary button in header)
2. **Edit Contract Settings** modal should open
3. Verify:
   - [ ] Service level pre-filled
   - [ ] Renewal notice period pre-filled
   - [ ] Auto-renewal status pre-selected
   - [ ] Terms text pre-filled

4. Make changes:
   - [ ] Change service level to "Enterprise"
   - [ ] Change renewal notice period to "90"
   - [ ] Toggle auto-renewal
   - [ ] Add text to terms

5. Click **OK** to submit
6. Verify:
   - [ ] Success message appears
   - [ ] Modal closes
   - [ ] Contract details update on page
   - [ ] Activity timeline shows "modified" entry

### 4. Test Renewal Functionality

1. Click the **Renew** button (main header or dropdown)
2. **Renew Service Contract** modal should open
3. Verify:
   - [ ] Information banner shows correct dates
   - [ ] Current contract end date displayed
   - [ ] New contract start date calculated
   - [ ] Renewal period defaults to "1 year"
   - [ ] Service level pre-selected
   - [ ] Auto-renewal pre-selected

4. Make renewal selections:
   - [ ] Select "2 years" renewal period
   - [ ] Keep service level the same (or change it)
   - [ ] Ensure auto-renewal is enabled

5. Click **OK** to submit
6. Verify:
   - [ ] Success message with NEW contract number appears
   - [ ] Modal closes
   - [ ] Page reloads with updated contract info
   - [ ] Activity timeline shows renewal event
   - [ ] Original contract status may show as "renewed"

### 5. Test Cancellation Functionality

1. Click the **More** button (dropdown with ⋮ icon)
2. Select **Cancel Contract** option (red text)
3. **Cancel Contract** confirmation dialog appears
4. Read the warning carefully
5. Click **Cancel Contract** button (red/danger style)

6. **Cancellation Reason** dialog appears:
   - [ ] TextArea visible for reason input
   - [ ] Placeholder text clear

7. Enter a cancellation reason:
   - Example: "Customer requested early termination due to business restructuring"

8. Click **Confirm** button
9. Verify:
   - [ ] Success message appears
   - [ ] Activity timeline shows cancellation event with reason
   - [ ] Page redirects to Service Contracts list after 1 second
   - [ ] Contract status should now be "cancelled" in the list

### 6. Test Renewal Alert (If Days < 30)

1. Open a contract that's within 30 days of expiration
2. Verify:
   - [ ] Yellow warning alert appears at top
   - [ ] Message shows days remaining
   - [ ] Expiration date shown
   - [ ] "Renew Now" button present
   - [ ] Alert can be dismissed with X button

3. Click "Renew Now" button
4. Verify:
   - [ ] Renewal modal opens
   - [ ] Alert remembers it was dismissed

### 7. Test Copy to Clipboard

1. In the contract details, find the Contract Number
2. Hover over the copy icon next to the number
3. Click the copy icon
4. Verify:
   - [ ] "Copied!" toast notification appears
   - [ ] Contract number is in clipboard (can paste elsewhere)

### 8. Test Responsive Design

**Mobile View (< 768px):**
1. Open developer tools (F12)
2. Set device to mobile (375px width)
3. Verify:
   - [ ] Layout stacks vertically
   - [ ] All sections visible without horizontal scroll
   - [ ] Buttons clickable
   - [ ] Modals fit on screen
   - [ ] Text readable

**Tablet View (768px - 1024px):**
1. Set device to tablet (768px width)
2. Verify:
   - [ ] 2-column layout works
   - [ ] Sidebar visible on right
   - [ ] Metrics cards display properly

**Desktop View (> 1024px):**
1. Full browser window
2. Verify:
   - [ ] 4-column metrics layout
   - [ ] Main content on left, activity on right
   - [ ] Professional spacing

### 9. Test Error Scenarios

**Try accessing non-existent contract:**
1. In URL, change contract ID to something invalid
2. Example: `http://localhost:5173/tenant/service-contracts/invalid-123`
3. Verify:
   - [ ] Error handled gracefully
   - [ ] "Contract not found" message displays (or empty state)
   - [ ] No console errors
   - [ ] Can navigate back

**Test form validation:**
1. Open Edit modal
2. Clear all required fields
3. Try to submit
4. Verify:
   - [ ] Validation errors appear
   - [ ] Form doesn't submit
   - [ ] Error messages helpful

### 10. Test Navigation

1. From contract detail, click breadcrumb **"Service Contracts"**
2. Verify: Returns to list page

3. From contract detail, click back button (browser back)
4. Verify: Returns to previous page

---

## ✅ Verification Checklist

### Page Load & Display
- [ ] Page loads in < 2 seconds
- [ ] No console errors (F12 → Console)
- [ ] All data displays correctly
- [ ] Images/icons render properly
- [ ] Responsive on all screen sizes

### Edit Feature
- [ ] Modal opens with current data
- [ ] All fields editable
- [ ] Form validates
- [ ] Submit works
- [ ] Data updates on page
- [ ] Activity updated

### Renewal Feature
- [ ] Modal shows renewal info
- [ ] New contract number generated
- [ ] Original marked as renewed
- [ ] Activity timeline updated
- [ ] Success message clear

### Cancellation Feature
- [ ] Two-step confirmation works
- [ ] Reason captured
- [ ] Status changed
- [ ] Activity recorded
- [ ] Redirects properly

### UI/UX
- [ ] Colors appropriate (green=active, red=error, etc.)
- [ ] Icons clear and correct
- [ ] Buttons accessible and clickable
- [ ] Modals professional
- [ ] Messages helpful

### Performance
- [ ] No lag when switching tabs
- [ ] Modals open smoothly
- [ ] Forms submit quickly
- [ ] No memory leaks (check DevTools)

---

## 🐛 Bug Report Template

If you find issues, report them with:

```
**Issue:** [Brief description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[If applicable]

**Browser/Device:**
[Browser + version, device specs]

**Console Errors:**
[Paste any console errors]
```

---

## 📊 Test Data

### Available Test Contracts

**Contract 1: SC-2024-001**
- Customer: Acme Corporation
- Product: Enterprise CRM Suite
- Value: $12,500
- Status: Active
- Days Left: Varies (based on start/end date)

**Contract 2: SC-2024-002**
- Customer: TechStart Inc
- Product: Analytics Dashboard Pro
- Value: $3,600
- Status: Active

**Contract 3: SC-2023-015**
- Customer: Global Enterprises
- Product: Enterprise CRM Suite
- Value: $55,000
- Status: Expired
- Good for testing error states

---

## 🎯 Phase 3 Success Indicators

Phase 3 is complete when:

✅ **Detail Page**
- Loads contract data correctly
- Shows all contract information
- Displays metrics accurately
- Timeline updates on actions

✅ **Edit Functionality**
- Modal opens with current data
- All editable fields work
- Form validation works
- Changes save correctly

✅ **Renewal Workflow**
- Can renew contracts
- New contract created
- Original marked as renewed
- Activity tracked

✅ **Cancellation Workflow**
- Can cancel contracts
- Reason captured
- Status updated
- Activity recorded

✅ **UI/UX Quality**
- Professional appearance
- Responsive design
- Clear messaging
- Good error handling

✅ **Performance**
- Fast loading
- Smooth interactions
- No console errors
- Proper cleanup

---

## 🔗 Related Documentation

- **Implementation Plan:** `PHASE_3_SERVICE_CONTRACT_MANAGEMENT.md`
- **Implementation Summary:** `PHASE_3_IMPLEMENTATION_SUMMARY.md`
- **Service Layer:** `src/services/serviceContractService.ts`
- **Type Definitions:** `src/types/productSales.ts`

---

## 📞 Questions?

If you have questions during testing:
1. Check the implementation documentation
2. Review the code comments in ServiceContractDetailPage.tsx
3. Check service layer methods in serviceContractService.ts
4. Test with the provided sample data

---

**Happy Testing! 🚀**