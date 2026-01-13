import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStockAdjustment } from '@/hooks/useDatabase';
import { useOwnerGuard } from '@/hooks/useOwnerGuard';
import { formatCurrency } from '@/lib/utils';
import type { ProductWithStock } from '@/types';
import { 
  Settings,
  Plus,
  Minus,
  Package,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface StockAdjustmentModalProps {
  product: ProductWithStock;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function StockAdjustmentModal({ product, open: externalOpen, onOpenChange: externalOnOpenChange, trigger }: StockAdjustmentModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  
  const isOwner = useOwnerGuard();
  const stockAdjustment = useStockAdjustment();

  // Use external or internal open state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  
  // Get current stock from product
  const currentStock = (product as any).stock?.[0]?.qty_on_hand || 0;

  // Don't render if user is not owner
  if (!isOwner) return null;

  const calculateNewStock = () => {
    const qty = parseInt(quantity) || 0;
    switch (adjustmentType) {
      case 'add':
        return currentStock + qty;
      case 'remove':
        return Math.max(0, currentStock - qty);
      case 'set':
        return Math.max(0, qty);
      default:
        return currentStock;
    }
  };

  const calculateAdjustmentQuantity = () => {
    const qty = parseInt(quantity) || 0;
    switch (adjustmentType) {
      case 'add':
        return qty;
      case 'remove':
        return -qty;
      case 'set':
        return qty - currentStock;
      default:
        return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quantity.trim()) return;
    
    const adjustmentQty = calculateAdjustmentQuantity();
    
    if (adjustmentQty === 0) {
      setOpen(false);
      return;
    }

    try {
      await stockAdjustment.mutateAsync({
        product_id: product.id,
        quantity: adjustmentQty,
        note: note.trim() || undefined
      });
      
      // Reset form
      setQuantity('');
      setNote('');
      setAdjustmentType('add');
      setOpen(false);
    } catch (error) {
      console.error('Stock adjustment failed:', error);
    }
  };

  const newStock = calculateNewStock();
  const adjustmentQty = calculateAdjustmentQuantity();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Stock Adjustment
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Info */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium">{product.name}</h4>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(product.unit_price)}
              {product.sku && <span className="ml-2">• SKU: {product.sku}</span>}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">Current Stock:</span>
              <Badge variant={currentStock <= 5 ? 'destructive' : 'default'}>
                {currentStock} units
              </Badge>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <Select value={adjustmentType} onValueChange={(value: 'add' | 'remove' | 'set') => setAdjustmentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-success" />
                    Add Stock
                  </div>
                </SelectItem>
                <SelectItem value="remove">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-destructive" />
                    Remove Stock
                  </div>
                </SelectItem>
                <SelectItem value="set">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Set Exact Amount
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              {adjustmentType === 'set' ? 'New Stock Level' : 'Quantity'}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={adjustmentType === 'set' ? 'Enter new stock level' : 'Enter quantity'}
              required
            />
          </div>

          {/* Preview */}
          {quantity && (
            <div className="p-3 bg-muted/20 rounded-lg border">
              <div className="flex items-center justify-between text-sm">
                <span>Current Stock:</span>
                <span>{currentStock} units</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Adjustment:</span>
                <span className={adjustmentQty > 0 ? 'text-success' : 'text-destructive'}>
                  {adjustmentQty > 0 ? '+' : ''}{adjustmentQty} units
                </span>
              </div>
              <div className="flex items-center justify-between font-medium pt-2 border-t">
                <span>New Stock:</span>
                <Badge variant={newStock <= 5 ? 'destructive' : 'default'}>
                  {newStock} units
                </Badge>
              </div>
              {newStock <= 5 && newStock > 0 && (
                <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Low stock warning
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for adjustment (e.g., inventory count, damaged goods, etc.)"
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!quantity.trim() || stockAdjustment.isPending}
            >
              {stockAdjustment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adjusting...
                </>
              ) : (
                'Apply Adjustment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}