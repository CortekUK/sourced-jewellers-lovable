import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DateRange {
  from?: Date;
  to?: Date;
}

interface ProductMixFilters {
  searchTerm?: string;
  categoryFilter?: string;
  typeFilter?: string;
}

export function useProductMixReport(dateRange: DateRange, filters: ProductMixFilters = {}) {
  return useQuery({
    queryKey: ['product-mix-report', dateRange, filters],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) {
        return null;
      }

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd 23:59:59');

      // Get product mix data from the new view
      const { data: pxConsignData, error: pxConsignError } = await supabase
        .from('v_pnl_px_consign')
        .select('*')
        .gte('sold_at', fromDate)
        .lte('sold_at', toDate);

      if (pxConsignError) throw pxConsignError;

      // Group by product and calculate totals
      const productMap = new Map();
      
      pxConsignData?.forEach(item => {
        const key = item.product_id;
        if (!productMap.has(key)) {
          productMap.set(key, {
            product_id: item.product_id,
            name: item.product_name,
            internal_sku: item.internal_sku,
            is_trade_in: item.is_trade_in,
            is_consignment: item.is_consignment,
            units_sold: 0,
            revenue: 0,
            cogs: 0,
            gross_profit: 0
          });
        }

        const product = productMap.get(key);
        product.units_sold += Number(item.quantity || 0);
        product.revenue += Number(item.revenue || 0);
        product.cogs += Number(item.cogs || 0);
        product.gross_profit += Number(item.revenue || 0) - Number(item.cogs || 0);
      });

      let products = Array.from(productMap.values());

      // Apply filters
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        products = products.filter(p => 
          p.name?.toLowerCase().includes(search) ||
          p.internal_sku?.toLowerCase().includes(search)
        );
      }

      if (filters.typeFilter && filters.typeFilter !== 'all') {
        switch (filters.typeFilter) {
          case 'owned':
            products = products.filter(p => !p.is_trade_in && !p.is_consignment);
            break;
          case 'px':
            products = products.filter(p => p.is_trade_in);
            break;
          case 'consignment':
            products = products.filter(p => p.is_consignment);
            break;
        }
      }

      // Sort by revenue descending
      products.sort((a, b) => Number(b.revenue) - Number(a.revenue));

      // Calculate totals
      const totals = products.reduce((acc, product) => ({
        units: acc.units + Number(product.units_sold || 0),
        revenue: acc.revenue + Number(product.revenue || 0),
        cogs: acc.cogs + Number(product.cogs || 0),
        grossProfit: acc.grossProfit + Number(product.gross_profit || 0)
      }), { units: 0, revenue: 0, cogs: 0, grossProfit: 0 });

      // Prepare chart data (top 10)
      const chartData = products.slice(0, 10).map(product => ({
        name: product.name || 'Unknown',
        revenue: Number(product.revenue || 0),
        units: Number(product.units_sold || 0),
        margin: product.revenue > 0 ? ((product.gross_profit / product.revenue) * 100) : 0
      }));

      // Extract unique categories (placeholder - would need to join with products table)
      const categories: string[] = [];

      return {
        products,
        totals,
        chartData,
        categories
      };
    },
    enabled: !!dateRange.from && !!dateRange.to
  });
}