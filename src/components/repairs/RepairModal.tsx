import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Check, ChevronsUpDown, CalendarIcon, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { CurrencyInput } from '@/components/ui/currency-input';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/hooks/useCustomers';
import { useLocations } from '@/hooks/useLocations';
import {
  RepairWithDetails,
  RepairInsert,
  RepairType,
  RepairStatus,
  REPAIR_TYPE_LABELS,
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_ORDER,
  useCreateRepair,
  useUpdateRepair,
} from '@/hooks/useRepairs';

interface RepairModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repair?: RepairWithDetails | null;
}

interface FormState {
  customer_id: number | null;
  customer_name: string;
  customer_phone: string;
  item_description: string;
  repair_type: RepairType;
  work_details: string;
  status: RepairStatus;
  quoted_cost: string;
  location_id: number | null;
  received_at: Date;
  promised_at: Date | null;
  notes: string;
}

function emptyForm(): FormState {
  return {
    customer_id: null,
    customer_name: '',
    customer_phone: '',
    item_description: '',
    repair_type: 'repair',
    work_details: '',
    status: 'received',
    quoted_cost: '',
    location_id: null,
    received_at: new Date(),
    promised_at: null,
    notes: '',
  };
}

export function RepairModal({ open, onOpenChange, repair }: RepairModalProps) {
  const isEdit = !!repair;
  const [form, setForm] = useState<FormState>(emptyForm());
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);

  const { data: customers } = useCustomers();
  const { data: locations } = useLocations();
  const createRepair = useCreateRepair();
  const updateRepair = useUpdateRepair();
  const isSaving = createRepair.isPending || updateRepair.isPending;

  useEffect(() => {
    if (!open) return;
    if (repair) {
      setForm({
        customer_id: repair.customer_id,
        customer_name: repair.customer_name ?? repair.customer?.name ?? '',
        customer_phone: repair.customer_phone ?? repair.customer?.phone ?? '',
        item_description: repair.item_description,
        repair_type: repair.repair_type,
        work_details: repair.work_details ?? '',
        status: repair.status,
        quoted_cost: repair.quoted_cost != null ? String(repair.quoted_cost) : '',
        location_id: repair.location_id,
        received_at: repair.received_at ? new Date(repair.received_at) : new Date(),
        promised_at: repair.promised_at ? new Date(repair.promised_at) : null,
        notes: repair.notes ?? '',
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, repair]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectCustomer = (id: number, name: string, phone: string | null) => {
    setForm((prev) => ({
      ...prev,
      customer_id: id,
      customer_name: name,
      customer_phone: phone ?? prev.customer_phone,
    }));
    setCustomerPickerOpen(false);
  };

  const clearCustomerLink = () =>
    setForm((prev) => ({ ...prev, customer_id: null }));

  const handleSubmit = async () => {
    if (!form.item_description.trim()) return;

    const payload: RepairInsert = {
      customer_id: form.customer_id,
      customer_name: form.customer_name.trim() || null,
      customer_phone: form.customer_phone.trim() || null,
      item_description: form.item_description.trim(),
      repair_type: form.repair_type,
      work_details: form.work_details.trim() || null,
      status: form.status,
      quoted_cost: form.quoted_cost ? Number(form.quoted_cost) : null,
      location_id: form.location_id,
      received_at: form.received_at.toISOString(),
      promised_at: form.promised_at ? form.promised_at.toISOString() : null,
      notes: form.notes.trim() || null,
      // When the repair is marked collected/ready, stamp completion date
      completed_at:
        form.status === 'collected'
          ? (repair?.completed_at ?? new Date().toISOString())
          : null,
    };

    try {
      if (isEdit && repair) {
        await updateRepair.mutateAsync({ id: repair.id, updates: payload });
      } else {
        await createRepair.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      // errors surfaced via toast in the hook
    }
  };

  const selectedCustomerLabel =
    form.customer_id != null
      ? form.customer_name || 'Selected customer'
      : 'Link an existing customer (optional)';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Repair' : 'Log a Repair'}</DialogTitle>
          <DialogDescription>
            Track a repair, polish, resize or other workshop job.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Customer */}
          <div className="space-y-2">
            <Label>Customer</Label>
            <div className="flex items-center gap-2">
              <Popover open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="flex-1 justify-between font-normal"
                  >
                    <span className="truncate">{selectedCustomerLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customers..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {(customers ?? []).map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.name} ${c.phone ?? ''}`}
                            onSelect={() => selectCustomer(c.id, c.name, c.phone)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                form.customer_id === c.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <span className="truncate">
                              {c.name}
                              {c.phone ? ` · ${c.phone}` : ''}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {form.customer_id != null && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearCustomerLink}
                  title="Unlink customer"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Name"
                value={form.customer_name}
                onChange={(e) => set('customer_name', e.target.value)}
              />
              <Input
                placeholder="Phone"
                value={form.customer_phone}
                onChange={(e) => set('customer_phone', e.target.value)}
              />
            </div>
          </div>

          {/* Item */}
          <div className="space-y-2">
            <Label htmlFor="item">
              Item <span className="text-destructive">*</span>
            </Label>
            <Input
              id="item"
              placeholder="e.g. 18ct gold ring, sapphire pendant"
              value={form.item_description}
              onChange={(e) => set('item_description', e.target.value)}
            />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.repair_type}
                onValueChange={(v) => set('repair_type', v as RepairType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REPAIR_TYPE_LABELS) as RepairType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {REPAIR_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set('status', v as RepairStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPAIR_STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {REPAIR_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Work details */}
          <div className="space-y-2">
            <Label htmlFor="work">Work to be done</Label>
            <Textarea
              id="work"
              placeholder="Describe the repair / polish work"
              value={form.work_details}
              onChange={(e) => set('work_details', e.target.value)}
              rows={2}
            />
          </div>

          {/* Cost + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quoted cost</Label>
              <CurrencyInput
                value={form.quoted_cost}
                onValueChange={(v) => set('quoted_cost', v)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={form.location_id != null ? String(form.location_id) : 'none'}
                onValueChange={(v) =>
                  set('location_id', v === 'none' ? null : Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {(locations ?? []).map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Received</Label>
              <DatePickerField
                value={form.received_at}
                onChange={(d) => d && set('received_at', d)}
              />
            </div>
            <div className="space-y-2">
              <Label>Promised by</Label>
              <DatePickerField
                value={form.promised_at}
                onChange={(d) => set('promised_at', d)}
                clearable
                placeholder="No date"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Anything else worth recording"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !form.item_description.trim()}
          >
            {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Log repair'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DatePickerFieldProps {
  value: Date | null;
  onChange: (d: Date | null) => void;
  clearable?: boolean;
  placeholder?: string;
}

function DatePickerField({ value, onChange, clearable, placeholder }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'dd MMM yyyy') : placeholder ?? 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarPicker
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => {
            onChange(d ?? null);
            setOpen(false);
          }}
          initialFocus
        />
        {clearable && value && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
