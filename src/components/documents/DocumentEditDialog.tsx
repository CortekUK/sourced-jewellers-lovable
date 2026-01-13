import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductDocument, DocumentType, useDocumentUpdate } from '@/hooks/useProductDocuments';
import { getDocumentTypeLabel } from './DocumentTypeIcon';

interface DocumentEditDialogProps {
  document: ProductDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentEditDialog({ document, open, onOpenChange }: DocumentEditDialogProps) {
  const [docType, setDocType] = useState<DocumentType>('other');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const updateDocument = useDocumentUpdate();

  const documentTypes: DocumentType[] = [
    'appraisal',
    'certificate_card',
    'photo',
    'registration',
    'service',
    'warranty',
    'other'
  ];

  // Reset form when document changes
  useEffect(() => {
    if (document) {
      setDocType(document.doc_type);
      setTitle(document.title || '');
      setNote(document.note || '');
      setExpiresAt(document.expires_at ? document.expires_at.split('T')[0] : '');
    }
  }, [document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document) return;

    await updateDocument.mutateAsync({
      documentId: document.id,
      productId: document.product_id,
      updates: {
        doc_type: docType,
        title: title || undefined,
        note: note || undefined,
        expires_at: expiresAt || undefined,
      },
    });

    onOpenChange(false);
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Document Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="doc-type">Document Type</Label>
            <Select value={docType} onValueChange={(value) => setDocType(value as DocumentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getDocumentTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expires-at">Expires At (optional)</Label>
            <Input
              id="expires-at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateDocument.isPending}
              className="flex-1"
            >
              {updateDocument.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}