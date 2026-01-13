import { useState, useRef } from 'react';
import { Upload, X, FileText, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOwnerGuard } from '@/hooks/useOwnerGuard';

interface DocumentUploadProps {
  value?: string;
  onChange: (path: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  productId?: number;
}

export function DocumentUpload({ value, onChange, onRemove, disabled, productId }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isOwner = useOwnerGuard();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !productId) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF, JPG, JPEG, or PNG file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const filePath = `products/${productId}/registration.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-docs')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      onChange(filePath);
      toast({
        title: "Success",
        description: "Registration document uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleView = async () => {
    if (!value) return;
    
    setViewing(true);
    try {
      const { data, error } = await supabase.storage
        .from('product-docs')
        .createSignedUrl(value, 60);

      if (error) throw error;
      
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive"
      });
    } finally {
      setViewing(false);
    }
  };

  const handleDownload = async () => {
    if (!value) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('product-docs')
        .createSignedUrl(value, 60);

      if (error) throw error;
      
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = value.split('/').pop() || 'registration-document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const handleRemove = async () => {
    if (value && isOwner) {
      try {
        await supabase.storage
          .from('product-docs')
          .remove([value]);
      } catch (error) {
        console.error('Error removing document:', error);
      }
    }
    onRemove();
  };

  const getFileName = (path: string) => {
    return path.split('/').pop() || 'registration-document';
  };

  const getFileType = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    return ext === 'pdf' ? 'PDF' : 'Image';
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleUpload}
        disabled={disabled || uploading || !isOwner}
        className="hidden"
      />
      
      {value ? (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{getFileName(value)}</p>
                <p className="text-sm text-muted-foreground">{getFileType(value)} Document</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleView}
                disabled={viewing}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              {isOwner && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading}
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {isOwner ? (
            <div
              className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer rounded-lg p-6 text-center"
              onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Click to upload registration document</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-border rounded-lg p-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No registration document uploaded</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}