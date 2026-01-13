import { toast } from '@/hooks/use-toast';

export interface EmailReceipt {
  saleId: string;
  customerName?: string;
  items: Array<{
    product?: { name: string };
    quantity: number;
    unit_price: number;
  }>;
  total: number;
  soldAt: string;
  paymentMethod: string;
  notes?: string;
}

export const EmailService = {
  sendReceipt: (receipt: EmailReceipt) => {
    const subject = `Receipt for Sale #${receipt.saleId}`;
    const body = `Thank you for your purchase!

Sale Details:
- Sale ID: #${receipt.saleId}
- Date: ${new Date(receipt.soldAt).toLocaleDateString()}
- Total: £${receipt.total.toFixed(2)}

Items:
${receipt.items.map(item => 
  `- ${item.product?.name || 'Unknown Product'} x${item.quantity} @ £${item.unit_price.toFixed(2)}`
).join('\n')}

Payment Method: ${receipt.paymentMethod}
${receipt.notes ? `\nNotes: ${receipt.notes}` : ''}

Thank you for your business!`;
    
    const mailtoLink = `mailto:${
      receipt.customerName ? `${encodeURIComponent(receipt.customerName)}` : ''
    }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoLink, '_blank');
    
    toast({
      title: "Email Receipt",
      description: "Opening default email client with receipt details",
      variant: "default"
    });
  },

  exportToCSV: (data: any[], filename: string, headers?: string[]) => {
    const csvContent = [
      headers ? headers.join(',') : Object.keys(data[0] || {}).join(','),
      ...data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : String(value)
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${filename} has been downloaded`,
      variant: "default"
    });
  }
};