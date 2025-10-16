export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'agent' | 'engineer' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  tenantId: string;
  tenantName?: string;
  avatar?: string;
  phone?: string;
  mobile?: string;
  company_name?: string;
  department?: string;
  position?: string;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
  createdBy?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_in: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}