import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      // Fetch top and bottom products by revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: productData, error: productError } = await supabase
        .from('v_product_mix')
        .select('*')
        .order('revenue', { ascending: false });

      if (productError) throw productError;

      const topProduct = productData?.[0];
      const bottomProduct = productData?.[productData.length - 1];

      // Fetch top supplier by spend
      const { data: supplierData, error: supplierError } = await supabase
        .from('v_supplier_spend')
        .select('*')
        .order('total_spend', { ascending: false })
        .limit(1);

      if (supplierError) throw supplierError;

      const topSupplier = supplierData?.[0];

      // Fetch recent audit log entries (last 5)
      const { data: auditData, error: auditError } = await supabase
        .from('audit_log')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(5);

      if (auditError) throw auditError;

      // Fetch stock alerts count
      const { data: stockData, error: stockError } = await supabase
        .from('v_stock_status')
        .select('*', { count: 'exact', head: false })
        .or('is_out_of_stock.eq.true,is_at_risk.eq.true');

      if (stockError) throw stockError;

      const stockAlertsCount = stockData?.length || 0;
      const outOfStockCount = stockData?.filter(item => item.is_out_of_stock).length || 0;

      return {
        topProduct,
        bottomProduct,
        topSupplier,
        recentAudit: auditData || [],
        stockAlertsCount,
        outOfStockCount
      };
    },
    refetchInterval: 60000 // Refetch every minute
  });
}
