import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting
export function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Number formatting  
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Percentage formatting
export function formatPercentage(value: number, decimals = 1): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

// Date formatting
export function formatDate(date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: '2-digit',
      });
    case 'long':
      return dateObj.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    default:
      return dateObj.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  }
}

// Date and time formatting
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
}

// Time formatting
export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
}

// Get date range for common periods
export function getDateRange(period: 'today' | 'week' | 'month' | '7d' | '30d'): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        from: today.toISOString(),
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
      };
    case 'week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        from: startOfWeek.toISOString(),
        to: now.toISOString(),
      };
    case 'month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        from: startOfMonth.toISOString(),
        to: now.toISOString(),
      };
    case '7d':
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        from: sevenDaysAgo.toISOString(),
        to: now.toISOString(),
      };
    case '30d':
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        from: thirtyDaysAgo.toISOString(),
        to: now.toISOString(),
      };
    default:
      return {
        from: today.toISOString(),
        to: now.toISOString(),
      };
  }
}

// Number validation
export function isValidNumber(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num);
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation (basic UK format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(?:(?:\+44\s?|0)(?:\d{2}\s?\d{4}\s?\d{4}|\d{3}\s?\d{3}\s?\d{4}|\d{4}\s?\d{3}\s?\d{3}))$/;
  return phoneRegex.test(phone);
}

// Generate random ID for temporary use
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Extract individual seller info from description
export function extractIndividualSeller(description: string | null): string | null {
  if (!description) return null;
  
  const match = description.match(/^Individual:\s*(.+?)(?:\n|$)/);
  return match ? match[1].trim() : null;
}

// Get cleaned description without individual seller info
export function getCleanedDescription(description: string | null): string | null {
  if (!description) return null;
  
  // Remove the "Individual: [Name]" part from the beginning
  const cleaned = description.replace(/^Individual:\s*.+?(?:\n|$)/, '').trim();
  return cleaned || null;
}

// Get supplier display name (registered supplier, individual seller, or fallback)
export function getSupplierDisplayName(product: any): string {
  // First check for registered supplier
  if (product.supplier?.name) {
    return product.supplier.name;
  }
  
  // Then check for individual seller in description
  const individualSeller = extractIndividualSeller(product.description);
  if (individualSeller) {
    return `${individualSeller} (Ind.)`;
  }
  
  return 'No supplier';
}

// Calculate cart totals
export function calculateCartTotals(items: Array<{
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
}>): {
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const discount_total = items.reduce((sum, item) => sum + item.discount, 0);
  const taxable_amount = subtotal - discount_total;
  const tax_total = items.reduce((sum, item) => {
    const item_subtotal = item.quantity * item.unit_price;
    const item_discount = item.discount;
    const taxable_item_amount = item_subtotal - item_discount;
    return sum + (taxable_item_amount * (item.tax_rate / 100));
  }, 0);
  
  return {
    subtotal,
    tax_total,
    discount_total,
    total: subtotal + tax_total - discount_total,
  };
}
