import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { ProductDocument, useDocumentReplace } from '@/hooks/useProductDocuments';

interface DocumentReplaceDialogProps {
  document: ProductDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentReplaceDialog({ document, open, onOpenChange }: DocumentReplaceDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const replaceDocument = useDocumentReplace();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !document) return;

    await replaceDocument.mutateAsync({
      documentId: document.id,
      productId: document.product_id,
      file,
      oldPath: document.path,
    });

    setFile(null);
    onOpenChange(false);
  };

  const resetForm = () => {
    setFile(null);
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Replace Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Replacing: <strong>{document.title}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              The new file will replace the existing document while keeping all metadata.
            </p>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div className="text-sm font-medium">Drop new file here or click to upload</div>
                <div className="text-xs text-muted-foreground">
                  PDF, JPG, PNG, DOCX files up to 20MB
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                  onChange={handleFileChange}
                  id="file-replace"
                />
                <label htmlFor="file-replace">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>
            )}
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
              disabled={!file || replaceDocument.isPending}
              className="flex-1"
            >
              {replaceDocument.isPending ? 'Replacing...' : 'Replace File'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}