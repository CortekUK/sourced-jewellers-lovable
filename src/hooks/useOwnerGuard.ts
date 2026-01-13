import { useAuth } from '@/contexts/AuthContext';

/**
 * Check if current user is an owner
 */
export function useOwnerGuard() {
  const { userRole } = useAuth();
  return userRole === 'owner';
}

/**
 * Check if current user is a manager
 */
export function useManagerGuard() {
  const { userRole } = useAuth();
  return userRole === 'manager';
}

/**
 * Check if current user is at least a manager (manager or owner)
 */
export function useManagerOrAboveGuard() {
  const { userRole } = useAuth();
  return userRole === 'owner' || userRole === 'manager';
}

/**
 * Check if current user is staff or above (any authenticated role)
 */
export function useStaffGuard() {
  const { userRole } = useAuth();
  return userRole === 'owner' || userRole === 'manager' || userRole === 'staff';
}
