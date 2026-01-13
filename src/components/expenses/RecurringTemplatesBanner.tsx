import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useExpenseTemplates } from '@/hooks/useExpenseTemplates';

export function RecurringTemplatesBanner() {
  const { templates } = useExpenseTemplates();

  if (templates.length === 0) return null;

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        You have {templates.length} recurring expense template
        {templates.length === 1 ? '' : 's'} set up. These will be tracked for future entries.
      </AlertDescription>
    </Alert>
  );
}
