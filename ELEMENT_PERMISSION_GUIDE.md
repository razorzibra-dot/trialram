# Element-Level Permission Guide

## Overview
This guide provides comprehensive documentation for the element-level permission system that extends the existing RBAC foundation. The system enables fine-grained control over UI elements, from high-level modules down to individual buttons and form fields.

## Architecture

### Permission Hierarchy
The system implements a hierarchical permission structure:

```
crm:module:contacts:access                    # Module-level access
├── crm:contacts:list:view                    # Feature access
│   ├── crm:contacts:list:button.create:visible    # Element visibility
│   ├── crm:contacts:list:button.export:enabled    # Element state
│   └── crm:contacts:list:filter.search:accessible # Element accessibility
├── crm:contacts:detail:view                  # Feature access
│   ├── crm:contacts:record.{id}:field.email:editable  # Field permissions
│   ├── crm:contacts:record.{id}:field.phone:visible   # Field visibility
│   └── crm:contacts:record.{id}:tab.history:accessible # Tab access
└── crm:contacts:create:access                # Action permissions
```

### Permission Context
All permissions are evaluated within a context that includes:
- **User**: Current user information and roles
- **Tenant**: Tenant-specific constraints
- **Resource**: Target resource (contacts, deals, etc.)
- **Record ID**: Specific record identifier (for record-level permissions)
- **Element Path**: UI element identifier
- **Action**: Desired action (visible, enabled, editable, accessible)
- **Metadata**: Additional context data

## Usage Examples

### Basic Component Usage

```typescript
import { PermissionControlled } from '@/components/common/PermissionControlled';

// Hide/show elements based on permissions
<PermissionControlled
  elementPath="crm:contacts:list:button.create"
  action="visible"
>
  <Button>Create Contact</Button>
</PermissionControlled>

// Enable/disable elements
<PermissionControlled
  elementPath="crm:contacts:list:button.export"
  action="enabled"
  fallback={<Button disabled>Export (No Permission)</Button>}
>
  <Button>Export</Button>
</PermissionControlled>
```

### Hook-Based Usage

```typescript
import { usePermission, useElementPermissions } from '@/hooks/useElementPermissions';

function ContactForm() {
  const canEditEmail = usePermission('crm:contacts:record.{id}:field.email:editable');
  const { hasPermission } = useElementPermissions();

  return (
    <Form>
      <PermissionField
        elementPath="crm:contacts:record.{id}:field.email"
        action="editable"
      >
        <Input
          name="email"
          disabled={!canEditEmail}
          placeholder={canEditEmail ? "Enter email" : "Email editing not permitted"}
        />
      </PermissionField>

      {hasPermission('crm:contacts:record.{id}:tab.history:accessible') && (
        <Tab label="History">...</Tab>
      )}
    </Form>
  );
}
```

### Dynamic Permissions

```typescript
import { dynamicPermissionService } from '@/services/serviceFactory';

// Assign temporary permissions
await dynamicPermissionService.assignTemporaryPermissions(userId, [
  'crm:emergency:access:granted',
  'crm:contacts:field.ssn:visible'
], {
  expiresIn: '1h',
  context: {
    user: currentUser,
    tenant: currentTenant,
    resource: 'contacts',
    metadata: { emergency: true }
  }
});
```

## Permission Patterns

### Module-Level Permissions
```
crm:{module}:{action}                    # e.g., crm:contacts:access
crm:{module}:{feature}:{action}          # e.g., crm:contacts:list:view
```

#### User Management Examples
```
crm:user:list:view:accessible            # render the Users grid
crm:user:list:button.create:visible      # show Create User button
crm:user:list:button.export:visible      # show Export button
crm:user:list:filters:visible            # expose advanced filters
crm:user:list:button.refresh:visible     # allow manual refresh
crm:user.*:button.edit:visible           # enable Edit in per-row menus
crm:user.*:button.resetpassword:visible  # enable Reset Password action
crm:user.*:button.delete:visible         # enable Delete action
```

These tokens are seeded via migration `20251130000002_user_management_element_permissions.sql` so every `supabase db reset` keeps the Users module aligned with the canonical `<app>:<domain>:<resource>[:<scope>][:<action>]` format.

### Element-Level Permissions
```
crm:{module}:{feature}:{element}:{action}  # e.g., crm:contacts:list:button.create:visible
crm:{module}:{feature}:{element}.{property}:{action}  # e.g., crm:contacts:list:filter.search:accessible
```

### Record-Level Permissions
```
crm:{module}:record.{id}:{element}:{action}  # e.g., crm:contacts:record.123:field.email:editable
crm:{module}:record.{id}:{element}.{property}:{action}  # e.g., crm:contacts:record.123:tab.documents:accessible
```

### Dynamic Permissions
```
crm:{department}:{resource}:{action}      # e.g., crm:sales:leads:owner.self:view
crm:{role}:{resource}:{action}            # e.g., crm:manager:team.members:view
crm:{context}:{resource}:{action}         # e.g., crm:emergency:access:granted
```

## Business Rules

### Department-Based Permissions
- **Sales**: Can view/edit leads they own, access sales pipeline
- **Marketing**: Can create campaigns, access analytics
- **Support**: Can edit assigned tickets, resolve complaints
- **Finance**: Can view invoices, process payments
- **HR**: Can manage department users, view HR reports

### Role-Based Permissions
- **Manager**: Can view team members, approve requests
- **Senior**: Can mentor, review code, enforce standards
- **Junior**: Can access training, requires supervision

### Time-Based Permissions
- **Business Hours**: Full access to standard features
- **Outside Hours**: Emergency access only
- **Maintenance Windows**: Restricted access

### Location-Based Permissions
- **Office**: Full resource access
- **Remote**: Standard access with VPN requirements
- **Travel**: Limited access with offline capabilities

## Configuration

### Permission Templates

```json
{
  "contactForm": {
    "fields": {
      "firstName": { "visible": true, "editable": true },
      "lastName": { "visible": true, "editable": true },
      "email": { "visible": true, "editable": true },
      "phone": { "visible": true, "editable": false },
      "ssn": { "visible": false, "editable": false }
    },
    "buttons": {
      "save": { "visible": true, "enabled": true },
      "cancel": { "visible": true, "enabled": true },
      "delete": { "visible": false, "enabled": false }
    }
  }
}
```

### Permission Overrides

```typescript
// Grant temporary access
await rbacService.createPermissionOverride({
  userId: 'user-123',
  permissionId: 'crm:contacts:field.ssn:visible',
  resourceType: 'field',
  resourceId: 'ssn',
  overrideType: 'grant',
  conditions: { emergency: true },
  expiresAt: '2025-12-01T00:00:00Z',
  tenantId: 'tenant-1'
});

// Deny access
await rbacService.createPermissionOverride({
  userId: 'user-456',
  permissionId: 'crm:admin:panel:access',
  resourceType: 'element',
  resourceId: 'admin-panel',
  overrideType: 'deny',
  tenantId: 'tenant-1'
});
```

## Best Practices

### Permission Naming
- Use consistent patterns: `crm:{module}:{feature}:{element}:{action}`
- Use descriptive action names: `visible`, `enabled`, `editable`, `accessible`
- Include context in dynamic permissions: `crm:{department}:{resource}:{constraint}:{action}`

### Component Design
- Always provide fallbacks for denied permissions
- Use loading states during permission evaluation
- Cache permission results to improve performance
- Handle permission errors gracefully

### Security Considerations
- Never expose permission logic to client-side
- Validate permissions on server-side for critical operations
- Use short expiration times for temporary permissions
- Audit all permission changes and evaluations

### Performance Optimization
- Implement caching for frequently checked permissions
- Use bulk permission evaluation for multiple checks
- Lazy load permission evaluations
- Monitor permission evaluation performance

## Migration Guide

### From Basic RBAC
1. Update existing permission checks to use element paths
2. Replace hardcoded role checks with permission evaluations
3. Implement permission contexts for dynamic evaluation
4. Add permission fallbacks for backward compatibility

### Database Migration
1. Run the element permissions migration
2. Seed initial element permissions
3. Update existing role assignments
4. Test permission evaluations

### Code Migration
1. Replace direct role checks with permission hooks
2. Update components to use PermissionControlled wrapper
3. Implement permission contexts in services
4. Add error handling for permission failures

## Troubleshooting

### Common Issues

**Permission Not Evaluated**
- Check if element path follows correct naming convention
- Verify permission exists in database
- Ensure user has required role assignments

**Performance Issues**
- Implement caching for repeated permission checks
- Use bulk evaluation for multiple permissions
- Monitor permission evaluation times

**Context Missing**
- Ensure PermissionContext is properly constructed
- Include all required context properties
- Handle optional context gracefully

**Override Not Working**
- Check override expiration dates
- Verify override conditions are met
- Ensure proper tenant isolation

### Debug Tools

```typescript
// Enable permission debugging
const debugPermissions = true;

if (debugPermissions) {
  console.log('Permission Evaluation:', {
    elementPath,
    action,
    context,
    result,
    evaluationTime: Date.now() - startTime
  });
}
```

## API Reference

### ElementPermissionService
- `evaluateElementPermission(elementPath, action, context)`: Evaluate single permission
- `hasPermission(permission, context)`: Check permission with context
- `validatePermissions(permissions, context)`: Validate multiple permissions

### DynamicPermissionManager
- `evaluateDynamicPermissions(userId, context)`: Get dynamic permissions
- `assignTemporaryPermissions(userId, permissions, options)`: Assign temporary permissions
- `cleanupExpiredPermissions()`: Clean up expired permissions

### Permission Hooks
- `usePermission(elementPath, action)`: Check single permission
- `useElementPermissions()`: Access permission utilities
- `useBulkPermissions(permissions)`: Check multiple permissions

### Permission Components
- `PermissionControlled`: Conditional rendering wrapper
- `PermissionField`: Form field with permission constraints
- `PermissionSection`: Section visibility control

This guide provides the foundation for implementing comprehensive element-level permissions throughout your application. The system is designed to be flexible, performant, and secure while maintaining backward compatibility with existing RBAC implementations.