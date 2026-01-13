import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function MultiImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  disabled = false 
}: MultiImageUploadProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleImageUpload = (imageUrl: string) => {
    if (uploadingIndex !== null) {
      // Replace existing image
      const newImages = [...images];
      newImages[uploadingIndex] = imageUrl;
      onImagesChange(newImages);
    } else {
      // Add new image
      onImagesChange([...images, imageUrl]);
    }
    setUploadingIndex(null);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                <img 
                  src={imageUrl} 
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {!disabled && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {!disabled && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-white hover:bg-white/20"
                    onClick={() => setUploadingIndex(index)}
                  >
                    Replace
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {!disabled && (uploadingIndex !== null || canAddMore) && (
        <div className="border-2 border-dashed border-border rounded-lg p-6">
          <div className="text-center space-y-4">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">
                {uploadingIndex !== null ? 'Replace Image' : 'Add Product Images'}
              </p>
              <p className="text-xs text-muted-foreground">
                {uploadingIndex !== null 
                  ? 'Upload a new image to replace the selected one'
                  : `Upload up to ${maxImages} images. Drag and drop or click to browse.`
                }
              </p>
            </div>
            
            <ImageUpload
              value=""
              onChange={handleImageUpload}
              onRemove={() => {}}
            />
            
            {uploadingIndex !== null && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUploadingIndex(null)}
              >
                Cancel Replace
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Upload More Button */}
      {!disabled && images.length > 0 && canAddMore && uploadingIndex === null && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setUploadingIndex(null)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add More Images ({images.length}/{maxImages})
        </Button>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        First image will be used as the primary product photo.
      </p>
    </div>
  );
}