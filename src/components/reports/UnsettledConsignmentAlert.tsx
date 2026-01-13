import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface UnsettledConsignmentAlertProps {
  unsettledConsignments: any[];
}

export function UnsettledConsignmentAlert({ unsettledConsignments }: UnsettledConsignmentAlertProps) {
  const totalUnsettled = unsettledConsignments.reduce((sum, item) => sum + (item.payout_amount || 0), 0);

  const displayItems = unsettledConsignments.slice(0, 3);
  const remainingCount = unsettledConsignments.length - 3;

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-orange-800 dark:text-orange-400">
          <AlertTriangle className="h-4 w-4" />
          Unsettled Consignments
        </CardTitle>
        <Badge variant="secondary" className="bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
          {unsettledConsignments.length} pending
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-orange-900 dark:text-orange-300">Outstanding Amount:</span>
          <span className="font-mono font-bold text-orange-800 dark:text-orange-300">£{totalUnsettled.toLocaleString()}</span>
        </div>
        
        {displayItems.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {displayItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-orange-700 dark:text-orange-400 truncate">
                  {item.supplier_name || 'Unknown Supplier'}
                </span>
                <span className="font-mono text-orange-800 dark:text-orange-300 ml-2">
                  £{(item.payout_amount || 0).toLocaleString()}
                </span>
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="text-xs text-orange-600 dark:text-orange-500 italic">
                and {remainingCount} more...
              </div>
            )}
          </div>
        )}
        
        <div className="text-xs text-orange-700 dark:text-orange-400 pt-1">
          Not included in Gross Profit until settlements are recorded
        </div>
      </CardContent>
    </Card>
  );
}