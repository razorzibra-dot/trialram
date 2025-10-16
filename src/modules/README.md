# Module-Based Architecture

This directory contains the new modular architecture for the CRM application.

## Structure

```
modules/
├── core/                    # Core functionality and shared utilities
│   ├── components/         # Shared UI components
│   ├── hooks/             # Shared custom hooks
│   ├── services/          # Core services (auth, api, etc.)
│   ├── store/             # Global state management
│   ├── types/             # Shared TypeScript types
│   ├── utils/             # Utility functions
│   └── constants/         # Application constants
├── shared/                 # Shared business logic
│   ├── components/        # Business-specific shared components
│   ├── hooks/             # Business-specific hooks
│   ├── services/          # Shared business services
│   └── types/             # Shared business types
├── features/              # Feature modules
│   ├── auth/              # Authentication module
│   ├── customers/         # Customer management
│   ├── sales/             # Sales management
│   ├── contracts/         # Contract management
│   ├── tickets/           # Ticket/Support management
│   ├── dashboard/         # Dashboard module
│   ├── notifications/     # Notification system
│   ├── super-admin/       # Super admin functionality
│   └── settings/          # Application settings
└── layouts/               # Layout components
    ├── tenant/            # Tenant portal layouts
    ├── super-admin/       # Super admin layouts
    └── shared/            # Shared layout components
```

## Module Structure

Each feature module follows this structure:

```
feature-name/
├── components/            # Feature-specific components
│   ├── ui/               # UI components
│   ├── forms/            # Form components
│   └── views/            # Page/view components
├── hooks/                # Feature-specific hooks
├── services/             # Feature-specific services
├── store/                # Feature-specific state
├── types/                # Feature-specific types
├── utils/                # Feature-specific utilities
├── routes/               # Feature routing
└── index.ts              # Module exports
```

## Principles

1. **Separation of Concerns**: Each module has a single responsibility
2. **Dependency Injection**: Services are injected rather than imported directly
3. **Lazy Loading**: Modules are loaded on demand
4. **Type Safety**: Full TypeScript support throughout
5. **Testability**: Each module can be tested in isolation
6. **Reusability**: Shared components and utilities are easily reusable
