import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Filter, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface ExpenseFiltersProps {
  filters: {
    category: string;
    supplier: string;
    dateRange: DateRange | undefined;
    amountRange: { min: string; max: string };
    isCogs: string;
  };
  onFiltersChange: (filters: any) => void;
  suppliers: Array<{ id: number; name: string }>;
  activeFilters: number;
}

export function ExpenseFilters({ 
  filters, 
  onFiltersChange, 
  suppliers,
  activeFilters 
}: ExpenseFiltersProps) {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const clearAllFilters = () => {
    onFiltersChange({
      category: '',
      supplier: '',
      dateRange: undefined,
      amountRange: { min: '', max: '' },
      isCogs: ''
    });
  };

  const removeFilter = (filterKey: string, subKey?: string) => {
    if (subKey) {
      onFiltersChange({
        ...filters,
        [filterKey]: { ...filters[filterKey], [subKey]: '' }
      });
    } else {
      onFiltersChange({
        ...filters,
        [filterKey]: filterKey === 'dateRange' ? undefined : ''
      });
    }
  };

  const formatDateRange = (dateRange: DateRange | undefined) => {
    if (!dateRange || !dateRange.from) return "Select date range";
    if (dateRange.to) {
      return `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`;
    }
    return format(dateRange.from, "MMM d, yyyy");
  };

  return (
    <div className="space-y-4">
      {/* Filter Button */}
      <div className="flex items-center gap-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilters > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilters}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Filter Expenses</CardTitle>
                  {activeFilters > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateRange(filters.dateRange)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={filters.dateRange?.from}
                        selected={filters.dateRange}
                        onSelect={(range) => onFiltersChange({...filters, dateRange: range})}
                        numberOfMonths={2}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={filters.category} onValueChange={(value) => onFiltersChange({...filters, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      <SelectItem value="rent">Rent & Utilities</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="supplies">Office Supplies</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Supplier Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Supplier/Vendor</Label>
                  <Select value={filters.supplier} onValueChange={(value) => onFiltersChange({...filters, supplier: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All suppliers</SelectItem>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* COGS Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type</Label>
                  <Select value={filters.isCogs} onValueChange={(value) => onFiltersChange({...filters, isCogs: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All expense types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All expense types</SelectItem>
                      <SelectItem value="true">Cost of Goods Sold</SelectItem>
                      <SelectItem value="false">Operating Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Amount Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amount Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Min amount"
                      value={filters.amountRange.min}
                      onChange={(e) => onFiltersChange({
                        ...filters,
                        amountRange: { ...filters.amountRange, min: e.target.value }
                      })}
                      type="number"
                      step="0.01"
                    />
                    <Input
                      placeholder="Max amount"
                      value={filters.amountRange.max}
                      onChange={(e) => onFiltersChange({
                        ...filters,
                        amountRange: { ...filters.amountRange, max: e.target.value }
                      })}
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* Quick Date Filters */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            onFiltersChange({
              ...filters,
              dateRange: { from: startOfMonth, to: now }
            });
          }}
        >
          This Month
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            onFiltersChange({
              ...filters,
              dateRange: { from: startOfYear, to: now }
            });
          }}
        >
          This Year
        </Button>
      </div>

      {/* Active Filters Display */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.dateRange && filters.dateRange.from && (
            <Badge variant="secondary" className="gap-1">
              Date: {formatDateRange(filters.dateRange)}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('dateRange')} />
            </Badge>
          )}
          
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('category')} />
            </Badge>
          )}
          
          {filters.supplier && (
            <Badge variant="secondary" className="gap-1">
              Supplier: {suppliers.find(s => s.id.toString() === filters.supplier)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('supplier')} />
            </Badge>
          )}
          
          {filters.isCogs && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.isCogs === 'true' ? 'COGS' : 'Operating'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('isCogs')} />
            </Badge>
          )}
          
          {(filters.amountRange.min || filters.amountRange.max) && (
            <Badge variant="secondary" className="gap-1">
              Amount: £{filters.amountRange.min || '0'} - £{filters.amountRange.max || '∞'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('amountRange', 'min')} />
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}