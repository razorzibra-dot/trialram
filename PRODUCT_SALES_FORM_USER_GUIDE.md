# Product Sales Form - User Guide ✅

**Updated**: January 29, 2025  
**Module**: Product Sales  
**Form**: Create/Edit Product Sale

## Overview

The Product Sales form has been enhanced with Sales module-style customer and product selection. This guide shows you how to use the new features.

## Quick Start

### Creating a New Product Sale

1. **Open Product Sales Module**
   - Navigate to **Product Sales** from the main menu
   - Click **Create New Sale** button

2. **Fill Sale Information**
   - Enter a **Sale Number** (e.g., PS-2025-001)

3. **Select Customer**
   - Click the **Customer** dropdown
   - Type to search by company name or email
   - Click on the customer to select
   - You'll see a **linked alert** confirming the selection
   - Review customer details in the card below

4. **Add Products**
   - Click the product dropdown under **Products/Services**
   - Type to search by product name or SKU
   - Click a product to select it
   - Click the **Add** button
   - Product appears in the **line items table** below

5. **Manage Line Items**
   - **Quantity**: Click the quantity field to edit (minimum 1)
   - **Discount**: Click the discount field to edit (e.g., apply $50 discount)
   - **Total**: Automatically calculates (Qty × Price - Discount)
   - **Delete**: Click the trash icon to remove a product
   - **View Total**: See the grand total at the bottom of the table

6. **Complete Sale Details**
   - Select **Sale Date** (required)
   - Select **Delivery Date** (optional)
   - Choose **Status** (Draft, Pending, Confirmed, etc.)
   - Enter **Warranty Period** (months, default 12)
   - Add any **Notes**

7. **Submit**
   - Click **Create** button to save
   - Success message appears
   - Form closes and sale is added to list

## Features Explained

### 🔍 Customer Selection with Search

```
Search by typing:
┌─────────────────────────────────────┐
│ Company name (e.g., "ACME Corp")   │
│ Email (e.g., "contact@acme.com")   │
│ Contact name (e.g., "John Smith")  │
└─────────────────────────────────────┘

Results show:
├─ Company Name (Bold)
└─ Contact • Email (Gray text)
```

**Searching Tips**:
- Type partial names (e.g., "acm" finds "ACME Corp")
- Case-insensitive (e.g., "acme" or "ACME" both work)
- Search updates as you type

### 📍 Customer Linked Alert

When you select a customer, you'll see:
```
✓ Customer Linked
Company: ACME Corporation | Contact: John Smith
```

### 📋 Customer Details Card

After selecting a customer, see full details:
```
Contact:     John Smith
Email:       john@acme.com
Phone:       +1-555-0123
Industry:    Technology
Company Size: 100-500
Status:      Active
```

### 📦 Product Selection

**Search by Product Name or SKU**:
```
Dropdown shows:
├─ Product Name (Bold)
└─ SKU: ABC123 • $99.99 (Gray text)
```

**Add Product to Sale**:
1. Select from dropdown
2. Click **Add** button
3. Product moves to line items table
4. Quantity auto-set to 1, price from product master

### 📊 Line Items Table

**Table Columns**:

| Column | Purpose | Editable |
|--------|---------|----------|
| Product | Product name + description | No |
| Qty | Quantity ordered | Yes (min 1) |
| Price | Unit price from product master | No |
| Discount | Discount per line | Yes |
| Total | Calculated total (Qty × Price - Discount) | Auto |
| Action | Delete button | Yes |

**Example**:
```
Product              | Qty | Price | Discount | Total   | 
─────────────────────┼─────┼───────┼──────────┼─────────
Widget (Blue)        | 5   | $20   | $10      | $90.00  | ✕
Software License     | 2   | $100  | $0       | $200.00 | ✕
─────────────────────┴─────┴───────┴──────────┴─────────
                           Total: $290.00
```

**Editing Example**:
1. Increase Widget quantity from 5 to 10
   - Total changes: 10 × $20 - $10 = $190.00
   - Grand total updates to $390.00

2. Add $25 discount to Software License
   - Line total: 2 × $100 - $25 = $175.00
   - Grand total updates to $365.00

### 🗑️ Removing Products

- Click the **trash icon** in the last column of any line item
- Product is immediately removed
- Totals recalculate automatically

### ✅ Form Validation

**Required Fields** (marked with *):
- Sale Number
- Customer
- At least one product

**Validation Examples**:
- ❌ Click Create without a customer → "Please select a customer"
- ❌ Click Create without products → "Please add at least one product to the sale"
- ❌ Enter invalid date → "Please select sale date"

### 💾 Auto-Calculations

**Line Total**: Automatically calculated
```
Line Total = (Unit Price × Quantity) - Discount
```

**Grand Total**: Automatically calculated
```
Grand Total = Sum of all Line Totals
```

**No Manual Calculation Needed** - Changes update instantly!

## Common Workflows

### Workflow 1: Simple Single-Product Sale
```
1. Select customer
2. Add 1 product with quantity
3. Accept default 0 discount
4. Set sale date to today
5. Click Create
```

### Workflow 2: Bundle Sale with Multiple Products
```
1. Select customer (e.g., "ACME Corp")
2. Add Product A (Widget)
3. Add Product B (Accessory)
4. Add Product C (Support)
5. Edit quantities for each
6. Set delivery date for future
7. Click Create
```

### Workflow 3: Promotional Sale with Discounts
```
1. Select customer
2. Add products
3. Edit discount for each product
   - Widget: $10 discount
   - Software: $50 discount
4. Review final total
5. Click Create
```

### Workflow 4: Editing Existing Sale
```
1. Click Edit on a sale in the list
2. Form opens with existing data
3. Can change:
   - Customer (different customer)
   - Products (add/remove)
   - Quantities/discounts
   - Dates and status
   - Notes
4. Click Update to save changes
```

## Loading States

### ⏳ Loading Customers
- Dropdown shows spinner while fetching
- "Loading" text appears
- Waits for customer list to load

### ⏳ Loading Products
- "Select product to add" shows spinner
- Add button disabled while loading
- Waits for product list to load

### ⏳ Submitting Form
- Create/Update button shows spinner
- Form fields disabled while saving
- Waits for server response

## Error Handling

### ❌ No Customers Available
```
Error Message: "Failed to load form data"
Action: Contact system administrator
```

### ❌ No Products Available
```
Error Message: "Failed to load form data"
Action: Create products first, or contact administrator
```

### ❌ Permission Denied
```
Alert: "Permission Denied - You do not have permission to create product sales"
Button: Disabled with lock icon
Action: Contact system administrator to grant permissions
```

## Tips & Tricks

### 💡 Quick Search
- **Product by SKU**: Type SKU directly (e.g., "ABC123")
- **Customer by Email**: Type email domain (e.g., "@acme.com")
- **Partial Matching**: "Smith" finds "John Smith" and "Jane Smith"

### 💡 Multiple Products
- Can add as many products as needed
- Each product tracked separately with own quantity/discount
- Grand total shows combined value

### 💡 Editing Before Save
- Keep editing until everything is perfect
- All calculations update in real-time
- No need to recalculate manually

### 💡 Discount Strategy
- Apply line-level discounts per product
- Good for promotional pricing
- Totals always accurate

### 💡 Large Quantities
- InputNumber supports large numbers
- No practical limit
- Recalculates instantly

## Comparison: Before vs After

### Before Enhancement
```
Old Form:
├─ Sale Number (text)
├─ Customer (simple dropdown)
├─ Product (simple dropdown)
├─ Quantity (number)
├─ Unit Price (number input)
├─ Total (calculated)
├─ Sale Date
├─ Delivery Date
├─ Status
└─ Notes

Limitations:
- No customer search
- No customer details visible
- No product details in dropdown
- Only 1 product per sale
- No ability to edit prices or discounts
- No line items table
```

### After Enhancement
```
New Form:
├─ Sale Number
├─ Customer Selection (with search, filter, details card)
├─ Products Section
│  ├─ Product Selection (with search, SKU, price)
│  ├─ Add Button
│  └─ Line Items Table
│     ├─ Product name + description
│     ├─ Editable quantity
│     ├─ Unit price display
│     ├─ Editable discount
│     ├─ Auto-calculated line total
│     └─ Delete button
├─ Sale Details
│  ├─ Sale Date
│  ├─ Delivery Date
│  ├─ Status
│  └─ Warranty Period
├─ Additional Information
│  └─ Notes
└─ Grand Total

Improvements:
✅ Search customers and products
✅ View full customer details
✅ View product SKU and price in dropdown
✅ Support multiple products in one sale
✅ Editable quantities and discounts
✅ Line items table for overview
✅ Auto-calculating totals
✅ Professional, consistent UI
```

## Troubleshooting

### Problem: Customer dropdown empty
**Solution**: 
- Wait a moment for customers to load
- Check if "Loading" spinner shows
- If error persists, contact administrator
- Ensure you have customers created in the system

### Problem: Can't add product
**Possible Causes**:
- No products selected in dropdown
- Product already in sale (shows warning)
- Product loading in progress

**Solution**:
- Select a product from dropdown before clicking Add
- Choose a different product if already added
- Wait for products to finish loading

### Problem: Total not updating
**Solution**:
- Changes should update instantly
- If not, try refreshing the form
- Report to administrator if issue persists

### Problem: Can't submit form
**Possible Causes**:
- Missing required fields
- No products added
- Form validation errors

**Solution**:
- Fill in all required fields (marked with *)
- Add at least one product
- Check for validation error messages
- Review all data before submitting

### Problem: Permission denied
**Solution**:
- You don't have permission to create/edit sales
- Contact your system administrator
- Request the "crm:product-sale:record:update" permission

## FAQ

**Q: Can I add the same product twice?**  
A: No. If you try, you'll see: "This product is already in the sale. Update the quantity instead."

**Q: How many products can I add?**  
A: As many as needed. No practical limit.

**Q: Can I edit customer after selecting?**  
A: Yes. Click the dropdown again and select a different customer.

**Q: Can I apply discount to specific lines?**  
A: Yes. Each line item has its own discount field.

**Q: What happens to the total when I change quantity?**  
A: Line total updates instantly: Qty × Price - Discount

**Q: Can I save without a delivery date?**  
A: Yes. Delivery date is optional. Sale date is required.

**Q: How do I delete a product I added?**  
A: Click the trash icon (✕) in the rightmost column of that line item.

**Q: Can I edit an existing sale?**  
A: Yes. Click Edit on the sale in the list. The form opens with existing data.

**Q: What status should I choose?**  
A: It depends:
- **Draft**: Sale not finalized
- **Pending**: Awaiting confirmation
- **Confirmed**: Customer confirmed order
- **Delivered**: Product shipped
- **Cancelled**: Sale cancelled
- **Refunded**: Refund issued

**Q: Is warranty period mandatory?**  
A: No. Defaults to 12 months, but you can change it.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Move to next field |
| `Shift+Tab` | Move to previous field |
| `Enter` | In Select: Open dropdown; In Create: Submit form |
| `Esc` | Close dropdown or cancel form |
| `↑↓` | Navigate dropdown options |

## Getting Help

- **Form Not Working**: Contact your system administrator
- **Missing Customers/Products**: Ask administrator to create them
- **Permission Issues**: Request permissions from your admin
- **Bug Report**: Document steps to reproduce and report

---

**Last Updated**: January 29, 2025  
**Version**: 1.0  
**Status**: ✅ Ready for Use