import { formatCurrency, formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PxItem {
  sale_id: number;
  product_id: number;
  product_name: string;
  internal_sku: string;
  revenue: number;
  cogs: number;
  sold_at: string;
}

interface ConsignmentItem extends PxItem {
  supplier_name?: string;
  is_paid: boolean;
}

interface PxConsignmentData {
  pxSummary: {
    items: number;
    totalAllowances: number;
    grossProfit: number;
  };
  consignmentSummary: {
    items: number;
    totalPayouts: number;
    grossProfit: number;
  };
  unsettledConsignments: any[];
  pxItems: PxItem[];
  consignmentItems: ConsignmentItem[];
  dateRange: { from?: Date; to?: Date };
}

export function exportPxConsignmentToCSV(data: PxConsignmentData) {
  const { from, to } = data.dateRange;
  const dateRangeText = from && to 
    ? `${formatDate(from, 'short')} to ${formatDate(to, 'short')}`
    : 'All Time';

  const unsettledAmount = data.unsettledConsignments.reduce(
    (sum, item) => sum + (item.payout_amount || 0), 
    0
  );

  // Build CSV content
  const lines = [
    'Part Exchange & Consignment Report',
    `Period: ${dateRangeText}`,
    '',
    'Summary',
    `PX Items,${data.pxSummary.items}`,
    `PX Total Allowances,${data.pxSummary.totalAllowances.toFixed(2)}`,
    `PX Gross Profit,${data.pxSummary.grossProfit.toFixed(2)}`,
    `Consignment Items,${data.consignmentSummary.items}`,
    `Consignment Total Payouts,${data.consignmentSummary.totalPayouts.toFixed(2)}`,
    `Consignment Gross Profit (Settled),${data.consignmentSummary.grossProfit.toFixed(2)}`,
    `Unsettled Amount,${unsettledAmount.toFixed(2)}`,
    '',
    'Part Exchange Items',
    'Product,SKU,Sale ID,Allowance,Sale Price,Gross Profit,Date',
    ...data.pxItems.map(item => {
      const profit = Number(item.revenue || 0) - Number(item.cogs || 0);
      return [
        `"${item.product_name}"`,
        item.internal_sku,
        item.sale_id,
        item.cogs.toFixed(2),
        item.revenue.toFixed(2),
        profit.toFixed(2),
        formatDate(new Date(item.sold_at), 'short')
      ].join(',');
    }),
    '',
    'Consignment Items',
    'Product,SKU,Consigner,Sale ID,Payout,Sale Price,Gross Profit,Status,Date',
    ...data.consignmentItems.map(item => {
      const profit = Number(item.revenue || 0) - Number(item.cogs || 0);
      return [
        `"${item.product_name}"`,
        item.internal_sku,
        `"${item.supplier_name || 'Unknown'}"`,
        item.sale_id,
        item.cogs.toFixed(2),
        item.revenue.toFixed(2),
        profit.toFixed(2),
        item.is_paid ? 'Settled' : 'Unsettled',
        formatDate(new Date(item.sold_at), 'short')
      ].join(',');
    }),
  ];

  const csvContent = lines.join('\n');
  
  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `px-consignment-${formatDate(new Date(), 'short').replace(/\//g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPxConsignmentToPDF(data: PxConsignmentData) {
  const { from, to } = data.dateRange;
  const dateRangeText = from && to 
    ? `${formatDate(from, 'short')} to ${formatDate(to, 'short')}`
    : 'All Time';

  const unsettledAmount = data.unsettledConsignments.reduce(
    (sum, item) => sum + (item.payout_amount || 0), 
    0
  );

  const doc = new jsPDF('landscape');
  
  // Title
  doc.setFontSize(18);
  doc.text('Part Exchange & Consignment Report', 14, 20);
  
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
      ['PX Items', data.pxSummary.items.toString()],
      ['PX Total Allowances', formatCurrency(data.pxSummary.totalAllowances)],
      ['PX Gross Profit', formatCurrency(data.pxSummary.grossProfit)],
      ['Consignment Items', data.consignmentSummary.items.toString()],
      ['Consignment Total Payouts', formatCurrency(data.consignmentSummary.totalPayouts)],
      ['Consignment Gross Profit (Settled)', formatCurrency(data.consignmentSummary.grossProfit)],
      ['Unsettled Amount', formatCurrency(unsettledAmount)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80, halign: 'right' },
    },
  });
  
  // PX Items Table
  const finalY1 = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(14);
  doc.text('Part Exchange Items', 14, finalY1 + 10);
  
  autoTable(doc, {
    startY: finalY1 + 15,
    head: [['Product', 'Sale ID', 'Allowance', 'Sale Price', 'Profit', 'Date']],
    body: data.pxItems.map(item => {
      const profit = Number(item.revenue || 0) - Number(item.cogs || 0);
      return [
        item.product_name,
        `#${item.sale_id}`,
        formatCurrency(item.cogs),
        formatCurrency(item.revenue),
        formatCurrency(profit),
        formatDate(new Date(item.sold_at), 'short'),
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
      5: { cellWidth: 35, halign: 'center' },
    },
    styles: { fontSize: 9 },
    didParseCell: function(data) {
      // Color code profit
      if (data.column.index === 4 && data.section === 'body') {
        const profitText = data.cell.text[0];
        const profitValue = parseFloat(profitText.replace('£', '').replace(',', ''));
        
        if (profitValue > 0) {
          data.cell.styles.textColor = [21, 128, 61];
          data.cell.styles.fillColor = [220, 252, 231];
        } else if (profitValue < 0) {
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fillColor = [254, 226, 226];
        }
      }
    },
  });
  
  // Consignment Items Table (on new page if needed)
  let finalY2 = (doc as any).lastAutoTable.finalY || 160;
  
  // Add new page if not enough space
  if (finalY2 > 160) {
    doc.addPage();
    finalY2 = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Consignment Items', 14, finalY2 + 10);
  
  autoTable(doc, {
    startY: finalY2 + 15,
    head: [['Product', 'Consigner', 'Sale ID', 'Payout', 'Sale Price', 'Profit', 'Status']],
    body: data.consignmentItems.map(item => {
      const profit = Number(item.revenue || 0) - Number(item.cogs || 0);
      return [
        item.product_name,
        item.supplier_name || 'Unknown',
        `#${item.sale_id}`,
        formatCurrency(item.cogs),
        formatCurrency(item.revenue),
        formatCurrency(profit),
        item.is_paid ? 'Settled' : 'Unsettled',
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 30, halign: 'center' },
    },
    styles: { fontSize: 9 },
    didParseCell: function(data) {
      // Color code profit
      if (data.column.index === 5 && data.section === 'body') {
        const profitText = data.cell.text[0];
        const profitValue = parseFloat(profitText.replace('£', '').replace(',', ''));
        
        if (profitValue > 0) {
          data.cell.styles.textColor = [21, 128, 61];
          data.cell.styles.fillColor = [220, 252, 231];
        } else if (profitValue < 0) {
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fillColor = [254, 226, 226];
        }
      }
      
      // Color code status
      if (data.column.index === 6 && data.section === 'body') {
        const statusText = data.cell.text[0];
        if (statusText === 'Settled') {
          data.cell.styles.textColor = [21, 128, 61];
          data.cell.styles.fillColor = [220, 252, 231];
        } else {
          data.cell.styles.textColor = [153, 27, 27];
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
  
  // Save
  doc.save(`px-consignment-${formatDate(new Date(), 'short').replace(/\//g, '-')}.pdf`);
}
