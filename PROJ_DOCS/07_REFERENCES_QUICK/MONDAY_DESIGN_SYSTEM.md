# Monday.com Design System

A comprehensive design system inspired by Monday.com's modern SaaS interface, implemented for the CRM Portal application.

## Overview

This design system provides a clean, modern, and highly user-friendly interface that follows Monday.com's design principles:

- **Modern & Clean**: Minimal design with strong use of whitespace
- **Flat Design**: Subtle shadows only for depth (cards, modals)
- **Rounded Corners**: 6–12px for friendliness
- **Consistent**: Unified look and feel across all pages and portals

## Color Palette

### Primary Colors
- **Primary Blue**: `#0073EA` - Monday.com's signature blue for highlights, buttons, links
- **Workspace Background**: `#F6F7FB` - Light gray workspace background
- **Pure White**: `#FFFFFF` - Card and sidebar backgrounds

### Status Colors (Vibrant & Recognizable)
- **Success Green**: `#00C875` - For completed/success states
- **Warning Yellow**: `#FDAB3D` - For in-progress/warning states  
- **Error Red**: `#E2445C` - For stuck/error states
- **Purple**: `#A25DDC` - For medium priority/additional status

### Text Colors
- **Primary Text**: `#323338` - Dark gray for headings and primary content
- **Secondary Text**: `#676879` - Medium gray for subtext and labels
- **Light Text**: `#B8BCC8` - Light gray for placeholders and disabled states

## Typography

### Font Family
- **Primary**: Inter (clean sans-serif)
- **Fallback**: Roboto, system fonts

### Hierarchy
- **Headings**: Bold, 16–20px
- **Subheadings**: Medium, 14–16px  
- **Body Text**: Regular, 13–14px
- **Small Text**: 12px for labels and captions

### Features
- Consistent letter spacing and line height ~1.5 for readability
- Font feature settings for ligatures and kerning
- Optimized for both desktop and mobile

## Layout & Navigation

### Sidebar (Left)
- **Collapsible**: Icons + labels, can be collapsed to icons only
- **Monday.com Style**: Clean white background with rounded navigation items
- **Active State**: Blue background with white text for current page
- **Hover State**: Light gray background on hover
- **Sections**: Grouped navigation with section headers

### Top Bar
- **Fixed Position**: Always visible at top
- **Search**: Prominent search bar in center with Monday.com styling
- **Profile**: Avatar and dropdown on right
- **Notifications**: Bell icon for alerts

### Main Workspace
- **Flexible Grid**: Supports multiple view modes
- **Background**: Light gray workspace background (`#F6F7FB`)
- **Content Cards**: White cards with subtle shadows

## Components

### Buttons
- **Rounded**: 8px border radius for modern look
- **Primary**: Blue background (`#0073EA`) with white text
- **Secondary**: Blue outline with blue text on white background
- **Ghost**: Transparent with gray text, light gray hover
- **Sizes**: Small (32px), Default (40px), Large (48px)
- **Hover Effects**: Subtle shadow and scale animation

### Status Badges
- **Pill-shaped**: Fully rounded corners for friendly appearance
- **Vibrant Colors**: High contrast colors for quick recognition
- **Status Types**:
  - Done: Green (`#00C875`)
  - Working: Yellow (`#FDAB3D`) 
  - Stuck: Red (`#E2445C`)
  - Pending: Gray
- **Priority Types**:
  - Critical: Red with emoji
  - High: Yellow with emoji
  - Medium: Purple with emoji
  - Low: Green with emoji

### Form Controls

#### Inputs
- **Flat Design**: White background with subtle border
- **Focus State**: Blue ring and border (`#0073EA`)
- **Rounded**: 8px border radius
- **Placeholder**: Light gray text (`#B8BCC8`)

#### Selects
- **Consistent Styling**: Matches input design
- **Dropdown**: Clean white background with subtle shadow
- **Hover States**: Light background on option hover

#### Textareas
- **Resizable**: Vertical resize only
- **Consistent**: Same styling as inputs
- **Minimum Height**: 120px for usability

### Tables (Spreadsheet-style)

#### Monday Table Component
- **Spreadsheet Feel**: Similar to Monday.com's main interface
- **Inline Editing**: Click to edit cells with save/cancel buttons
- **Sortable Headers**: Click headers to sort with visual indicators
- **Row Selection**: Checkboxes for bulk actions
- **Status Cells**: Integrated status badges
- **Actions**: Dropdown menu for row actions
- **Hover Effects**: Light gray background on row hover

#### Features
- Resizable columns
- Fixed header on scroll
- Mobile responsive with card layout
- Keyboard navigation support

### View Modes

#### Table View
- **Spreadsheet-style**: Grid layout with inline editing
- **Sortable**: Click headers to sort columns
- **Filterable**: Search and filter capabilities

#### Kanban View
- **Card-based**: Drag-and-drop cards between columns
- **Color-coded**: Column headers with status colors
- **Compact Cards**: Essential info with status badges

#### Timeline View
- **Gantt-style**: Horizontal progress bars
- **Progress Indicators**: Visual progress with percentages
- **Date Ranges**: Start and end dates clearly shown

#### Dashboard View
- **Widget-based**: Modular cards with charts and stats
- **Responsive Grid**: Adapts to screen size
- **Interactive**: Hover effects and click actions

## Micro-interactions

### Hover Effects
- **Cards**: Subtle lift and shadow increase
- **Buttons**: Shadow and slight scale animation
- **Table Rows**: Light gray background
- **Navigation**: Smooth color transitions

### Animations
- **Fade In**: Content appears with opacity and slight upward movement
- **Scale In**: Components scale from 95% to 100% on load
- **Slide Up**: Content slides up from below
- **Bounce**: Subtle bounce for success actions

### Loading States
- **Pulse**: Gentle opacity animation for loading content
- **Shimmer**: Gradient animation for skeleton loading
- **Spinners**: Consistent loading indicators

## Accessibility

### Focus Management
- **Visible Focus**: Blue ring around focused elements
- **Keyboard Navigation**: Tab order follows logical flow
- **Skip Links**: Jump to main content

### Color Contrast
- **WCAG AA**: All text meets contrast requirements
- **Status Colors**: High contrast for visibility
- **Hover States**: Clear visual feedback

### Screen Readers
- **ARIA Labels**: Proper labeling for interactive elements
- **Semantic HTML**: Correct heading hierarchy and landmarks
- **Alt Text**: Descriptive text for images and icons

## Usage Guidelines

### Do's
- ✅ Use consistent spacing (4px, 8px, 16px, 24px, 32px)
- ✅ Apply hover effects to interactive elements
- ✅ Use status colors consistently across the application
- ✅ Maintain the rounded corner style (6-12px)
- ✅ Keep the flat design aesthetic with minimal shadows

### Don'ts
- ❌ Mix different border radius values inconsistently
- ❌ Use colors outside the defined palette
- ❌ Create heavy shadows or 3D effects
- ❌ Ignore hover states on interactive elements
- ❌ Use different font weights arbitrarily

## Implementation

### CSS Classes
The design system includes utility classes for common patterns:

```css
.monday-hover          /* Standard hover effect */
.monday-card-hover     /* Enhanced card hover */
.monday-button-hover   /* Button hover animation */
.monday-fade-in        /* Fade in animation */
.monday-slide-up       /* Slide up animation */
.monday-scale-in       /* Scale in animation */
```

### Component Usage
```tsx
// Status Badge
<StatusBadge status="working" />
<PriorityBadge priority="high" />

// Monday Table
<MondayTable>
  <MondayTableHeader>
    <MondayTableRow>
      <MondayTableHead sortable>Name</MondayTableHead>
      <MondayTableHead>Status</MondayTableHead>
    </MondayTableRow>
  </MondayTableHeader>
  <MondayTableBody>
    <MondayTableRow>
      <MondayTableCell editable>Project Name</MondayTableCell>
      <MondayTableStatusCell status="working" />
    </MondayTableRow>
  </MondayTableBody>
</MondayTable>

// View Modes
<ViewModeSelector 
  currentView={view} 
  onViewChange={setView} 
/>
<KanbanBoard columns={data} />
<TimelineView items={data} />
<DashboardView widgets={data} />
```



## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Optimized CSS with minimal bundle size
- Hardware-accelerated animations
- Efficient re-renders with React optimization
- Lazy loading for complex components
