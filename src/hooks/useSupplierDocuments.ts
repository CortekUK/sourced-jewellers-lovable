import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupplierDocument {
  id: number;
  supplier_id: number;
  title: string | null;
  file_path: string;
  file_size: number | null;
  file_ext: string | null;
  doc_type: string;
  uploaded_at: string;
  uploaded_by: string | null;
  note: string | null;
}

export function useSupplierDocuments(supplierId: number) {
  return useQuery({
    queryKey: ['supplier-documents', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_documents')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as SupplierDocument[];
    },
    enabled: !!supplierId,
  });
}

export function useUploadSupplierDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      supplierId, 
      file, 
      title, 
      docType, 
      note 
    }: {
      supplierId: number;
      file: File;
      title?: string;
      docType: string;
      note?: string;
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${supplierId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-docs') // Reusing existing bucket
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document metadata
      const { data, error } = await supabase
        .from('supplier_documents')
        .insert([{
          supplier_id: supplierId,
          title: title || file.name,
          file_path: uploadData.path,
          file_size: file.size,
          file_ext: fileExt,
          doc_type: docType,
          note: note || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-documents', variables.supplierId] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload document: ${error.message}`);
    },
  });
}

export function useDeleteSupplierDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, filePath }: { documentId: number; filePath: string }) => {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('product-docs')
        .remove([filePath]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
      }

      // Delete document record
      const { error } = await supabase
        .from('supplier_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate all supplier documents queries
      queryClient.invalidateQueries({ queryKey: ['supplier-documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}