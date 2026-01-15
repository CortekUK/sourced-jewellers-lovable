import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useRecordCashMovement, useSetCashFloat, CashMovementType } from '@/hooks/useCashDrawer';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: number | null;
  locationName: string;
  movementType: 'deposit' | 'withdrawal' | 'float_set';
}

export function CashMovementModal({
  isOpen,
  onClose,
  locationId,
  locationName,
  movementType,
}: CashMovementModalProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const recordMovement = useRecordCashMovement();
  const setFloat = useSetCashFloat();

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!locationId || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (movementType === 'withdrawal' && !notes.trim()) {
      toast.error('Please provide a reason for the withdrawal');
      return;
    }

    try {
      if (movementType === 'float_set') {
        await setFloat.mutateAsync({
          locationId,
          amount: numAmount,
          notes: notes.trim() || undefined,
        });
      } else {
        await recordMovement.mutateAsync({
          location_id: locationId,
          movement_type: movementType as CashMovementType,
          amount: movementType === 'withdrawal' ? -numAmount : numAmount,
          notes: notes.trim() || null,
        });
        toast.success(`Cash ${movementType === 'deposit' ? 'added to' : 'removed from'} ${locationName}`);
      }

      setAmount('');
      setNotes('');
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isProcessing = recordMovement.isPending || setFloat.isPending;

  const getTitle = () => {
    switch (movementType) {
      case 'deposit':
        return `Add Cash to ${locationName}`;
      case 'withdrawal':
        return `Remove Cash from ${locationName}`;
      case 'float_set':
        return `Set Float for ${locationName}`;
      default:
        return 'Cash Movement';
    }
  };

  const getDescription = () => {
    switch (movementType) {
      case 'deposit':
        return 'Add cash to the till (e.g., petty cash top-up)';
      case 'withdrawal':
        return 'Remove cash from the till (e.g., bank deposit)';
      case 'float_set':
        return 'Set the opening cash balance for the day';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <p className="text-sm text-muted-foreground">{getDescription()}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <CurrencyInput
              id="amount"
              value={amount}
              onValueChange={setAmount}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {movementType === 'withdrawal' ? 'Reason *' : 'Notes (Optional)'}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                movementType === 'withdrawal'
                  ? 'e.g., Bank deposit, Petty cash expense...'
                  : 'Optional notes...'
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isProcessing}
            className={
              movementType === 'deposit' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : movementType === 'withdrawal'
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : ''
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              movementType === 'deposit' ? 'Add Cash' :
              movementType === 'withdrawal' ? 'Remove Cash' :
              'Set Float'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
