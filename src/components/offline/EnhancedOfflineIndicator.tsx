import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';

export function EnhancedOfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 5000);
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Alert className={isOnline ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
        <AlertDescription className={isOnline ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
          {isOnline ? (
            <div>
              <div className="font-medium">Connection restored!</div>
              <div className="text-sm">You're back online and can sync your data.</div>
            </div>
          ) : (
            <div>
              <div className="font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                You're offline
              </div>
              <div className="text-sm">Some features may not work. Checkout is disabled.</div>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}