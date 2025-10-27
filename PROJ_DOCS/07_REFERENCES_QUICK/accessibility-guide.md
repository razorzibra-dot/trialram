# Accessibility Guide for CRM Application

## Overview

This guide documents the accessibility features implemented in the CRM application to ensure WCAG 2.1 AA compliance and provide an inclusive user experience for all users, including those using assistive technologies.

## Key Accessibility Features

### 1. **Keyboard Navigation**
- **Focus Management**: All interactive elements are keyboard accessible with visible focus indicators
- **Tab Order**: Logical tab order throughout the application
- **Skip Links**: Skip to main content links for efficient navigation
- **Arrow Key Navigation**: Implemented for menus, lists, and data tables
- **Escape Key Support**: Close modals and dropdowns with Escape key

### 2. **Screen Reader Support**
- **ARIA Labels**: Comprehensive ARIA labeling for all interactive elements
- **ARIA Roles**: Proper semantic roles for complex UI components
- **ARIA States**: Dynamic state announcements (expanded, selected, etc.)
- **Live Regions**: Real-time announcements for dynamic content changes
- **Semantic HTML**: Proper heading hierarchy and semantic structure

### 3. **Visual Accessibility**
- **Color Contrast**: WCAG AA compliant contrast ratios (4.5:1 minimum)
- **Focus Indicators**: High-contrast focus rings on all interactive elements
- **Color Independence**: Information not conveyed by color alone
- **High Contrast Mode**: Support for Windows High Contrast mode
- **Reduced Motion**: Respects user's motion preferences

### 4. **Form Accessibility**
- **Label Association**: All form fields properly labeled
- **Error Handling**: Clear error messages with ARIA support
- **Required Field Indicators**: Visual and programmatic indication
- **Field Validation**: Real-time validation with screen reader announcements
- **Help Text**: Descriptive help text associated with form fields

## Accessibility Components

### Core Components

#### 1. **AccessibleForm** (`src/components/ui/accessible-form.tsx`)
```typescript
import { AccessibleForm, FormField, FormError, AccessibleLabel } from '@/components/ui/accessible-form'

<AccessibleForm onSubmit={handleSubmit}>
  <FormField>
    <AccessibleLabel required>Email Address</AccessibleLabel>
    <Input 
      type="email" 
      required 
      error={!!errors.email}
      errorMessage={errors.email}
      helperText="We'll never share your email"
    />
  </FormField>
</AccessibleForm>
```

#### 2. **AccessibleModal** (`src/components/ui/accessible-modal.tsx`)
```typescript
import { AccessibleModal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/accessible-modal'

<AccessibleModal 
  open={isOpen} 
  onOpenChange={setIsOpen}
  title="Edit User"
  description="Update user information"
>
  <ModalHeader>Edit User</ModalHeader>
  <ModalBody>
    {/* Modal content */}
  </ModalBody>
  <ModalFooter>
    <Button onClick={handleSave}>Save</Button>
    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
  </ModalFooter>
</AccessibleModal>
```

#### 3. **AccessibleTable** (`src/components/ui/accessible-table.tsx`)
```typescript
import { AccessibleTable, AccessibleTableHeader, AccessibleTableRow, AccessibleTableCell } from '@/components/ui/accessible-table'

<AccessibleTable caption="User management table">
  <thead>
    <tr>
      <AccessibleTableHeader sortable sortDirection="asc" onSort={handleSort}>
        Name
      </AccessibleTableHeader>
      <AccessibleTableHeader>Email</AccessibleTableHeader>
    </tr>
  </thead>
  <tbody>
    {users.map((user, index) => (
      <AccessibleTableRow key={user.id} selectable rowIndex={index}>
        <AccessibleTableCell>{user.name}</AccessibleTableCell>
        <AccessibleTableCell>{user.email}</AccessibleTableCell>
      </AccessibleTableRow>
    ))}
  </tbody>
</AccessibleTable>
```

#### 4. **AccessibleToast** (`src/components/ui/accessible-toast.tsx`)
```typescript
import { useAccessibleToast } from '@/components/ui/accessible-toast'

const { toast } = useAccessibleToast()

// Success notification
toast({
  title: "User created successfully",
  description: "The new user has been added to the system",
  variant: "success"
})

// Error notification
toast({
  title: "Error creating user",
  description: "Please check the form and try again",
  variant: "destructive"
})
```

### Utility Functions

#### Accessibility Utils (`src/utils/accessibility.ts`)

```typescript
import { a11y } from '@/utils/accessibility'

// Focus management
const cleanup = a11y.focus.trapFocus(modalElement)
a11y.focus.restoreFocus(previousElement)

// Screen reader announcements
a11y.announce.success("User saved successfully")
a11y.announce.error("Validation failed")

// Keyboard navigation
const cleanup = a11y.keyboard.handleArrowNavigation(menuElement, {
  vertical: true,
  loop: true
})

// ARIA utilities
a11y.aria.setExpanded(button, true)
a11y.aria.setDescribedBy(input, [helpText, errorMessage])
```

## CSS Accessibility Classes

### Focus Management
```css
.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2;
}

.focus-ring-error {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500 focus-visible:ring-offset-2;
}
```

### Screen Reader Only Content
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Skip Links
```css
.skip-link {
  @apply sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50;
  @apply bg-accent-500 text-white px-4 py-2 rounded-md font-medium;
}
```

## Testing Accessibility

### Automated Testing
- Use axe-core for automated accessibility testing
- Integrate accessibility tests into CI/CD pipeline
- Regular lighthouse accessibility audits

### Manual Testing
1. **Keyboard Navigation**: Test all functionality using only keyboard
2. **Screen Reader**: Test with NVDA, JAWS, or VoiceOver
3. **High Contrast**: Test in Windows High Contrast mode
4. **Zoom**: Test at 200% zoom level
5. **Color Blindness**: Test with color blindness simulators

### Testing Checklist
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and high contrast
- [ ] Screen reader announces all important information
- [ ] Form errors are properly announced
- [ ] Modal focus is trapped and restored
- [ ] Tables have proper headers and captions
- [ ] Images have appropriate alt text
- [ ] Color contrast meets WCAG AA standards
- [ ] Text can be zoomed to 200% without horizontal scrolling

## Browser Support

### Screen Readers
- **Windows**: NVDA, JAWS
- **macOS**: VoiceOver
- **Mobile**: TalkBack (Android), VoiceOver (iOS)

### Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Resources

### WCAG Guidelines
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa)
- [WebAIM Accessibility Checklist](https://webaim.org/standards/wcag/checklist)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

### Screen Reader Testing
- [NVDA Screen Reader](https://www.nvaccess.org/download/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

## Implementation Notes

### Design System Integration
All accessibility features are integrated into the design system with:
- Consistent focus indicators across all components
- Standardized ARIA patterns
- Reusable accessibility utilities
- Comprehensive documentation and examples

### Performance Considerations
- Accessibility features are optimized for performance
- Screen reader announcements are debounced to prevent spam
- Focus management uses efficient DOM queries
- ARIA attributes are updated only when necessary

### Future Enhancements
- Voice control support
- Enhanced keyboard shortcuts
- Better support for cognitive disabilities
- Improved mobile accessibility features
