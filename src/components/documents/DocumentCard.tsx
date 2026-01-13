import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Eye, 
  Download, 
  MoreVertical, 
  Edit, 
  Trash2, 
  RefreshCw,
  AlertTriangle 
} from 'lucide-react';
import { ProductDocument, useDocumentDelete, generateSignedUrl, isDocumentExpiringSoon, formatFileSize } from '@/hooks/useProductDocuments';
import { DocumentTypeIcon, getDocumentTypeLabel, getDocumentTypeColor } from './DocumentTypeIcon';
import { DocumentEditDialog } from './DocumentEditDialog';
import { DocumentReplaceDialog } from './DocumentReplaceDialog';
import { useOwnerGuard } from '@/hooks/useOwnerGuard';
import { useToast } from '@/hooks/use-toast';

interface DocumentCardProps {
  document: ProductDocument;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const isOwner = useOwnerGuard();
  const deleteDocument = useDocumentDelete();
  const { toast } = useToast();

  const isExpiring = document.expires_at && isDocumentExpiringSoon(document.expires_at);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(document.file_ext?.toLowerCase() || '');

  const handleView = async () => {
    setIsLoading(true);
    try {
      const signedUrl = await generateSignedUrl(document.path);
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Failed to generate view link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Failed to view document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const signedUrl = await generateSignedUrl(document.path);
      if (signedUrl) {
        const link = window.document.createElement('a');
        link.href = signedUrl;
        link.download = document.title || 'document';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate download link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    await deleteDocument.mutateAsync({
      documentId: document.id,
      path: document.path,
      productId: document.product_id,
    });
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Document Icon */}
            <div className="flex-shrink-0 mt-1">
              <DocumentTypeIcon type={document.doc_type} className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Document Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate" title={document.title || undefined}>
                    {document.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getDocumentTypeColor(document.doc_type)}`}
                    >
                      {getDocumentTypeLabel(document.doc_type)}
                    </Badge>
                    {isExpiring && (
                      <Badge className="text-xs bg-amber-500 hover:bg-amber-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleView} disabled={isLoading}>
                      <Eye className="h-4 w-4 mr-2" />
                      {isImage ? 'View' : 'Open'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload} disabled={isLoading}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    {isOwner && (
                      <>
                        <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowReplaceDialog(true)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Replace File
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Document Meta */}
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <div>
                  Uploaded {format(new Date(document.uploaded_at), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <span>{formatFileSize(document.file_size)}</span>
                  {document.file_ext && (
                    <span>• {document.file_ext.toUpperCase()}</span>
                  )}
                </div>
                {document.expires_at && (
                  <div className={isExpiring ? 'text-amber-600 font-medium' : ''}>
                    Expires {format(new Date(document.expires_at), 'MMM d, yyyy')}
                  </div>
                )}
                {document.note && (
                  <div className="text-xs bg-muted p-2 rounded mt-2">
                    {document.note}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDocument.isPending}
            >
              {deleteDocument.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <DocumentEditDialog
        document={document}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      {/* Replace Dialog */}
      <DocumentReplaceDialog
        document={document}
        open={showReplaceDialog}
        onOpenChange={setShowReplaceDialog}
      />
    </>
  );
}