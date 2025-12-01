/**
 * Navigation Service
 * Main service interface for navigation items management
 * Routes to mock or Supabase implementation based on API mode
 */

import { NavigationItem } from '@/types/navigation';
import { supabaseNavigationService } from './supabase/navigationService';

class MockNavigationService {
  /**
   * Get all navigation items for current user's tenant
   * ✅ Database-driven: Fetches from navigation_items table
   */
  async getNavigationItems(): Promise<NavigationItem[]> {
    return supabaseNavigationService.getNavigationItems();
  }

  /**
   * Get a single navigation item by key
   */
  async getNavigationItemByKey(key: string): Promise<NavigationItem | null> {
    return supabaseNavigationService.getNavigationItemByKey(key);
  }

  /**
   * Create a new navigation item
   * ✅ Requires navigation:manage or crm:system:config:manage permission
   */
  async createNavigationItem(item: Partial<NavigationItem>): Promise<NavigationItem> {
    return supabaseNavigationService.createNavigationItem(item);
  }

  /**
   * Update a navigation item
   * ✅ Requires navigation:manage or crm:system:config:manage permission
   */
  async updateNavigationItem(id: string, updates: Partial<NavigationItem>): Promise<NavigationItem> {
    return supabaseNavigationService.updateNavigationItem(id, updates);
  }

  /**
   * Delete a navigation item (soft delete)
   * ✅ Requires navigation:manage or crm:system:config:manage permission
   */
  async deleteNavigationItem(id: string): Promise<void> {
    return supabaseNavigationService.deleteNavigationItem(id);
  }
}

export const mockNavigationService = new MockNavigationService();

