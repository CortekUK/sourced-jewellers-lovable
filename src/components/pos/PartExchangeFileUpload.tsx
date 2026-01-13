import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UploadedFile {
  name: string;
  path: string;
  size: number;
  type: string;
}

interface PartExchangeFileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  saleId?: string;
}

export const PartExchangeFileUpload: React.FC<PartExchangeFileUploadProps> = ({
  files,
  onFilesChange,
  saleId,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const invalidFiles = selectedFiles.filter(f => !validTypes.includes(f.type));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Only JPG, PNG, and PDF files are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes (20MB max)
    const oversizedFiles = selectedFiles.filter(f => f.size > 20 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadedFiles: UploadedFile[] = [];
      
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const folder = saleId || 'temp';
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase.storage
          .from('part-exchange-docs')
          .upload(filePath, file);

        if (error) throw error;

        uploadedFiles.push({
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type,
        });
      }

      onFilesChange([...files, ...uploadedFiles]);
      
      toast({
        title: "Files uploaded",
        description: `${uploadedFiles.length} file(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveFile = async (path: string) => {
    try {
      const { error } = await supabase.storage
        .from('part-exchange-docs')
        .remove([path]);

      if (error) throw error;

      onFilesChange(files.filter(f => f.path !== path));
      
      toast({
        title: "File removed",
        description: "File deleted successfully.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete file.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3">
      <div>
        <input
          type="file"
          id="part-exchange-files"
          multiple
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <label htmlFor="part-exchange-files">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={uploading}
            asChild
          >
            <span>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Photos / Docs
                </>
              )}
            </span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground mt-1">
          JPG, PNG, or PDF (max 20MB each)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(file.path)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
