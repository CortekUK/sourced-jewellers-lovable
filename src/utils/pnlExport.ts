import { formatCurrency, formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PnLData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  expensesByCategory: Array<{ category: string; amount: number }>;
  transactionCount: number;
  totalItems: number;
  dateRange: { from?: Date; to?: Date };
}

export function exportPnLToCSV(data: PnLData) {
  const { from, to } = data.dateRange;
  const dateRangeText = from && to 
    ? `${formatDate(from, 'short')} to ${formatDate(to, 'short')}`
    : 'All Time';

  // Build CSV content
  const lines = [
    'Profit & Loss Statement',
    `Period: ${dateRangeText}`,
    '',
    'Revenue & Costs',
    `Total Sales Revenue,${data.revenue.toFixed(2)}`,
    `Cost of Goods Sold (COGS),-${data.cogs.toFixed(2)}`,
    `Gross Profit,${data.grossProfit.toFixed(2)}`,
    `Gross Margin,${data.revenue > 0 ? ((data.grossProfit / data.revenue) * 100).toFixed(1) : '0.0'}%`,
    '',
    'Operating Expenses by Category',
    ...data.expensesByCategory.map(cat => 
      `${cat.category.charAt(0).toUpperCase() + cat.category.slice(1).replace('_', ' ')},${cat.amount.toFixed(2)}`
    ),
    `Total Operating Expenses,-${data.operatingExpenses.toFixed(2)}`,
    '',
    'Net Profit',
    `Net Profit,${data.netProfit.toFixed(2)}`,
    `Net Margin,${data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : '0.0'}%`,
    '',
    'Transaction Summary',
    `Total Transactions,${data.transactionCount}`,
    `Items Sold,${data.totalItems}`,
    `Average Transaction Value,${data.transactionCount > 0 ? (data.revenue / data.transactionCount).toFixed(2) : '0.00'}`,
  ];

  const csvContent = lines.join('\n');
  
  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `pnl-report-${formatDate(new Date(), 'short').replace(/\//g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPnLToPDF(data: PnLData) {
  const { from, to } = data.dateRange;
  const dateRangeText = from && to 
    ? `${formatDate(from, 'short')} to ${formatDate(to, 'short')}`
    : 'All Time';

  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Profit & Loss Statement', 14, 20);
  
  // Date range
  doc.setFontSize(11);
  doc.text(`Period: ${dateRangeText}`, 14, 28);
  
  // Revenue & Costs Section
  doc.setFontSize(14);
  doc.text('Revenue & Costs', 14, 40);
  
  autoTable(doc, {
    startY: 45,
    head: [['Item', 'Amount']],
    body: [
      ['Total Sales Revenue', formatCurrency(data.revenue)],
      ['Cost of Goods Sold (COGS)', formatCurrency(-data.cogs)],
      ['Gross Profit', formatCurrency(data.grossProfit)],
      ['Gross Margin', `${data.revenue > 0 ? ((data.grossProfit / data.revenue) * 100).toFixed(1) : '0.0'}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Operating Expenses Section
  const finalY1 = (doc as any).lastAutoTable.finalY || 70;
  doc.setFontSize(14);
  doc.text('Operating Expenses', 14, finalY1 + 10);
  
  autoTable(doc, {
    startY: finalY1 + 15,
    head: [['Category', 'Amount']],
    body: [
      ...data.expensesByCategory.map(cat => [
        cat.category.charAt(0).toUpperCase() + cat.category.slice(1).replace('_', ' '),
        formatCurrency(cat.amount)
      ]),
      ['Total Operating Expenses', formatCurrency(-data.operatingExpenses)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Net Profit Section
  const finalY2 = (doc as any).lastAutoTable.finalY || 120;
  doc.setFontSize(14);
  doc.text('Net Profit', 14, finalY2 + 10);
  
  autoTable(doc, {
    startY: finalY2 + 15,
    head: [['Item', 'Amount']],
    body: [
      ['Net Profit', formatCurrency(data.netProfit)],
      ['Net Margin', `${data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : '0.0'}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    bodyStyles: {
      fillColor: data.netProfit >= 0 ? [220, 252, 231] : [254, 226, 226],
      textColor: data.netProfit >= 0 ? [21, 128, 61] : [153, 27, 27],
    },
  });
  
  // Transaction Summary
  const finalY3 = (doc as any).lastAutoTable.finalY || 160;
  doc.setFontSize(14);
  doc.text('Transaction Summary', 14, finalY3 + 10);
  
  autoTable(doc, {
    startY: finalY3 + 15,
    head: [['Metric', 'Value']],
    body: [
      ['Total Transactions', data.transactionCount.toString()],
      ['Items Sold', data.totalItems.toString()],
      ['Average Transaction Value', formatCurrency(data.transactionCount > 0 ? data.revenue / data.transactionCount : 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(
      `Generated on ${formatDate(new Date(), 'medium')} | Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Save
  doc.save(`pnl-report-${formatDate(new Date(), 'short').replace(/\//g, '-')}.pdf`);
}
