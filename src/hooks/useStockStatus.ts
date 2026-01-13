import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StockStatusItem {
  product_id: number;
  qty_on_hand: number;
  reorder_threshold: number;
  is_out_of_stock: boolean;
  is_at_risk: boolean;
}

export const useStockStatus = (productIds?: number[]) => {
  const { user, session } = useAuth();
  
  return useQuery({
    queryKey: ['stock-status', productIds],
    queryFn: async (): Promise<Map<number, StockStatusItem>> => {
      let query = supabase.from('v_stock_status').select('*');
      
      if (productIds && productIds.length > 0) {
        query = query.in('product_id', productIds);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const statusMap = new Map<number, StockStatusItem>();
      data?.forEach(item => {
        statusMap.set(item.product_id, item);
      });
      
      return statusMap;
    },
    enabled: !!user && !!session,
  });
};

export const getStockBadge = (stockStatus: StockStatusItem | undefined) => {
  if (!stockStatus) {
    return { variant: 'secondary' as const, text: 'Unknown' };
  }
  
  if (stockStatus.is_out_of_stock) {
    return { variant: 'destructive' as const, text: 'Out of stock' };
  }
  
  if (stockStatus.is_at_risk) {
    return { variant: 'secondary' as const, text: `At Risk • ${stockStatus.qty_on_hand}` };
  }
  
  return { variant: 'outline' as const, text: `In Stock: ${stockStatus.qty_on_hand}` };
};