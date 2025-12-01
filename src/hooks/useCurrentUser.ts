/**
 * Hook to get current authenticated user
 * Follows strict layer synchronization rules
 */

import { useState, useEffect } from 'react';
import { authService } from '@/services/serviceFactory';
import { User } from '@/types/auth';

export const useCurrentUser = (): User | null => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial user
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // TODO: Subscribe to auth changes if needed
    // For now, this is a simple hook that gets current user
  }, []);

  return user;
};