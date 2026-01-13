import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number) => void;
  onMaxAttemptsReached?: () => void;
}

export function useRetry() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> => {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = true,
      onRetry,
      onMaxAttemptsReached
    } = options;

    setIsRetrying(true);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setAttemptCount(attempt);
        const result = await operation();
        setIsRetrying(false);
        setAttemptCount(0);
        return result;
      } catch (error) {
        if (attempt === maxAttempts) {
          setIsRetrying(false);
          setAttemptCount(0);
          onMaxAttemptsReached?.();
          throw error;
        }

        onRetry?.(attempt);
        
        // Show retry toast
        toast({
          title: `Attempt ${attempt} failed`,
          description: `Retrying in ${delay * (backoff ? attempt : 1)}ms...`,
          variant: "destructive"
        });

        // Wait before next attempt with optional backoff
        await new Promise(resolve => 
          setTimeout(resolve, delay * (backoff ? attempt : 1))
        );
      }
    }

    throw new Error('Max retry attempts reached');
  }, []);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setAttemptCount(0);
  }, []);

  return {
    retry,
    isRetrying,
    attemptCount,
    reset
  };
}