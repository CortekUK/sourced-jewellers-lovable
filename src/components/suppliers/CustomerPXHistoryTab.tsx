import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierTradeIns } from '@/hooks/useSupplierTradeInsConsignments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink, TrendingUp, Package } from 'lucide-react';
import { SimpleDatePicker } from '@/components/ui/simple-date-picker';
import { DateRange } from 'react-day-picker';

interface CustomerPXHistoryTabProps {
  supplierId: number;
}

export function CustomerPXHistoryTab({ supplierId }: CustomerPXHistoryTabProps) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data: tradeIns = [], isLoading } = useSupplierTradeIns(
    supplierId,
    dateRange?.from,
    dateRange?.to,
    statusFilter
  );

  // Calculate summary stats
  const totalTradeIns = tradeIns.length;
  const totalAllowances = tradeIns.reduce((sum, item) => sum + item.allowance, 0);
  const soldItems = tradeIns.filter(item => item.status === 'sold');
  const totalValue = soldItems.reduce((sum, item) => sum + (item.sold_price || 0), 0);
  const totalProfit = soldItems.reduce((sum, item) => sum + (item.gross_profit || 0), 0);
  const conversionRate = totalTradeIns > 0 ? (soldItems.length / totalTradeIns) * 100 : 0;

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDateRange(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trade-Ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTradeIns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Allowances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalAllowances.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">{soldItems.length} sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resale Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">£{totalProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From £{totalValue.toLocaleString()} sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-luxury">Part-Exchange History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[150px]">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[250px]">
              <Label>Date Range</Label>
              <SimpleDatePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>

            {(statusFilter !== 'all' || dateRange?.from) && (
              <div className="flex items-end">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          ) : tradeIns.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">No trade-in history found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {statusFilter !== 'all' || dateRange?.from
                  ? 'Try adjusting your filters'
                  : 'Trade-in items from this customer will appear here'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Product</th>
                    <th className="text-left py-3 px-2">SKU</th>
                    <th className="text-right py-3 px-2">Allowance</th>
                    <th className="text-center py-3 px-2">Status</th>
                    <th className="text-right py-3 px-2">Sale Price</th>
                    <th className="text-right py-3 px-2">Profit</th>
                    <th className="text-left py-3 px-2">Date Sold</th>
                    <th className="text-center py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeIns.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{item.product_name}</td>
                      <td className="py-3 px-2 font-mono text-xs">{item.internal_sku}</td>
                      <td className="py-3 px-2 text-right font-mono">
                        £{item.allowance.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {item.status === 'sold' ? (
                          <Badge variant="default">Sold</Badge>
                        ) : (
                          <Badge variant="secondary">In Stock</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        {item.sold_price ? `£${item.sold_price.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        {item.gross_profit !== undefined ? (
                          <span className={item.gross_profit > 0 ? 'text-green-600' : 'text-red-600'}>
                            £{item.gross_profit.toLocaleString()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-2 text-xs">
                        {item.sold_at ? new Date(item.sold_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/products?id=${item.product_id}`)}
                            title="View Product"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          {item.sale_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/sales?id=${item.sale_id}`)}
                              title="View Sale"
                            >
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
