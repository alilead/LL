/**
 * Advanced Reporting & Dashboards
 *
 * SALESFORCE: Static reports, outdated data, slow to load (PAINFUL!)
 * LEADLAB: Real-time dashboards, drag & drop widgets, live updates! (AMAZING!)
 *
 * Beautiful insights at your fingertips!
 */

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { advancedReportsApi } from '@/api/advancedReports';
import { useQuery } from '@tanstack/react-query';

// Widget types
export type WidgetType =
  | 'metric'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'table'
  | 'funnel';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  data: any;
  config?: any;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
}

// Colors
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

// Metric Widget
interface MetricWidgetProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: any;
  color?: string;
}

export function MetricWidget({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon: Icon = TrendingUp,
  color = 'blue',
}: MetricWidgetProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={cn('p-2 rounded-lg', colorClasses[color as keyof typeof colorClasses] || colorClasses.blue)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && <TrendingUp className="w-4 h-4 text-green-600" />}
              {isNegative && <TrendingDown className="w-4 h-4 text-red-600" />}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive && 'text-green-600',
                  isNegative && 'text-red-600',
                  !isPositive && !isNegative && 'text-gray-600'
                )}
              >
                {change > 0 && '+'}
                {change}%
              </span>
              <span className="text-xs text-gray-500">{changeLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Chart Widget Container
interface ChartWidgetProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function ChartWidget({ title, children, actions }: ChartWidgetProps) {
  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

// Line Chart Widget
interface LineChartWidgetProps {
  title: string;
  data: any[];
  dataKeys: { key: string; label: string; color?: string }[];
}

export function LineChartWidget({ title, data, dataKeys }: LineChartWidgetProps) {
  return (
    <ChartWidget title={title}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: 12 }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          {dataKeys.map((dk, idx) => (
            <Line
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.label}
              stroke={dk.color || CHART_COLORS[idx % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

// Bar Chart Widget
interface BarChartWidgetProps {
  title: string;
  data: any[];
  dataKeys: { key: string; label: string; color?: string }[];
}

export function BarChartWidget({ title, data, dataKeys }: BarChartWidgetProps) {
  return (
    <ChartWidget title={title}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: 12 }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          {dataKeys.map((dk, idx) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.label}
              fill={dk.color || CHART_COLORS[idx % CHART_COLORS.length]}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

// Pie Chart Widget
interface PieChartWidgetProps {
  title: string;
  data: any[];
}

export function PieChartWidget({ title, data }: PieChartWidgetProps) {
  return (
    <ChartWidget title={title}>
      <ResponsiveContainer width="100%" height={300}>
        <RePieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </RePieChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

// Area Chart Widget
interface AreaChartWidgetProps {
  title: string;
  data: any[];
  dataKeys: { key: string; label: string; color?: string }[];
}

export function AreaChartWidget({ title, data, dataKeys }: AreaChartWidgetProps) {
  return (
    <ChartWidget title={title}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            {dataKeys.map((dk, idx) => (
              <linearGradient key={dk.key} id={`color${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={dk.color || CHART_COLORS[idx % CHART_COLORS.length]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={dk.color || CHART_COLORS[idx % CHART_COLORS.length]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: 12 }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          {dataKeys.map((dk, idx) => (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.label}
              stroke={dk.color || CHART_COLORS[idx % CHART_COLORS.length]}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color${dk.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

// Sales Funnel Widget
interface FunnelWidgetProps {
  title: string;
  stages: { name: string; count: number; value: number }[];
}

export function FunnelWidget({ title, stages }: FunnelWidgetProps) {
  const maxCount = Math.max(...stages.map(s => s.count));

  return (
    <ChartWidget title={title}>
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const percentage = (stage.count / maxCount) * 100;
          const conversionRate = idx > 0 ? ((stage.count / stages[idx - 1].count) * 100).toFixed(1) : 100;

          return (
            <div key={stage.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{stage.count} leads</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${stage.value.toLocaleString()}
                  </span>
                  {idx > 0 && (
                    <span className="text-xs text-gray-500">{conversionRate}% conversion</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full flex items-center justify-end pr-3 text-white text-sm font-medium transition-all duration-500'
                  )}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  }}
                >
                  {percentage > 20 && `${percentage.toFixed(0)}%`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ChartWidget>
  );
}

// Complete Dashboard Example
export function AdvancedDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    };
  }, [timeRange]);

  // Fetch KPI metrics
  const { data: kpiData, isLoading: isLoadingKPI, refetch: refetchKPI } = useQuery({
    queryKey: ['kpiDashboard', dateRange],
    queryFn: () => advancedReportsApi.getKPIDashboard(dateRange),
  });

  // Fetch lead sources
  const { data: leadSources, isLoading: isLoadingLeadSources, refetch: refetchLeadSources } = useQuery({
    queryKey: ['leadSources', dateRange],
    queryFn: () => advancedReportsApi.getLeadSourceAnalysis(dateRange),
  });

  // Fetch pipeline health
  const { data: pipelineHealth, isLoading: isLoadingPipeline, refetch: refetchPipeline } = useQuery({
    queryKey: ['pipelineHealth'],
    queryFn: () => advancedReportsApi.getPipelineHealth(),
  });

  // Fetch conversion funnel
  const { data: conversionFunnel, isLoading: isLoadingFunnel, refetch: refetchFunnel } = useQuery({
    queryKey: ['conversionFunnel', dateRange],
    queryFn: () => advancedReportsApi.getConversionFunnel(dateRange),
  });

  const isRefreshing = isLoadingKPI || isLoadingLeadSources || isLoadingPipeline || isLoadingFunnel;

  // Transform API data to chart format
  const leadSourceData = useMemo(() => {
    return (leadSources || []).map(source => ({
      name: source.source,
      value: source.total_leads,
    }));
  }, [leadSources]);

  const pipelineData = useMemo(() => {
    return (pipelineHealth || []).map(stage => ({
      name: stage.stage_name,
      count: stage.lead_count,
      value: stage.total_value,
    }));
  }, [pipelineHealth]);

  // Mock revenue data (would need time-series endpoint from backend)
  const revenueData = [
    { name: 'Jan', revenue: 45000, target: 50000 },
    { name: 'Feb', revenue: 52000, target: 50000 },
    { name: 'Mar', revenue: 48000, target: 50000 },
    { name: 'Apr', revenue: 61000, target: 55000 },
    { name: 'May', revenue: 55000, target: 55000 },
    { name: 'Jun', revenue: 67000, target: 60000 },
  ];

  const handleRefresh = async () => {
    await Promise.all([refetchKPI(), refetchLeadSources(), refetchPipeline(), refetchFunnel()]);
  };

  // Extract KPI metrics
  const totalRevenue = kpiData?.kpi_metrics.find(m => m.name.includes('Revenue'))?.current_value || 0;
  const revenueChange = kpiData?.kpi_metrics.find(m => m.name.includes('Revenue'))?.change_percentage || 0;
  const newLeads = kpiData?.kpi_metrics.find(m => m.name.includes('Lead'))?.current_value || 0;
  const leadsChange = kpiData?.kpi_metrics.find(m => m.name.includes('Lead'))?.change_percentage || 0;
  const conversionRate = kpiData?.kpi_metrics.find(m => m.name.includes('Conversion'))?.current_value || 0;
  const conversionChange = kpiData?.kpi_metrics.find(m => m.name.includes('Conversion'))?.change_percentage || 0;
  const activeDealCount = kpiData?.kpi_metrics.find(m => m.name.includes('Deal'))?.current_value || 0;
  const dealsChange = kpiData?.kpi_metrics.find(m => m.name.includes('Deal'))?.change_percentage || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time insights and analytics</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded transition-colors',
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {range === '7d' && '7 days'}
                {range === '30d' && '30 days'}
                {range === '90d' && '90 days'}
                {range === '1y' && '1 year'}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricWidget
          title="Total Revenue"
          value={`$${(totalRevenue / 1000).toFixed(0)}K`}
          change={revenueChange}
          icon={DollarSign}
          color="green"
        />
        <MetricWidget
          title="New Leads"
          value={newLeads}
          change={leadsChange}
          icon={Users}
          color="blue"
        />
        <MetricWidget
          title="Deals Won"
          value="23"
          change={-3.1}
          icon={Target}
          color="purple"
        />
        <MetricWidget
          title="Conversion Rate"
          value="18.4%"
          change={2.3}
          icon={TrendingUp}
          color="yellow"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AreaChartWidget
          title="Revenue vs Target"
          data={revenueData}
          dataKeys={[
            { key: 'revenue', label: 'Revenue', color: '#3b82f6' },
            { key: 'target', label: 'Target', color: '#10b981' },
          ]}
        />

        <PieChartWidget title="Lead Sources" data={leadSourceData} />
      </div>

      {/* Full Width Chart */}
      <FunnelWidget title="Sales Pipeline" stages={pipelineData} />
    </div>
  );
}
