import { HelpTooltip } from '@/components/ui/help-tooltips';

export const ExpenseHelpTooltips = {
  category: (
    <HelpTooltip content="Choose from predefined categories or create custom ones. Categories help you organize and analyze your expenses." />
  ),
  cogs: (
    <HelpTooltip content="Cost of Goods Sold (COGS) expenses are directly related to producing goods. This helps separate operating expenses from production costs for accurate accounting." />
  ),
  paymentMethod: (
    <HelpTooltip content="Track how expenses were paid. This helps with cash flow analysis and reconciliation." />
  ),
  categoryBreakdown: (
    <HelpTooltip content="Visual breakdown of expenses by category. Hover over segments to see detailed amounts and percentages." />
  ),
  monthlyTrends: (
    <HelpTooltip content="Shows how your operating costs and COGS change over time. Use this to identify spending patterns and seasonal variations." />
  ),
  filters: (
    <HelpTooltip content="Use filters to narrow down expenses by date, category, supplier, payment method, and more. Filters update all charts and tables in real-time." />
  ),
  bulkActions: (
    <HelpTooltip content="Select multiple expenses to delete or change categories in bulk. This saves time when managing large numbers of expenses." />
  ),
  customCategory: (
    <HelpTooltip content="Add industry-specific expense categories that fit your business needs. Custom categories appear alongside predefined ones." />
  ),
  largestExpense: (
    <HelpTooltip content="Shows the single largest expense for the selected period. Useful for identifying significant costs that may need review." />
  ),
  yoyComparison: (
    <HelpTooltip content="Compares total expenses between this year and last year to track growth or cost-cutting effectiveness." />
  ),
  expenseType: (
    <HelpTooltip content="Operating expenses are ongoing business costs, while COGS are directly tied to producing goods. Separating these provides better financial insights." />
  ),
  quickFilters: (
    <HelpTooltip content="Quickly filter expenses by common time periods. Click 'This Month' or 'This Year' for instant filtering." />
  ),
  export: (
    <HelpTooltip content="Export your expense data to CSV for spreadsheet analysis or PDF for reports and record-keeping." />
  )
};
