import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DocumentType = 'registration' | 'warranty' | 'appraisal' | 'service' | 'photo' | 'certificate_card' | 'consignment_agreement' | 'other';

export interface ProductDocument {
  id: number;
  product_id: number;
  doc_type: DocumentType;
  title: string | null;
  note: string | null;
  path: string;
  file_ext: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  expires_at: string | null;
}

export interface DocumentUploadData {
  doc_type: DocumentType;
  title?: string;
  note?: string;
  expires_at?: string;
}

// Fetch documents for a product
export function useProductDocuments(productId: number) {
  return useQuery({
    queryKey: ['product-documents', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_documents')
        .select('*')
        .eq('product_id', productId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as ProductDocument[];
    },
    enabled: !!productId,
  });
}

// Upload a new document
export function useDocumentUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      file,
      metadata,
    }: {
      productId: number;
      file: File;
      metadata: DocumentUploadData;
    }) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `products/${productId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('product-docs')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Create database record
      const { error: insertError } = await supabase
        .from('product_documents')
        .insert({
          product_id: productId,
          doc_type: metadata.doc_type,
          title: metadata.title || file.name,
          note: metadata.note || null,
          path: filePath,
          file_ext: fileExt,
          file_size: file.size,
          expires_at: metadata.expires_at || null,
        });

      if (insertError) throw insertError;

      return filePath;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-documents', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });
}

// Delete a document
export function useDocumentDelete() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, path, productId }: { documentId: number; path: string; productId: number }) => {
      // Delete from storage
      await supabase.storage.from('product-docs').remove([path]);

      // Delete from database
      const { error } = await supabase
        .from('product_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-documents', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });
}

// Update document metadata
export function useDocumentUpdate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      productId,
      updates,
    }: {
      documentId: number;
      productId: number;
      updates: Partial<DocumentUploadData & { title: string }>;
    }) => {
      const { error } = await supabase
        .from('product_documents')
        .update(updates)
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-documents', variables.productId] });
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error updating document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update document",
        variant: "destructive",
      });
    },
  });
}

// Replace document file
export function useDocumentReplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      productId,
      file,
      oldPath,
    }: {
      documentId: number;
      productId: number;
      file: File;
      oldPath: string;
    }) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const newPath = `products/${productId}/${fileName}`;

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('product-docs')
        .upload(newPath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Update database record
      const { error: updateError } = await supabase
        .from('product_documents')
        .update({
          path: newPath,
          file_ext: fileExt,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Delete old file (don't fail if this doesn't work)
      await supabase.storage.from('product-docs').remove([oldPath]);

      return newPath;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-documents', variables.productId] });
      toast({
        title: "Success",
        description: "Document replaced successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error replacing document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to replace document",
        variant: "destructive",
      });
    },
  });
}

// Generate signed URL for viewing/downloading
export async function generateSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('product-docs')
    .createSignedUrl(path, 3600); // 1 hour

  if (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

// Helper to check if document is expiring soon (within 30 days)
export function isDocumentExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  
  const expiryDate = new Date(expiresAt);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
}

// Helper to get file type icon
export function getFileTypeIcon(fileExt: string | null): string {
  if (!fileExt) return 'file';
  
  const ext = fileExt.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'file-text';
  if (['doc', 'docx'].includes(ext)) return 'file-text';
  if (['xls', 'xlsx'].includes(ext)) return 'file-spreadsheet';
  
  return 'file';
}

// Helper to format file size
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}