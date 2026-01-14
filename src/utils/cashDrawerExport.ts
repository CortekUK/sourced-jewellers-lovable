import { format } from 'date-fns';
import type { CashMovement } from '@/hooks/useCashDrawer';

export function exportCashDrawerHistory(movements: CashMovement[], locationName: string) {
  const headers = [
    'Date',
    'Time',
    'Type',
    'Amount',
    'Staff',
    'Notes',
    'Sale Reference',
  ];

  const rows = movements.map((movement) => [
    format(new Date(movement.created_at), 'dd/MM/yyyy'),
    format(new Date(movement.created_at), 'HH:mm:ss'),
    formatMovementType(movement.movement_type),
    movement.amount.toFixed(2),
    movement.profile?.full_name || 'System',
    (movement.notes || '').replace(/,/g, ';').replace(/\n/g, ' '),
    movement.reference_sale_id ? `#${movement.reference_sale_id}` : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `cash-drawer-${locationName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
}

function formatMovementType(type: string): string {
  const labels: Record<string, string> = {
    sale_cash_in: 'Cash Sale',
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    float_set: 'Float Set',
    adjustment: 'Adjustment',
    sale_void_refund: 'Void Refund',
  };
  return labels[type] || type;
}
