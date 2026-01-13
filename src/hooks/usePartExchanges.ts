import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PartExchange, PartExchangeInsert, PartExchangeUpdate } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Get part exchanges where a specific product was the trade-in item
export const usePartExchangesByProduct = (productId: number) => {
  return useQuery({
    queryKey: ['part-exchanges', 'product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('part_exchanges')
        .select(`
          *,
          sale:sales(sold_at, staff_id)
        `)
        .eq('product_id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - product is not from a part exchange
          return null;
        }
        throw error;
      }
      return data;
    },
    enabled: !!productId,
  });
};

// Get part exchanges for a specific sale
export const usePartExchangesBySale = (saleId: number) => {
  return useQuery({
    queryKey: ['part-exchanges', 'sale', saleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('part_exchanges')
        .select(`
          *,
          product:products(*),
          sale:sales(sold_at)
        `)
        .eq('sale_id', saleId);

      if (error) throw error;
      return data;
    },
    enabled: !!saleId,
  });
};

// Get all part exchanges with product details for reporting
export const usePartExchanges = () => {
  return useQuery({
    queryKey: ['part-exchanges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('part_exchanges')
        .select(`
          *,
          product:products(*),
          sale:sales(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Get pending part exchanges stats for dashboard
export const usePendingPartExchangesStats = () => {
  return useQuery({
    queryKey: ['part-exchanges', 'pending-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('part_exchanges')
        .select('allowance')
        .eq('status', 'pending');

      if (error) throw error;
      
      const count = data?.length || 0;
      const totalValue = data?.reduce((sum, px) => sum + Number(px.allowance), 0) || 0;
      
      return { count, totalValue };
    },
  });
};

// Create a new part exchange
export const useCreatePartExchange = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (partExchange: PartExchangeInsert) => {
      const { data, error } = await supabase
        .from('part_exchanges')
        .insert(partExchange)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['part-exchanges'] });
      toast({
        title: "Part exchange created",
        description: "Trade-in item has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating part exchange",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Update part exchange
export const useUpdatePartExchange = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: PartExchangeUpdate }) => {
      const { data, error } = await supabase
        .from('part_exchanges')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['part-exchanges'] });
      toast({
        title: "Part exchange updated",
        description: "Trade-in details have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating part exchange",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Delete part exchange
export const useDeletePartExchange = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('part_exchanges')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['part-exchanges'] });
      toast({
        title: "Part exchange deleted",
        description: "Trade-in item has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting part exchange",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Discard part exchange (soft delete by changing status)
export const useDiscardPartExchange = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const updates: any = {
        status: 'discarded',
      };

      // Append discard reason to notes if provided
      if (reason) {
        const { data: current } = await supabase
          .from('part_exchanges')
          .select('notes')
          .eq('id', id)
          .single();

        const timestamp = new Date().toISOString();
        const discardNote = `\n\n[DISCARDED ${timestamp}]: ${reason}`;
        updates.notes = (current?.notes || '') + discardNote;
      }

      const { error } = await supabase
        .from('part_exchanges')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['part-exchanges'] });
      queryClient.invalidateQueries({ queryKey: ['pending-part-exchanges'] });
      toast({
        title: "Trade-in discarded",
        description: "Item has been marked as discarded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error discarding trade-in",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};