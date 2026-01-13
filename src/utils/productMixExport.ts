import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProductRow {
  product_id: number;
  name: string;
  sku?: string;
  internal_sku: string;
  units_sold: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  is_trade_in: boolean;
  is_consignment: boolean;
}

interface ProductMixData {
  products: ProductRow[];
  totals: {
    units: number;
    revenue: number;
    cogs: number;
    grossProfit: number;
  };
  dateRange: { from?: Date; to?: Date };
  filters?: {
    searchTerm?: string;
    categoryFilter?: string;
    typeFilter?: string;
  };
}

function getProductType(product: ProductRow): string {
  if (product.is_trade_in) return 'Part Exchange';
  if (product.is_consignment) return 'Consignment';
  return 'Owned';
}

function getMargin(revenue: number, profit: number): number {
  return revenue > 0 ? (profit / revenue) * 100 : 0;
}

export function exportProductMixToCSV(data: ProductMixData) {
  const { from, to } = data.dateRange;
  const dateRangeText = from && to 
    ? `${formatDate(from, 'short')} to ${formatDate(to, 'short')}`
    : 'All Time';

  const avgMargin = data.totals.revenue > 0 
    ? ((data.totals.grossProfit / data.totals.revenue) * 100).toFixed(1)
    : '0.0';

  // Build CSV content
  const lines = [
    'Product Performance Report',
    `Period: ${dateRangeText}`,
    '',
    'Summary',
    `Total Units Sold,${data.totals.units}`,
    `Total Revenue,${data.totals.revenue.toFixed(2)}`,
    `Total Gross Profit,${data.totals.grossProfit.toFixed(2)}`,
    `Average Margin,${avgMargin}%`,
    '',
    'Product Name,SKU,Units Sold,Revenue,COGS,Gross Profit,Margin %,Type',
    ...data.products.map(product => {
      const margin = getMargin(product.revenue, product.gross_profit);
      return [
        `"${product.name}"`,
        product.sku || product.internal_sku,
        product.units_sold,
        product.revenue.toFixed(2),
        product.cogs.toFixed(2),
        product.gross_profit.toFixed(2),
        margin.toFixed(1),
        getProductType(product)
      ].join(',');
    }),
  ];

  const csvContent = lines.join('\n');
  
  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `product-mix-${formatDate(new Date(), 'short').replace(/\//g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportProductMixToPDF(data: ProductMixData) {
  const { from, to } = data.dateRange;
  const dateRangeText = from && to 
    ? `${formatDate(from, 'short')} to ${formatDate(to, 'short')}`
    : 'All Time';

  const avgMargin = data.totals.revenue > 0 
    ? ((data.totals.grossProfit / data.totals.revenue) * 100).toFixed(1)
    : '0.0';

  const doc = new jsPDF('landscape'); // Use landscape for wide table
  
  // Title
  doc.setFontSize(18);
  doc.text('Product Performance Report', 14, 20);
  
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
      ['Total Units Sold', data.totals.units.toString()],
      ['Total Revenue', formatCurrency(data.totals.revenue)],
      ['Total Gross Profit', formatCurrency(data.totals.grossProfit)],
      ['Average Margin', `${avgMargin}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80, halign: 'right' },
    },
  });
  
  // Products Table
  const finalY = (doc as any).lastAutoTable.finalY || 75;
  doc.setFontSize(14);
  doc.text('Top Products by Revenue', 14, finalY + 10);
  
  // Limit to top 50 products for PDF
  const topProducts = data.products.slice(0, 50);
  
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Product', 'SKU', 'Units', 'Revenue', 'COGS', 'Profit', 'Margin %', 'Type']],
    body: topProducts.map(product => {
      const margin = getMargin(product.revenue, product.gross_profit);
      return [
        product.name,
        product.sku || product.internal_sku,
        product.units_sold.toString(),
        formatCurrency(product.revenue),
        formatCurrency(product.cogs),
        formatCurrency(product.gross_profit),
        `${margin.toFixed(1)}%`,
        getProductType(product),
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 30, halign: 'center' },
    },
    styles: { fontSize: 8 },
    didParseCell: function(data) {
      // Color code margins
      if (data.column.index === 6 && data.section === 'body') {
        const marginText = data.cell.text[0];
        const marginValue = parseFloat(marginText);
        
        if (marginValue >= 10) {
          data.cell.styles.textColor = [21, 128, 61]; // Green
          data.cell.styles.fillColor = [220, 252, 231];
        } else if (marginValue >= 5) {
          data.cell.styles.textColor = [161, 98, 7]; // Amber
          data.cell.styles.fillColor = [254, 243, 199];
        } else {
          data.cell.styles.textColor = [153, 27, 27]; // Red
          data.cell.styles.fillColor = [254, 226, 226];
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
  
  // Add note if products were truncated
  if (data.products.length > 50) {
    doc.setPage(1);
    doc.setFontSize(9);
    doc.text(
      `Note: Showing top 50 of ${data.products.length} products. Export to CSV for complete data.`,
      14,
      finalY + 8
    );
  }
  
  // Save
  doc.save(`product-mix-${formatDate(new Date(), 'short').replace(/\//g, '-')}.pdf`);
}
