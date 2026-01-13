import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

export function useSupplierSpendAnalytics(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['supplier-spend-analytics', dateRange],
    queryFn: async () => {
      // Get inventory spend (stock movements)
      let stockQuery = supabase
        .from('stock_movements')
        .select(`
          supplier_id,
          unit_cost,
          quantity,
          occurred_at,
          suppliers(name)
        `)
        .eq('movement_type', 'purchase')
        .not('supplier_id', 'is', null);

      if (dateRange?.from) {
        stockQuery = stockQuery.gte('occurred_at', startOfDay(dateRange.from).toISOString());
      }
      if (dateRange?.to) {
        stockQuery = stockQuery.lte('occurred_at', endOfDay(dateRange.to).toISOString());
      }

      const { data: stockData, error: stockError } = await stockQuery;
      if (stockError) throw stockError;

      // Get expense spend
      let expenseQuery = supabase
        .from('expenses')
        .select(`
          supplier_id,
          amount,
          incurred_at,
          suppliers(name)
        `)
        .not('supplier_id', 'is', null);

      if (dateRange?.from) {
        expenseQuery = expenseQuery.gte('incurred_at', startOfDay(dateRange.from).toISOString());
      }
      if (dateRange?.to) {
        expenseQuery = expenseQuery.lte('incurred_at', endOfDay(dateRange.to).toISOString());
      }

      const { data: expenseData, error: expenseError } = await expenseQuery;
      if (expenseError) throw expenseError;

      // Aggregate by supplier
      const supplierMap = new Map();

      // Process stock movements
      stockData?.forEach(movement => {
        if (!movement.supplier_id) return;
        
        if (!supplierMap.has(movement.supplier_id)) {
          supplierMap.set(movement.supplier_id, {
            supplier_id: movement.supplier_id,
            name: movement.suppliers?.name || 'Unknown',
            inventory_spend: 0,
            expense_spend: 0,
            total_spend: 0,
            daily_data: new Map()
          });
        }

        const supplier = supplierMap.get(movement.supplier_id);
        const amount = Number(movement.unit_cost || 0) * Number(movement.quantity || 0);
        supplier.inventory_spend += amount;
        supplier.total_spend += amount;

        // Track daily data
        const day = format(new Date(movement.occurred_at), 'yyyy-MM-dd');
        const dayData = supplier.daily_data.get(day) || { inventory: 0, expenses: 0 };
        dayData.inventory += amount;
        supplier.daily_data.set(day, dayData);
      });

      // Process expenses
      expenseData?.forEach(expense => {
        if (!expense.supplier_id) return;
        
        if (!supplierMap.has(expense.supplier_id)) {
          supplierMap.set(expense.supplier_id, {
            supplier_id: expense.supplier_id,
            name: expense.suppliers?.name || 'Unknown',
            inventory_spend: 0,
            expense_spend: 0,
            total_spend: 0,
            daily_data: new Map()
          });
        }

        const supplier = supplierMap.get(expense.supplier_id);
        const amount = Number(expense.amount || 0);
        supplier.expense_spend += amount;
        supplier.total_spend += amount;

        // Track daily data
        const day = format(new Date(expense.incurred_at), 'yyyy-MM-dd');
        const dayData = supplier.daily_data.get(day) || { inventory: 0, expenses: 0 };
        dayData.expenses += amount;
        supplier.daily_data.set(day, dayData);
      });

      const suppliers = Array.from(supplierMap.values()).map(s => ({
        ...s,
        daily_data: Array.from(s.daily_data.entries()).map(([day, data]) => ({
          day,
          inventory_spend: data.inventory,
          expense_spend: data.expenses,
          total_spend: data.inventory + data.expenses
        }))
      }));

      // Sort by total spend
      suppliers.sort((a, b) => b.total_spend - a.total_spend);

      // Calculate totals
      const totals = suppliers.reduce((acc, s) => ({
        inventory: acc.inventory + s.inventory_spend,
        expenses: acc.expenses + s.expense_spend,
        total: acc.total + s.total_spend
      }), { inventory: 0, expenses: 0, total: 0 });

      // Calculate top supplier percentage
      const topSupplierPercentage = suppliers.length > 0 && totals.total > 0
        ? (suppliers[0].total_spend / totals.total) * 100
        : 0;

      // Prepare chart data (top 10)
      const barChartData = suppliers.slice(0, 10).map(s => ({
        category: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
        amount: s.total_spend
      }));

      // Prepare time series data (aggregate all suppliers by day)
      const timeSeriesMap = new Map();
      suppliers.forEach(supplier => {
        supplier.daily_data.forEach((dayData: any) => {
          const existing = timeSeriesMap.get(dayData.day) || { 
            day: dayData.day, 
            total_spend: 0 
          };
          existing.total_spend += dayData.total_spend;
          timeSeriesMap.set(dayData.day, existing);
        });
      });

      const timeSeriesData = Array.from(timeSeriesMap.values())
        .sort((a, b) => a.day.localeCompare(b.day))
        .map(item => ({
          day: item.day,
          revenue: item.total_spend, // Using 'revenue' field to match SimpleLineChart
          gross_profit: 0 // Not used for this chart
        }));

      return {
        suppliers,
        totals,
        topSupplierPercentage,
        barChartData,
        timeSeriesData
      };
    }
  });
}
