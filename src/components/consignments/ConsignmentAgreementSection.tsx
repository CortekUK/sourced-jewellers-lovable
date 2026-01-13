import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Upload, Download, Eye, RotateCcw, Trash2, Calendar } from 'lucide-react';
import { useConsignmentAgreements } from '@/hooks/useConsignmentAgreements';
import { useDocumentDelete, generateSignedUrl, formatFileSize } from '@/hooks/useProductDocuments';
import { useOwnerGuard } from '@/hooks/useOwnerGuard';
import { ConsignmentAgreementUploadModal } from './ConsignmentAgreementUploadModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ConsignmentAgreementSectionProps {
  productId: number;
  isConsignment: boolean;
}

export function ConsignmentAgreementSection({ productId, isConsignment }: ConsignmentAgreementSectionProps) {
  const { data: agreements, isLoading } = useConsignmentAgreements(productId);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [replaceDocumentId, setReplaceDocumentId] = useState<number | null>(null);
  const deleteDocument = useDocumentDelete();
  const isOwner = useOwnerGuard();
  const { toast } = useToast();

  const handleViewDocument = async (path: string) => {
    try {
      const signedUrl = await generateSignedUrl(path);
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Failed to generate download link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: number, path: string) => {
    try {
      await deleteDocument.mutateAsync({ documentId, path, productId });
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consignment Agreement
          </CardTitle>
          <CardDescription>
            {isConsignment 
              ? "Manage consignment agreement documents for this product"
              : "This product must be marked as consignment to upload agreements"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConsignment && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Product must be marked as consignment to upload agreements</p>
            </div>
          )}

          {isConsignment && agreements.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">No consignment agreements uploaded yet</p>
              {isOwner && (
                <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Agreement
                </Button>
              )}
            </div>
          )}

          {isConsignment && agreements.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Agreement Documents ({agreements.length})</p>
                {isOwner && (
                  <Button 
                    onClick={() => setUploadModalOpen(true)} 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload New
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {agreements.map((agreement) => (
                  <Card key={agreement.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-yellow-600" />
                            <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300">
                              Consignment Agreement
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium truncate mb-1">
                            {agreement.title || 'Consignment Agreement'}
                          </h4>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Uploaded {format(new Date(agreement.uploaded_at), 'MMM dd, yyyy')}
                            </span>
                            <span>{formatFileSize(agreement.file_size)}</span>
                            {agreement.file_ext && (
                              <span className="uppercase">{agreement.file_ext}</span>
                            )}
                          </div>

                          {agreement.expires_at && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                              <Calendar className="h-3 w-3" />
                              Expires {format(new Date(agreement.expires_at), 'MMM dd, yyyy')}
                            </div>
                          )}

                          {agreement.note && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {agreement.note}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(agreement.path)}
                            className="h-8 w-8 p-0"
                            title="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(agreement.path)}
                            className="h-8 w-8 p-0"
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          {isOwner && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setReplaceDocumentId(agreement.id);
                                  setUploadModalOpen(true);
                                }}
                                className="h-8 w-8 p-0"
                                title="Replace document"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    title="Delete document"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Agreement</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this consignment agreement? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteDocument(agreement.id, agreement.path)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConsignmentAgreementUploadModal
        productId={productId}
        open={uploadModalOpen}
        onOpenChange={(open) => {
          setUploadModalOpen(open);
          if (!open) setReplaceDocumentId(null);
        }}
        replaceDocumentId={replaceDocumentId}
      />
    </>
  );
}