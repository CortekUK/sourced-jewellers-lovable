import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDateRange } from '@/lib/utils';
import type { DateRange } from '@/types';

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const presetRanges = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'This month', value: 'month' },
    { label: 'Custom range', value: 'custom' },
  ];

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      // Don't change range, just keep current custom selection
      return;
    }
    
    const range = getDateRange(preset as any);
    onDateRangeChange(range);
  };

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      onDateRangeChange({
        from: customStartDate.toISOString(),
        to: customEndDate.toISOString(),
      });
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    // Handle empty or invalid date strings
    if (!dateRange.from || !dateRange.to) {
      return 'All time';
    }
    
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    
    // Check if dates are valid
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return 'All time';
    }
    
    // Check if it's today
    const today = new Date();
    const isToday = format(from, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') &&
                   format(to, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    
    if (isToday) return 'Today';
    
    // Check if it's a standard range
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'Last 7 days';
    if (diffDays <= 30) return 'Last 30 days';
    
    return `${format(from, 'MMM d')} - ${format(to, 'MMM d, yyyy')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={handlePresetChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder={formatDateRange()} />
        </SelectTrigger>
        <SelectContent>
          {presetRanges.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={setCustomStartDate}
                className="pointer-events-auto"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={setCustomEndDate}
                className="pointer-events-auto"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCustomRangeApply}
                disabled={!customStartDate || !customEndDate}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
