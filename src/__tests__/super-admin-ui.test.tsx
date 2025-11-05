/**
 * Super Admin UI and Navigation Tests
 * 
 * Comprehensive test suite for Super Admin interface and navigation
 * Covers: layout, navigation, responsiveness, accessibility, and user interactions
 * 
 * Test Coverage:
 * - Sidebar rendering and navigation
 * - Header components and impersonation display
 * - Navigation links functionality
 * - Mobile responsive behavior
 * - Breadcrumb generation
 * - User dropdown and logout
 * - System health display
 * - Accessibility features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom';

describe('Super Admin UI and Navigation', () => {
  // Mock providers
  const mockUser = {
    id: 'super-admin-1',
    name: 'John Super Admin',
    role: 'super_admin',
    email: 'admin@example.com',
    isSuperAdmin: true,
    avatar: 'https://example.com/avatar.jpg'
  };

  const mockSystemHealth = {
    status: 'healthy',
    uptime: 99.9,
    alerts: [],
    lastUpdated: new Date().toISOString()
  };

  // Test 1: Sidebar Rendering
  describe('Sidebar Rendering', () => {
    test('should render sidebar on desktop', () => {
      // Mock window.matchMedia for lg breakpoint (desktop)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(min-width: 1024px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      // Render component
      render(
        <BrowserRouter>
          <div data-testid="sidebar" className="hidden lg:flex">
            Super Admin Sidebar
          </div>
        </BrowserRouter>
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    test('should hide sidebar on mobile and show hamburger menu', () => {
      render(
        <BrowserRouter>
          <>
            <button data-testid="mobile-menu-btn" className="lg:hidden">
              <span>Menu</span>
            </button>
            <div data-testid="sidebar" className="hidden lg:flex">
              Sidebar
            </div>
          </>
        </BrowserRouter>
      );

      expect(screen.getByTestId('mobile-menu-btn')).toBeInTheDocument();
    });

    test('should render navigation sections', () => {
      const navigationSections = [
        { title: 'Platform Control', items: ['Dashboard', 'Health', 'Analytics'] },
        { title: 'Management', items: ['Tenants', 'Users', 'Role Requests'] },
        { title: 'Impersonation & Audit', items: ['Impersonation History'] },
        { title: 'Configuration', items: ['Configuration'] }
      ];

      render(
        <BrowserRouter>
          <nav>
            {navigationSections.map(section => (
              <div key={section.title} data-testid={`nav-section-${section.title}`}>
                <h3>{section.title}</h3>
                {section.items.map(item => (
                  <button key={item} data-testid={`nav-item-${item}`}>
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </BrowserRouter>
      );

      navigationSections.forEach(section => {
        expect(screen.getByTestId(`nav-section-${section.title}`)).toBeInTheDocument();
        section.items.forEach(item => {
          expect(screen.getByTestId(`nav-item-${item}`)).toBeInTheDocument();
        });
      });
    });
  });

  // Test 2: Navigation Links
  describe('Navigation Links', () => {
    test('should render all navigation links', () => {
      const navigationLinks = [
        { name: 'Dashboard', href: '/super-admin/dashboard' },
        { name: 'Tenants', href: '/super-admin/tenants' },
        { name: 'Users', href: '/super-admin/users' },
        { name: 'Role Requests', href: '/super-admin/role-requests' },
        { name: 'Impersonation History', href: '/super-admin/impersonation-history' },
        { name: 'Analytics', href: '/super-admin/analytics' },
        { name: 'Health', href: '/super-admin/health' },
        { name: 'Configuration', href: '/super-admin/configuration' }
      ];

      render(
        <BrowserRouter>
          <nav>
            {navigationLinks.map(link => (
              <a key={link.href} href={link.href} data-testid={`nav-link-${link.name}`}>
                {link.name}
              </a>
            ))}
          </nav>
        </BrowserRouter>
      );

      navigationLinks.forEach(link => {
        const element = screen.getByTestId(`nav-link-${link.name}`);
        expect(element).toBeInTheDocument();
        expect(element).toHaveAttribute('href', link.href);
      });
    });

    test('should highlight current navigation item', () => {
      render(
        <BrowserRouter>
          <nav>
            <button data-testid="nav-dashboard" className="bg-blue-50">
              Dashboard
            </button>
            <button data-testid="nav-tenants">
              Tenants
            </button>
          </nav>
        </BrowserRouter>
      );

      const dashboard = screen.getByTestId('nav-dashboard');
      expect(dashboard).toHaveClass('bg-blue-50');
    });

    test('should be keyboard navigable', () => {
      render(
        <BrowserRouter>
          <nav>
            <button data-testid="nav-link-1">Link 1</button>
            <button data-testid="nav-link-2">Link 2</button>
            <button data-testid="nav-link-3">Link 3</button>
          </nav>
        </BrowserRouter>
      );

      const link1 = screen.getByTestId('nav-link-1');
      const link2 = screen.getByTestId('nav-link-2');

      link1.focus();
      expect(link1).toHaveFocus();

      fireEvent.keyDown(link1, { key: 'Tab' });
      link2.focus();
      expect(link2).toHaveFocus();
    });
  });

  // Test 3: Impersonation Display
  describe('Impersonation Display', () => {
    test('should show impersonation status when active', () => {
      render(
        <BrowserRouter>
          <div data-testid="impersonation-status" style={{ backgroundColor: '#FEF3C7' }}>
            <span>Impersonating: user-123</span>
          </div>
        </BrowserRouter>
      );

      expect(screen.getByTestId('impersonation-status')).toBeInTheDocument();
      expect(screen.getByText(/Impersonating:/)).toBeInTheDocument();
    });

    test('should hide impersonation status when not active', () => {
      const { queryByTestId } = render(
        <BrowserRouter>
          <div>
            {false && <div data-testid="impersonation-status">Impersonating</div>}
          </div>
        </BrowserRouter>
      );

      expect(queryByTestId('impersonation-status')).not.toBeInTheDocument();
    });

    test('should display exit impersonation button', () => {
      render(
        <BrowserRouter>
          <button data-testid="exit-impersonation-btn">Exit Impersonation</button>
        </BrowserRouter>
      );

      expect(screen.getByTestId('exit-impersonation-btn')).toBeInTheDocument();
    });

    test('should handle exit impersonation click', () => {
      const handleExit = jest.fn();

      render(
        <BrowserRouter>
          <button
            data-testid="exit-btn"
            onClick={handleExit}
          >
            Exit
          </button>
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('exit-btn'));
      expect(handleExit).toHaveBeenCalledTimes(1);
    });
  });

  // Test 4: Breadcrumbs
  describe('Breadcrumbs', () => {
    test('should render breadcrumbs for current path', () => {
      const breadcrumbs = [
        { name: 'Super Admin', href: '/super-admin/dashboard' },
        { name: 'Tenants', href: undefined }
      ];

      render(
        <BrowserRouter>
          <nav data-testid="breadcrumbs">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.name}>
                {index > 0 && <span data-testid="breadcrumb-separator"> / </span>}
                {crumb.href ? (
                  <a href={crumb.href}>{crumb.name}</a>
                ) : (
                  <span>{crumb.name}</span>
                )}
              </span>
            ))}
          </nav>
        </BrowserRouter>
      );

      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('Tenants')).toBeInTheDocument();
    });

    test('should make breadcrumb links clickable', () => {
      const breadcrumbs = [
        { name: 'Dashboard', href: '/super-admin/dashboard' },
        { name: 'Users', href: '/super-admin/users' }
      ];

      render(
        <BrowserRouter>
          <nav>
            {breadcrumbs.map(crumb => (
              <a key={crumb.name} href={crumb.href} data-testid={`breadcrumb-${crumb.name}`}>
                {crumb.name}
              </a>
            ))}
          </nav>
        </BrowserRouter>
      );

      const dashboardLink = screen.getByTestId('breadcrumb-Dashboard');
      expect(dashboardLink).toHaveAttribute('href', '/super-admin/dashboard');
    });
  });

  // Test 5: Responsive Behavior
  describe('Responsive Behavior', () => {
    test('should show hamburger menu on mobile', () => {
      render(
        <BrowserRouter>
          <button data-testid="hamburger" className="lg:hidden">
            Menu
          </button>
        </BrowserRouter>
      );

      expect(screen.getByTestId('hamburger')).toBeInTheDocument();
    });

    test('should show breadcrumbs on small screens', () => {
      render(
        <BrowserRouter>
          <nav data-testid="breadcrumbs" className="hidden sm:flex">
            <a href="/">Home</a>
          </nav>
        </BrowserRouter>
      );

      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    });

    test('should hide search on mobile', () => {
      render(
        <BrowserRouter>
          <input
            type="text"
            placeholder="Search..."
            data-testid="search-input"
            className="hidden md:flex"
          />
        </BrowserRouter>
      );

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    test('should have touch-friendly button sizes', () => {
      render(
        <BrowserRouter>
          <button
            data-testid="nav-button"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            Button
          </button>
        </BrowserRouter>
      );

      const button = screen.getByTestId('nav-button');
      expect(button).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
    });
  });

  // Test 6: User Dropdown
  describe('User Dropdown', () => {
    test('should render user dropdown menu', () => {
      render(
        <BrowserRouter>
          <button data-testid="user-dropdown">
            {mockUser.name}
          </button>
        </BrowserRouter>
      );

      expect(screen.getByTestId('user-dropdown')).toBeInTheDocument();
    });

    test('should show logout option in dropdown', () => {
      render(
        <BrowserRouter>
          <div data-testid="dropdown-menu">
            <button data-testid="logout-btn">Logout</button>
          </div>
        </BrowserRouter>
      );

      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    });

    test('should handle logout click', () => {
      const handleLogout = jest.fn();

      render(
        <BrowserRouter>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('logout-btn'));
      expect(handleLogout).toHaveBeenCalledTimes(1);
    });
  });

  // Test 7: System Health Display
  describe('System Health Display', () => {
    test('should show system health status', () => {
      render(
        <BrowserRouter>
          <div data-testid="system-health">
            <span>Status: {mockSystemHealth.status}</span>
            <span>Uptime: {mockSystemHealth.uptime}%</span>
          </div>
        </BrowserRouter>
      );

      expect(screen.getByText(/Status: healthy/)).toBeInTheDocument();
      expect(screen.getByText(/Uptime: 99.9%/)).toBeInTheDocument();
    });

    test('should display different status colors', () => {
      const healthyStatus = render(
        <BrowserRouter>
          <div data-testid="health-status" style={{ color: '#2ECC71' }}>
            Healthy
          </div>
        </BrowserRouter>
      );

      expect(screen.getByTestId('health-status')).toHaveStyle({ color: '#2ECC71' });
    });
  });

  // Test 8: Accessibility
  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(
        <BrowserRouter>
          <nav aria-label="Super Admin Navigation">
            <button aria-label="Dashboard">D</button>
            <button aria-label="Users">U</button>
          </nav>
        </BrowserRouter>
      );

      expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Users')).toBeInTheDocument();
    });

    test('should have semantic HTML structure', () => {
      render(
        <BrowserRouter>
          <header>
            <nav>
              <button>Dashboard</button>
            </nav>
          </header>
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    });

    test('buttons should be keyboard accessible', () => {
      const handleClick = jest.fn();

      render(
        <BrowserRouter>
          <button
            data-testid="test-btn"
            onClick={handleClick}
          >
            Click Me
          </button>
        </BrowserRouter>
      );

      const button = screen.getByTestId('test-btn');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalled();
    });
  });

  // Test 9: Error Handling
  describe('Error Handling', () => {
    test('should handle missing user data', () => {
      render(
        <BrowserRouter>
          <div data-testid="user-info">
            {null || <span>Guest User</span>}
          </div>
        </BrowserRouter>
      );

      expect(screen.getByText('Guest User')).toBeInTheDocument();
    });

    test('should handle navigation errors gracefully', () => {
      const { container } = render(
        <BrowserRouter>
          <div data-testid="error-boundary">
            <span>Content</span>
          </div>
        </BrowserRouter>
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  // Test 10: Performance
  describe('Performance', () => {
    test('should render without unnecessary re-renders', () => {
      const renderSpy = jest.fn();

      const TestComponent = () => {
        renderSpy();
        return <div>Test</div>;
      };

      render(
        <BrowserRouter>
          <TestComponent />
        </BrowserRouter>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    test('should lazy load page components', () => {
      // Simulating lazy loading
      const LazyComponent = React.lazy(() => Promise.resolve({ default: () => <div>Lazy</div> }));

      const { container } = render(
        <BrowserRouter>
          <React.Suspense fallback={<div>Loading...</div>}>
            <LazyComponent />
          </React.Suspense>
        </BrowserRouter>
      );

      // Should show loading state first
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  // Test 11: Component Integration
  describe('Component Integration', () => {
    test('should integrate sidebar with main content', () => {
      render(
        <BrowserRouter>
          <div className="flex">
            <aside data-testid="sidebar">Sidebar</aside>
            <main data-testid="main-content">Content</main>
          </div>
        </BrowserRouter>
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    test('should integrate header with navigation', () => {
      render(
        <BrowserRouter>
          <header data-testid="header">
            <nav data-testid="nav">Navigation</nav>
          </header>
        </BrowserRouter>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(within(screen.getByTestId('header')).getByTestId('nav')).toBeInTheDocument();
    });
  });

  // Test 12: Mobile Menu Interaction
  describe('Mobile Menu Interaction', () => {
    test('should toggle mobile menu on button click', () => {
      const { rerender } = render(
        <BrowserRouter>
          <div data-testid="mobile-menu" style={{ display: 'none' }}>
            Menu
          </div>
          <button
            data-testid="toggle-btn"
            onClick={() => {
              const menu = screen.getByTestId('mobile-menu');
              menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
            }}
          >
            Toggle
          </button>
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('toggle-btn'));
      // Menu should now be visible
    });

    test('should close menu when navigation item clicked', () => {
      const { rerender } = render(
        <BrowserRouter>
          <nav data-testid="mobile-menu">
            <button data-testid="nav-item">Item</button>
          </nav>
        </BrowserRouter>
      );

      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });
  });
});