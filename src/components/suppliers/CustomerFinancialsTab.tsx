import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomerFinancialKPIs, useTradeInAllowances, useConsignmentPayouts, useRecordConsignmentPayout } from '@/hooks/useCustomerFinancials';
import { useOwnerGuard } from '@/hooks/useOwnerGuard';
import { TrendingUp, Wallet, AlertCircle, CalendarIcon, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CustomerFinancialsTabProps {
  supplierId: number;
}

export function CustomerFinancialsTab({ supplierId }: CustomerFinancialsTabProps) {
  const { data: kpis } = useCustomerFinancialKPIs(supplierId);
  const { data: allowances } = useTradeInAllowances(supplierId);
  const { data: payouts } = useConsignmentPayouts(supplierId);
  const isOwner = useOwnerGuard();

  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<number | null>(null);
  const [paidDate, setPaidDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');

  const recordPayoutMutation = useRecordConsignmentPayout();

  const handleRecordPayout = () => {
    if (!selectedSettlement) return;

    recordPayoutMutation.mutate(
      {
        settlementId: selectedSettlement,
        paidAt: paidDate.toISOString(),
        notes,
      },
      {
        onSuccess: () => {
          setPayoutDialogOpen(false);
          setSelectedSettlement(null);
          setNotes('');
          setPaidDate(new Date());
        },
      }
    );
  };

  const unpaidPayouts = payouts?.filter(p => !p.paid_at) || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Allowances</p>
                <p className="text-3xl font-luxury font-bold text-[#D4AF37] mt-1">
                  £{(kpis?.totalAllowances || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Part-Exchange total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payouts</p>
                <p className="text-3xl font-luxury font-bold text-[#D4AF37] mt-1">
                  £{(kpis?.totalPayouts || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Consignment total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unsettled Payouts</p>
                <p className="text-3xl font-luxury font-bold text-orange-500 mt-1">
                  £{(kpis?.unsettledPayouts || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Trade-in Allowances List */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-luxury text-lg font-semibold mb-4">Trade-in Allowances</h3>
          {!allowances || allowances.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No trade-in allowances</p>
          ) : (
            <div className="space-y-2">
              {allowances.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.internal_sku} • {new Date(item.date).toLocaleDateString()}
                        {item.sold_at && ` • Sold on ${new Date(item.sold_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#D4AF37]">
                      £{item.allowance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    {item.sale_id && <Badge variant="secondary" className="mt-1">Sold</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consignment Payouts List */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-luxury text-lg font-semibold">Consignment Payouts</h3>
            {isOwner && unpaidPayouts.length > 0 && (
              <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Record Payout</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Consignment Payout</DialogTitle>
                    <DialogDescription>
                      Mark a consignment payout as paid
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="settlement">Select Settlement *</Label>
                      <Select
                        value={selectedSettlement?.toString() || ''}
                        onValueChange={(value) => setSelectedSettlement(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a settlement" />
                        </SelectTrigger>
                        <SelectContent>
                          {unpaidPayouts.map((payout) => (
                            <SelectItem key={payout.settlement_id} value={payout.settlement_id.toString()}>
                              {payout.product_name} - £{payout.agreed_payout.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Paid Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn('w-full justify-start text-left font-normal')}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(paidDate, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={paidDate}
                            onSelect={(date) => date && setPaidDate(date)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Payment method, reference number, etc."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setPayoutDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRecordPayout}
                        disabled={!selectedSettlement || recordPayoutMutation.isPending}
                        className="flex-1"
                      >
                        {recordPayoutMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Recording...
                          </>
                        ) : (
                          'Record Payment'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!payouts || payouts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No consignment payouts</p>
          ) : (
            <div className="space-y-2">
              {payouts.map((item) => (
                <div key={item.settlement_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-secondary/10">
                      <Wallet className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.internal_sku} • {new Date(item.date).toLocaleDateString()}
                        {item.paid_at && ` • Paid on ${new Date(item.paid_at).toLocaleDateString()}`}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#D4AF37]">
                      £{item.agreed_payout.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <Badge variant={item.paid_at ? 'default' : 'outline'} className="mt-1">
                      {item.paid_at ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
