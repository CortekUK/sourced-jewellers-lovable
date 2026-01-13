interface AllActiveStockItem {
  supplier_name: string;
  product_name: string;
  internal_sku: string;
  cost: number;
  agreed_price: number;
  start_date?: string;
  status: string;
}

interface AllUnsettledSaleItem {
  supplier_name: string;
  product_name: string;
  internal_sku: string;
  sold_at?: string;
  sale_price?: number;
  payout_owed: number;
  payment_status: string;
}

interface AllSettledItem {
  supplier_name: string;
  product_name: string;
  internal_sku: string;
  sold_at?: string;
  sale_price?: number;
  payout_amount: number;
  settlement_date?: string;
}

export function exportAllActiveStockCSV(data: AllActiveStockItem[]) {
  const headers = [
    'Supplier',
    'Product Name',
    'SKU',
    'Cost',
    'Agreed Sell Price',
    'Start Date',
    'Status'
  ];
  
  const rows = data.map(item => [
    item.supplier_name,
    item.product_name,
    item.internal_sku,
    `£${item.cost.toFixed(2)}`,
    `£${item.agreed_price.toFixed(2)}`,
    item.start_date ? new Date(item.start_date).toLocaleDateString() : '-',
    item.status,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadCSV(csvContent, `all_active_consignment_stock_${getDateString()}.csv`);
}

export function exportAllUnsettledSalesCSV(data: AllUnsettledSaleItem[]) {
  const headers = [
    'Supplier',
    'Product Name',
    'SKU',
    'Date Sold',
    'Sale Price',
    'Payout Owed',
    'Payment Status'
  ];
  
  const rows = data.map(item => [
    item.supplier_name,
    item.product_name,
    item.internal_sku,
    item.sold_at ? new Date(item.sold_at).toLocaleDateString() : '-',
    `£${(item.sale_price || 0).toFixed(2)}`,
    `£${item.payout_owed.toFixed(2)}`,
    item.payment_status,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadCSV(csvContent, `all_unsettled_sales_${getDateString()}.csv`);
}

export function exportAllSettledConsignmentsCSV(data: AllSettledItem[]) {
  const headers = [
    'Supplier',
    'Product Name',
    'SKU',
    'Date Sold',
    'Sale Price',
    'Payout Amount',
    'Settlement Date'
  ];
  
  const rows = data.map(item => [
    item.supplier_name,
    item.product_name,
    item.internal_sku,
    item.sold_at ? new Date(item.sold_at).toLocaleDateString() : '-',
    `£${(item.sale_price || 0).toFixed(2)}`,
    `£${item.payout_amount.toFixed(2)}`,
    item.settlement_date ? new Date(item.settlement_date).toLocaleDateString() : '-',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadCSV(csvContent, `all_settled_consignments_${getDateString()}.csv`);
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
