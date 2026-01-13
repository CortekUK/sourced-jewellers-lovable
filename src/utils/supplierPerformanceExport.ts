import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SupplierRow {
  supplier_id: number;
  name: string;
  supplier_type: string;
  products_sold: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  settled_amount: number;
  outstanding_settlements: number;
}

interface SupplierPerformanceData {
  totalSuppliers: number;
  activeSuppliers: number;
  suppliers: SupplierRow[];
  totals: {
    products_sold: number;
    revenue: number;
    cogs: number;
    gross_profit: number;
    settled_amount: number;
    outstanding_settlements: number;
  };
  dateRange: { from?: Date; to?: Date };
  filters?: {
    supplierType?: string;
  };
}

function getSupplierType(type: string): string {
  if (type === 'customer') return 'Customer';
  return 'Registered';
}

function getMargin(revenue: number, profit: number): number {
  return revenue > 0 ? (profit / revenue) * 100 : 0;
}

function getSettlementStatus(settled: number, outstanding: number): string {
  if (outstanding > 0) return `£${outstanding.toFixed(2)} Outstanding`;
  if (settled > 0) return 'Settled';
  return 'N/A';
}

export function exportSupplierPerformanceToCSV(data: SupplierPerformanceData) {
  const { from, to } = data.dateRange;
  const dateRangeText = from && to 
    ? `${formatDate(from, 'short')} to ${formatDate(to, 'short')}`
    : 'All Time';

  const avgMargin = data.totals.revenue > 0 
    ? ((data.totals.gross_profit / data.totals.revenue) * 100).toFixed(1)
    : '0.0';

  // Build CSV content
  const lines = [
    'Supplier Performance Report',
    `Period: ${dateRangeText}`,
    '',
    'Summary',
    `Total Suppliers,${data.totalSuppliers}`,
    `Active Suppliers,${data.activeSuppliers}`,
    `Total Revenue,${data.totals.revenue.toFixed(2)}`,
    `Total Gross Profit,${data.totals.gross_profit.toFixed(2)}`,
    `Average Margin,${avgMargin}%`,
    `Total Products Sold,${data.totals.products_sold}`,
    '',
    'Supplier Name,Type,Products Sold,Revenue,COGS,Gross Profit,Margin %,Settlements,Status',
    ...data.suppliers.map(supplier => {
      const margin = getMargin(supplier.revenue, supplier.gross_profit);
      const settlementAmount = supplier.settled_amount + supplier.outstanding_settlements;
      const status = getSettlementStatus(supplier.settled_amount, supplier.outstanding_settlements);
      
      return [
        `"${supplier.name}"`,
        getSupplierType(supplier.supplier_type),
        supplier.products_sold,
        supplier.revenue.toFixed(2),
        supplier.cogs.toFixed(2),
        supplier.gross_profit.toFixed(2),
        margin.toFixed(1),
        settlementAmount.toFixed(2),
        status
      ].join(',');
    }),
  ];

  const csvContent = lines.join('\n');
  
  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `supplier-performance-${formatDate(new Date(), 'short').replace(/\//g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSupplierPerformanceToPDF(data: SupplierPerformanceData) {
  const { from, to } = data.dateRange;
  const dateRangeText = from && to 
    ? `${formatDate(from, 'short')} to ${formatDate(to, 'short')}`
    : 'All Time';

  const avgMargin = data.totals.revenue > 0 
    ? ((data.totals.gross_profit / data.totals.revenue) * 100).toFixed(1)
    : '0.0';

  const doc = new jsPDF('landscape');
  
  // Title
  doc.setFontSize(18);
  doc.text('Supplier Performance Report', 14, 20);
  
  // Date range
  doc.setFontSize(11);
  doc.text(`Period: ${dateRangeText}`, 14, 28);
  
  // Summary Section
  doc.setFontSize(14);
  doc.text('Summary', 14, 40);
  
  autoTable(doc, {
    startY: 45,
    head: [['Metric', 'Value']],
    body: [
      ['Total Suppliers', data.totalSuppliers.toString()],
      ['Active Suppliers', data.activeSuppliers.toString()],
      ['Total Products Sold', data.totals.products_sold.toString()],
      ['Total Revenue', formatCurrency(data.totals.revenue)],
      ['Total Gross Profit', formatCurrency(data.totals.gross_profit)],
      ['Average Margin', `${avgMargin}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80, halign: 'right' },
    },
  });
  
  // Suppliers Table
  const finalY = (doc as any).lastAutoTable.finalY || 85;
  doc.setFontSize(14);
  doc.text('Supplier Performance', 14, finalY + 10);
  
  // Limit to top 40 suppliers for PDF
  const topSuppliers = data.suppliers.slice(0, 40);
  
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Supplier', 'Type', 'Products', 'Revenue', 'COGS', 'Profit', 'Margin %', 'Settlement Status']],
    body: topSuppliers.map(supplier => {
      const margin = getMargin(supplier.revenue, supplier.gross_profit);
      const status = getSettlementStatus(supplier.settled_amount, supplier.outstanding_settlements);
      
      return [
        supplier.name,
        getSupplierType(supplier.supplier_type),
        supplier.products_sold.toString(),
        formatCurrency(supplier.revenue),
        formatCurrency(supplier.cogs),
        formatCurrency(supplier.gross_profit),
        `${margin.toFixed(1)}%`,
        status,
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 40, halign: 'center' },
    },
    styles: { fontSize: 8 },
    didParseCell: function(data) {
      // Color code margins
      if (data.column.index === 6 && data.section === 'body') {
        const marginText = data.cell.text[0];
        const marginValue = parseFloat(marginText);
        
        if (marginValue >= 10) {
          data.cell.styles.textColor = [21, 128, 61];
          data.cell.styles.fillColor = [220, 252, 231];
        } else if (marginValue >= 5) {
          data.cell.styles.textColor = [161, 98, 7];
          data.cell.styles.fillColor = [254, 243, 199];
        } else if (marginValue > 0) {
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fillColor = [254, 226, 226];
        }
      }
      
      // Color code settlement status
      if (data.column.index === 7 && data.section === 'body') {
        const statusText = data.cell.text[0];
        if (statusText.includes('Outstanding')) {
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fillColor = [254, 226, 226];
        } else if (statusText === 'Settled') {
          data.cell.styles.textColor = [21, 128, 61];
          data.cell.styles.fillColor = [220, 252, 231];
        }
      }
    },
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
  
  // Add note if suppliers were truncated
  if (data.suppliers.length > 40) {
    doc.setPage(1);
    doc.setFontSize(9);
    doc.text(
      `Note: Showing top 40 of ${data.suppliers.length} suppliers. Export to CSV for complete data.`,
      14,
      finalY + 8
    );
  }
  
  // Save
  doc.save(`supplier-performance-${formatDate(new Date(), 'short').replace(/\//g, '-')}.pdf`);
}
