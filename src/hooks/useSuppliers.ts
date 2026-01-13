import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Supplier {
  id: number;
  name: string;
  supplier_type: 'registered' | 'customer';
  email: string | null;
  phone: string | null;
  contact_name: string | null;
  notes: string | null;
  address: string | null;
  status: string;
  tags: string[] | null;
  created_at: string;
  demo_session_id: string | null;
  product_count?: number;
  orders_this_month?: number;
  total_spend_this_year?: number;
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      // Fetch suppliers
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (suppliersError) throw suppliersError;

      // Fetch metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('v_supplier_metrics')
        .select('supplier_id, product_count, orders_this_month, total_spend_this_year');

      if (metricsError) throw metricsError;

      // Merge suppliers with metrics
      const suppliersWithMetrics = suppliers.map(supplier => {
        const metric = metrics?.find(m => m.supplier_id === supplier.id);
        return {
          ...supplier,
          product_count: metric?.product_count || 0,
          orders_this_month: metric?.orders_this_month || 0,
          total_spend_this_year: metric?.total_spend_this_year || 0,
        };
      });

      return suppliersWithMetrics as Supplier[];
    },
  });
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Supplier;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'created_at' | 'demo_session_id'>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          ...supplier,
          supplier_type: supplier.supplier_type || 'registered' // Default to registered
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-metrics'] });
      toast.success('Supplier created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create supplier: ${error.message}`);
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: number }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-metrics'] });
      toast.success('Supplier updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update supplier: ${error.message}`);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-metrics'] });
      toast.success('Supplier deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete supplier: ${error.message}`);
    },
  });
}
