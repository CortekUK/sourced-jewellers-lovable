import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toCSV } from '@/utils/csvUtils';
import { useToast } from '@/hooks/use-toast';

interface CSVExportButtonProps {
  data: any[];
  filename: string;
  headers?: string[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  children?: React.ReactNode;
}

export function CSVExportButton({
  data,
  filename,
  headers,
  variant = 'outline',
  size = 'sm',
  disabled = false,
  children
}: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!data || data.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no records to export.',
        variant: 'destructive'
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const csv = toCSV(data, headers);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `${data.length} records exported to ${link.download}`
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error exporting the data.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={disabled || isExporting || !data || data.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      {children || (isExporting ? 'Exporting...' : 'Export CSV')}
    </Button>
  );
}