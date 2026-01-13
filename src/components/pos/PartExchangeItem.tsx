import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Repeat, Trash2, Edit3 } from 'lucide-react';
import { PartExchangeItem as PartExchangeItemType } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface PartExchangeItemProps {
  item: PartExchangeItemType;
  onEdit?: () => void;
  onRemove?: () => void;
  showActions?: boolean;
}

export const PartExchangeItem = ({ 
  item, 
  onEdit, 
  onRemove, 
  showActions = true 
}: PartExchangeItemProps) => {
  return (
    <Card className="p-3 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Repeat className="h-4 w-4 text-amber-600" />
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{item.product_name}</h4>
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/50">
                Trade-In
              </Badge>
            </div>
            
            {item.description && (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            )}
            
            {item.serial && (
              <p className="text-xs text-muted-foreground">SKU: {item.serial}</p>
            )}
            
            {item.notes && (
              <p className="text-xs text-muted-foreground italic">{item.notes}</p>
            )}
            
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Trade-In Allowance
              </span>
              <span className="text-sm font-bold text-green-600">
                -{formatCurrency(item.allowance)}
              </span>
            </div>
          </div>
        </div>

        {showActions && (onEdit || onRemove) && (
          <div className="flex gap-1 ml-2">
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
                className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};