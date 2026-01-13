import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ProductCreationDocuments } from '@/components/documents/ProductCreationDocuments';
import { DocumentType } from '@/types';
import { FileText, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadItem {
  id: string;
  file: File;
  doc_type: DocumentType;
  title: string;
  note?: string;
  expires_at?: Date;
}

interface RegisteredWatchSectionProps {
  isRegistered: boolean;
  onRegisteredChange: (checked: boolean) => void;
  documents: DocumentUploadItem[];
  onDocumentsChange: (documents: DocumentUploadItem[]) => void;
  disabled?: boolean;
}

export function RegisteredWatchSection({
  isRegistered,
  onRegisteredChange,
  documents,
  onDocumentsChange,
  disabled = false
}: RegisteredWatchSectionProps) {
  const registrationDocs = documents.filter(doc => 
    doc.doc_type === 'registration' || doc.doc_type === 'warranty'
  );

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <Label className="font-medium">This is a registered watch</Label>
            <p className="text-sm text-muted-foreground">
              Enable if this watch requires registration documentation
            </p>
          </div>
        </div>
        <Switch
          checked={isRegistered}
          onCheckedChange={onRegisteredChange}
          disabled={disabled}
        />
      </div>

      {/* Registration Documents Upload */}
      {isRegistered && (
        <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-primary" />
            <Label className="font-medium text-primary">Registration Documents</Label>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Upload registration certificates, authenticity documents, or warranty papers. 
            Supported formats: PDF, JPG, PNG.
          </p>

          <ProductCreationDocuments
            documents={documents}
            onDocumentsChange={onDocumentsChange}
          />

          {registrationDocs.length > 0 && (
            <div className="mt-4 p-3 bg-card rounded border">
              <p className="text-sm font-medium mb-2">Uploaded Registration Documents:</p>
              <div className="space-y-2">
                {registrationDocs.map((doc, index) => (
                  <div key={doc.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{doc.title}</span>
                      <span className="text-muted-foreground">({doc.doc_type})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {(doc.file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}