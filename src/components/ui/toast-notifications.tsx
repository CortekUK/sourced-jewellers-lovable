import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

// Toast notification utilities with better UX
export const showSuccessToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    duration: 3000,
    className: "border-success bg-success/10 text-success-foreground",
  });
};

export const showErrorToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    duration: 5000,
    variant: "destructive",
  });
};

export const showWarningToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    duration: 4000,
    className: "border-yellow-200 bg-yellow-50 text-yellow-900",
  });
};

export const showInfoToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    duration: 3000,
    className: "border-blue-200 bg-blue-50 text-blue-900",
  });
};

// Auto-save notification hook
export function useAutoSaveNotification(isSaving: boolean, lastSaved?: Date) {
  useEffect(() => {
    if (isSaving) {
      showInfoToast("Saving...", "Your changes are being saved");
    }
  }, [isSaving]);

  useEffect(() => {
    if (lastSaved) {
      showSuccessToast("Saved", "Changes saved successfully");
    }
  }, [lastSaved]);
}

// Network status notifications
export function useNetworkNotifications() {
  useEffect(() => {
    const handleOnline = () => {
      showSuccessToast("Connection restored", "You're back online");
    };

    const handleOffline = () => {
      showWarningToast("Connection lost", "You're currently offline");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}