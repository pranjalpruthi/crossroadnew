import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, DollarSign, LineChart, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

// Fake API service
const api = {
  getDashboardStats: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      totalUsers: '12,345',
      activeUsers: '8,891',
      revenue: '$123,456',
      growth: '+12.5%',
      userGrowth: '+180',
      activeGrowth: '+20.1%',
      revenueGrowth: '+19%',
      monthlyGrowth: '+201'
    }
  },
  getChartData: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      barData: [
        { name: 'Jan', value: 400, category: 'Q1' },
        { name: 'Feb', value: 300, category: 'Q1' },
        { name: 'Mar', value: 600, category: 'Q1' },
        { name: 'Apr', value: 800, category: 'Q2' },
        { name: 'May', value: 500, category: 'Q2' },
        { name: 'Jun', value: 700, category: 'Q2' },
      ],
      pieData: [
        { name: 'Mobile', value: 400 },
        { name: 'Desktop', value: 300 },
        { name: 'Tablet', value: 200 },
        { name: 'Other', value: 100 }
      ]
    }
  }
}

// Enhanced color palette with vibrant colors
const colors = {
  chart1: 'hsl(222, 100%, 61%)', // Bright blue
  chart2: 'hsl(280, 100%, 65%)', // Vibrant purple
  chart3: 'hsl(330, 100%, 71%)', // Rose gold
  chart4: 'hsl(150, 100%, 50%)', // Bright green
  chart5: 'hsl(45, 100%, 60%)',  // Gold
  chart6: 'hsl(190, 100%, 50%)', // Cyan
}

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: api.getDashboardStats
  })

  const { data: chartData, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: api.getChartData
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h2>
            <div className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your enterprise metrics.
            </div>
          </div>
          <div className="hidden md:block">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 flex items-center justify-center">
              <LineChart className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden transition-all hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats?.totalUsers}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stats?.userGrowth} from last month
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-green-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats?.activeUsers}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stats?.activeGrowth} from last week
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-amber-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats?.revenue}</div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stats?.revenueGrowth} from last month
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-rose-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">{stats?.growth}</div>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stats?.monthlyGrowth} since last hour
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="w-full transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.barData}>
                <XAxis 
                  dataKey="name" 
                  stroke="currentColor" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ strokeWidth: 0.5 }}
                />
                <YAxis
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ strokeWidth: 0.5 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                >
                  {chartData?.barData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.category === 'Q1' ? colors.chart1 : colors.chart2}
                      style={{ filter: 'brightness(1.1)' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="w-full transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              Platform Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData?.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData?.pieData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[`chart${index + 1}`]}
                      style={{ filter: 'brightness(1.1)' }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  formatter={(value) => (
                    <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 