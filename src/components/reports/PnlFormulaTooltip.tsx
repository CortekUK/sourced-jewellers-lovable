import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function PnlFormulaTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2 text-sm">
            <div className="font-semibold">How Net Profit is calculated:</div>
            <div>• Revenue = Σ (qty × unit_price) - discount</div>
            <div>• COGS = Σ (qty × unit_cost)</div>
            <div>• PX items: unit_cost = allowance</div>
            <div>• Consignment items: unit_cost = agreed payout</div>
            <div>• Gross Profit = Revenue - COGS</div>
            <div>• Operating Expenses = Σ expenses where is_cogs = false</div>
            <div className="font-semibold">• Net Profit = Gross Profit - Operating Expenses</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}