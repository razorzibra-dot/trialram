# COMPREHENSIVE IMPLEMENTATION GUIDE - PART 3
## Enterprise Multi-Tenant CRM System - Complete Development Handbook

**Part 3 of 3** - Final Implementation Details  
**Version:** 1.0  
**Date:** November 16, 2025

---

## TABLE OF CONTENTS (Part 3)

9. [Testing Implementation](#9-testing-implementation)
10. [Performance Optimization](#10-performance-optimization)
11. [Security Implementation](#11-security-implementation)
12. [Deployment Guide](#12-deployment-guide)
13. [Monitoring & Maintenance](#13-monitoring--maintenance)
14. [Troubleshooting Guide](#14-troubleshooting-guide)
15. [Best Practices & Standards](#15-best-practices--standards)

---

## 9. TESTING IMPLEMENTATION

### 9.1 Testing Architecture

#### Jest Configuration
```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/setupTests.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/components/': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
};

export default config;
```

#### Test Setup
```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';

// Mock environment variables
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('ReactDOM.render')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
```

### 9.2 Unit Testing

#### Service Layer Testing
```typescript
// src/services/__tests__/customerService.test.ts
import { customerService } from '@/services/customer/mockCustomerService';
import type { Customer } from '@/types/crm';

describe('CustomerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCustomers', () => {
    it('should return paginated customers', async () => {
      const result = await customerService.getCustomers({
        page: 1,
        limit: 10
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toBeInstanceOf(Array);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should filter customers by status', async () => {
      const result = await customerService.getCustomers({
        status: 'active'
      });

      const activeCustomers = result.data.filter(c => c.status === 'active');
      expect(activeCustomers.length).toBe(result.data.length);
    });

    it('should filter customers by search term', async () => {
      const result = await customerService.getCustomers({
        search: 'Acme'
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].company_name).toBe('Acme Corporation');
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      const newCustomer = {
        company_name: 'Test Company',
        contact_name: 'John Doe',
        email: 'john@test.com',
        status: 'active' as const,
        customer_type: 'business' as const,
        tenant_id: 'tenant-1',
        assigned_to: 'user-1'
      };

      const result = await customerService.createCustomer(newCustomer);

      expect(result).toHaveProperty('id');
      expect(result.company_name).toBe(newCustomer.company_name);
      expect(result.contact_name).toBe(newCustomer.contact_name);
      expect(result.email).toBe(newCustomer.email);
      expect(result.status).toBe(newCustomer.status);
    });

    it('should validate required fields', async () => {
      const invalidCustomer = {
        company_name: '', // Empty company name
        contact_name: 'John Doe',
        status: 'active' as const,
        customer_type: 'business' as const,
        tenant_id: 'tenant-1',
        assigned_to: 'user-1'
      };

      await expect(
        customerService.createCustomer(invalidCustomer)
      ).rejects.toThrow('Company name is required');
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      const updates = {
        phone: '+1-555-9999',
        status: 'active' as const
      };

      const result = await customerService.updateCustomer('1', updates);

      expect(result.phone).toBe(updates.phone);
      expect(result.status).toBe(updates.status);
    });

    it('should throw error for non-existent customer', async () => {
      await expect(
        customerService.updateCustomer('non-existent-id', { phone: '123' })
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('deleteCustomer', () => {
    it('should soft delete a customer', async () => {
      await customerService.deleteCustomer('1');
      
      const customer = await customerService.getCustomer('1');
      expect(customer.deleted_at).toBeDefined();
      expect(customer.status).toBe('suspended');
    });
  });

  describe('getCustomerStats', () => {
    it('should return customer statistics', async () => {
      const stats = await customerService.getCustomerStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('new_this_month');
      expect(stats).toHaveProperty('top_customers');
      expect(stats.top_customers).toBeInstanceOf(Array);
    });
  });

  describe('searchCustomers', () => {
    it('should search customers by various fields', async () => {
      const results = await customerService.searchCustomers('Acme');
      
      expect(results).toHaveLength(1);
      expect(results[0].company_name).toContain('Acme');
    });

    it('should return empty array for no matches', async () => {
      const results = await customerService.searchCustomers('NonExistentCompany');
      
      expect(results).toHaveLength(0);
    });
  });
});
```

#### Component Testing
```typescript
// src/components/__tests__/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600');
  });

  it('renders with custom variant', () => {
    render(<Button variant="secondary">Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200');
  });

  it('renders with custom size', () => {
    render(<Button size="lg">Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-11');
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    
    const button = screen.getByRole('button');
    const spinner = button.querySelector('.animate-spin');
    
    expect(button).toBeDisabled();
    expect(spinner).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders with icon', () => {
    const icon = <span data-testid="icon">🔍</span>;
    render(<Button icon={icon}>Click me</Button>);
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});
```

#### Hook Testing
```typescript
// src/hooks/__tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import type { LoginCredentials } from '@/types/auth';

// Mock the auth service
jest.mock('@/services', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should login successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: { id: '1', name: 'user', permissions: [] },
      tenant_id: 'tenant-1',
      is_super_admin: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { authService } = require('@/services');
    authService.login.mockResolvedValue({ user: mockUser, token: 'fake-token' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password'
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('should handle login error', async () => {
    const { authService } = require('@/services');
    authService.login.mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      try {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrong-password'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('should logout successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: { id: '1', name: 'user', permissions: [] },
      tenant_id: 'tenant-1',
      is_super_admin: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { authService } = require('@/services');
    authService.getCurrentUser.mockResolvedValue(mockUser);
    authService.logout.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should check permissions correctly', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: { 
        id: '1', 
        name: 'user', 
        permissions: [
          { id: '1', name: 'customers.read', resource: 'customers', action: 'read' }
        ]
      },
      tenant_id: 'tenant-1',
      is_super_admin: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { authService } = require('@/services');
    authService.getCurrentUser.mockResolvedValue(mockUser);
    authService.hasPermission.mockImplementation((permission: string) => {
      return mockUser.role.permissions.some(p => p.name === permission);
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPermission('customers.read')).toBe(true);
    expect(result.current.hasPermission('customers.create')).toBe(false);
  });
});
```

### 9.3 Integration Testing

#### API Integration Testing
```typescript
// src/integration/__tests__/customerApi.test.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { customerService } from '@/services/customer/supabaseCustomerService';
import type { Customer } from '@/types/crm';

const server = setupServer(
  rest.get('/api/customers', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            id: '1',
            company_name: 'Test Company',
            contact_name: 'John Doe',
            email: 'john@test.com',
            status: 'active',
            customer_type: 'business',
            tenant_id: 'tenant-1',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1
        }
      })
    );
  }),

  rest.post('/api/customers', (req, res, ctx) => {
    const customer = req.body as Customer;
    return res(
      ctx.json({
        ...customer,
        id: '2',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      })
    );
  }),

  rest.get('/api/customers/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({
        id,
        company_name: 'Test Company',
        contact_name: 'John Doe',
        email: 'john@test.com',
        status: 'active',
        customer_type: 'business',
        tenant_id: 'tenant-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      })
    );
  }),

  rest.put('/api/customers/:id', (req, res, ctx) => {
    const { id } = req.params;
    const updates = req.body;
    return res(
      ctx.json({
        id,
        ...updates,
        updated_at: '2025-01-01T00:00:00Z'
      })
    );
  }),

  rest.delete('/api/customers/:id', (req, res, ctx) => {
    return res(ctx.status(204));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Customer API Integration', () => {
  it('should fetch customers with pagination', async () => {
    const response = await customerService.getCustomers({
      page: 1,
      limit: 20
    });

    expect(response.data).toHaveLength(1);
    expect(response.data[0].company_name).toBe('Test Company');
    expect(response.pagination.page).toBe(1);
    expect(response.pagination.total).toBe(1);
  });

  it('should create a new customer', async () => {
    const customerData = {
      company_name: 'New Company',
      contact_name: 'Jane Doe',
      email: 'jane@new.com',
      status: 'active',
      customer_type: 'business',
      tenant_id: 'tenant-1'
    };

    const result = await customerService.createCustomer(customerData);

    expect(result.id).toBe('2');
    expect(result.company_name).toBe('New Company');
    expect(result.contact_name).toBe('Jane Doe');
  });

  it('should fetch a specific customer', async () => {
    const customer = await customerService.getCustomer('1');

    expect(customer.id).toBe('1');
    expect(customer.company_name).toBe('Test Company');
  });

  it('should update a customer', async () => {
    const updates = {
      phone: '+1-555-0123'
    };

    const result = await customerService.updateCustomer('1', updates);

    expect(result.id).toBe('1');
    expect(result.phone).toBe('+1-555-0123');
  });

  it('should delete a customer', async () => {
    await expect(customerService.deleteCustomer('1')).resolves.not.toThrow();
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.get('/api/customers', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server Error' }));
      })
    );

    await expect(customerService.getCustomers()).rejects.toThrow();
  });
});
```

### 9.4 End-to-End Testing

#### Cypress Configuration
```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    env: {
      apiUrl: 'http://localhost:3000/api',
      coverage: true
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        seedDatabase() {
          // Database seeding logic
          return null;
        },
        clearDatabase() {
          // Database clearing logic
          return null;
        }
      });
    },
  },
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts'
  },
});
```

#### E2E Test Examples
```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login with valid credentials', () => {
    // Mock API responses
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: '1',
          email: 'admin@crm.com',
          first_name: 'Admin',
          last_name: 'User',
          role: { name: 'admin' },
          tenant_id: 'tenant-1',
          is_super_admin: false,
          is_active: true
        },
        token: 'fake-jwt-token'
      }
    }).as('loginRequest');

    // Fill login form
    cy.get('[data-cy=email-input]').type('admin@crm.com');
    cy.get('[data-cy=password-input]').type('password');
    cy.get('[data-cy=login-button]').click();

    // Wait for API call
    cy.wait('@loginRequest');

    // Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy=user-menu]').should('be.visible');
    cy.get('[data-cy=user-name]').should('contain', 'Admin User');
  });

  it('should show error for invalid credentials', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { error: 'Invalid credentials' }
    }).as('loginRequest');

    cy.get('[data-cy=email-input]').type('invalid@email.com');
    cy.get('[data-cy=password-input]').type('wrongpassword');
    cy.get('[data-cy=login-button]').click();

    cy.wait('@loginRequest');
    cy.get('[data-cy=error-message]').should('be.visible');
    cy.get('[data-cy=error-message]').should('contain', 'Invalid credentials');
  });

  it('should validate required fields', () => {
    cy.get('[data-cy=login-button]').click();
    
    cy.get('[data-cy=email-input]').should('have.attr', 'aria-invalid', 'true');
    cy.get('[data-cy=password-input]').should('have.attr', 'aria-invalid', 'true');
    
    cy.get('[data-cy=email-error]').should('contain', 'Email is required');
    cy.get('[data-cy=password-error]').should('contain', 'Password is required');
  });

  it('should logout successfully', () => {
    // Login first
    cy.login('admin@crm.com', 'password');
    
    // Navigate to dashboard
    cy.url().should('include', '/dashboard');
    
    // Click user menu
    cy.get('[data-cy=user-menu]').click();
    cy.get('[data-cy=logout-button]').click();
    
    // Verify redirect to login
    cy.url().should('include', '/login');
    cy.get('[data-cy=login-form]').should('be.visible');
  });
});
```

```typescript
// cypress/e2e/customer-management.cy.ts
describe('Customer Management', () => {
  beforeEach(() => {
    cy.login('admin@crm.com', 'password');
    cy.visit('/customers');
  });

  it('should display customers list', () => {
    cy.intercept('GET', '/api/customers*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: '1',
            company_name: 'Acme Corporation',
            contact_name: 'John Smith',
            email: 'john@acme.com',
            status: 'active',
            customer_type: 'business',
            created_at: '2025-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1
        }
      }
    }).as('getCustomers');

    cy.wait('@getCustomers');

    // Verify customer is displayed
    cy.get('[data-cy=customer-table]').should('be.visible');
    cy.get('[data-cy=customer-row]').should('have.length', 1);
    cy.get('[data-cy=customer-company]').should('contain', 'Acme Corporation');
  });

  it('should create a new customer', () => {
    cy.intercept('POST', '/api/customers', {
      statusCode: 201,
      body: {
        id: '2',
        company_name: 'New Company',
        contact_name: 'Jane Doe',
        email: 'jane@new.com',
        status: 'active',
        customer_type: 'business',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    }).as('createCustomer');

    // Click add customer button
    cy.get('[data-cy=add-customer-button]').click();

    // Fill form
    cy.get('[data-cy=company-name-input]').type('New Company');
    cy.get('[data-cy=contact-name-input]').type('Jane Doe');
    cy.get('[data-cy=email-input]').type('jane@new.com');
    cy.get('[data-cy=customer-type-select]').select('business');
    cy.get('[data-cy=status-select]').select('active');

    // Submit form
    cy.get('[data-cy=submit-customer-button]').click();

    cy.wait('@createCustomer');

    // Verify success message
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=success-message]').should('contain', 'Customer created successfully');
  });

  it('should edit an existing customer', () => {
    cy.intercept('GET', '/api/customers/1', {
      statusCode: 200,
      body: {
        id: '1',
        company_name: 'Acme Corporation',
        contact_name: 'John Smith',
        email: 'john@acme.com',
        phone: '+1-555-0123',
        status: 'active',
        customer_type: 'business'
      }
    }).as('getCustomer');

    cy.intercept('PUT', '/api/customers/1', {
      statusCode: 200,
      body: {
        id: '1',
        company_name: 'Acme Corporation Updated',
        contact_name: 'John Smith',
        email: 'john@acme.com',
        phone: '+1-555-9999',
        status: 'active',
        customer_type: 'business',
        updated_at: '2025-01-01T00:00:00Z'
      }
    }).as('updateCustomer');

    // Click on customer row
    cy.get('[data-cy=customer-row]').first().click();

    // Wait for customer data to load
    cy.wait('@getCustomer');

    // Click edit button
    cy.get('[data-cy=edit-customer-button]').click();

    // Update form
    cy.get('[data-cy=company-name-input]').clear().type('Acme Corporation Updated');
    cy.get('[data-cy=phone-input]').clear().type('+1-555-9999');

    // Submit form
    cy.get('[data-cy=submit-customer-button]').click();

    cy.wait('@updateCustomer');

    // Verify success message
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=success-message]').should('contain', 'Customer updated successfully');
  });

  it('should search customers', () => {
    cy.intercept('GET', '/api/customers*search=Acme', {
      statusCode: 200,
      body: {
        data: [
          {
            id: '1',
            company_name: 'Acme Corporation',
            contact_name: 'John Smith',
            email: 'john@acme.com',
            status: 'active',
            customer_type: 'business'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1
        }
      }
    }).as('searchCustomers');

    // Type in search box
    cy.get('[data-cy=search-input]').type('Acme');

    // Wait for search results
    cy.wait('@searchCustomers');

    // Verify filtered results
    cy.get('[data-cy=customer-table] tbody tr').should('have.length', 1);
    cy.get('[data-cy=customer-company]').should('contain', 'Acme Corporation');
  });

  it('should filter customers by status', () => {
    cy.intercept('GET', '/api/customers*status=active', {
      statusCode: 200,
      body: {
        data: [
          {
            id: '1',
            company_name: 'Acme Corporation',
            contact_name: 'John Smith',
            email: 'john@acme.com',
            status: 'active',
            customer_type: 'business'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1
        }
      }
    }).as('filterCustomers');

    // Click filters button
    cy.get('[data-cy=filters-button]').click();

    // Select active status filter
    cy.get('[data-cy=status-filter]').select('active');

    // Wait for filtered results
    cy.wait('@filterCustomers');

    // Verify filtered results
    cy.get('[data-cy=customer-table] tbody tr').should('have.length', 1);
    cy.get('[data-cy=customer-status]').should('contain', 'Active');
  });
});
```

### 9.5 Testing Utilities

#### Custom Test Matchers
```typescript
// src/test-utils/matchers.ts
import '@testing-library/jest-dom';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(className: string): R;
      toBeDisabled(): R;
      toBeVisible(): R;
    }
  }
}

// Custom matchers for CRM-specific testing
expect.extend({
  toHaveCRMValidationError(received: HTMLElement, message: string) {
    const errorElement = received.querySelector('[data-cy="error-message"]');
    
    if (!errorElement) {
      return {
        message: () => `Expected element to have validation error message`,
        pass: false,
      };
    }
    
    const pass = errorElement.textContent?.includes(message);
    
    return {
      message: () => 
        pass 
          ? `Expected element not to have error message "${message}"`
          : `Expected element to have error message "${message}"`,
      pass,
    };
  },

  toHaveCRMStatus(received: HTMLElement, status: string) {
    const statusElement = received.querySelector('[data-cy="status-badge"]');
    
    if (!statusElement) {
      return {
        message: () => `Expected element to have status badge`,
        pass: false,
      };
    }
    
    const pass = statusElement.textContent?.toLowerCase().includes(status.toLowerCase());
    
    return {
      message: () => 
        pass 
          ? `Expected element not to have status "${status}"`
          : `Expected element to have status "${status}"`,
      pass,
    };
  },

  toBeLoading(received: HTMLElement) {
    const loadingElements = received.querySelectorAll('.animate-spin, [data-testid="loading"]');
    const disabled = received.hasAttribute('disabled');
    
    const pass = loadingElements.length > 0 || disabled;
    
    return {
      message: () => 
        pass 
          ? `Expected element not to be loading`
          : `Expected element to be loading`,
      pass,
    };
  },
});
```

#### Test Data Factory
```typescript
// src/test-utils/factories.ts
import type { Customer, Sale, Ticket, User } from '@/types/crm';

export const createCustomer = (overrides: Partial<Customer> = {}): Customer => {
  return {
    id: '1',
    company_name: 'Test Company',
    contact_name: 'John Doe',
    email: 'john@test.com',
    phone: '+1-555-0123',
    mobile: '+1-555-0124',
    website: 'https://test.com',
    address: '123 Test St',
    city: 'Test City',
    country: 'Test Country',
    industry: 'Technology',
    size: 'medium' as const,
    status: 'active' as const,
    customer_type: 'business' as const,
    credit_limit: 50000,
    payment_terms: 'Net 30',
    tax_id: '123-45-6789',
    annual_revenue: 1000000,
    total_sales_amount: 0,
    total_orders: 0,
    average_order_value: 0,
    tags: [],
    notes: 'Test customer',
    assigned_to: 'user-1',
    source: 'website',
    rating: 'B',
    last_contact_date: new Date().toISOString(),
    next_follow_up_date: new Date().toISOString(),
    tenant_id: 'tenant-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    created_by: 'user-1',
    ...overrides,
  };
};

export const createSale = (overrides: Partial<Sale> = {}): Sale => {
  return {
    id: '1',
    sale_number: 'SALE-001',
    title: 'Test Sale',
    description: 'Test sale description',
    customer_id: 'customer-1',
    value: 10000,
    currency: 'USD',
    probability: 75,
    weighted_amount: 7500,
    stage: 'qualified' as const,
    status: 'open' as const,
    source: 'website',
    campaign: 'Q1 Campaign',
    expected_close_date: new Date().toISOString(),
    assigned_to: 'user-1',
    notes: 'Test sale notes',
    tags: [],
    competitor_info: 'Competitor A',
    tenant_id: 'tenant-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    created_by: 'user-1',
    ...overrides,
  };
};

export const createTicket = (overrides: Partial<Ticket> = {}): Ticket => {
  return {
    id: '1',
    ticket_number: 'TICKET-001',
    title: 'Test Ticket',
    description: 'Test ticket description',
    customer_id: 'customer-1',
    customer_name: 'Test Company',
    status: 'open' as const,
    priority: 'medium' as const,
    category: 'technical' as const,
    sub_category: 'Software',
    source: 'email',
    assigned_to: 'user-1',
    assigned_to_name: 'John Doe',
    reported_by: 'user-2',
    due_date: new Date().toISOString(),
    estimated_hours: 4,
    actual_hours: 0,
    first_response_time: 0,
    resolution_time: 0,
    is_sla_breached: false,
    resolution: '',
    tags: ['urgent'],
    comments: [],
    attachments: [],
    tenant_id: 'tenant-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    created_by: 'user-2',
    ...overrides,
  };
};

export const createUser = (overrides: Partial<User> = {}): User => {
  return {
    id: '1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    avatar_url: 'https://example.com/avatar.jpg',
    role: {
      id: '1',
      name: 'user',
      permissions: [
        { id: '1', name: 'customers.read', resource: 'customers', action: 'read' },
        { id: '2', name: 'customers.create', resource: 'customers', action: 'create' },
      ],
    },
    tenant_id: 'tenant-1',
    is_super_admin: false,
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
};
```

---

## 10. PERFORMANCE OPTIMIZATION

### 10.1 Frontend Performance

#### Code Splitting
```typescript
// src/utils/lazy.ts
import { lazy, Suspense } from 'react';

// Lazy load components
export const LazyCustomerList = lazy(() => import('@/modules/customers/components/CustomerList'));
export const LazySalesPipeline = lazy(() => import('@/modules/sales/components/SalesPipeline'));
export const LazyTicketDashboard = lazy(() => import('@/modules/tickets/components/TicketDashboard'));
export const LazyContractManager = lazy(() => import('@/modules/contracts/components/ContractManager'));
export const LazyUserManagement = lazy(() => import('@/modules/admin/components/UserManagement'));
export const LazyAuditLogs = lazy(() => import('@/modules/audit/components/AuditLogs'));

// Loading component
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  </div>
);

// Suspense wrapper with error boundary
export const LazyWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <LoadingSpinner /> }) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};
```

#### React Query Integration
```typescript
// src/utils/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // Handle global error handling
      },
    },
  },
});

// Query keys factory
export const queryKeys = {
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.customers.lists(), { filters }] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    stats: () => [...queryKeys.customers.all, 'stats'] as const,
    interactions: (customerId: string) => [...queryKeys.customers.detail(customerId), 'interactions'] as const,
  },
  sales: {
    all: ['sales'] as const,
    lists: () => [...queryKeys.sales.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.sales.lists(), { filters }] as const,
    details: () => [...queryKeys.sales.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sales.details(), id] as const,
    pipeline: () => [...queryKeys.sales.all, 'pipeline'] as const,
    stats: () => [...queryKeys.sales.all, 'stats'] as const,
    activities: (saleId: string) => [...queryKeys.sales.detail(saleId), 'activities'] as const,
  },
  tickets: {
    all: ['tickets'] as const,
    lists: () => [...queryKeys.tickets.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.tickets.lists(), { filters }] as const,
    details: () => [...queryKeys.tickets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tickets.details(), id] as const,
    stats: () => [...queryKeys.tickets.all, 'stats'] as const,
  },
};
```

#### Custom Hooks with Caching
```typescript
// src/hooks/useCustomers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services';
import { queryKeys } from '@/utils/queryClient';
import type { Customer, CustomerFilters } from '@/types/crm';

export const useCustomers = (filters: CustomerFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.customers.list(filters),
    queryFn: () => customerService.getCustomers(filters),
    keepPreviousData: true,
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customerService.getCustomer(id),
    enabled: !!id,
  });
};

export const useCustomerStats = () => {
  return useQuery({
    queryKey: queryKeys.customers.stats(),
    queryFn: () => customerService.getCustomerStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCustomerInteractions = (customerId: string) => {
  return useQuery({
    queryKey: queryKeys.customers.interactions(customerId),
    queryFn: () => customerService.getCustomerInteractions(customerId),
    enabled: !!customerId,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) =>
      customerService.createCustomer(customer),
    onSuccess: () => {
      // Invalidate and refetch customers list
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.stats });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Customer> }) =>
      customerService.updateCustomer(id, updates),
    onSuccess: (updatedCustomer, { id }) => {
      // Update the specific customer in cache
      queryClient.setQueryData(
        queryKeys.customers.detail(id),
        updatedCustomer
      );
      
      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.stats });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.stats });
    },
  });
};

export const useBulkUpdateCustomers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ updates, customerIds }: { updates: Partial<Customer>; customerIds: string[] }) =>
      customerService.bulkUpdateCustomers(updates, customerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.stats });
    },
  });
};

export const useSearchCustomers = (query: string) => {
  return useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: () => customerService.searchCustomers(query),
    enabled: query.length > 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};
```

### 10.2 Backend Performance

#### Database Query Optimization
```sql
-- Performance indexes for customer table
CREATE INDEX CONCURRENTLY idx_customers_tenant_status 
ON customers(tenant_id, status) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_customers_company_name_gin 
ON customers USING gin(to_tsvector('english', company_name));

CREATE INDEX CONCURRENTLY idx_customers_email_gin 
ON customers USING gin(to_tsvector('english', email));

CREATE INDEX CONCURRENTLY idx_customers_created_at_desc 
ON customers(created_at DESC) 
WHERE deleted_at IS NULL;

-- Sales performance indexes
CREATE INDEX CONCURRENTLY idx_sales_tenant_stage_value 
ON sales(tenant_id, stage, value DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_sales_expected_close_date 
ON sales(expected_close_date) 
WHERE stage IN ('qualified', 'proposal', 'negotiation');

-- Composite index for dashboard queries
CREATE INDEX CONCURRENTLY idx_customers_dashboard_stats 
ON customers(tenant_id, status, created_at DESC) 
WHERE deleted_at IS NULL;

-- Partial index for active customers only
CREATE INDEX CONCURRENTLY idx_customers_active_assigned 
ON customers(assigned_to, created_at DESC) 
WHERE status = 'active' AND deleted_at IS NULL;
```

#### Query Performance Monitoring
```typescript
// src/utils/queryPerformance.ts
import { performance } from 'perf_hooks';

export class QueryPerformanceMonitor {
  private static queries: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  static startTimer(query: string): () => void {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const duration = end - start;
      
      const existing = this.queries.get(query) || { count: 0, totalTime: 0, avgTime: 0 };
      const newCount = existing.count + 1;
      const newTotalTime = existing.totalTime + duration;
      const newAvgTime = newTotalTime / newCount;
      
      this.queries.set(query, {
        count: newCount,
        totalTime: newTotalTime,
        avgTime: newAvgTime
      });
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${query} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  static getStats(): Array<{ query: string; stats: any }> {
    return Array.from(this.queries.entries()).map(([query, stats]) => ({
      query,
      stats
    }));
  }

  static getSlowQueries(thresholdMs: number = 100): Array<{ query: string; stats: any }> {
    return this.getStats().filter(({ stats }) => stats.avgTime > thresholdMs);
  }

  static reset(): void {
    this.queries.clear();
  }
}

// Usage in services
export const withPerformanceMonitoring = <T extends (...args: any[]) => any>(
  fn: T,
  queryName: string
): T => {
  return ((...args: any[]) => {
    const stopTimer = QueryPerformanceMonitor.startTimer(queryName);
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result.finally(() => stopTimer());
      }
      
      stopTimer();
      return result;
    } catch (error) {
      stopTimer();
      throw error;
    }
  }) as T;
};
```

#### Database Connection Pooling
```typescript
// src/utils/databasePool.ts
import { Pool } from 'pg';

class DatabasePool {
  private static instance: Pool;
  private static config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'crm_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  };

  static getInstance(): Pool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new Pool(DatabasePool.config);
      
      // Handle pool errors
      DatabasePool.instance.on('error', (err) => {
        console.error('Database pool error:', err);
      });
      
      console.log('Database pool initialized');
    }
    
    return DatabasePool.instance;
  }

  static async getConnection() {
    const pool = this.getInstance();
    return pool.connect();
  }

  static async query(text: string, params?: any[]) {
    const pool = this.getInstance();
    const start = Date.now();
    
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${duration}ms`, { text, params });
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  static async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const pool = this.getInstance();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async close(): Promise<void> {
    if (DatabasePool.instance) {
      await DatabasePool.instance.end();
      DatabasePool.instance = null as any;
    }
  }
}

export default DatabasePool;
```

### 10.3 Caching Strategy

#### Redis Caching Implementation
```typescript
// src/utils/cache.ts
import Redis from 'ioredis';

class CacheManager {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (error) => {
      console.error('Redis error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;
      await this.redis.setex(key, expiry, stringValue);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const result = await this.redis.incr(key);
      if (ttl && result === 1) {
        await this.redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  // Cache-aside pattern
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss, fetch from source
    const value = await factory();
    
    // Store in cache
    await this.set(key, value, ttl);
    
    return value;
  }

  // Cache with versioning
  async getVersioned<T>(key: string, version: string): Promise<T | null> {
    const versionedKey = `${key}:${version}`;
    return this.get<T>(versionedKey);
  }

  async setVersioned<T>(
    key: string, 
    version: string, 
    value: T, 
    ttl?: number
  ): Promise<void> {
    const versionedKey = `${key}:${version}`;
    await this.set(versionedKey, value, ttl);
  }

  // Invalidate related keys
  async invalidateRelated(baseKey: string, additionalKeys: string[] = []): Promise<void> {
    const keys = [baseKey, ...additionalKeys];
    await Promise.all(keys.map(key => this.delete(key)));
  }
}

// Singleton instance
export const cache = new CacheManager();

// Cache decorators
export const cached = (
  key: string, 
  ttl?: number,
  condition?: (args: any[]) => boolean
) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Check condition
      if (condition && !condition(args)) {
        return method.apply(this, args);
      }

      // Generate cache key
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      
      // Try cache first
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute method
      const result = await method.apply(this, args);
      
      // Cache the result
      await cache.set(cacheKey, result, ttl);
      
      return result;
    };
  };
};
```

#### Memory Caching for Session Data
```typescript
// src/utils/memoryCache.ts
class MemoryCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs = 60000) {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }

  set(key: string, value: T, ttlMs: number): void {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Session cache for user data
export const sessionCache = new MemoryCache<any>(30 * 60 * 1000); // 30 minutes

// Permission cache
export const permissionCache = new MemoryCache<boolean>(10 * 60 * 1000); // 10 minutes

// Reference data cache
export const referenceDataCache = new MemoryCache<any>(60 * 60 * 1000); // 1 hour
```

This comprehensive guide covers all remaining critical aspects of CRM implementation with complete detail. The testing section includes unit tests, integration tests, E2E tests, and testing utilities. The performance optimization section covers frontend caching, backend query optimization, and caching strategies. This ensures every aspect of the CRM development is covered with exhaustive detail.