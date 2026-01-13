import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SimpleLineChartProps {
  data: Array<{ day: string; revenue: number; gross_profit: number }>;
  className?: string;
}

export function SimpleLineChart({ data, className }: SimpleLineChartProps) {
  // Transform data for chart
  const chartData = data.map(item => ({
    date: formatDate(item.day, 'short'),
    revenue: Number(item.revenue) || 0,
    profit: Number(item.gross_profit) || 0,
  })).reverse(); // Reverse to show chronologically

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => `£${value}`}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              formatCurrency(value), 
              name === 'revenue' ? 'Revenue' : 'Profit'
            ]}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="profit" 
            stroke="hsl(var(--success))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--success))', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SimpleBarChartProps {
  data: Array<{ category: string; amount: number }>;
  className?: string;
}

export function SimpleBarChart({ data, className }: SimpleBarChartProps) {
  const chartData = data.map(item => ({
    category: item.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    amount: Number(item.amount) || 0,
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="category" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => `£${value}`}
          />
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'Amount']}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Bar 
            dataKey="amount" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SimplePieChartProps {
  data: Array<{ category: string; amount: number }>;
  className?: string;
}

export function SimplePieChart({ data, className }: SimplePieChartProps) {
  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--success))',
    'hsl(var(--destructive))',
    'hsl(var(--accent))',
    'hsl(var(--secondary))',
  ];

  const chartData = data.map((item, index) => ({
    name: item.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: Number(item.amount) || 0,
    color: colors[index % colors.length],
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'Amount']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}