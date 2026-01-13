import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { useVoidSaleSimple } from '@/hooks/useSaleActions';
import { formatCurrency } from '@/lib/utils';

interface VoidSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number;
  saleTotal: number;
  onSuccess?: () => void;
}

export function VoidSaleModal({
  open,
  onOpenChange,
  saleId,
  saleTotal,
  onSuccess
}: VoidSaleModalProps) {
  const [reason, setReason] = useState('');
  const voidSale = useVoidSaleSimple();

  const handleVoid = async () => {
    try {
      await voidSale.mutateAsync({
        saleId,
        reason: reason.trim() || 'No reason provided'
      });
      onOpenChange(false);
      setReason('');
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Only allow closing if not in the middle of voiding
      if (!voidSale.isPending) {
        onOpenChange(isOpen);
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Void Sale #{saleId}
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <p>
              Are you sure you want to void this sale? This will:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Mark the sale as voided (it will remain in records for audit)</li>
              <li>Restore all items back to inventory</li>
              <li>Remove {formatCurrency(saleTotal)} from your sales total</li>
            </ul>
            <p className="font-medium text-foreground">
              This action cannot be undone.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="void-reason">Reason for voiding (optional)</Label>
          <Textarea
            id="void-reason"
            placeholder="e.g., Customer returned item, Incorrect price entered..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={voidSale.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleVoid}
            disabled={voidSale.isPending}
          >
            {voidSale.isPending ? 'Voiding...' : 'Void Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
