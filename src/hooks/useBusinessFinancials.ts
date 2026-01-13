import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BusinessFinancialKPIs {
  totalSpendLifetime: number;
  totalSpendYTD: number;
  avgUnitCost: number;
  percentOfTotalSpend: number;
}

export function useBusinessFinancialKPIs(supplierId: number) {
  return useQuery({
    queryKey: ['business-financial-kpis', supplierId],
    queryFn: async () => {
      // Get supplier metrics
      const { data: supplierMetrics } = await supabase
        .from('v_supplier_metrics')
        .select('*')
        .eq('supplier_id', supplierId)
        .single();

      // Get all suppliers to calculate percentage
      const { data: allSuppliers } = await supabase
        .from('v_supplier_metrics')
        .select('total_spend_this_year');

      const totalAllSpend = allSuppliers?.reduce((sum, s) => sum + Number(s.total_spend_this_year || 0), 0) || 1;
      const supplierSpend = Number(supplierMetrics?.total_spend_this_year || 0);
      const percentOfTotal = totalAllSpend > 0 ? (supplierSpend / totalAllSpend) * 100 : 0;

      // Calculate average unit cost
      const { data: products } = await supabase
        .from('products')
        .select('unit_cost')
        .eq('supplier_id', supplierId);

      const avgCost = products && products.length > 0
        ? products.reduce((sum, p) => sum + Number(p.unit_cost || 0), 0) / products.length
        : 0;

      // Lifetime spend (inventory + expenses)
      const lifetimeSpend = Number(supplierMetrics?.inventory_spend_this_year || 0) + 
                           Number(supplierMetrics?.expense_spend_this_year || 0);

      return {
        totalSpendLifetime: lifetimeSpend,
        totalSpendYTD: Number(supplierMetrics?.total_spend_this_year || 0),
        avgUnitCost: avgCost,
        percentOfTotalSpend: percentOfTotal,
      } as BusinessFinancialKPIs;
    },
  });
}
