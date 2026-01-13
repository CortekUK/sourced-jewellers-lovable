// Performance monitoring utilities
export const performanceMonitor = {
  // Measure function execution time
  measure: <T extends any[], R>(
    name: string,
    fn: (...args: T) => R
  ) => {
    return (...args: T): R => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (end - start > 100) { // Log slow operations (>100ms)
        console.warn(`Slow operation detected: ${name} took ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    };
  },

  // Measure async function execution time
  measureAsync: <T extends any[], R>(
    name: string,
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R> => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      
      if (end - start > 200) { // Log slow async operations (>200ms)
        console.warn(`Slow async operation detected: ${name} took ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    };
  },

  // Log performance metrics
  logMetrics: () => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.group('Performance Metrics');
        console.log('Page Load Time:', `${navigation.loadEventEnd - navigation.loadEventStart}ms`);
        console.log('DOM Content Loaded:', `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`);
        console.log('Time to Interactive:', `${navigation.loadEventEnd - navigation.fetchStart}ms`);
        console.groupEnd();
      }
    }
  }
};

// Debounce utility for search and input handling
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}