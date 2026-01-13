import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface VoidSaleParams {
  saleId: number;
  reason: string;
}

interface EditSaleItemParams {
  saleId: number;
  itemId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  reason: string;
}

export function useVoidSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ saleId, reason }: VoidSaleParams) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('void_sale', {
        p_sale_id: saleId,
        p_user_id: user.id,
        p_reason: reason
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to void sale');
      }

      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-details', variables.saleId] });
      queryClient.invalidateQueries({ queryKey: ['sold-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-data'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });

      toast({
        title: 'Sale Voided',
        description: 'The sale has been voided and stock has been restored.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to void sale',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useEditSaleItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ saleId, itemId, quantity, unitPrice, discount, reason }: EditSaleItemParams) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('edit_sale_item', {
        p_sale_id: saleId,
        p_item_id: itemId,
        p_new_quantity: quantity,
        p_new_unit_price: unitPrice,
        p_new_discount: discount,
        p_user_id: user.id,
        p_reason: reason
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to edit sale');
      }

      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-details', variables.saleId] });
      queryClient.invalidateQueries({ queryKey: ['sold-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-data'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });

      toast({
        title: 'Sale Updated',
        description: 'The sale has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to edit sale',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to directly update sale item without RPC (simpler approach)
export function useUpdateSaleItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      saleId,
      itemId,
      quantity,
      unitPrice,
      discount,
      originalQuantity,
      productId,
      unitCost,
      reason
    }: {
      saleId: number;
      itemId: number;
      quantity: number;
      unitPrice: number;
      discount: number;
      originalQuantity: number;
      productId: number;
      unitCost: number;
      reason: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const quantityDiff = originalQuantity - quantity;

      // Update the sale item
      const { error: itemError } = await supabase
        .from('sale_items')
        .update({
          quantity,
          unit_price: unitPrice,
          discount
        })
        .eq('id', itemId);

      if (itemError) throw itemError;

      // Adjust stock if quantity changed
      if (quantityDiff !== 0) {
        const { error: stockError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: productId,
            movement_type: quantityDiff > 0 ? 'purchase' : 'sale',
            quantity: Math.abs(quantityDiff),
            unit_cost: unitCost,
            note: quantityDiff > 0
              ? `Stock restored from sale edit #${saleId}: quantity reduced by ${quantityDiff}`
              : `Stock deducted from sale edit #${saleId}: quantity increased by ${Math.abs(quantityDiff)}`
          });

        if (stockError) throw stockError;
      }

      // Recalculate sale totals
      const { data: allItems } = await supabase
        .from('sale_items')
        .select('quantity, unit_price, discount')
        .eq('sale_id', saleId);

      const newSubtotal = allItems?.reduce((sum, item) =>
        sum + (item.quantity * item.unit_price), 0) || 0;
      const newDiscountTotal = allItems?.reduce((sum, item) =>
        sum + item.discount, 0) || 0;
      const newTotal = newSubtotal - newDiscountTotal;

      // Update sale totals
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          subtotal: newSubtotal,
          discount_total: newDiscountTotal,
          total: newTotal,
          edited_at: new Date().toISOString(),
          edited_by: user.id,
          edit_reason: reason
        })
        .eq('id', saleId);

      if (saleError) throw saleError;

      return { success: true, saleId, itemId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-details', result.saleId] });
      queryClient.invalidateQueries({ queryKey: ['sold-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-data'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-products'] });

      toast({
        title: 'Sale Updated',
        description: 'The sale item has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update sale',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to void sale without RPC (simpler approach)
export function useVoidSaleSimple() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ saleId, reason }: VoidSaleParams) => {
      if (!user) throw new Error('User not authenticated');

      // Check if sale is already voided
      const { data: sale, error: saleCheckError } = await supabase
        .from('sales')
        .select('is_voided')
        .eq('id', saleId)
        .single();

      if (saleCheckError) throw saleCheckError;
      if (sale?.is_voided) {
        throw new Error('This sale has already been voided');
      }

      // Get sale items to restore stock
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('product_id, quantity, unit_cost')
        .eq('sale_id', saleId);

      if (itemsError) throw itemsError;

      // Mark sale as voided
      const { error: voidError } = await supabase
        .from('sales')
        .update({
          is_voided: true,
          voided_at: new Date().toISOString(),
          voided_by: user.id,
          void_reason: reason
        })
        .eq('id', saleId);

      if (voidError) throw voidError;

      // Restore stock for each item
      for (const item of saleItems || []) {
        const { error: stockError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: item.product_id,
            movement_type: 'purchase',
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            note: `Stock restored from voided sale #${saleId}: ${reason}`
          });

        if (stockError) throw stockError;
      }

      return { success: true, saleId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-details', result.saleId] });
      queryClient.invalidateQueries({ queryKey: ['sold-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-data'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });

      toast({
        title: 'Sale Voided',
        description: 'The sale has been voided and stock has been restored.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to void sale',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
