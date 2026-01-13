import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierMetrics {
  supplier_id: number;
  name: string;
  status: string;
  supplier_type: 'registered' | 'customer';
  tags: string[] | null;
  product_count: number;
  orders_this_month: number;
  inventory_spend_this_year: number;
  expense_spend_this_year: number;
  total_spend_this_year: number;
}

export function useSupplierMetrics(supplierId?: number) {
  return useQuery({
    queryKey: ['supplier-metrics', supplierId],
    queryFn: async () => {
      if (supplierId) {
        const { data, error } = await supabase
          .from('v_supplier_metrics')
          .select('*')
          .eq('supplier_id', supplierId)
          .single();
        
        if (error) throw error;
        return data as SupplierMetrics;
      } else {
        const { data, error } = await supabase
          .from('v_supplier_metrics')
          .select('*');
        
        if (error) throw error;
        return data as SupplierMetrics[];
      }
    },
  });
}

export function useSupplierMetricsSummary() {
  return useQuery({
    queryKey: ['supplier-metrics-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_supplier_metrics')
        .select('*');
      
      if (error) throw error;
      
      const metrics = data as SupplierMetrics[];
      
      return {
        activeSuppliers: metrics.filter(m => m.status === 'active').length,
        ordersThisMonth: metrics.reduce((sum, m) => sum + (m.orders_this_month || 0), 0),
        totalSpendThisYear: metrics.reduce((sum, m) => sum + (m.total_spend_this_year || 0), 0),
      };
    },
  });
}
