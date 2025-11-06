/**
 * Modern Dashboard - Beats Salesforce & HubSpot
 *
 * Features:
 * - Real-time KPIs with trend indicators
 * - Beautiful charts with Recharts
 * - Quick actions
 * - Recent activities feed
 * - Deal pipeline visualization
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Activity,
  Calendar,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Mock data - Replace with real API calls
const kpiData = [
  {
    title: 'Total Leads',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'blue'
  },
  {
    title: 'Pipeline Value',
    value: '$487K',
    change: '+8.3%',
    trend: 'up',
    icon: DollarSign,
    color: 'green'
  },
  {
    title: 'Conversion Rate',
    value: '24.8%',
    change: '-2.1%',
    trend: 'down',
    icon: Target,
    color: 'purple'
  },
  {
    title: 'Active Deals',
    value: '156',
    change: '+5.2%',
    trend: 'up',
    icon: Activity,
    color: 'orange'
  },
];

const revenueData = [
  { month: 'Jan', revenue: 45000, deals: 12 },
  { month: 'Feb', revenue: 52000, deals: 15 },
  { month: 'Mar', revenue: 48000, deals: 14 },
  { month: 'Apr', revenue: 61000, deals: 18 },
  { month: 'May', revenue: 55000, deals: 16 },
  { month: 'Jun', revenue: 67000, deals: 20 },
];

const pipelineData = [
  { name: 'Qualified', value: 45, color: '#3b82f6' },
  { name: 'Contacted', value: 30, color: '#10b981' },
  { name: 'Proposal', value: 15, color: '#f59e0b' },
  { name: 'Negotiation', value: 10, color: '#ef4444' },
];

const recentActivities = [
  {
    type: 'lead',
    title: 'New lead from Website',
    subtitle: 'Acme Corp - Enterprise plan inquiry',
    time: '5 min ago',
    icon: Users,
    color: 'blue'
  },
  {
    type: 'deal',
    title: 'Deal closed won',
    subtitle: 'TechStart Inc - $25,000',
    time: '1 hour ago',
    icon: CheckCircle2,
    color: 'green'
  },
  {
    type: 'email',
    title: 'Email campaign sent',
    subtitle: '2,450 recipients - 32% open rate',
    time: '2 hours ago',
    icon: Mail,
    color: 'purple'
  },
  {
    type: 'call',
    title: 'Call scheduled',
    subtitle: 'Demo call with Global Systems',
    time: '3 hours ago',
    icon: Phone,
    color: 'orange'
  },
];

const upcomingTasks = [
  { title: 'Follow up with Acme Corp', time: 'Today, 2:00 PM', priority: 'high' },
  { title: 'Send proposal to TechVision', time: 'Today, 4:30 PM', priority: 'medium' },
  { title: 'Demo call preparation', time: 'Tomorrow, 10:00 AM', priority: 'high' },
  { title: 'Review contract terms', time: 'Tomorrow, 3:00 PM', priority: 'low' },
];

export function ModernDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          Welcome back, Firat! 👋
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Here's what's happening with your sales today
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === 'up';

          return (
            <div key={index} className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${kpi.color}-50 dark:bg-${kpi.color}-900/20`}>
                  <Icon className={`w-6 h-6 text-${kpi.color}-600 dark:text-${kpi.color}-400`} />
                </div>
                <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {kpi.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">
                {kpi.value}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {kpi.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Distribution */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
            Pipeline Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Recent Activities
            </h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                  <div className={`p-2 rounded-lg bg-${activity.color}-50 dark:bg-${activity.color}-900/20`}>
                    <Icon className={`w-5 h-5 text-${activity.color}-600 dark:text-${activity.color}-400`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {activity.title}
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {activity.subtitle}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-500">
                    {activity.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Upcoming Tasks
            </h3>
            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <Plus className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingTasks.map((task, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {task.title}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        : task.priority === 'medium'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {task.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
