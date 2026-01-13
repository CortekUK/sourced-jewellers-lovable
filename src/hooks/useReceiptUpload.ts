import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Receipt {
  id: number;
  expense_id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_by: string | null;
  uploaded_at: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export function useReceiptUpload(expenseId?: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Fetch receipts for an expense
  const { data: receipts, isLoading } = useQuery({
    queryKey: ['expense-receipts', expenseId],
    queryFn: async () => {
      if (!expenseId) return [];
      const { data, error } = await supabase
        .from('expense_receipts')
        .select('*')
        .eq('expense_id', expenseId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as Receipt[];
    },
    enabled: !!expenseId,
  });

  // Upload receipt mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ expenseId, file }: { expenseId: number; file: File }) => {
      // Validate file
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Only PDF, JPG, and PNG files are allowed');
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size must be less than 10MB');
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${expenseId}/${crypto.randomUUID()}.${fileExt}`;
      const filePath = `expense-receipts/${fileName}`;

      // Upload to storage
      setUploadProgress(0);
      const { error: uploadError } = await supabase.storage
        .from('expense-receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      setUploadProgress(50);

      // Create database record
      const { data: user } = await supabase.auth.getUser();
      const { error: dbError } = await supabase.from('expense_receipts').insert({
        expense_id: expenseId,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: fileExt?.toLowerCase() || 'unknown',
        uploaded_by: user.user?.id,
      });

      if (dbError) {
        // Clean up storage if DB insert fails
        await supabase.storage.from('expense-receipts').remove([filePath]);
        throw dbError;
      }

      setUploadProgress(100);
      return filePath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-receipts', expenseId] });
      toast({
        title: 'Receipt uploaded',
        description: 'Receipt has been uploaded successfully.',
      });
      setTimeout(() => setUploadProgress(0), 1000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      setUploadProgress(0);
    },
  });

  // Delete receipt mutation
  const deleteMutation = useMutation({
    mutationFn: async (receipt: Receipt) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('expense-receipts')
        .remove([receipt.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('expense_receipts')
        .delete()
        .eq('id', receipt.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-receipts', expenseId] });
      toast({
        title: 'Receipt deleted',
        description: 'Receipt has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get signed URL for viewing
  const getSignedUrl = async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('expense-receipts')
      .createSignedUrl(filePath, 3600); // 1 hour

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    receipts: receipts || [],
    isLoading,
    uploadProgress,
    uploadReceipt: uploadMutation.mutate,
    deleteReceipt: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    getSignedUrl,
  };
}
