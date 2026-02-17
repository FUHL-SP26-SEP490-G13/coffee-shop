import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { revenueData, topProducts, ordersByType } from '../../lib/mockData';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminOverview() {
  const stats = [
    {
      label: 'Total Revenue',
      value: '$10,890',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      label: 'Total Orders',
      value: '356',
      change: '+8.2%',
      icon: ShoppingBag,
      color: 'text-accent',
    },
    {
      label: 'Active Users',
      value: '1,234',
      change: '+18.7%',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Growth Rate',
      value: '23.5%',
      change: '+4.1%',
      icon: TrendingUp,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded">
                {stat.change}
              </span>
            </div>
            <div className="text-2xl mb-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <Card className="col-span-2 p-4">
          <h3 className="text-sm mb-4">Revenue & Orders Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(111, 78, 55, 0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6F4E37"
                strokeWidth={2}
                name="Revenue ($)"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#8B9556"
                strokeWidth={2}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Order Types Pie Chart */}
        <Card className="p-4">
          <h3 className="text-sm mb-4">Orders by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ordersByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.type}: ${entry.value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ordersByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-4">
        <h3 className="text-sm mb-4">Top Selling Products</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topProducts}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(111, 78, 55, 0.1)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="sales" fill="#6F4E37" name="Units Sold" radius={[8, 8, 0, 0]} />
            <Bar dataKey="revenue" fill="#8B9556" name="Revenue ($)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
