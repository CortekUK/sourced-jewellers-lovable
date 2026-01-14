import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { useCashDrawerBalances } from '@/hooks/useCashDrawer';
import { usePermissions } from '@/hooks/usePermissions';
import { CashMovementModal } from './CashMovementModal';
import { CashDrawerHistoryModal } from './CashDrawerHistoryModal';
import { 
  Banknote, 
  Plus, 
  Minus, 
  History, 
  RefreshCw,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';

export function CashDrawerPanel() {
  const { data: balances, isLoading, refetch } = useCashDrawerBalances();
  const { isOwner, isAtLeast } = usePermissions();
  const [movementModal, setMovementModal] = useState<{
    isOpen: boolean;
    locationId: number | null;
    locationName: string;
    type: 'deposit' | 'withdrawal' | 'float_set';
  }>({ isOpen: false, locationId: null, locationName: '', type: 'deposit' });
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    locationId: number | null;
    locationName: string;
  }>({ isOpen: false, locationId: null, locationName: '' });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Cash Drawer Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Cash Drawer Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active locations found.</p>
            <p className="text-sm">Add locations in Settings to start tracking cash.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Cash Drawer Status
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {balances.map((location) => (
            <Card key={location.location_id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-base">{location.location_name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {location.last_movement_at 
                        ? `Updated ${format(new Date(location.last_movement_at), 'dd MMM HH:mm')}`
                        : 'No transactions yet'}
                    </p>
                  </div>
                </div>
                
                <div className={`text-2xl font-bold mb-4 ${
                  location.current_balance < 0 ? 'text-destructive' : 'text-primary'
                }`}>
                  {formatCurrency(location.current_balance)}
                </div>

                <div className="flex flex-wrap gap-2">
                  {isAtLeast('manager') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMovementModal({
                          isOpen: true,
                          locationId: location.location_id,
                          locationName: location.location_name,
                          type: 'deposit'
                        })}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMovementModal({
                          isOpen: true,
                          locationId: location.location_id,
                          locationName: location.location_name,
                          type: 'withdrawal'
                        })}
                      >
                        <Minus className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </>
                  )}
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMovementModal({
                        isOpen: true,
                        locationId: location.location_id,
                        locationName: location.location_name,
                        type: 'float_set'
                      })}
                    >
                      Set Float
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHistoryModal({
                      isOpen: true,
                      locationId: location.location_id,
                      locationName: location.location_name
                    })}
                  >
                    <History className="h-3 w-3 mr-1" />
                    History
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>

      <CashMovementModal
        isOpen={movementModal.isOpen}
        onClose={() => setMovementModal({ ...movementModal, isOpen: false })}
        locationId={movementModal.locationId}
        locationName={movementModal.locationName}
        movementType={movementModal.type}
      />

      <CashDrawerHistoryModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
        locationId={historyModal.locationId}
        locationName={historyModal.locationName}
      />
    </Card>
  );
}
