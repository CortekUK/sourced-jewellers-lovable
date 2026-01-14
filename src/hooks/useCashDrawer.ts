import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export type CashMovementType = 'sale_cash_in' | 'withdrawal' | 'deposit' | 'float_set' | 'adjustment' | 'sale_void_refund';

export interface CashDrawerBalance {
  location_id: number;
  location_name: string;
  current_balance: number;
  last_movement_at: string | null;
  total_movements: number;
}

export interface CashMovement {
  id: number;
  location_id: number;
  movement_type: CashMovementType;
  amount: number;
  reference_sale_id: number | null;
  notes: string | null;
  staff_id: string | null;
  created_at: string;
  location?: { name: string };
  profile?: { full_name: string | null };
}

export function useCashDrawerBalances() {
  return useQuery({
    queryKey: ['cash-drawer-balances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_cash_drawer_balance')
        .select('*');

      if (error) throw error;
      return data as CashDrawerBalance[];
    },
  });
}

export function useCashDrawerHistory(locationId?: number, dateRange?: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['cash-drawer-history', locationId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('cash_drawer_movements')
        .select(`
          *,
          location:locations(name),
          profile:profiles!cash_drawer_movements_staff_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      return data as CashMovement[];
    },
  });
}

export function useRecordCashMovement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (movement: {
      location_id: number;
      movement_type: CashMovementType;
      amount: number;
      reference_sale_id?: number | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('cash_drawer_movements')
        .insert([{
          ...movement,
          staff_id: user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-drawer-balances'] });
      queryClient.invalidateQueries({ queryKey: ['cash-drawer-history'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to record cash movement: ${error.message}`);
    },
  });
}

export function useSetCashFloat() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ locationId, amount, notes }: { locationId: number; amount: number; notes?: string }) => {
      // Get current balance
      const { data: balanceData } = await supabase
        .from('v_cash_drawer_balance')
        .select('current_balance')
        .eq('location_id', locationId)
        .single();

      const currentBalance = balanceData?.current_balance || 0;
      const adjustmentAmount = amount - currentBalance;

      // Insert float set movement
      const { data, error } = await supabase
        .from('cash_drawer_movements')
        .insert([{
          location_id: locationId,
          movement_type: 'float_set',
          amount: adjustmentAmount,
          notes: notes || `Float set to ${amount}`,
          staff_id: user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-drawer-balances'] });
      queryClient.invalidateQueries({ queryKey: ['cash-drawer-history'] });
      toast.success('Cash float set successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to set float: ${error.message}`);
    },
  });
}
