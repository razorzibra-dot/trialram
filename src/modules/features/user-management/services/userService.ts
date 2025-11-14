/**
 * User Service Interface
 * Defines the contract for user management operations
 */

import { 
  UserDTO, 
  UserFiltersDTO, 
  CreateUserDTO, 
  UpdateUserDTO, 
  UserStatsDTO,
  UserRole,
  UserStatus,
  UserActivityDTO
} from '@/types';

/**
 * User Service Interface
 * All user management operations must implement this interface
 */
export interface IUserService {
  getUsers(filters?: UserFiltersDTO): Promise<UserDTO[]>;
  
  getUser(id: string): Promise<UserDTO>;
  
  createUser(data: CreateUserDTO): Promise<UserDTO>;
  
  updateUser(id: string, data: UpdateUserDTO): Promise<UserDTO>;
  
  deleteUser(id: string): Promise<void>;
  
  resetPassword(id: string): Promise<void>;
  
  getUserStats(): Promise<UserStatsDTO>;
  
  getRoles(): Promise<UserRole[]>;
  
  getStatuses(): Promise<UserStatus[]>;
  
  getUserActivity(userId: string): Promise<UserActivityDTO[]>;
  
  logActivity(activity: Omit<UserActivityDTO, 'id'>): Promise<UserActivityDTO>;
  
  getTenants(): Promise<Array<{ id: string; name: string; status: string }>>;
}
