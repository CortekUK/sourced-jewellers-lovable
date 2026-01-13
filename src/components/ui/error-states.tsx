import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Wifi, Database, ShieldAlert } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

export function ErrorState({ title, description, icon, action, children }: ErrorStateProps) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex flex-col items-center justify-center py-12">
        {icon || <AlertTriangle className="h-12 w-12 text-destructive mb-4" />}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} className="mb-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

// Specific Error States
export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Failed"
      description="Unable to connect to the server. Please check your internet connection and try again."
      icon={<Wifi className="h-12 w-12 text-destructive mb-4" />}
      action={onRetry ? { label: "Retry Connection", onClick: onRetry } : undefined}
    />
  );
}

export function DatabaseErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Database Error"
      description="There was a problem accessing the database. Please try again in a few moments."
      icon={<Database className="h-12 w-12 text-destructive mb-4" />}
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
    />
  );
}

export function UnauthorizedErrorState() {
  return (
    <ErrorState
      title="Access Denied"
      description="You don't have permission to access this resource. Please contact your administrator."
      icon={<ShieldAlert className="h-12 w-12 text-destructive mb-4" />}
      action={{
        label: "Go to Dashboard",
        onClick: () => window.location.href = "/"
      }}
    />
  );
}

export function NotFoundErrorState({ resourceType = "resource" }: { resourceType?: string }) {
  return (
    <ErrorState
      title={`${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Not Found`}
      description={`The ${resourceType} you're looking for doesn't exist or has been removed.`}
      action={{
        label: "Go Back",
        onClick: () => window.history.back()
      }}
    />
  );
}

// Generic Query Error Handler
export function QueryErrorHandler({ 
  error, 
  onRetry,
  fallback 
}: { 
  error: Error; 
  onRetry?: () => void;
  fallback?: React.ReactNode;
}) {
  if (fallback) return <>{fallback}</>;

  // Handle specific error types
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return <NetworkErrorState onRetry={onRetry} />;
  }
  
  if (error.message.includes('database') || error.message.includes('SQL')) {
    return <DatabaseErrorState onRetry={onRetry} />;
  }
  
  if (error.message.includes('unauthorized') || error.message.includes('permission')) {
    return <UnauthorizedErrorState />;
  }

  // Default error state
  return (
    <ErrorState
      title="Something went wrong"
      description={error.message || "An unexpected error occurred. Please try again."}
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
    />
  );
}