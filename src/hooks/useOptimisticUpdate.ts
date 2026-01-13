import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticUpdate<T = any>() {
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);

  const performOptimisticUpdate = useCallback(async <TData, TVariables>(
    optimisticData: TData,
    updateFunction: (data: TData) => void,
    asyncOperation: () => Promise<TVariables>,
    revertFunction: () => void,
    options: OptimisticUpdateOptions<TVariables> = {}
  ) => {
    const { onSuccess, onError, successMessage, errorMessage } = options;
    
    setIsOptimisticUpdate(true);
    
    // Apply optimistic update immediately
    updateFunction(optimisticData);
    
    try {
      // Perform the async operation
      const result = await asyncOperation();
      
      setIsOptimisticUpdate(false);
      
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage
        });
      }
      
      onSuccess?.(result);
      return result;
    } catch (error) {
      // Revert optimistic update on error
      revertFunction();
      setIsOptimisticUpdate(false);
      
      const errorMsg = errorMessage || (error as Error).message || 'Operation failed';
      
      toast({
        title: "Error", 
        description: errorMsg,
        variant: "destructive"
      });
      
      onError?.(error as Error);
      throw error;
    }
  }, []);

  return {
    performOptimisticUpdate,
    isOptimisticUpdate
  };
}