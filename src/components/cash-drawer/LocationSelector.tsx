import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLocations } from '@/hooks/useLocations';
import { MapPin } from 'lucide-react';

interface LocationSelectorProps {
  value: number | null;
  onChange: (locationId: number | null) => void;
  required?: boolean;
  disabled?: boolean;
}

export function LocationSelector({ value, onChange, required, disabled }: LocationSelectorProps) {
  const { data: locations, isLoading } = useLocations();

  const activeLocations = locations?.filter(l => l.status === 'active') || [];

  return (
    <div className="space-y-2">
      <Label htmlFor="location" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Shop Location {required && '*'}
      </Label>
      <Select
        value={value?.toString() || ''}
        onValueChange={(val) => onChange(val ? parseInt(val, 10) : null)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id="location">
          <SelectValue placeholder={isLoading ? 'Loading...' : 'Select shop location'} />
        </SelectTrigger>
        <SelectContent>
          {activeLocations.map((location) => (
            <SelectItem key={location.id} value={location.id.toString()}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activeLocations.length === 0 && !isLoading && (
        <p className="text-xs text-muted-foreground">
          No active locations. Add locations in Settings.
        </p>
      )}
    </div>
  );
}
