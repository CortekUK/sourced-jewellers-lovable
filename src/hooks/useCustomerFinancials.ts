import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FinancialKPIs {
  totalAllowances: number;
  totalPayouts: number;
  unsettledPayouts: number;
}

export function useCustomerFinancialKPIs(supplierId: number) {
  return useQuery({
    queryKey: ['customer-financial-kpis', supplierId],
    queryFn: async () => {
      // First get all products for this customer supplier
      const { data: products } = await supabase
        .from('products')
        .select('id, unit_cost, is_trade_in')
        .eq('supplier_id', supplierId)
        .eq('is_trade_in', true);

      if (!products || products.length === 0) {
        return {
          totalAllowances: 0,
          totalPayouts: 0,
          unsettledPayouts: 0,
        } as FinancialKPIs;
      }

      const productIds = products.map(p => p.id);

      // Get total allowances from part exchanges
      const { data: pxData } = await supabase
        .from('part_exchanges')
        .select('allowance, product_id')
        .in('product_id', productIds);

      const totalAllowances = products.reduce((sum, p) => {
        const px = pxData?.find(px => px.product_id === p.id);
        return sum + Number(px?.allowance || p.unit_cost || 0);
      }, 0);

      // Get consignment settlements
      const { data: settlements } = await supabase
        .from('consignment_settlements')
        .select('payout_amount, paid_at')
        .eq('supplier_id', supplierId);

      const totalPayouts = settlements?.reduce((sum, s) => sum + (s.payout_amount || 0), 0) || 0;
      const unsettledPayouts = settlements?.filter(s => !s.paid_at)
        .reduce((sum, s) => sum + (s.payout_amount || 0), 0) || 0;

      return {
        totalAllowances: Number(totalAllowances),
        totalPayouts: Number(totalPayouts),
        unsettledPayouts: Number(unsettledPayouts),
      } as FinancialKPIs;
    },
  });
}

interface TradeInAllowance {
  id: number;
  date: string;
  product_name: string;
  internal_sku: string;
  allowance: number;
  sale_id?: number;
  sold_at?: string;
}

export function useTradeInAllowances(supplierId: number) {
  return useQuery({
    queryKey: ['trade-in-allowances', supplierId],
    queryFn: async () => {
      const { data: products } = await supabase
        .from('products')
        .select(`
          id,
          name,
          internal_sku,
          unit_cost,
          created_at
        `)
        .eq('supplier_id', supplierId)
        .eq('is_trade_in', true)
        .order('created_at', { ascending: false });

      if (!products) return [];

      const productIds = products.map(p => p.id);

      const { data: partExchanges } = await supabase
        .from('part_exchanges')
        .select('product_id, allowance, sale_id, created_at')
        .in('product_id', productIds);

      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('product_id, sale_id, sales(sold_at)')
        .in('product_id', productIds);

      const result: TradeInAllowance[] = products.map(product => {
        const px = partExchanges?.find(p => p.product_id === product.id);
        const saleItem = saleItems?.find(si => si.product_id === product.id);

        return {
          id: product.id,
          date: px?.created_at || product.created_at,
          product_name: product.name,
          internal_sku: product.internal_sku,
          allowance: Number(px?.allowance || product.unit_cost || 0),
          sale_id: saleItem?.sale_id,
          sold_at: saleItem?.sales?.sold_at,
        };
      });

      return result;
    },
  });
}

interface ConsignmentPayout {
  id: number;
  settlement_id: number;
  date: string;
  product_name: string;
  internal_sku: string;
  agreed_payout: number;
  paid_at?: string;
  notes?: string;
}

export function useConsignmentPayouts(supplierId: number) {
  return useQuery({
    queryKey: ['consignment-payouts', supplierId],
    queryFn: async () => {
      const { data: settlements } = await supabase
        .from('consignment_settlements')
        .select(`
          id,
          product_id,
          payout_amount,
          agreed_price,
          paid_at,
          created_at,
          notes
        `)
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (!settlements) return [];

      const productIds = settlements.map(s => s.product_id);

      const { data: products } = await supabase
        .from('products')
        .select('id, name, internal_sku')
        .in('id', productIds);

      const result: ConsignmentPayout[] = settlements.map(settlement => {
        const product = products?.find(p => p.id === settlement.product_id);

        return {
          id: settlement.product_id,
          settlement_id: settlement.id,
          date: settlement.created_at || '',
          product_name: product?.name || 'Unknown',
          internal_sku: product?.internal_sku || '',
          agreed_payout: Number(settlement.payout_amount || settlement.agreed_price || 0),
          paid_at: settlement.paid_at,
          notes: settlement.notes,
        };
      });

      return result;
    },
  });
}

interface RecordPayoutData {
  settlementId: number;
  paidAt: string;
  notes?: string;
}

export function useRecordConsignmentPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecordPayoutData) => {
      const { error } = await supabase
        .from('consignment_settlements')
        .update({
          paid_at: data.paidAt,
          notes: data.notes,
        })
        .eq('id', data.settlementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['customer-financial-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-consignments'] });
      toast.success('Consignment payout recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payout: ${error.message}`);
    },
  });
}
