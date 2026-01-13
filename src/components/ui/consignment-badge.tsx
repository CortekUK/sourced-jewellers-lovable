import { Badge } from '@/components/ui/badge';

interface ConsignmentBadgeProps {
  className?: string;
}

export function ConsignmentBadge({ className }: ConsignmentBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`border-warning/50 text-warning bg-warning/10 ${className}`}
    >
      Consignment
    </Badge>
  );
}