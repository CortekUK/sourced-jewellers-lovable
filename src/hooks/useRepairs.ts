import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// Types
// ============================================
export type RepairStatus =
  | 'received'
  | 'in_progress'
  | 'ready'
  | 'collected'
  | 'cancelled';

export type RepairType =
  | 'repair'
  | 'polish'
  | 'resize'
  | 'rhodium'
  | 'stone_setting'
  | 'engraving'
  | 'valuation'
  | 'cleaning'
  | 'restringing'
  | 'other';

export interface Repair {
  id: number;
  customer_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  item_description: string;
  repair_type: RepairType;
  work_details: string | null;
  status: RepairStatus;
  quoted_cost: number | null;
  location_id: number | null;
  assigned_to: string | null;
  received_at: string;
  promised_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepairWithDetails extends Repair {
  customer?: { id: number; name: string; phone: string | null } | null;
  location?: { id: number; name: string } | null;
}

export interface RepairInsert {
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  item_description: string;
  repair_type?: RepairType;
  work_details?: string | null;
  status?: RepairStatus;
  quoted_cost?: number | null;
  location_id?: number | null;
  assigned_to?: string | null;
  received_at?: string;
  promised_at?: string | null;
  completed_at?: string | null;
  notes?: string | null;
}

export type RepairUpdate = Partial<RepairInsert>;

// ============================================
// Display helpers
// ============================================
export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
  received: 'Received',
  in_progress: 'In Progress',
  ready: 'Ready for Collection',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

export const REPAIR_TYPE_LABELS: Record<RepairType, string> = {
  repair: 'Repair',
  polish: 'Polish',
  resize: 'Resize',
  rhodium: 'Rhodium Plating',
  stone_setting: 'Stone Setting',
  engraving: 'Engraving',
  valuation: 'Valuation',
  cleaning: 'Cleaning',
  restringing: 'Restringing',
  other: 'Other',
};

export const REPAIR_STATUS_ORDER: RepairStatus[] = [
  'received',
  'in_progress',
  'ready',
  'collected',
  'cancelled',
];

export interface RepairFilter {
  status?: RepairStatus | 'all' | 'open';
  search?: string;
}

// ============================================
// Queries
// ============================================
export function useRepairs(filter?: RepairFilter) {
  const { user, session } = useAuth();

  return useQuery({
    queryKey: ['repairs', filter],
    queryFn: async () => {
      let query = supabase
        .from('repairs')
        .select(`
          *,
          customer:customers(id, name, phone),
          location:locations(id, name)
        `)
        .order('received_at', { ascending: false });

      if (filter?.status && filter.status !== 'all' && filter.status !== 'open') {
        query = query.eq('status', filter.status);
      } else if (filter?.status === 'open') {
        // Open = anything not collected/cancelled
        query = query.not('status', 'in', '("collected","cancelled")');
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as RepairWithDetails[];
    },
    enabled: !!user && !!session,
  });
}

export function useRepairStats() {
  const { user, session } = useAuth();

  return useQuery({
    queryKey: ['repair-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repairs')
        .select('status');
      if (error) throw error;

      const rows = data ?? [];
      const open = rows.filter(
        (r) => r.status !== 'collected' && r.status !== 'cancelled'
      ).length;
      const ready = rows.filter((r) => r.status === 'ready').length;
      const inProgress = rows.filter((r) => r.status === 'in_progress').length;

      return { total: rows.length, open, ready, inProgress };
    },
    enabled: !!user && !!session,
  });
}

// ============================================
// Mutations
// ============================================
export function useCreateRepair() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (repair: RepairInsert) => {
      const { data, error } = await supabase
        .from('repairs')
        .insert({ ...repair, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['repair-stats'] });
      toast({ title: 'Repair logged', description: 'The repair has been added.' });
    },
    onError: (error) => {
      console.error('Failed to create repair:', error);
      toast({
        title: 'Error',
        description: 'Failed to log the repair. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateRepair() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: RepairUpdate }) => {
      const { data, error } = await supabase
        .from('repairs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['repair-stats'] });
      toast({ title: 'Repair updated' });
    },
    onError: (error) => {
      console.error('Failed to update repair:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the repair. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteRepair() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('repairs').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['repair-stats'] });
      toast({ title: 'Repair deleted' });
    },
    onError: (error) => {
      console.error('Failed to delete repair:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the repair.',
        variant: 'destructive',
      });
    },
  });
}
