# Masters Module - Form Fields Documentation

Complete reference for all form fields, tooltips, constraints, and validation rules in the Masters module.

**Last Updated**: 2025-01-30  
**Module**: Masters (Products & Companies)  
**Version**: 1.0

## Table of Contents

1. [Product Form Fields](#product-form-fields)
2. [Company Form Fields](#company-form-fields)
3. [Database Constraint Mapping](#database-constraint-mapping)
4. [Validation Rules](#validation-rules)
5. [Field Tooltips](#field-tooltips)

---

## Product Form Fields

### Required Fields

#### Name (name)
- **Type**: Text Input (String)
- **Database Column**: `name` (VARCHAR(255))
- **Constraints**:
  - Required (NOT NULL)
  - Minimum length: 2 characters
  - Maximum length: 255 characters
- **Validation**: Text only, no HTML/scripts
- **Tooltip**: "Enter product name (2-255 characters)"
- **Example**: "Wireless Keyboard"

#### SKU (sku)
- **Type**: Text Input (String)
- **Database Column**: `sku` (VARCHAR(100) UNIQUE)
- **Constraints**:
  - Required (NOT NULL)
  - Unique (no duplicates allowed)
  - Format: Alphanumeric, hyphens, underscores only
  - Length: 2-50 characters
- **Validation**: Pattern `/^[A-Z0-9_-]{2,50}$/i`
- **Tooltip**: "Stock Keeping Unit (2-50 chars, alphanumeric/hyphens/underscores only). Must be unique"
- **Example**: "PROD-001-A"

#### Category (category)
- **Type**: Select Dropdown or Combo Box
- **Database Column**: `category` (VARCHAR(100))
- **Constraints**:
  - Required (NOT NULL)
  - Predefined list of categories
- **Validation**: Must match predefined categories
- **Tooltip**: "Select product category from list"
- **Allowed Values**: "Electronics", "Software", "Hardware", "Services", etc.
- **Example**: "Electronics"

#### Price (price)
- **Type**: Decimal Number Input
- **Database Column**: `price` (DECIMAL(10,2))
- **Constraints**:
  - Required (NOT NULL)
  - Must be >= 0 (non-negative)
  - Maximum 2 decimal places
  - Maximum value: 99,999.99
- **Validation**: `/^\d+(\.\d{1,2})?$/`
- **Tooltip**: "Selling price (non-negative, max 2 decimal places. Max value: 99,999.99)"
- **Example**: "299.99"

#### Status (status)
- **Type**: Select Dropdown
- **Database Column**: `status` (VARCHAR(20))
- **Constraints**:
  - Required (NOT NULL)
  - Must be one of: 'active', 'inactive', 'discontinued'
  - CHECK constraint enforced at DB level
- **Validation**: Enum validation
- **Tooltip**: "Product status: active (available for sale), inactive (temporarily unavailable), discontinued (no longer sold)"
- **Allowed Values**:
  - "active" - Available for sale
  - "inactive" - Temporarily unavailable
  - "discontinued" - Permanently discontinued

### Optional Fields

#### Description (description)
- **Type**: Text Area
- **Database Column**: `description` (TEXT)
- **Constraints**:
  - Optional (nullable)
  - Maximum length: 1000 characters
- **Validation**: Text only, no HTML/scripts
- **Tooltip**: "Product description (max 1000 characters)"
- **Example**: "High-performance wireless keyboard with backlit keys"

#### Cost Price (cost_price)
- **Type**: Decimal Number Input
- **Database Column**: `cost_price` (DECIMAL(10,2))
- **Constraints**:
  - Optional (nullable)
  - Must be >= 0 if provided
  - Maximum 2 decimal places
- **Validation**: Positive number, max 2 decimals
- **Tooltip**: "Cost to acquire this product (non-negative, max 2 decimal places)"
- **Example**: "150.00"

#### Stock Quantity (stock_quantity)
- **Type**: Number Input (Integer)
- **Database Column**: `stock_quantity` (INTEGER)
- **Constraints**:
  - Optional (nullable)
  - Must be >= 0 (non-negative)
  - Must be whole number (no decimals)
  - Default: 0 if not provided
- **Validation**: Non-negative integer
- **Tooltip**: "Current stock quantity (non-negative whole numbers only)"
- **Example**: "150"

#### Min Stock Level (min_stock_level)
- **Type**: Number Input (Integer)
- **Database Column**: `min_stock_level` (INTEGER)
- **Constraints**:
  - Optional (nullable)
  - Must be >= 0
  - Must be whole number
- **Validation**: Non-negative integer
- **Tooltip**: "Minimum stock level before reorder alert (whole numbers only)"
- **Example**: "10"

#### Reorder Level (reorder_level)
- **Type**: Number Input (Integer)
- **Database Column**: `reorder_level` (INTEGER)
- **Constraints**:
  - Optional (nullable)
  - Must be >= 0
  - Must be whole number
- **Validation**: Non-negative integer
- **Tooltip**: "Stock level that triggers reorder (whole numbers only)"
- **Example**: "20"

#### Unit (unit)
- **Type**: Select Dropdown or Text Input
- **Database Column**: `unit` (VARCHAR(20))
- **Constraints**:
  - Optional (nullable)
  - Predefined list
- **Validation**: Must match predefined list or custom text
- **Tooltip**: "Unit of measurement (pieces, boxes, kg, liters, etc.)"
- **Allowed Values**: "pieces", "boxes", "kg", "liters", "meters", etc.
- **Example**: "pieces"

#### Weight (weight)
- **Type**: Decimal Number Input
- **Database Column**: `weight` (DECIMAL(8,3))
- **Constraints**:
  - Optional (nullable)
  - Must be >= 0
  - Maximum 3 decimal places
- **Validation**: Non-negative decimal
- **Tooltip**: "Product weight (kg, max 3 decimal places)"
- **Example**: "0.5"

#### Tags (tags)
- **Type**: Multi-Select or Tag Input
- **Database Column**: `tags` (TEXT[] or JSONB)
- **Constraints**:
  - Optional (nullable)
  - Array of strings
- **Validation**: Array of strings
- **Tooltip**: "Add relevant tags for easy searching (e.g., wireless, premium, bestseller)"
- **Example**: ["wireless", "premium", "bestseller"]

#### Service Contract Available (service_contract_available)
- **Type**: Toggle/Checkbox
- **Database Column**: `service_contract_available` (BOOLEAN)
- **Constraints**:
  - Optional
  - Default: false
- **Validation**: Boolean
- **Tooltip**: "Check if extended warranty/service contract available"
- **Example**: true

---

## Company Form Fields

### Required Fields

#### Name (name)
- **Type**: Text Input (String)
- **Database Column**: `name` (VARCHAR(255))
- **Constraints**:
  - Required (NOT NULL)
  - Minimum length: 2 characters
  - Maximum length: 255 characters
- **Validation**: Text only, no HTML/scripts
- **Tooltip**: "Enter company name (2-255 characters)"
- **Example**: "Acme Corporation"

#### Industry (industry)
- **Type**: Select Dropdown or Combo Box
- **Database Column**: `industry` (VARCHAR(100))
- **Constraints**:
  - Required (NOT NULL)
  - Predefined list of industries
- **Validation**: Must match predefined industries
- **Tooltip**: "Select industry from list"
- **Allowed Values**: "Technology", "Finance", "Healthcare", "Manufacturing", "Retail", etc.
- **Example**: "Technology"

#### Status (status)
- **Type**: Select Dropdown
- **Database Column**: `status` (VARCHAR(20))
- **Constraints**:
  - Required (NOT NULL)
  - Must be one of: 'active', 'inactive'
- **Validation**: Enum validation
- **Tooltip**: "Company status: active (current customer/partner), inactive (no longer engaged)"
- **Allowed Values**:
  - "active" - Currently active
  - "inactive" - Currently inactive

### Optional Fields

#### Email (email)
- **Type**: Email Input
- **Database Column**: `email` (VARCHAR(255))
- **Constraints**:
  - Optional (nullable)
  - Valid email format
- **Validation**: Email regex pattern
- **Tooltip**: "Company email address (must be valid email format)"
- **Example**: "contact@acme.com"

#### Phone (phone)
- **Type**: Phone Input
- **Database Column**: `phone` (VARCHAR(50))
- **Constraints**:
  - Optional (nullable)
  - Valid phone format
- **Validation**: International phone format
- **Tooltip**: "Company phone number (e.g., +1 (555) 123-4567)"
- **Example**: "+1-555-123-4567"

#### Website (website)
- **Type**: URL Input
- **Database Column**: `website` (VARCHAR(500))
- **Constraints**:
  - Optional (nullable)
  - Valid URL format
- **Validation**: Must be valid URL with protocol
- **Tooltip**: "Company website URL (must start with https:// or http://)"
- **Example**: "https://www.acme.com"

#### Address (address)
- **Type**: Text Area
- **Database Column**: `address` (VARCHAR(500))
- **Constraints**:
  - Optional (nullable)
  - Maximum length: 500 characters
- **Validation**: Text only, no HTML/scripts
- **Tooltip**: "Company address (max 500 characters)"
- **Example**: "123 Main St, Suite 100, New York, NY 10001"

#### Registration Number (registration_number)
- **Type**: Text Input
- **Database Column**: `registration_number` (VARCHAR(50))
- **Constraints**:
  - Optional (nullable)
  - Maximum length: 50 characters
- **Validation**: Text, alphanumeric
- **Tooltip**: "Business registration number (max 50 characters)"
- **Example**: "123456789"

#### Tax ID (tax_id)
- **Type**: Text Input
- **Database Column**: `tax_id` (VARCHAR(50))
- **Constraints**:
  - Optional (nullable)
  - Maximum length: 50 characters
- **Validation**: Text, alphanumeric
- **Tooltip**: "Tax identification number (max 50 characters)"
- **Example**: "98-7654321"

#### Founded Year (founded_year)
- **Type**: Year Input (Number)
- **Database Column**: `founded_year` (INTEGER)
- **Constraints**:
  - Optional (nullable)
  - Must be between 1800 and current year
- **Validation**: Integer between 1800 and current year
- **Tooltip**: "Year company was founded"
- **Example**: "2010"

#### Notes (notes)
- **Type**: Text Area
- **Database Column**: `notes` (TEXT)
- **Constraints**:
  - Optional (nullable)
  - Maximum length: 1000 characters
- **Validation**: Text only, no HTML/scripts
- **Tooltip**: "Additional notes about the company (max 1000 characters)"
- **Example**: "Key partner for enterprise solutions"

---

## Database Constraint Mapping

| Field | DB Type | Constraint | Validation Rule | Error Message |
|-------|---------|-----------|-----------------|----------------|
| Product.name | VARCHAR(255) | NOT NULL | len 2-255 | "Product name must be 2-255 chars" |
| Product.sku | VARCHAR(100) | NOT NULL UNIQUE | alphanumeric, 2-50 | "SKU format invalid" |
| Product.price | DECIMAL(10,2) | NOT NULL CHECK >= 0 | >= 0, 2 decimals | "Price must be non-negative" |
| Product.status | VARCHAR(20) | CHECK IN() | enum | "Status must be active/inactive/discontinued" |
| Product.stock_quantity | INTEGER | CHECK >= 0 | >= 0, integer | "Stock must be non-negative whole number" |
| Company.name | VARCHAR(255) | NOT NULL | len 2-255 | "Company name must be 2-255 chars" |
| Company.industry | VARCHAR(100) | NOT NULL | text | "Industry is required" |
| Company.email | VARCHAR(255) | - | email regex | "Invalid email format" |
| Company.phone | VARCHAR(50) | - | phone regex | "Invalid phone format" |
| Company.website | VARCHAR(500) | - | URL | "Invalid website URL" |

---

## Validation Rules

### Cross-Field Validations

**Product Cost Price vs Selling Price**:
- If both provided, cost_price should be <= price
- Warning: Cost price higher than selling price

**Stock Levels**:
- min_stock_level <= reorder_level (if both provided)
- reorder_level <= max_stock_level (if max_stock_level provided)

**Date Ranges**:
- Founded year <= current year
- Founded year >= 1800

---

## Field Tooltips

### Product Form Tooltips Template

```tsx
<Form.Item
  name="name"
  label="Product Name"
  tooltip="Enter product name (2-255 characters)"
  rules={[
    { required: true, message: 'Product name is required' },
    { min: 2, message: 'Minimum 2 characters' },
    { max: 255, message: 'Maximum 255 characters' },
  ]}
>
  <Input placeholder="e.g., Wireless Keyboard" />
</Form.Item>

<Form.Item
  name="sku"
  label="SKU"
  tooltip="Stock Keeping Unit (2-50 chars, alphanumeric/hyphens/underscores). Must be unique"
  rules={[...]}
>
  <Input placeholder="e.g., PROD-001-A" />
</Form.Item>

<Form.Item
  name="price"
  label="Selling Price"
  tooltip="Price (non-negative, max 2 decimal places. Max value: 99,999.99)"
  rules={[...]}
>
  <InputNumber min={0} step={0.01} precision={2} />
</Form.Item>

<Form.Item
  name="status"
  label="Status"
  tooltip="active: Available for sale | inactive: Temporarily unavailable | discontinued: No longer sold"
  rules={[...]}
>
  <Select options={[...]} />
</Form.Item>
```

### Company Form Tooltips Template

```tsx
<Form.Item
  name="email"
  label="Email"
  tooltip="Company email address (must be valid email format)"
  rules={[...]}
>
  <Input placeholder="e.g., contact@company.com" />
</Form.Item>

<Form.Item
  name="phone"
  label="Phone"
  tooltip="Company phone number (e.g., +1 (555) 123-4567 or 555-123-4567)"
  rules={[...]}
>
  <Input placeholder="+1-555-123-4567" />
</Form.Item>

<Form.Item
  name="website"
  label="Website"
  tooltip="Company website URL (must start with https:// or http://)"
  rules={[...]}
>
  <Input placeholder="https://www.company.com" />
</Form.Item>
```

---

## Implementation Checklist

- [x] All form fields have database column mappings
- [x] All fields have validation rules
- [x] All fields have helpful tooltips
- [x] Constraint violations show clear error messages
- [x] Cross-field validation rules implemented
- [x] Type consistency across all layers
- [x] Sanitization prevents XSS attacks
- [x] Required vs optional fields clearly marked
- [x] Field examples provided for users

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-30  
**Status**: Complete & Production Ready