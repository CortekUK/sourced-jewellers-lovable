import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentTypeIcon, getDocumentTypeLabel } from '@/components/documents/DocumentTypeIcon';
import { DocumentType } from '@/types';
import { DocumentQueueDialog } from './DocumentQueueDialog';

interface DocumentUploadItem {
  id: string;
  file: File;
  doc_type: DocumentType;
  title: string;
  note?: string;
  expires_at?: Date;
}

interface ProductCreationDocumentsProps {
  documents: DocumentUploadItem[];
  onDocumentsChange: (documents: DocumentUploadItem[]) => void;
  disabled?: boolean;
}

export function ProductCreationDocuments({ documents, onDocumentsChange, disabled }: ProductCreationDocumentsProps) {
  const handleAddDocument = (document: DocumentUploadItem) => {
    onDocumentsChange([...documents, document]);
  };

  const handleRemoveDocument = (id: string) => {
    onDocumentsChange(documents.filter(doc => doc.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Product Documents</Label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </span>
          <DocumentQueueDialog
            onDocumentAdded={handleAddDocument}
            trigger={
              <Button type="button" variant="outline" size="sm" disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            }
          />
        </div>
      </div>

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected Documents</Label>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex items-center gap-3">
                  <DocumentTypeIcon type={doc.doc_type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <Badge variant="secondary" className="text-xs">
                        {getDocumentTypeLabel(doc.doc_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{doc.file.name}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file.size)}</span>
                      {doc.expires_at && (
                        <>
                          <span>•</span>
                          <span>Expires {format(doc.expires_at, "PP")}</span>
                        </>
                      )}
                    </div>
                    {doc.note && (
                      <p className="text-xs text-muted-foreground mt-1">{doc.note}</p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDocument(doc.id)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}