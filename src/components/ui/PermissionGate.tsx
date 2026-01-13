import { ReactNode } from 'react';
import { usePermissions, CRMModule, Action } from '@/hooks/usePermissions';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PermissionGateProps {
  children: ReactNode;
  /** The module to check permissions for */
  module: CRMModule;
  /** The action to check (view, create, edit, delete) */
  action: Action;
  /** Optional fallback content when permission is denied */
  fallback?: ReactNode;
  /** Show disabled version instead of hiding completely */
  showDisabled?: boolean;
  /** Tooltip text when showing disabled version */
  disabledTooltip?: string;
}

/**
 * Conditionally render children based on user permissions.
 *
 * @example
 * // Hide button if user can't delete products
 * <PermissionGate module="products" action="delete">
 *   <Button onClick={handleDelete}>Delete</Button>
 * </PermissionGate>
 *
 * @example
 * // Show disabled button with tooltip instead of hiding
 * <PermissionGate
 *   module="products"
 *   action="create"
 *   showDisabled
 *   disabledTooltip="Only managers can add products"
 * >
 *   <Button>Add Product</Button>
 * </PermissionGate>
 *
 * @example
 * // Custom fallback content
 * <PermissionGate
 *   module="reports"
 *   action="view"
 *   fallback={<p>Upgrade to view reports</p>}
 * >
 *   <ReportsPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  module,
  action,
  fallback = null,
  showDisabled = false,
  disabledTooltip = "You don't have permission for this action",
}: PermissionGateProps) {
  const { can } = usePermissions();

  const hasPermission = can(module, action);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (showDisabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block opacity-50 cursor-not-allowed">
            <div className="pointer-events-none">{children}</div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{disabledTooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <>{fallback}</>;
}

/**
 * Higher-order component for permission-based rendering.
 * Wraps a component to only render when user has permission.
 *
 * @example
 * const ProtectedDeleteButton = withPermission(DeleteButton, 'products', 'delete');
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  module: CRMModule,
  action: Action
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGate module={module} action={action}>
        <Component {...props} />
      </PermissionGate>
    );
  };
}
