import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdatePartExchange } from '@/hooks/usePartExchanges';
import { Loader2 } from 'lucide-react';

interface PartExchange {
  id: number;
  sale_id: number;
  title: string;
  category: string | null;
  description: string | null;
  serial: string | null;
  allowance: number;
  customer_name: string | null;
  customer_contact: string | null;
  customer_supplier_id: number | null;
  notes: string | null;
  created_at: string;
  status: string;
}

interface EditPartExchangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partExchange: PartExchange | null;
}

export function EditPartExchangeModal({ open, onOpenChange, partExchange }: EditPartExchangeModalProps) {
  const updateMutation = useUpdatePartExchange();
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    serial: '',
    allowance: '',
    customer_name: '',
    customer_contact: '',
    notes: '',
  });

  useEffect(() => {
    if (partExchange) {
      setFormData({
        title: partExchange.title || '',
        category: partExchange.category || '',
        description: partExchange.description || '',
        serial: partExchange.serial || '',
        allowance: partExchange.allowance.toString(),
        customer_name: partExchange.customer_name || '',
        customer_contact: partExchange.customer_contact || '',
        notes: partExchange.notes || '',
      });
    }
  }, [partExchange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partExchange) return;

    await updateMutation.mutateAsync({
      id: partExchange.id,
      updates: {
        title: formData.title,
        category: formData.category || null,
        description: formData.description || null,
        serial: formData.serial || null,
        allowance: parseFloat(formData.allowance),
        customer_name: formData.customer_name || null,
        customer_contact: formData.customer_contact || null,
        notes: formData.notes || null,
      },
    });

    onOpenChange(false);
  };

  if (!partExchange) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-luxury text-2xl">Edit Trade-In Details</DialogTitle>
          <DialogDescription>
            Update the details for this pending trade-in item.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="title">Product Name *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Rolex Submariner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rings">Rings</SelectItem>
                  <SelectItem value="Necklaces">Necklaces</SelectItem>
                  <SelectItem value="Earrings">Earrings</SelectItem>
                  <SelectItem value="Bracelets">Bracelets</SelectItem>
                  <SelectItem value="Watches">Watches</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial">Serial Number</Label>
              <Input
                id="serial"
                value={formData.serial}
                onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Condition, notable features..."
                rows={3}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="allowance">Trade-In Allowance *</Label>
              <Input
                id="allowance"
                type="number"
                step="0.01"
                value={formData.allowance}
                onChange={(e) => setFormData({ ...formData, allowance: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_contact">Customer Contact</Label>
              <Input
                id="customer_contact"
                value={formData.customer_contact}
                onChange={(e) => setFormData({ ...formData, customer_contact: e.target.value })}
                placeholder="Email or phone"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
