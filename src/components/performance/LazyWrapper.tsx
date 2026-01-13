import { Suspense, ReactNode, lazy } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-states';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
}

// Lazy-loaded components for better performance
export const LazyReports = lazy(() => import('@/pages/Reports'));
export const LazySettings = lazy(() => import('@/pages/Settings'));
export const LazyProductDetailModal = lazy(() => 
  import('@/components/modals/ProductDetailModal').then(module => ({ default: module.ProductDetailModal }))
);
export const LazyEditProductModal = lazy(() => 
  import('@/components/modals/EditProductModal').then(module => ({ default: module.EditProductModal }))
);

// HOC for lazy loading
export function withLazyLoading<T extends {}>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function LazyLoadedComponent(props: T) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    );
  };
}