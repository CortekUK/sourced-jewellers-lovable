interface ActiveStockItem {
  product_name: string;
  internal_sku: string;
  agreed_payout: number;
  status: string;
}

interface UnsettledSaleItem {
  product_name: string;
  internal_sku: string;
  sold_at?: string;
  sold_price?: number;
  agreed_payout: number;
}

interface SettledItem {
  product_name: string;
  internal_sku: string;
  sold_at?: string;
  sold_price?: number;
  agreed_payout: number;
  paid_at?: string;
}

export function exportActiveStockCSV(
  data: ActiveStockItem[],
  supplierName: string
) {
  const headers = ['Product Name', 'SKU', 'Agreed Payout', 'Status'];
  
  const rows = data.map(item => [
    item.product_name,
    item.internal_sku,
    `£${item.agreed_payout.toFixed(2)}`,
    item.status,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadCSV(csvContent, `${supplierName}_active_consignment_stock_${getDateString()}.csv`);
}

export function exportUnsettledSalesCSV(
  data: UnsettledSaleItem[],
  supplierName: string
) {
  const headers = ['Product Name', 'SKU', 'Date Sold', 'Sale Price', 'Payout Owed'];
  
  const rows = data.map(item => [
    item.product_name,
    item.internal_sku,
    item.sold_at ? new Date(item.sold_at).toLocaleDateString() : '-',
    `£${(item.sold_price || 0).toFixed(2)}`,
    `£${item.agreed_payout.toFixed(2)}`,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadCSV(csvContent, `${supplierName}_unsettled_sales_${getDateString()}.csv`);
}

export function exportSettledConsignmentsCSV(
  data: SettledItem[],
  supplierName: string
) {
  const headers = ['Product Name', 'SKU', 'Date Sold', 'Sale Price', 'Payout Amount', 'Settlement Date'];
  
  const rows = data.map(item => [
    item.product_name,
    item.internal_sku,
    item.sold_at ? new Date(item.sold_at).toLocaleDateString() : '-',
    `£${(item.sold_price || 0).toFixed(2)}`,
    `£${item.agreed_payout.toFixed(2)}`,
    item.paid_at ? new Date(item.paid_at).toLocaleDateString() : '-',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadCSV(csvContent, `${supplierName}_settled_consignments_${getDateString()}.csv`);
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getDateString(): string {
  return new Date().toISOString().split('T')[0];
}
