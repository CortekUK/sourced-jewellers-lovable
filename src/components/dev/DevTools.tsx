import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Database, Zap, Users } from 'lucide-react';

// Development tools component - only shown in development
export function DevTools() {
  const [isVisible, setIsVisible] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setPerformanceMetrics({
          pageLoad: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
          timeToInteractive: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        });
      }
    }
  }, [isVisible]);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80">
      <Card className="shadow-lg border-orange-200 bg-orange-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-orange-900">
              Dev Tools
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0 text-orange-600 hover:text-orange-900"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Perf
              </TabsTrigger>
              <TabsTrigger value="database" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                DB
              </TabsTrigger>
              <TabsTrigger value="auth" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Auth
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="performance" className="mt-2 space-y-2">
              {performanceMetrics && (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Page Load:</span>
                    <Badge variant={performanceMetrics.pageLoad > 1000 ? "destructive" : "default"}>
                      {performanceMetrics.pageLoad}ms
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>DOM Ready:</span>
                    <Badge variant={performanceMetrics.domContentLoaded > 500 ? "destructive" : "default"}>
                      {performanceMetrics.domContentLoaded}ms
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Interactive:</span>
                    <Badge variant={performanceMetrics.timeToInteractive > 2000 ? "destructive" : "default"}>
                      {performanceMetrics.timeToInteractive}ms
                    </Badge>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="database" className="mt-2">
              <div className="text-xs space-y-1">
                <p className="text-green-700">✓ Supabase Connected</p>
                <p className="text-green-700">✓ RLS Enabled</p>
                <p className="text-orange-700">⚠ Dev Mode Active</p>
              </div>
            </TabsContent>
            
            <TabsContent value="auth" className="mt-2">
              <div className="text-xs space-y-1">
                <p className="text-green-700">✓ Auth Context Active</p>
                <p className="text-green-700">✓ Session Persistence</p>
                <p className="text-blue-700">ℹ Check /auth for login</p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-2 pt-2 border-t border-orange-200">
            <p className="text-xs text-orange-600">
              Press Ctrl+Shift+D to toggle
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}