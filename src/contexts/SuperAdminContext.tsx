import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  TenantConfig, 
  SuperAdminUser, 
  RoleRequest, 
  PlatformUsage, 
  SystemHealth, 
  AnalyticsData,
  SuperAdminFilters 
} from '@/types/superAdmin';
import { superAdminService as factorySuperAdminService, uiNotificationService as factoryUINotificationService } from '@/services/serviceFactory';
import { useAuth } from './AuthContext';

interface SuperAdminContextType {
  // State
  tenants: TenantConfig[];
  globalUsers: SuperAdminUser[];
  roleRequests: RoleRequest[];
  platformUsage: PlatformUsage | null;
  systemHealth: SystemHealth | null;
  analyticsData: AnalyticsData | null;
  isLoading: boolean;
  
  // Tenant Management
  loadTenants: (filters?: SuperAdminFilters['tenants']) => Promise<void>;
  createTenant: (tenantData: Omit<TenantConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTenant: (id: string, updates: Partial<TenantConfig>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  
  // Global User Management
  loadGlobalUsers: (filters?: SuperAdminFilters['users']) => Promise<void>;
  updateGlobalUser: (id: string, updates: Partial<SuperAdminUser>) => Promise<void>;
  
  // Role Request Management
  loadRoleRequests: (filters?: SuperAdminFilters['role_requests']) => Promise<void>;
  approveRoleRequest: (id: string, comments?: string) => Promise<void>;
  rejectRoleRequest: (id: string, comments?: string) => Promise<void>;
  
  // Analytics & Monitoring
  loadPlatformUsage: () => Promise<void>;
  loadSystemHealth: () => Promise<void>;
  loadAnalyticsData: () => Promise<void>;
  
  // Utility
  refreshAll: () => Promise<void>;
  isSuperAdmin: () => boolean;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};

export const SuperAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [globalUsers, setGlobalUsers] = useState<SuperAdminUser[]>([]);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [platformUsage, setPlatformUsage] = useState<PlatformUsage | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSuperAdmin = (): boolean => {
    if (!user) return false;
    // Check for proper super_admin role
    return user.role === 'super_admin';
  };

  // Tenant Management
  const loadTenants = async (filters?: SuperAdminFilters['tenants']) => {
    if (!isSuperAdmin()) return;
    
    setIsLoading(true);
    try {
      const data = await factorySuperAdminService.getTenants(filters);
      setTenants(data);
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to load tenants'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createTenant = async (tenantData: Omit<TenantConfig, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isSuperAdmin()) return;
    
    setIsLoading(true);
    try {
      const newTenant = await factorySuperAdminService.createTenant(tenantData);
      setTenants(prev => [...prev, newTenant]);
      factoryUINotificationService.successNotify(
        'Success',
        'Tenant created successfully'
      );
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to create tenant'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTenant = async (id: string, updates: Partial<TenantConfig>) => {
    if (!isSuperAdmin()) return;
    
    setIsLoading(true);
    try {
      const updatedTenant = await factorySuperAdminService.updateTenant(id, updates);
      setTenants(prev => prev.map(t => t.id === id ? updatedTenant : t));
      factoryUINotificationService.successNotify(
        'Success',
        'Tenant updated successfully'
      );
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to update tenant'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTenant = async (id: string) => {
    if (!isSuperAdmin()) return;
    
    setIsLoading(true);
    try {
      await factorySuperAdminService.deleteTenant(id);
      setTenants(prev => prev.filter(t => t.id !== id));
      factoryUINotificationService.successNotify(
        'Success',
        'Tenant deleted successfully'
      );
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to delete tenant'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Global User Management
  const loadGlobalUsers = async (filters?: SuperAdminFilters['users']) => {
    if (!isSuperAdmin()) return;
    
    setIsLoading(true);
    try {
      const data = await factorySuperAdminService.getGlobalUsers(filters);
      setGlobalUsers(data);
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to load users'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateGlobalUser = async (id: string, updates: Partial<SuperAdminUser>) => {
    if (!isSuperAdmin()) return;
    
    setIsLoading(true);
    try {
      const updatedUser = await factorySuperAdminService.updateGlobalUser(id, updates);
      setGlobalUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      factoryUINotificationService.successNotify(
        'Success',
        'User updated successfully'
      );
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to update user'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Role Request Management
  const loadRoleRequests = async (filters?: SuperAdminFilters['role_requests']) => {
    if (!isSuperAdmin()) return;
    
    setIsLoading(true);
    try {
      const data = await factorySuperAdminService.getRoleRequests(filters);
      setRoleRequests(data);
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to load role requests'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const approveRoleRequest = async (id: string, comments?: string) => {
    if (!isSuperAdmin()) return;
    
    setIsLoading(true);
    try {
      const updatedRequest = await factorySuperAdminService.approveRoleRequest(id, comments);
      setRoleRequests(prev => prev.map(r => r.id === id ? updatedRequest : r));
      factoryUINotificationService.successNotify(
        'Success',
        'Role request approved successfully'
      );
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to approve role request'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectRoleRequest = async (id: string, comments?: string) => {
    if (!isSuperAdmin()) return;
    
    setIsLoading(true);
    try {
      const updatedRequest = await factorySuperAdminService.rejectRoleRequest(id, comments);
      setRoleRequests(prev => prev.map(r => r.id === id ? updatedRequest : r));
      factoryUINotificationService.successNotify(
        'Success',
        'Role request rejected'
      );
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to reject role request'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Analytics & Monitoring
  const loadPlatformUsage = async () => {
    if (!isSuperAdmin()) return;
    
    try {
      const data = await factorySuperAdminService.getPlatformUsage();
      setPlatformUsage(data);
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to load platform usage'
      );
    }
  };

  const loadSystemHealth = async () => {
    if (!isSuperAdmin()) return;
    
    try {
      const data = await factorySuperAdminService.getSystemHealth();
      setSystemHealth(data);
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to load system health'
      );
    }
  };

  const loadAnalyticsData = async () => {
    if (!isSuperAdmin()) return;
    
    try {
      const data = await factorySuperAdminService.getAnalyticsData();
      setAnalyticsData(data);
    } catch (error) {
      factoryUINotificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to load analytics data'
      );
    }
  };

  const refreshAll = async () => {
    if (!isSuperAdmin()) return;
    
    await Promise.all([
      loadTenants(),
      loadGlobalUsers(),
      loadRoleRequests(),
      loadPlatformUsage(),
      loadSystemHealth(),
      loadAnalyticsData()
    ]);
  };

  // Initialize data when user changes
  useEffect(() => {
    if (isSuperAdmin()) {
      refreshAll();
    }
  }, [user]);

  const value: SuperAdminContextType = {
    // State
    tenants,
    globalUsers,
    roleRequests,
    platformUsage,
    systemHealth,
    analyticsData,
    isLoading,
    
    // Tenant Management
    loadTenants,
    createTenant,
    updateTenant,
    deleteTenant,
    
    // Global User Management
    loadGlobalUsers,
    updateGlobalUser,
    
    // Role Request Management
    loadRoleRequests,
    approveRoleRequest,
    rejectRoleRequest,
    
    // Analytics & Monitoring
    loadPlatformUsage,
    loadSystemHealth,
    loadAnalyticsData,
    
    // Utility
    refreshAll,
    isSuperAdmin
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
};