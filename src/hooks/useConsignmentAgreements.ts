import { useMemo } from 'react';
import { useProductDocuments, useDocumentUpload, type DocumentUploadData } from '@/hooks/useProductDocuments';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Hook to get consignment agreements for a product
export function useConsignmentAgreements(productId: number) {
  const { data: documents, ...query } = useProductDocuments(productId);
  
  const agreements = useMemo(() => {
    return documents?.filter(doc => doc.doc_type === 'consignment_agreement') || [];
  }, [documents]);

  return {
    ...query,
    data: agreements,
    hasAgreements: agreements.length > 0,
  };
}

// Hook to upload consignment agreement specifically
export function useConsignmentAgreementUpload() {
  const upload = useDocumentUpload();
  
  return useMutation({
    mutationFn: async ({
      productId,
      file,
      metadata = {},
    }: {
      productId: number;
      file: File;
      metadata?: Partial<DocumentUploadData>;
    }) => {
      const agreementMetadata: DocumentUploadData = {
        doc_type: 'consignment_agreement',
        title: metadata.title || 'Consignment Agreement',
        note: metadata.note,
        expires_at: metadata.expires_at,
      };

      return upload.mutateAsync({
        productId,
        file,
        metadata: agreementMetadata,
      });
    },
    onSuccess: () => {},
    onError: () => {},
  });
}

// Hook to check if multiple products have consignment agreements
export function useProductsWithAgreements(productIds: number[]) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: number[]) => {
      if (!productIds.length) return {};

      const { data, error } = await supabase
        .from('product_documents')
        .select('product_id')
        .in('product_id', productIds)
        .eq('doc_type', 'consignment_agreement');

      if (error) throw error;

      // Return a map of productId -> hasAgreement
      const agreementMap = productIds.reduce((acc, id) => {
        acc[id] = data.some(doc => doc.product_id === id);
        return acc;
      }, {} as Record<number, boolean>);

      return agreementMap;
    },
    onError: (error: any) => {
      console.error('Error checking agreements:', error);
      toast({
        title: "Error",
        description: "Failed to check agreement status",
        variant: "destructive",
      });
    },
  });
}