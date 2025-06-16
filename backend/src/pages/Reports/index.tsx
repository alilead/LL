import { useState, useEffect } from 'react';
import { BarChart3, LineChart, PieChart, TrendingUp, DollarSign, Users } from 'lucide-react';
import { reportsApi, DashboardStats } from '../../api/reports';
import { format, subDays, subMonths, subWeeks, startOfQuarter, startOfYear } from 'date-fns';

export function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = () => {
    const endDate = new Date();
    let startDate;

    switch (selectedPeriod) {
      case 'day':
        startDate = subDays(endDate, 1);
        break;
      case 'week':
        startDate = subWeeks(endDate, 1);
        break;
      case 'month':
        startDate = subMonths(endDate, 1);
        break;
      case 'quarter':
        startDate = startOfQuarter(endDate);
        break;
      case 'year':
        startDate = startOfYear(endDate);
        break;
      default:
        startDate = subMonths(endDate, 1);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { startDate, endDate } = getDateRange();
        const data = await reportsApi.getDashboardStats(startDate, endDate);
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Revenue Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats?.salesPerformance.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                Win Rate: {stats?.salesPerformance.winRate.toFixed(1)}%
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        {/* Leads Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.leadFunnel.totalLeads.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600">
                New: {stats?.leadFunnel.newLeads.toLocaleString()}
              </p>
            </div>
            <Users className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.leadFunnel.conversionRates.overall.toFixed(1)}%
              </p>
              <p className="text-sm text-purple-600">
                Opportunities: {stats?.leadFunnel.opportunities.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
            <LineChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex flex-col items-center justify-center text-gray-500">
            <p className="text-lg font-medium mb-2">Average Deal Size</p>
            <p className="text-3xl font-bold text-blue-600">
              ${stats?.salesPerformance.averageDealSize.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Sales Cycle: {stats?.salesPerformance.salesCycleLength} days
            </p>
          </div>
        </div>

        {/* Leads by Source */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Pipeline Value</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex flex-col items-center justify-center text-gray-500">
            <p className="text-lg font-medium mb-2">Total Pipeline Value</p>
            <p className="text-3xl font-bold text-green-600">
              ${stats?.opportunityPipeline.totalValue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Won Deals: {stats?.leadFunnel.wonDeals}
            </p>
          </div>
        </div>

        {/* Task Completion */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Task Completion</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex flex-col items-center justify-center text-gray-500">
            <p className="text-lg font-medium mb-2">Completion Rate</p>
            <p className="text-3xl font-bold text-purple-600">
              {stats?.taskCompletion.completionRate.toFixed(1)}%
            </p>
            <div className="text-sm text-gray-500 mt-2">
              <p>Total Tasks: {stats?.taskCompletion.totalTasks}</p>
              <p>Completed: {stats?.taskCompletion.completedTasks}</p>
              <p>Overdue: {stats?.taskCompletion.overdueTasks}</p>
            </div>
          </div>
        </div>

        {/* System Health (Admin Only) */}
        {stats?.systemHealth && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">System Health</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
              <p className="text-lg font-medium mb-2">System Status</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.systemHealth.systemUptime.toFixed(1)}% Uptime
              </p>
              <div className="text-sm text-gray-500 mt-2">
                <p>API Response: {stats.systemHealth.apiResponseTime.toFixed(2)}ms</p>
                <p>Error Rate: {stats.systemHealth.errorRate.toFixed(2)}%</p>
                <p>Active Sessions: {stats.systemHealth.activeSessions}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}