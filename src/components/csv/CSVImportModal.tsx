import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { fromCSV, CSVParseResult } from '@/utils/csvUtils';

interface CSVImportModalProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  expectedHeaders: string[];
  typeCoercion?: Record<string, (value: string) => any>;
  onImport: (data: T[]) => Promise<void>;
  maxPreviewRows?: number;
}

export function CSVImportModal<T>({
  open,
  onOpenChange,
  title,
  description,
  expectedHeaders,
  typeCoercion,
  onImport,
  maxPreviewRows = 50
}: CSVImportModalProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult<T> | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    try {
      const text = await selectedFile.text();
      const result = fromCSV<T>(text, expectedHeaders, typeCoercion);
      setParseResult(result);
    } catch (error) {
      setParseResult({
        ok: false,
        rows: [],
        errors: ['Failed to read file'],
        headers: []
      });
    }
  };

  const handleImport = async () => {
    if (!parseResult?.ok || parseResult.rows.length === 0) return;

    setIsImporting(true);
    try {
      await onImport(parseResult.rows);
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setParseResult(null);
    setIsImporting(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const previewRows = parseResult?.rows.slice(0, maxPreviewRows) || [];
  const hasMoreRows = (parseResult?.rows.length || 0) > maxPreviewRows;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          {parseResult && (
            <div className="space-y-4">
              {/* Validation Results */}
              <div className="flex flex-wrap gap-2">
                <Badge variant={parseResult.ok ? "default" : "destructive"}>
                  {parseResult.ok ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {parseResult.rows.length} rows
                </Badge>
                <Badge variant="outline">
                  {parseResult.headers.length} columns
                </Badge>
                {parseResult.errors.length > 0 && (
                  <Badge variant="destructive">
                    {parseResult.errors.length} errors
                  </Badge>
                )}
              </div>

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {parseResult.errors.slice(0, 5).map((error, i) => (
                        <div key={i} className="text-sm">{error}</div>
                      ))}
                      {parseResult.errors.length > 5 && (
                        <div className="text-sm font-medium">
                          ...and {parseResult.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview Table */}
              {previewRows.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">
                    Preview {hasMoreRows ? `(first ${maxPreviewRows} rows)` : ''}
                  </h4>
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {parseResult.headers.map((header) => (
                            <TableHead key={header} className="whitespace-nowrap">
                              {header}
                              {expectedHeaders.includes(header) && (
                                <CheckCircle className="h-3 w-3 ml-1 inline text-green-600" />
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRows.map((row: any, i) => (
                          <TableRow key={i}>
                            {parseResult.headers.map((header) => (
                              <TableCell key={header} className="whitespace-nowrap">
                                {String(row[header] || '')}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parseResult?.ok || parseResult.rows.length === 0 || isImporting}
          >
            {isImporting ? 'Importing...' : `Import ${parseResult?.rows.length || 0} rows`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}