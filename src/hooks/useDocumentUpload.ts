import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useDocumentUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      file, 
      onProgress 
    }: { 
      productId: number; 
      file: File; 
      onProgress?: (progress: number) => void;
    }) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const filePath = `products/${productId}/registration.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('product-docs')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update product record
      const { error: updateError } = await supabase
        .from('products')
        .update({
          registration_doc: filePath,
          is_registered: true,
          registration_doc_uploaded_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      return filePath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Registration document uploaded successfully"
      });
    },
    onError: (error: any) => {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    }
  });
}

export function useDocumentRemove() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, filePath }: { productId: number; filePath?: string }) => {
      // Remove file from storage if it exists
      if (filePath) {
        await supabase.storage
          .from('product-docs')
          .remove([filePath]);
      }

      // Update product record
      const { error } = await supabase
        .from('products')
        .update({
          registration_doc: null,
          registration_doc_uploaded_at: null
        })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Registration document removed"
      });
    },
    onError: (error: any) => {
      console.error('Error removing document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove document",
        variant: "destructive"
      });
    }
  });
}