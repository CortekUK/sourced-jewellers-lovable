import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, FileText } from 'lucide-react';
import { useProductDocuments, DocumentType, ProductDocument } from '@/hooks/useProductDocuments';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import { DocumentCard } from './DocumentCard';
import { DocumentTypeIcon, getDocumentTypeLabel } from './DocumentTypeIcon';
import { useOwnerGuard } from '@/hooks/useOwnerGuard';
import { Loader2 } from 'lucide-react';

interface ProductDocumentsTabProps {
  productId: number;
}

export function ProductDocumentsTab({ productId }: ProductDocumentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const { data: documents = [], isLoading, error } = useProductDocuments(productId);
  const isOwner = useOwnerGuard();

  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.doc_type]) {
      acc[doc.doc_type] = [];
    }
    acc[doc.doc_type].push(doc);
    return acc;
  }, {} as Record<DocumentType, ProductDocument[]>);

  // Filter documents based on search and tab
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = !searchQuery || 
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDocumentTypeLabel(doc.doc_type).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || doc.doc_type === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const documentTypes: (DocumentType | 'all')[] = [
    'all',
    'appraisal',
    'certificate_card',
    'photo',
    'registration',
    'service',
    'warranty',
    'other'
  ];
  const availableTypes = documentTypes.filter(type => 
    type === 'all' || documentsByType[type as DocumentType]?.length > 0
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading documents</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documents</h3>
          <p className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isOwner && (
          <DocumentUploadDialog 
            productId={productId}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            }
          />
        )}
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">No documents uploaded</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {isOwner 
                  ? "Upload documents like registration certificates, warranties, and appraisals."
                  : "No documents have been uploaded for this product yet."
                }
              </p>
              {isOwner && (
                <DocumentUploadDialog 
                  productId={productId}
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Upload First Document
                    </Button>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search and Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Document Type Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                {availableTypes.map((type) => (
                  <TabsTrigger key={type} value={type} className="text-xs">
                    <div className="flex items-center gap-1">
                      {type !== 'all' && (
                        <DocumentTypeIcon type={type as DocumentType} className="h-3 w-3" />
                      )}
                      <span>
                        {type === 'all' 
                          ? `All (${documents.length})`
                          : `${getDocumentTypeLabel(type as DocumentType)} (${documentsByType[type as DocumentType]?.length || 0})`
                        }
                      </span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredDocuments.length === 0 ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2" />
                        <p>
                          {searchQuery 
                            ? `No documents match "${searchQuery}"`
                            : `No ${activeTab === 'all' ? '' : getDocumentTypeLabel(activeTab as DocumentType).toLowerCase()} documents`
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {filteredDocuments.map((document) => (
                      <DocumentCard key={document.id} document={document} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
}