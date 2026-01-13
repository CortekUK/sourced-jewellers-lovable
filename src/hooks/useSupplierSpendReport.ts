import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSupplierSpendReport() {
  return useQuery({
    queryKey: ['supplier-spend-report'],
    queryFn: async () => {
      // Get base supplier spend data with supplier_type
      const { data: supplierSpend, error: supplierError } = await supabase
        .from('v_supplier_spend')
        .select(`
          *,
          suppliers!inner(supplier_type)
        `);

      if (supplierError) throw supplierError;

      // Get consignment payouts by supplier
      const { data: consignmentPayouts, error: payoutError } = await supabase
        .from('consignment_settlements')
        .select(`
          supplier_id,
          payout_amount,
          paid_at,
          suppliers(name)
        `)
        .not('payout_amount', 'is', null);

      if (payoutError) throw payoutError;

      // Group consignment data by supplier
      const consignmentMap = new Map();
      consignmentPayouts?.forEach(payout => {
        if (!payout.supplier_id) return;
        
        if (!consignmentMap.has(payout.supplier_id)) {
          consignmentMap.set(payout.supplier_id, {
            supplier_id: payout.supplier_id,
            name: payout.suppliers?.name || 'Unknown',
            paid_payouts: 0,
            outstanding_payouts: 0
          });
        }

        const supplier = consignmentMap.get(payout.supplier_id);
        const amount = Number(payout.payout_amount || 0);
        
        if (payout.paid_at) {
          supplier.paid_payouts += amount;
        } else {
          supplier.outstanding_payouts += amount;
        }
      });

      // Merge supplier spend with consignment data
      const enrichedSuppliers = supplierSpend?.map((supplier: any) => {
        const consignmentData = consignmentMap.get(supplier.supplier_id) || {
          paid_payouts: 0,
          outstanding_payouts: 0
        };

        const supplierTypeData = Array.isArray(supplier.suppliers) 
          ? supplier.suppliers[0] 
          : supplier.suppliers;

        return {
          supplier_id: supplier.supplier_id,
          name: supplier.name,
          supplier_type: supplierTypeData?.supplier_type || 'registered',
          inventory_spend: Number(supplier.inventory_spend || 0),
          expense_spend: Number(supplier.expense_spend || 0),
          consignment_payouts: consignmentData.paid_payouts,
          outstanding_payouts: consignmentData.outstanding_payouts,
          total_spend: Number(supplier.total_spend || 0) + consignmentData.paid_payouts
        };
      }) || [];

      // Add suppliers that only have consignment data
      consignmentMap.forEach((consignmentData, supplierId) => {
        if (!enrichedSuppliers.find(s => s.supplier_id === supplierId)) {
          enrichedSuppliers.push({
            supplier_id: supplierId,
            name: consignmentData.name,
            supplier_type: 'registered', // Default, would need additional query to get actual type
            inventory_spend: 0,
            expense_spend: 0,
            consignment_payouts: consignmentData.paid_payouts,
            outstanding_payouts: consignmentData.outstanding_payouts,
            total_spend: consignmentData.paid_payouts
          });
        }
      });

      // Sort by total spend descending
      enrichedSuppliers.sort((a, b) => b.total_spend - a.total_spend);

      // Calculate totals
      const totals = enrichedSuppliers.reduce((acc, supplier) => ({
        inventorySpend: acc.inventorySpend + supplier.inventory_spend,
        expenseSpend: acc.expenseSpend + supplier.expense_spend,
        consignmentPayouts: acc.consignmentPayouts + supplier.consignment_payouts,
        totalSpend: acc.totalSpend + supplier.total_spend
      }), { inventorySpend: 0, expenseSpend: 0, consignmentPayouts: 0, totalSpend: 0 });

      // Prepare chart data (top 10)
      const chartData = enrichedSuppliers.slice(0, 10).map(supplier => ({
        name: supplier.name || 'Unknown',
        total_spend: supplier.total_spend,
        inventory_spend: supplier.inventory_spend,
        expense_spend: supplier.expense_spend,
        consignment_payouts: supplier.consignment_payouts
      }));

      return {
        suppliers: enrichedSuppliers,
        totals,
        chartData
      };
    }
  });
}