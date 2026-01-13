import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DateRange {
  from?: Date;
  to?: Date;
}

interface SupplierPerformanceFilters {
  supplierType?: string; // 'all', 'registered', 'customer'
}

export function useSupplierPerformanceReport(
  dateRange: DateRange,
  filters: SupplierPerformanceFilters = {}
) {
  return useQuery({
    queryKey: ['supplier-performance-report', dateRange, filters],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) {
        return null;
      }

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd 23:59:59');

      // Get all suppliers for count
      const { data: allSuppliers, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, name, supplier_type, status');

      if (supplierError) throw supplierError;

      const totalSuppliers = allSuppliers?.length || 0;
      const activeSuppliers = allSuppliers?.filter(s => s.status === 'active').length || 0;

      // Get sales data from v_pnl_px_consign view with product info
      const { data: salesData, error: salesError } = await supabase
        .from('v_pnl_px_consign')
        .select(`
          *,
          products!inner(supplier_id, consignment_supplier_id, suppliers:supplier_id(name, supplier_type))
        `)
        .gte('sold_at', fromDate)
        .lte('sold_at', toDate);

      if (salesError) throw salesError;

      // Get consignment settlements for the period
      const { data: settlements, error: settlementsError } = await supabase
        .from('consignment_settlements')
        .select(`
          supplier_id,
          payout_amount,
          paid_at,
          suppliers(name, supplier_type)
        `)
        .gte('created_at', fromDate)
        .lte('created_at', toDate);

      if (settlementsError) throw settlementsError;

      // Build supplier map
      const supplierMap = new Map();

      // Process sales data
      salesData?.forEach((item: any) => {
        const product = item.products;
        if (!product) return;

        // Determine supplier (primary supplier or consignment supplier)
        const supplierId = product.consignment_supplier_id || product.supplier_id;
        if (!supplierId) return;

        const supplierData = Array.isArray(product.suppliers) 
          ? product.suppliers[0] 
          : product.suppliers;

        if (!supplierMap.has(supplierId)) {
          supplierMap.set(supplierId, {
            supplier_id: supplierId,
            name: supplierData?.name || 'Unknown',
            supplier_type: supplierData?.supplier_type || 'registered',
            products_sold: 0,
            revenue: 0,
            cogs: 0,
            gross_profit: 0,
            settled_amount: 0,
            outstanding_settlements: 0,
          });
        }

        const supplier = supplierMap.get(supplierId);
        supplier.products_sold += Number(item.quantity || 0);
        supplier.revenue += Number(item.revenue || 0);
        supplier.cogs += Number(item.cogs || 0);
        supplier.gross_profit += Number(item.revenue || 0) - Number(item.cogs || 0);
      });

      // Process consignment settlements
      settlements?.forEach((settlement: any) => {
        const supplierId = settlement.supplier_id;
        if (!supplierId) return;

        if (!supplierMap.has(supplierId)) {
          const supplierData = Array.isArray(settlement.suppliers)
            ? settlement.suppliers[0]
            : settlement.suppliers;

          supplierMap.set(supplierId, {
            supplier_id: supplierId,
            name: supplierData?.name || 'Unknown',
            supplier_type: supplierData?.supplier_type || 'registered',
            products_sold: 0,
            revenue: 0,
            cogs: 0,
            gross_profit: 0,
            settled_amount: 0,
            outstanding_settlements: 0,
          });
        }

        const supplier = supplierMap.get(supplierId);
        const amount = Number(settlement.payout_amount || 0);
        
        if (settlement.paid_at) {
          supplier.settled_amount += amount;
        } else {
          supplier.outstanding_settlements += amount;
        }
      });

      let suppliers = Array.from(supplierMap.values());

      // Apply supplier type filter
      if (filters.supplierType && filters.supplierType !== 'all') {
        suppliers = suppliers.filter(s => s.supplier_type === filters.supplierType);
      }

      // Sort by revenue descending
      suppliers.sort((a, b) => b.revenue - a.revenue);

      // Calculate totals
      const totals = suppliers.reduce(
        (acc, supplier) => ({
          products_sold: acc.products_sold + supplier.products_sold,
          revenue: acc.revenue + supplier.revenue,
          cogs: acc.cogs + supplier.cogs,
          gross_profit: acc.gross_profit + supplier.gross_profit,
          settled_amount: acc.settled_amount + supplier.settled_amount,
          outstanding_settlements: acc.outstanding_settlements + supplier.outstanding_settlements,
        }),
        {
          products_sold: 0,
          revenue: 0,
          cogs: 0,
          gross_profit: 0,
          settled_amount: 0,
          outstanding_settlements: 0,
        }
      );

      // Prepare chart data (top 10 by revenue)
      const chartData = suppliers.slice(0, 10).map(supplier => ({
        name: supplier.name || 'Unknown',
        revenue: supplier.revenue,
        gross_profit: supplier.gross_profit,
      }));

      return {
        totalSuppliers,
        activeSuppliers,
        suppliers,
        totals,
        chartData,
      };
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });
}
