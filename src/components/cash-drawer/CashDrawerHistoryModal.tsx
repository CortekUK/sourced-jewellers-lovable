import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useCashDrawerHistory, CashMovementType } from '@/hooks/useCashDrawer';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  Banknote,
  Receipt,
  Download
} from 'lucide-react';
import { exportCashDrawerHistory } from '@/utils/cashDrawerExport';

interface CashDrawerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: number | null;
  locationName: string;
}

const movementTypeConfig: Record<CashMovementType, { label: string; icon: typeof ArrowUpCircle; color: string }> = {
  sale_cash_in: { label: 'Cash Sale', icon: Banknote, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  deposit: { label: 'Deposit', icon: ArrowUpCircle, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  withdrawal: { label: 'Withdrawal', icon: ArrowDownCircle, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  float_set: { label: 'Float Set', icon: RefreshCw, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  adjustment: { label: 'Adjustment', icon: RefreshCw, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  sale_void_refund: { label: 'Void Refund', icon: Receipt, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export function CashDrawerHistoryModal({
  isOpen,
  onClose,
  locationId,
  locationName,
}: CashDrawerHistoryModalProps) {
  const { data: movements, isLoading } = useCashDrawerHistory(locationId || undefined);

  const handleExport = () => {
    if (movements && movements.length > 0) {
      exportCashDrawerHistory(movements, locationName);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Cash Drawer History - {locationName}</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!movements || movements.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : !movements || movements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No cash movements recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map((movement) => {
                const config = movementTypeConfig[movement.movement_type];
                const Icon = config.icon;
                
                return (
                  <div
                    key={movement.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${movement.amount >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      <Icon className={`h-4 w-4 ${movement.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={config.color}>
                          {config.label}
                        </Badge>
                        {movement.reference_sale_id && (
                          <span className="text-xs text-muted-foreground">
                            Sale #{movement.reference_sale_id}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {movement.profile?.full_name || 'System'}
                          </p>
                          {movement.notes && (
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {movement.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${movement.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {movement.amount >= 0 ? '+' : ''}{formatCurrency(movement.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(movement.created_at), 'dd MMM yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
