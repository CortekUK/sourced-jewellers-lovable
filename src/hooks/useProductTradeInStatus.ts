import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook to check if a product is from a trade-in (exists in part_exchanges table)
export const useProductTradeInStatus = (productId: number) => {
  return useQuery({
    queryKey: ['product-trade-in-status', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('part_exchanges')
        .select('id')
        .eq('product_id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - product is not from a trade-in
          return false;
        }
        throw error;
      }
      return true;
    },
    enabled: !!productId,
  });
};