import { Badge } from '@/components/ui/badge';

interface TradeInBadgeProps {
  className?: string;
}

export function TradeInBadge({ className }: TradeInBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`border-blue-500/50 text-blue-600 bg-blue-500/10 ${className}`}
    >
      PX
    </Badge>
  );
}