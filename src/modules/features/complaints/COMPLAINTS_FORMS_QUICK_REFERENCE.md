# Complaints Form Enhancement - Quick Reference Guide
## Developer Quick Start & Code Snippets

**Version**: 1.0.0  
**Date**: 2025-01-30

---

## 🚀 Quick Start

### Import Component
```typescript
import { ComplaintsFormPanel } from '@/modules/features/complaints/components/ComplaintsFormPanel';
```

### Basic Usage
```typescript
const [showForm, setShowForm] = useState(false);
const [selectedComplaint, setSelectedComplaint] = useState(null);

<ComplaintsFormPanel
  complaint={selectedComplaint}
  mode={selectedComplaint ? 'edit' : 'create'}
  isOpen={showForm}
  onClose={() => setShowForm(false)}
/>
```

### Props Reference
```typescript
interface ComplaintsFormPanelProps {
  complaint: Complaint | null;        // null for create, Complaint object for edit
  mode: 'create' | 'edit';            // Form mode
  isOpen: boolean;                    // Control drawer visibility
  onClose: () => void;                // Callback when closing
}
```

---

## 📋 Common Code Patterns

### 1. Open Create Form
```typescript
const handleCreateComplaint = () => {
  setSelectedComplaint(null);
  setShowForm(true);
};

// Usage in button
<Button onClick={handleCreateComplaint} type="primary">
  Create Complaint
</Button>
```

### 2. Open Edit Form
```typescript
const handleEditComplaint = (complaint: Complaint) => {
  setSelectedComplaint(complaint);
  setShowForm(true);
};

// Usage in table row
<Button onClick={() => handleEditComplaint(complaint)}>
  Edit
</Button>
```

### 3. Close and Refresh
```typescript
const handleFormClose = async () => {
  setShowForm(false);
  setSelectedComplaint(null);
  // Refresh complaints list
  await refetchComplaints();
};
```

### 4. Complete Page Integration
```typescript
export const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedComplaint(null);
  };

  return (
    <>
      <Button onClick={() => handleCreateComplaint()}>
        Create Complaint
      </Button>
      
      <ComplaintsFormPanel
        complaint={selectedComplaint}
        mode={selectedComplaint ? 'edit' : 'create'}
        isOpen={showForm}
        onClose={handleFormClose}
      />
    </>
  );
};
```

---

## ⚙️ SLA Configuration

### Add Custom SLA
```typescript
// In ComplaintsFormPanel.tsx - modify COMPLAINT_TYPES

const COMPLAINT_TYPES = [
  { 
    label: 'Emergency Support',     // Display name
    value: 'emergency',              // Used in data
    color: 'red',                    // Color code
    department: 'Urgent Team',       // Auto-assigned department
    slaResponse: '15 minutes',        // Response time SLA
    slaResolution: '2 hours',        // Resolution time SLA
    icon: <ThunderboltOutlined />
  },
  // Add more types
];
```

### Update Priority SLA
```typescript
// In ComplaintsFormPanel.tsx - modify PRIORITIES

const PRIORITIES = [
  { 
    label: 'Critical',
    value: 'critical',
    color: 'red',
    responseTime: '15 minutes',      // ← Change this
    resolutionTime: '2 hours',       // ← Change this
    icon: '🔥'
  },
  // Update more priorities
];
```

---

## 🏷️ Tag Management

### Suggested Tags Configuration
```typescript
// In ComplaintsFormPanel.tsx

const SUGGESTED_TAGS = [
  'urgent_response_needed',
  'customer_escalation',
  'warranty_claim',
  'requires_parts',
  'requires_technician_visit',
  'documentation_needed',
  'customer_training',
  'follow_up_required',
  'critical_system',
  'multiple_units',
];

// Add more tags as needed
```

### Add Tag Dynamically
```typescript
const [tags, setTags] = useState<string[]>([]);

const addTag = (tag: string) => {
  if (!tags.includes(tag)) {
    setTags([...tags, tag]);
  }
};

// Usage
addTag('urgent_response_needed');
```

### Remove Tag
```typescript
const removeTag = (tag: string) => {
  setTags(tags.filter(t => t !== tag));
};

// Usage
removeTag('urgent_response_needed');
```

---

## ✅ Validation Rules

### Title Validation
```typescript
<Form.Item
  label="Title"
  name="title"
  rules={[
    { required: true, message: 'Please enter complaint title' },
    { min: 5, message: 'Title must be at least 5 characters' },
    { max: 100, message: 'Title must not exceed 100 characters' },
  ]}
>
  <Input showCount maxLength={100} />
</Form.Item>
```

### Description Validation
```typescript
<Form.Item
  label="Detailed Description"
  name="description"
  rules={[
    { required: true, message: 'Please enter complaint description' },
    { min: 10, message: 'Description must be at least 10 characters' },
    { max: 1000, message: 'Description must not exceed 1000 characters' },
  ]}
>
  <Input.TextArea rows={5} showCount maxLength={1000} />
</Form.Item>
```

### Custom Validation
```typescript
<Form.Item
  name="custom_field"
  rules={[
    {
      validator: (_, value) => {
        if (!value || checkCondition(value)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('Custom error message'));
      },
    },
  ]}
>
  <Input />
</Form.Item>
```

---

## 🎨 State Management

### Priority State
```typescript
const [priority, setPriority] = useState<string>('medium');

// Usage
<Select value={priority} onChange={setPriority} />
```

### Complaint Type State
```typescript
const [complaintType, setComplaintType] = useState<string>('breakdown');

// Usage
<Select value={complaintType} onChange={setComplaintType} />
```

### Tags State
```typescript
const [tags, setTags] = useState<string[]>([]);

// Clear all tags
const clearTags = () => setTags([]);

// Reset to initial
const resetTags = () => setTags(complaint?.tags || []);
```

### Form Instance
```typescript
const [form] = Form.useForm();

// Reset form
form.resetFields();

// Get values
const values = form.getFieldsValue();

// Set values
form.setFieldsValue({ title: 'New title' });
```

---

## 🔄 Form Submission

### Handle Submit
```typescript
const handleSubmit = useCallback(async (values: any) => {
  try {
    setIsSubmitting(true);
    
    const submitData = {
      ...values,
      complaint_number: complaintNumber,
      tags: tags,
      assigned_department: assignedDepartment,
    };

    // Call service
    if (mode === 'create') {
      await complaintService.createComplaint(submitData);
    } else {
      await complaintService.updateComplaint(complaint.id, submitData);
    }

    message.success('Complaint saved successfully');
    onClose();
  } catch (error) {
    message.error('Failed to save complaint');
  } finally {
    setIsSubmitting(false);
  }
}, [complaintNumber, tags, assignedDepartment, mode, complaint?.id]);
```

### Error Handling
```typescript
const handleSubmit = async (values: any) => {
  try {
    // Submission logic
  } catch (error) {
    if (error instanceof ValidationError) {
      message.error('Please check form fields');
    } else if (error instanceof APIError) {
      message.error('Server error - please retry');
    } else {
      message.error('Unknown error occurred');
    }
  }
};
```

---

## 🧮 SLA Calculations

### Calculate Response Deadline
```typescript
const responseDeadline = useMemo(() => {
  const priorityConfig = PRIORITIES.find(p => p.value === priority);
  const hours = parseInt(priorityConfig?.responseTime.split(' ')[0] || '24');
  return dayjs().add(hours, 'hours');
}, [priority]);
```

### Calculate Resolution Deadline
```typescript
const resolutionDeadline = useMemo(() => {
  const typeConfig = COMPLAINT_TYPES.find(t => t.value === complaintType);
  const days = parseInt(typeConfig?.slaResolution.split(' ')[0] || '7');
  return dayjs().add(days, 'days');
}, [complaintType]);
```

---

## 🎯 Department Routing

### Get Department by Type
```typescript
const assignedDepartment = useMemo(() => {
  const typeConfig = COMPLAINT_TYPES.find(t => t.value === complaintType);
  return typeConfig?.department || 'Support Team';
}, [complaintType]);
```

### Get Department Config
```typescript
const getDepartmentConfig = (type: string) => {
  return COMPLAINT_TYPES.find(t => t.value === type);
};

// Usage
const config = getDepartmentConfig('breakdown');
console.log(config?.department); // "Maintenance Team"
```

---

## 📱 Responsive Design

### Mobile-First Columns
```typescript
// Use xs, sm, md, lg for different screen sizes
<Row gutter={16}>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Input />
  </Col>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Select />
  </Col>
</Row>
```

### Responsive Drawer Width
```typescript
// Adjust width based on screen size
<Drawer
  width={window.innerWidth < 768 ? '100%' : 800}
  // ... other props
/>
```

---

## 🔒 RBAC Integration

### Permission Checks
```typescript
import { useAuth } from '@/contexts/AuthContext';

export const ComplaintsPage = () => {
  const { hasPermission } = useAuth();

  if (!hasPermission('complaints:create')) {
    return <Empty description="Not authorized to create complaints" />;
  }

  return <ComplaintsFormPanel ... />;
};
```

### Conditional Features
```typescript
// Show certain fields only for managers
{hasPermission('complaints:manage_sla') && (
  <Form.Item label="SLA Override" name="sla_override">
    <DatePicker />
  </Form.Item>
)}
```

---

## 🐛 Debugging Tips

### Log Form Values
```typescript
const handleSubmit = (values: any) => {
  console.log('Form values:', values);
  console.log('Tags:', tags);
  console.log('Priority:', priority);
  console.log('Complaint Number:', complaintNumber);
};
```

### Check State Updates
```typescript
useEffect(() => {
  console.log('Priority changed:', priority);
  console.log('SLA Details:', slaDeatails);
}, [priority, slaDeatails]);
```

### Monitor Form Instance
```typescript
<Form
  form={form}
  onValuesChange={(_, values) => {
    console.log('Form changed:', values);
  }}
/>
```

---

## 📊 Performance Tips

### Optimize Memoization
```typescript
// Good: Memoize expensive calculations
const slaDeatails = useMemo(() => {
  return expensiveCalculation(complaintType, priority);
}, [complaintType, priority]);

// Good: Memoize callbacks
const handleSubmit = useCallback(async (values) => {
  // submission logic
}, [complaintNumber, tags]);
```

### Prevent Unnecessary Renders
```typescript
// Use React.memo for child components
export const MyComponent = React.memo(({ prop1, prop2 }) => {
  return <div>{prop1} {prop2}</div>;
});
```

---

## 🎓 Best Practices

1. **Always validate required fields** before submission
2. **Show SLA clearly** to users so they understand expectations
3. **Route to correct department** automatically to reduce errors
4. **Use tags for categorization** for better reporting
5. **Test on mobile** - responsive design is critical
6. **Provide helpful placeholders** to guide users
7. **Show character counters** for text fields
8. **Use pro tips** to educate users about best practices
9. **Handle errors gracefully** with user-friendly messages
10. **Performance test** especially with large tag lists

---

## 🔗 Related Files

- [Complaints Module](./DOC.md)
- [Main Enhancement Docs](./COMPLAINTS_FORMS_ENHANCEMENT.md)
- [Comparison Guide](./COMPLAINTS_ENHANCEMENT_COMPARISON.md)
- [Component Code](./components/ComplaintsFormPanel.tsx)

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-30  
**Status**: Production Ready ✅