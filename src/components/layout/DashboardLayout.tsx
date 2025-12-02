import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePortal } from '../../contexts/PortalContext';
import { useSidebarScroll, usePageScroll } from '../../contexts/ScrollStateContext';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';
import { useCanAccessModule } from '../../hooks/useCanAccessModule';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  Shield,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  FileText,
  MessageSquare,
  Wrench,
  Building,
  Database,
  Activity,
  ChevronRight,
  Home,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

const DashboardLayout = () => {
  const { user, logout, hasRole, hasPermission, isSuperAdmin } = useAuth();
  const { currentPortal, switchPortal } = usePortal();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Module access checks
  const canAccessSuperAdmin = useCanAccessModule('super-admin');
  const canAccessCustomers = useCanAccessModule('customers');
  const canAccessSales = useCanAccessModule('deals');
  const canAccessProductSales = useCanAccessModule('productSales');
  const canAccessContracts = useCanAccessModule('contracts');
  const canAccessServiceContracts = useCanAccessModule('serviceContract');
  const canAccessTickets = useCanAccessModule('tickets');
  const canAccessComplaints = useCanAccessModule('complaints');
  const canAccessJobWorks = useCanAccessModule('jobWorks');

  // Scroll state management
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pageContentRef = useRef<HTMLDivElement>(null);
  const {
    saveSidebarScrollPosition,
    restoreSidebarScrollPosition,
    getSidebarScrollRef
  } = useSidebarScroll();
  const {
    savePageScrollPosition,
    restorePageScrollPosition,
    getPageScrollRef
  } = usePageScroll();

  // Set up scroll restoration for sidebar
  const sidebarScrollRestoration = useScrollRestoration(
    sidebarRef,
    saveSidebarScrollPosition,
    restoreSidebarScrollPosition,
    {
      smooth: true,
      delay: 150,
      threshold: 5,
      debounceMs: 200
    }
  );

  // Set up scroll restoration for page content
  const pageScrollRestoration = useScrollRestoration(
    pageContentRef,
    savePageScrollPosition,
    restorePageScrollPosition,
    {
      smooth: true,
      delay: 100,
      threshold: 10,
      debounceMs: 150
    }
  );

  /**
   * Build navigation sections based on user type and module access
   * 
   * Super admins see only System Admin section with super-admin modules
   * Regular users see all tenant modules they have access to
   * 
   * CRITICAL: Super admins are isolated and don't see regular tenant modules.
   * Regular users cannot see super-admin modules.
   */
  const navigationSections = [];

  // Super Admin Section - ONLY for super admins
  if (isSuperAdmin() && canAccessSuperAdmin) {
    navigationSections.push({
      title: "System Admin",
      items: [
        { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard, module: 'super-admin' },
        { name: 'Tenants', href: '/super-admin/tenants', icon: Building, module: 'super-admin' },
        { name: 'Users', href: '/super-admin/users', icon: Users, module: 'super-admin' },
        { name: 'Analytics', href: '/super-admin/analytics', icon: Activity, module: 'super-admin' },
        { name: 'Health Check', href: '/super-admin/health', icon: Activity, module: 'super-admin' },
        { name: 'Configuration', href: '/super-admin/configuration', icon: Settings, module: 'super-admin' },
        { name: 'Role Requests', href: '/super-admin/role-requests', icon: Shield, module: 'super-admin' },
      ]
    });
  } else if (!isSuperAdmin()) {
    // Regular tenant user sections - hidden from super admins
    
    // Core module section
    navigationSections.push({
      title: "Core",
      items: [
        canAccessCustomers && { name: 'Dashboard', href: '/tenant/dashboard', icon: LayoutDashboard, permission: 'read' },
        canAccessCustomers && { name: 'Customers', href: '/tenant/customers', icon: Users, permission: 'read' },
        canAccessSales && { name: 'Deals', href: '/tenant/deals', icon: ShoppingCart, permission: 'read' },
      ].filter(Boolean)
    });

    // Operations section
    const operationsItems = [
      canAccessProductSales && { name: 'Product Sales', href: '/tenant/product-sales', icon: Package, permission: 'crm:sales:deal:update' },
      canAccessContracts && { name: 'Contracts', href: '/tenant/contracts', icon: FileText, permission: 'manage_contracts' },
      canAccessServiceContracts && { name: 'Service Contracts', href: '/tenant/service-contracts', icon: Shield, permission: 'manage_contracts' },
      canAccessTickets && { name: 'Tickets', href: '/tenant/tickets', icon: MessageSquare, permission: 'read' },
      canAccessComplaints && { name: 'Complaints', href: '/tenant/complaints', icon: MessageSquare, permission: 'read' },
      canAccessJobWorks && { name: 'Job Works', href: '/tenant/job-works', icon: Wrench, permission: 'read' },
    ].filter(Boolean);

    if (operationsItems.length > 0) {
      navigationSections.push({
        title: "Operations",
        items: operationsItems
      });
    }

    // Admin-only sections (NOT shown to super admins)
    if (hasRole('admin')) {
      navigationSections.push({
        title: "Administration",
        items: [
          { name: 'User Management', href: '/tenant/users/list', icon: Users, permission: 'crm:user:record:update' },
          { name: 'Role Management', href: '/tenant/users/roles', icon: Shield, permission: 'crm:role:record:update' },
          { name: 'Permission Matrix', href: '/tenant/users/permissions', icon: Settings, permission: 'crm:role:record:update' },
          { name: 'PDF Templates', href: '/tenant/configuration/pdf-templates', icon: FileText, permission: 'crm:user:record:update' },
          { name: 'Company Master', href: '/tenant/masters/companies', icon: Building, permission: 'manage_companies' },
          { name: 'Product Master', href: '/tenant/masters/products', icon: Package, permission: 'manage_products' },
        ].filter(item => hasPermission(item.permission))
      });
    }

    // Settings section (NOT shown to super admins)
    if (hasPermission('crm:user:record:update')) {
      navigationSections.push({
        title: "Settings",
        items: [
          { name: 'Configuration', href: '/tenant/configuration/tenant', icon: Settings, permission: 'crm:user:record:update' },
          { name: 'Notifications', href: '/tenant/notifications', icon: Bell, permission: 'read' },
        ].filter(item => hasPermission(item.permission))
      });
    }
  }



  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', href: '/tenant/dashboard' }];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      if (segment !== 'tenant') {
        currentPath += `/${segment}`;
        const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
        breadcrumbs.push({
          name,
          href: index === pathSegments.length - 1 ? undefined : `/tenant${currentPath}`
        });
      }
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleLogout = () => {
    // Save scroll positions before logout
    sidebarScrollRestoration.saveCurrentPosition();
    pageScrollRestoration.saveCurrentPosition();

    logout();
    navigate('/login');
  };

  // Restore sidebar scroll position on mount and route changes
  useEffect(() => {
    const timer = setTimeout(() => {
      sidebarScrollRestoration.restoreScrollPosition();
    }, 200); // Delay to ensure sidebar content is rendered

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Restore page scroll position when route changes
  useEffect(() => {
    const timer = setTimeout(() => {
      pageScrollRestoration.restoreScrollPosition();
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Save scroll positions when component unmounts
  useEffect(() => {
    return () => {
      sidebarScrollRestoration.saveCurrentPosition();
      pageScrollRestoration.saveCurrentPosition();
    };
  }, []);

  const handleNavigation = (href: string) => {
    // Save current scroll positions before navigation
    sidebarScrollRestoration.saveCurrentPosition();
    pageScrollRestoration.saveCurrentPosition();

    navigate(href);
    setIsMobileMenuOpen(false);
  };

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-neutral-200">
      {/* Logo Section */}
      <div className="flex h-16 items-center px-6 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 shadow-sm">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-neutral-900 tracking-tight">CRM Pro</span>
            <span className="text-xs text-neutral-500 font-medium">Enterprise</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav ref={sidebarRef} className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigationSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 py-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items
                /**
                 * Filter items based on user permissions and module access.
                 * 
                 * For super admin items: no filtering needed (already filtered in navigationSections)
                 * For tenant items: check hasPermission for permission-based items
                 */
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.href);
                  
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group focus-ring",
                        isActive
                          ? "bg-accent-50 text-accent-700 border-r-2 border-accent-500"
                          : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50"
                      )}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={`Navigate to ${item.name}`}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-colors duration-200 flex-shrink-0",
                          isActive ? "text-accent-500" : "text-neutral-400 group-hover:text-neutral-500"
                        )}
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-left">{item.name}</span>
                    </button>
                  );
                })}
            </div>
            {section !== navigationSections[navigationSections.length - 1] && (
              <Separator className="bg-neutral-200 my-4" />
            )}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 transition-all duration-200">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-accent-500 text-white font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate">{user?.name}</p>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="skip-link"
        onFocus={(e) => e.target.classList.add('not-sr-only')}
        onBlur={(e) => e.target.classList.remove('not-sr-only')}
      >
        Skip to main content
      </a>

      <div className="h-screen flex bg-neutral-50">
        {/* Desktop Sidebar */}
        <aside
          className="hidden lg:flex lg:w-64 lg:flex-col"
          aria-label="Main navigation"
          role="navigation"
        >
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent
            side="left"
            className="p-0 w-64"
            aria-label="Mobile navigation"
          >
            <SidebarContent />
          </SheetContent>
        </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 shadow-sm">
          <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
            {/* Left Section */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden p-2"
                    onClick={() => setIsMobileMenuOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center space-x-1 sm:space-x-2 text-sm min-w-0 flex-1">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.name}>
                    {index > 0 && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-400 flex-shrink-0" />}
                    {crumb.href ? (
                      <button
                        onClick={() => navigate(crumb.href!)}
                        className="font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-1 sm:px-2 py-1 rounded-md hover:bg-neutral-100 truncate"
                      >
                        {crumb.name}
                      </button>
                    ) : (
                      <span className="font-semibold text-neutral-900 px-1 sm:px-2 py-1 rounded-md bg-neutral-100 truncate">
                        {crumb.name}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>

              {/* Mobile Page Title */}
              <div className="sm:hidden flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-neutral-900 truncate">
                  {breadcrumbs[breadcrumbs.length - 1]?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            {/* Center Section - Search - TASK 2.10 */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder={
                    isSuperAdmin() 
                      ? "Search tenants, users, configurations..." 
                      : "Search customers, contracts, tickets..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                  aria-label="Search across accessible modules"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* Mobile Search Button */}
              <Button variant="ghost" size="sm" className="md:hidden p-2">
                <Search className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative p-2">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 p-0 text-xs" variant="destructive">
                  3
                </Badge>
              </Button>

              {/* Portal Switcher for Super Admin - TASK 2.10 */}
              {isSuperAdmin() && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-accent-300 text-accent-600 hover:bg-accent-50"
                      aria-label="Switch between super admin and tenant portals"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {currentPortal === 'super-admin' ? 'Super Admin' : 'Tenant'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Switch Portal</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => switchPortal('tenant')}
                      disabled={currentPortal === 'tenant'}
                    >
                      <Building className="mr-2 h-4 w-4" />
                      Tenant Portal
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => switchPortal('super-admin')}
                      disabled={currentPortal === 'super-admin'}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Super Admin Portal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-accent-500 text-white font-semibold">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-neutral-900">{user?.name}</p>
                      <p className="text-xs leading-none text-neutral-500">{user?.email}</p>
                      <Badge variant="secondary" className="w-fit text-xs mt-1">
                        {user?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/tenant/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/tenant/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-error-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          id="main-content"
          ref={pageContentRef}
          className="flex-1 overflow-auto bg-neutral-50"
          role="main"
          aria-label="Main content"
          tabIndex={-1}
        >
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default DashboardLayout;