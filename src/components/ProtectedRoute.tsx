import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { usePermissions, CRMModule, Action } from '@/hooks/usePermissions';
import { UserRole } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Legacy: Required role level (owner, manager, staff) */
  requiredRole?: UserRole;
  /** Module-based permission check */
  module?: CRMModule;
  /** Action required for the module (defaults to 'view') */
  action?: Action;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  module,
  action = 'view',
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { isAtLeast, can } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check module-based permission first (new approach)
  if (module && !can(module, action)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Legacy role-based check (backwards compatibility)
  if (requiredRole && !isAtLeast(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
