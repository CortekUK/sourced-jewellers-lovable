export function exportSupplierFinancialCSV(
  supplierName: string,
  transactions: Array<{
    id: number | string;
    date: string;
    description: string;
    amount: number;
    type: string;
  }>
) {
  const headers = ['Date', 'Description', 'Type', 'Amount'];
  
  const rows = transactions.map(transaction => [
    new Date(transaction.date).toLocaleDateString(),
    transaction.description,
    transaction.type.replace('_', ' '),
    `£${transaction.amount.toFixed(2)}`,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${supplierName.replace(/[^a-z0-9]/gi, '_')}_transactions_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
