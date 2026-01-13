import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSupplierProducts(supplierId: number) {
  return useQuery({
    queryKey: ['supplier-products', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          internal_sku,
          sku,
          category,
          metal,
          karat,
          unit_cost,
          unit_price,
          is_consignment,
          is_trade_in,
          track_stock
        `)
        .or(`supplier_id.eq.${supplierId},consignment_supplier_id.eq.${supplierId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });
}

export function useSupplierTransactions(supplierId: number) {
  return useQuery({
    queryKey: ['supplier-transactions', supplierId],
    queryFn: async () => {
      // Get supplier info to determine type
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('supplier_type')
        .eq('id', supplierId)
        .single();

      if (supplierError) throw supplierError;

      const isCustomerSupplier = supplier?.supplier_type === 'customer';

      // Get stock movements
      const { data: stockMovements, error: stockError } = await supabase
        .from('stock_movements')
        .select(`
          id,
          movement_type,
          quantity,
          unit_cost,
          occurred_at,
          note,
          product_id,
          products (name, internal_sku)
        `)
        .eq('supplier_id', supplierId)
        .eq('movement_type', 'purchase')
        .order('occurred_at', { ascending: false })
        .limit(10);

      if (stockError) throw stockError;

      // Get expenses
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select(`
          id,
          description,
          amount,
          category,
          incurred_at
        `)
        .eq('supplier_id', supplierId)
        .order('incurred_at', { ascending: false })
        .limit(10);

      if (expenseError) throw expenseError;

      // Combine and sort by date
      const allTransactions = [
        ...(stockMovements || []).map(sm => ({
          id: `stock-${sm.id}`,
          type: 'stock_purchase' as const,
          date: sm.occurred_at,
          description: isCustomerSupplier 
            ? `Part-Exchange: ${sm.products?.name || 'Unknown Product'}`
            : `Stock Purchase: ${sm.products?.name || 'Unknown Product'}`,
          amount: (sm.quantity || 0) * (sm.unit_cost || 0),
          details: {
            quantity: sm.quantity,
            unitCost: sm.unit_cost,
            productName: sm.products?.name,
            productSku: sm.products?.internal_sku,
          }
        })),
        ...(expenses || []).map(exp => ({
          id: `expense-${exp.id}`,
          type: 'expense' as const,
          date: exp.incurred_at,
          description: isCustomerSupplier
            ? exp.description || 'Customer Payout'
            : exp.description || 'Expense',
          amount: exp.amount,
          details: {
            category: exp.category,
          }
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return allTransactions;
    },
    enabled: !!supplierId,
  });
}

export function useSupplierSpendTrend(supplierId: number, months: number = 12) {
  return useQuery({
    queryKey: ['supplier-spend-trend', supplierId, months],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get monthly stock purchases
      const { data: stockSpend, error: stockError } = await supabase
        .from('stock_movements')
        .select('occurred_at, quantity, unit_cost')
        .eq('supplier_id', supplierId)
        .eq('movement_type', 'purchase')
        .gte('occurred_at', startDate.toISOString());

      if (stockError) throw stockError;

      // Get monthly expenses
      const { data: expenseSpend, error: expenseError } = await supabase
        .from('expenses')
        .select('incurred_at, amount')
        .eq('supplier_id', supplierId)
        .gte('incurred_at', startDate.toISOString());

      if (expenseError) throw expenseError;

      // Group by month
      const monthlyData: { [key: string]: { stock: number; expenses: number } } = {};

      // Process stock movements
      (stockSpend || []).forEach(sm => {
        const monthKey = new Date(sm.occurred_at).toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { stock: 0, expenses: 0 };
        }
        monthlyData[monthKey].stock += (sm.quantity || 0) * (sm.unit_cost || 0);
      });

      // Process expenses
      (expenseSpend || []).forEach(exp => {
        const monthKey = new Date(exp.incurred_at).toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { stock: 0, expenses: 0 };
        }
        monthlyData[monthKey].expenses += exp.amount || 0;
      });

      // Convert to chart data format
      const chartData = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
          }),
          stockSpend: data.stock,
          expenseSpend: data.expenses,
          totalSpend: data.stock + data.expenses,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      return chartData;
    },
    enabled: !!supplierId,
  });
}