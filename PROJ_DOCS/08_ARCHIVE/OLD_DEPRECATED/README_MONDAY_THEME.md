# Monday.com Design System Implementation

A comprehensive, production-ready design system inspired by Monday.com's clean SaaS web application interface. This implementation provides a complete set of components, tokens, and configurations for building modern, user-friendly applications.

## 🎨 Design Specifications

### Color System
```css
/* Primary Color */
--primary: #0073EA;           /* Monday.com signature blue */

/* Background Colors */
--background: #F6F7FB;        /* Light gray workspace background */
--background-light: #FFFFFF;  /* Pure white for cards and sidebar */

/* Text Colors */
--text-primary: #323338;      /* Dark gray for headings and primary content */
--text-secondary: #676879;    /* Medium gray for subtext and labels */
--text-light: #B8BCC8;       /* Light gray for placeholders and disabled states */

/* Status Colors (Vibrant & Recognizable) */
--status-success: #00C875;    /* Green - for completed/success states */
--status-warning: #FFD600;    /* Bright Yellow - for in-progress/warning states */
--status-danger: #FF3D57;     /* Bright Red - for stuck/error states */
--status-info: #A358DF;       /* Purple - for medium priority/additional status */
```

### Typography
- **Font Family**: Inter, Roboto, system-ui, sans-serif
- **Size Range**: 13–20px
- **Weights**: 
  - Bold headings (700)
  - Medium subtitles (500-600)
  - Light body text (300-400)

### Layout Components
- **Collapsible left sidebar** with icons/labels
- **Fixed top bar** with search/notifications/profile
- **Flexible main workspace** supporting multiple view modes

### Component Styles
- **Rounded corners**: 6–12px for friendliness
- **Subtle shadows**: Minimal flat UI design
- **Pill-shaped status chips** with vibrant colors
- **Flat inputs** with blue focus highlight
- **Spreadsheet-style tables** with inline editing

## 🚀 Quick Start

### 1. Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#0073EA',
        background: {
          DEFAULT: '#F6F7FB',
          light: '#FFFFFF',
        },
        text: {
          primary: '#323338',
          secondary: '#676879',
        },
        status: {
          success: '#00C875',
          warning: '#FFD600',
          danger: '#FF3D57',
          info: '#A358DF',
        },
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        card: '0 2px 6px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
    },
  },
};
```

### 2. Material UI Theme
```javascript
// theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#0073EA' },
    background: {
      default: '#F6F7FB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#323338',
      secondary: '#676879',
    },
    status: {
      success: '#00C875',
      warning: '#FFD600',
      error: '#FF3D57',
      info: '#A358DF',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, sans-serif',
    h1: { fontWeight: 700, fontSize: '20px' },
    h2: { fontWeight: 600, fontSize: '18px' },
    body1: { fontWeight: 400, fontSize: '14px' },
    body2: { fontWeight: 300, fontSize: '13px' },
  },
  shape: { borderRadius: 8 },
  shadows: ['none', '0 2px 6px rgba(0,0,0,0.08)'],
});

export default theme;
```

## 📁 File Structure

```
src/
├── theme/
│   ├── monday-theme.ts      # Complete theme configuration
│   └── mui-theme.ts         # Material UI theme
├── components/
│   ├── ui/
│   │   ├── badge.tsx        # Status badges and pills
│   │   ├── button.tsx       # Monday.com style buttons
│   │   ├── card.tsx         # Cards with hover effects
│   │   ├── input.tsx        # Flat inputs with focus highlights
│   │   ├── monday-table.tsx # Spreadsheet-style tables
│   │   └── view-modes.tsx   # Multiple workspace views
│   └── layout/
│       ├── DashboardLayout.tsx     # Main layout with sidebar
│       └── SuperAdminLayout.tsx    # Admin portal layout
├── pages/
└── index.css               # CSS variables and utilities
```

## 🎯 Key Features

### ✅ Complete Color System
- Monday.com's exact color specifications
- Vibrant status colors for quick recognition
- Consistent text hierarchy
- Proper contrast ratios (WCAG AA compliant)

### ✅ Typography Scale
- Inter/Roboto font family
- 13-20px size range as specified
- Bold headings, medium subtitles, light body text
- Optimized line heights and letter spacing

### ✅ Layout Components
- **Collapsible Sidebar**: Icons + labels, Monday.com styling
- **Fixed Top Bar**: Search, notifications, profile avatar
- **Flexible Workspace**: Grid, kanban, timeline, dashboard views
- **Responsive Design**: Mobile-friendly breakpoints

### ✅ UI Components
- **Status Badges**: Pill-shaped with vibrant colors
- **Buttons**: Rounded (6-12px), primary blue, secondary outline
- **Form Controls**: Flat design with blue focus highlights
- **Tables**: Spreadsheet-style with inline editing
- **Cards**: Subtle shadows with hover effects

### ✅ Micro-interactions
- **Hover Effects**: Light gray/blue highlights
- **Smooth Transitions**: 200ms duration for all interactions
- **Drag-and-Drop**: Visual feedback animations
- **Loading States**: Pulse and shimmer effects

## 🎪 Demo & Examples



### Component Usage
```tsx
// Status Badges
<StatusBadge status="working" />
<PriorityBadge priority="high" />

// Buttons
<Button>Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>

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

## 🔧 Development

### Prerequisites
- Node.js 16+
- React 18+
- TypeScript
- Tailwind CSS
- Material UI (optional)

### Installation
```bash
npm install
npm run dev
```

### Building
```bash
npm run build
```

## 📚 Documentation

- **Complete Design Guide**: `docs/MONDAY_DESIGN_SYSTEM.md`
- **Component API**: Each component includes TypeScript interfaces
- **Theme Configuration**: `src/theme/monday-theme.ts`


## 🎨 Design Principles

1. **Clean & Modern**: Minimal design with strategic use of whitespace
2. **Flat Design**: Subtle shadows only for depth and hierarchy
3. **Consistent**: Unified look and feel across all components
4. **Accessible**: WCAG AA compliant with proper focus management
5. **Responsive**: Mobile-first approach with flexible layouts
6. **Performance**: Optimized CSS with minimal bundle size

## 🌟 What's Included

✅ **Exact Monday.com color specifications**  
✅ **Complete typography scale (13-20px)**  
✅ **Collapsible sidebar with icons/labels**  
✅ **Fixed top bar with search/notifications/profile**  
✅ **Multiple workspace views (grid, kanban, timeline, dashboard)**  
✅ **Pill-shaped status labels with vibrant colors**  
✅ **Rounded buttons (primary blue, secondary outline)**  
✅ **Flat inputs with blue focus highlights**  
✅ **Spreadsheet-style tables with inline editing**  
✅ **Smooth hover highlights and drag-and-drop animations**  
✅ **Consistent 6-12px rounded corners**  
✅ **Subtle shadows and spacious whitespace**  
✅ **Complete Tailwind and Material UI configurations**  

This implementation provides everything needed to create a Monday.com-inspired SaaS application with a professional, clean, and highly user-friendly interface.
