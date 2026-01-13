import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, subDays } from 'date-fns';

interface PurchasesThisMonth {
  totalCost: number;
  itemCount: number;
  previousMonthCost: number;
  percentageChange: number;
}

interface AgeBreakdown {
  fresh: { count: number; cost: number };
  warming: { count: number; cost: number };
  aged: { count: number; cost: number };
}

interface PurchasesVsSalesData {
  date: string;
  purchases: number;
  sales: number;
}

export function usePurchasesThisMonth(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  return useQuery<PurchasesThisMonth>({
    queryKey: ['purchases-this-month', period],
    queryFn: async () => {
      const now = new Date();
      let currentPeriodStart: Date;
      let currentPeriodEnd: Date;
      let previousPeriodStart: Date;
      let previousPeriodEnd: Date;

      switch (period) {
        case 'week':
          currentPeriodStart = subDays(now, 7);
          currentPeriodEnd = now;
          previousPeriodStart = subDays(now, 14);
          previousPeriodEnd = subDays(now, 7);
          break;
        case 'quarter':
          currentPeriodStart = subMonths(now, 3);
          currentPeriodEnd = now;
          previousPeriodStart = subMonths(now, 6);
          previousPeriodEnd = subMonths(now, 3);
          break;
        case 'year':
          currentPeriodStart = subMonths(now, 12);
          currentPeriodEnd = now;
          previousPeriodStart = subMonths(now, 24);
          previousPeriodEnd = subMonths(now, 12);
          break;
        case 'month':
        default:
          currentPeriodStart = startOfMonth(now);
          currentPeriodEnd = endOfMonth(now);
          previousPeriodStart = startOfMonth(subMonths(now, 1));
          previousPeriodEnd = endOfMonth(subMonths(now, 1));
      }

      // Current period purchases
      const { data: currentPurchases, error: currentError } = await supabase
        .from('stock_movements')
        .select('quantity, unit_cost')
        .eq('movement_type', 'purchase')
        .gte('occurred_at', currentPeriodStart.toISOString())
        .lte('occurred_at', currentPeriodEnd.toISOString());

      if (currentError) throw currentError;

      // Previous period purchases
      const { data: previousPurchases, error: previousError } = await supabase
        .from('stock_movements')
        .select('quantity, unit_cost')
        .eq('movement_type', 'purchase')
        .gte('occurred_at', previousPeriodStart.toISOString())
        .lte('occurred_at', previousPeriodEnd.toISOString());

      if (previousError) throw previousError;

      const totalCost = currentPurchases?.reduce((sum, item) => 
        sum + (item.quantity * (item.unit_cost || 0)), 0) || 0;
      
      const itemCount = currentPurchases?.length || 0;

      const previousMonthCost = previousPurchases?.reduce((sum, item) => 
        sum + (item.quantity * (item.unit_cost || 0)), 0) || 0;

      const percentageChange = previousMonthCost === 0 
        ? (totalCost > 0 ? 100 : 0)
        : ((totalCost - previousMonthCost) / previousMonthCost) * 100;

      return {
        totalCost,
        itemCount,
        previousMonthCost,
        percentageChange
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

export function useInventoryAgeBreakdown() {
  return useQuery<AgeBreakdown>({
    queryKey: ['inventory-age-breakdown'],
    queryFn: async () => {
      const now = new Date();

      // Get all products with current stock
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          purchase_date,
          consignment_start_date,
          created_at,
          is_consignment,
          unit_cost
        `)
        .gt('id', 0);

      if (error) throw error;

      // Get stock quantities
      const { data: stockData, error: stockError } = await supabase
        .from('v_stock_on_hand')
        .select('product_id, qty_on_hand');

      if (stockError) throw stockError;

      const stockMap = new Map(stockData?.map(s => [s.product_id, s.qty_on_hand]) || []);

      const breakdown = {
        fresh: { count: 0, cost: 0 },
        warming: { count: 0, cost: 0 },
        aged: { count: 0, cost: 0 }
      };

      products?.forEach(product => {
        const qtyOnHand = stockMap.get(product.id) || 0;
        if (qtyOnHand <= 0) return;

        // Determine effective purchase date
        const effectiveDate = product.is_consignment && product.consignment_start_date
          ? new Date(product.consignment_start_date)
          : product.purchase_date 
            ? new Date(product.purchase_date)
            : new Date(product.created_at);

        const daysDiff = Math.floor((now.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24));
        const itemCost = (product.unit_cost || 0) * qtyOnHand;

        if (daysDiff <= 30) {
          breakdown.fresh.count++;
          breakdown.fresh.cost += itemCost;
        } else if (daysDiff <= 90) {
          breakdown.warming.count++;
          breakdown.warming.cost += itemCost;
        } else {
          breakdown.aged.count++;
          breakdown.aged.cost += itemCost;
        }
      });

      return breakdown;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

export function usePurchasesVsSales() {
  return useQuery<PurchasesVsSalesData[]>({
    queryKey: ['purchases-vs-sales-30d'],
    queryFn: async () => {
      const now = new Date();
      const startDate = subDays(now, 30);

      // Get purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('stock_movements')
        .select('occurred_at, quantity, unit_cost')
        .eq('movement_type', 'purchase')
        .gte('occurred_at', startDate.toISOString());

      if (purchasesError) throw purchasesError;

      // Get sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('sold_at, total')
        .gte('sold_at', startDate.toISOString());

      if (salesError) throw salesError;

      // Create map of dates with data
      const dataMap = new Map<string, { purchases: number; sales: number }>();

      // Initialize all 30 days with zeros
      for (let i = 0; i <= 30; i++) {
        const date = format(subDays(now, 30 - i), 'yyyy-MM-dd');
        dataMap.set(date, { purchases: 0, sales: 0 });
      }

      // Aggregate purchases by date
      purchases?.forEach(purchase => {
        const date = format(new Date(purchase.occurred_at), 'yyyy-MM-dd');
        const current = dataMap.get(date) || { purchases: 0, sales: 0 };
        current.purchases += (purchase.quantity * (purchase.unit_cost || 0));
        dataMap.set(date, current);
      });

      // Aggregate sales by date
      sales?.forEach(sale => {
        const date = format(new Date(sale.sold_at), 'yyyy-MM-dd');
        const current = dataMap.get(date) || { purchases: 0, sales: 0 };
        current.sales += sale.total;
        dataMap.set(date, current);
      });

      // Convert to array and format dates for display
      return Array.from(dataMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
          date: format(new Date(date), 'MMM dd'),
          purchases: Math.round(data.purchases * 100) / 100,
          sales: Math.round(data.sales * 100) / 100
        }));
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
