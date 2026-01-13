import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DateRange {
  from?: Date;
  to?: Date;
}

export function usePxConsignmentReport(dateRange: DateRange) {
  return useQuery({
    queryKey: ['px-consignment-report', dateRange],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) {
        return null;
      }

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd 23:59:59');

      // Get PX & Consignment data
      const { data: pxConsignData, error: pxConsignError } = await supabase
        .from('v_pnl_px_consign')
        .select('*')
        .gte('sold_at', fromDate)
        .lte('sold_at', toDate);

      if (pxConsignError) throw pxConsignError;

      // Get unsettled consignments
      const { data: unsettled, error: unsettledError } = await supabase
        .from('v_consign_unsettled')
        .select('*');

      if (unsettledError) throw unsettledError;

      // Get consignment settlements to check payment status
      const { data: settlements, error: settlementsError } = await supabase
        .from('consignment_settlements')
        .select('sale_id, product_id, paid_at, supplier_id, suppliers(name)');

      if (settlementsError) throw settlementsError;

      // Create settlement lookup
      const settlementMap = new Map();
      settlements?.forEach(s => {
        const key = `${s.sale_id}-${s.product_id}`;
        settlementMap.set(key, {
          is_paid: !!s.paid_at,
          supplier_name: s.suppliers?.name
        });
      });

      // Separate PX and Consignment items
      const pxItems = pxConsignData?.filter(item => item.kind === 'px') || [];
      const consignmentItems = pxConsignData?.filter(item => item.kind === 'consignment') || [];

      // Add settlement info to consignment items
      const enrichedConsignmentItems = consignmentItems.map(item => {
        const key = `${item.sale_id}-${item.product_id}`;
        const settlement = settlementMap.get(key) || { is_paid: false, supplier_name: null };
        return {
          ...item,
          ...settlement
        };
      });

      // Calculate summaries
      const pxSummary = {
        items: pxItems.length,
        totalAllowances: pxItems.reduce((sum, item) => sum + Number(item.cogs || 0), 0),
        grossProfit: pxItems.reduce((sum, item) => sum + (Number(item.revenue || 0) - Number(item.cogs || 0)), 0)
      };

      // Only count paid consignment items for GP
      const paidConsignmentItems = enrichedConsignmentItems.filter(item => item.is_paid);
      const consignmentSummary = {
        items: consignmentItems.length,
        totalPayouts: consignmentItems.reduce((sum, item) => sum + Number(item.cogs || 0), 0),
        grossProfit: paidConsignmentItems.reduce((sum, item) => sum + (Number(item.revenue || 0) - Number(item.cogs || 0)), 0)
      };

      return {
        pxSummary,
        consignmentSummary,
        unsettledConsignments: unsettled || [],
        pxItems,
        consignmentItems: enrichedConsignmentItems
      };
    },
    enabled: !!dateRange.from && !!dateRange.to
  });
}