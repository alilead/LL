import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  ClipboardList, 
  Video,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Calendar,
  Bell,
  Upload,
  Download,
  CalendarDays,
  UserPlus,
  Coins,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/axios';
import { useAuthStore } from '../../store/auth';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Legend
} from 'recharts';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Badge } from '../../components/ui/Badge';
import { PageContainer } from '@/components/ui/PageContainer';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { UserProfile } from '@/types/user';

type DateRange = '7d' | '30d' | '90d' | 'next30d' | 'next90d' | 'next180d';

interface DashboardStats {
  leads: {
    total: number;
    new_today: number;
    new_last_30_days: number;
    trend: Array<{
      date: string;
      new_leads: number;
      converted: number;
    }>;
    date_range: DateRange;
  };
  tasks: {
    open: number;
    overdue: number;
    trend: Array<{
      date: string;
      created: number;
      completed: number;
    }>;
    date_range: DateRange;
  };
  opportunities: {
    total: number;
    won: number;
    conversion_rate: number;
    pipeline_value: number;
    pipeline_trend: Array<{
      close_date: string;
      value: number;
      deal_count: number;
      uncertainty?: number;
    }>;
    date_range: DateRange;
    forecast_data?: {
      certainty: string;
      methodology: string;
      description: string;
      timeline: string;
      uncertainty_factor: number;
    };
  };
  meetings: {
    upcoming: number;
    trend: Array<{
      date: string;
      scheduled: number;
      completed: number;
    }>;
    date_range: DateRange;
  };
  user_stats: {
    total_tokens_used: number;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

// Activity item interface for the activity summary
interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'lead' | 'deal' | 'task' | 'meeting' | string;
  entityId?: string;
}

const pastRangeOptions = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

const futureRangeOptions = [
  { value: 'next30d', label: 'Next 30 Days' },
  { value: 'next90d', label: 'Next 90 Days' },
  { value: 'next180d', label: 'Next 180 Days' },
];

// Stat kartları için tip tanımı
interface StatCard {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

// Define theme types
type ThemeType = 'light' | 'dark' | 'system';

// Define theme colors
const themeColors = {
  light: {
    gradient: 'from-white to-blue-50/30',
    cardBg: 'bg-white',
    cardBorder: 'border-gray-100 hover:border-blue-200',
    textGradient: 'from-gray-900 to-gray-600',
    iconBg: 'bg-blue-500/10 text-blue-600',
    cardHeaderBg: '',
  },
  dark: {
    gradient: 'from-gray-900 to-gray-800',
    cardBg: 'bg-gray-800',
    cardBorder: 'border-gray-700 hover:border-blue-700',
    textGradient: 'from-blue-100 to-gray-300',
    iconBg: 'bg-blue-500/20 text-blue-400',
    cardHeaderBg: 'bg-gray-800',
  }
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore() as { user: UserProfile | null };
  const [pastRange] = useState<DateRange>('30d');
  const [futureRange] = useState<DateRange>('next90d');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [greeting, setGreeting] = useState<string>('Welcome back');
  const [theme, setTheme] = useState<ThemeType>('light');

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good morning');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  // Fetch notifications (only for future use)
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const response = await api.get('/notifications', { 
          params: { 
            limit: 5, 
            is_read: false 
          } 
        });
        return response.data?.items || [];
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
    enabled: false, // Şimdilik devre dışı bırakıyoruz
    retry: false
  });

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', pastRange, futureRange],
    queryFn: () => api.get(`/dashboard/stats?past_range=${pastRange}&future_range=${futureRange}`)
      .then(res => {
        // API yanıtını tam olarak görelim
        
        // data.data içindeki gerçek verileri görelim
        const apiData = res.data.data || {};
        
        // Leads, tasks, deals gibi kritik alanları kontrol edelim
        
        // API yanıtındaki 'data' objesi direk olarak DashboardStats formatına uyuyor mu?
        return apiData as DashboardStats;
      })
      .catch(error => {
        console.error('Error fetching dashboard data:', error);
        throw error;
      }),
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Aktivite verilerini doğrudan dashboard API'sinden al
  const { data: recentActivities = [] } = useQuery<ActivityItem[]>({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      try {
        // Dashboard API'sinden aktiviteleri al
        const response = await api.get('/dashboard/stats');
        const activities = response.data.data?.activities || [];
        
        return activities.map((item: any) => ({
          id: item.id || String(Math.random()),
          title: item.title || 'Activity',
          description: item.description || '',
          timestamp: item.created_at || new Date().toISOString(), // created_at API'den gelen alan adı
          type: item.type || 'other',
          entityId: item.entity_id || undefined
        }));
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Function to get icon based on activity type - type için güvenlik ekleyelim
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'lead':
        return <UserPlus className="h-4 w-4" />;
      case 'deal':
        return <DollarSign className="h-4 w-4" />;
      case 'task':
        return <ClipboardList className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Function to navigate to the relevant entity
  const handleActivityClick = (activity: ActivityItem) => {
    if (!activity.entityId) return;
    
    switch (activity.type) {
      case 'lead':
        navigate(`/leads/${activity.entityId}`);
        break;
      case 'deal':
        navigate(`/deals/${activity.entityId}`);
        break;
      case 'task':
        navigate(`/tasks/${activity.entityId}`);
        break;
      case 'meeting':
        navigate(`/calendar?event=${activity.entityId}`);
        break;
    }
  };

  // Get theme colors based on current theme
  const getThemeColors = () => {
    return theme === 'dark' ? themeColors.dark : themeColors.light;
  };

  // Change theme
  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    
    // In a real app, you would save this preference to local storage or user settings
    localStorage.setItem('dashboard-theme', newTheme);
    
    // If system is selected, detect OS preference
    if (newTheme === 'system') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDarkMode ? 'dark' : 'light');
      
      // Listen for OS theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        setTheme(e.matches ? 'dark' : 'light');
      });
    }
  };

  // Load theme preference from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as ThemeType | null;
    if (savedTheme) {
      handleThemeChange(savedTheme);
    }
  }, []);

  // Current theme colors
  const colors = getThemeColors();

  // Fix the theme comparison logic for system theme
  const getButtonClass = (buttonTheme: ThemeType) => {
    if (buttonTheme === 'system') {
      return 'text-gray-400 hover:text-gray-600';
    }
    
    if (buttonTheme === theme) {
      return theme === 'dark' 
        ? 'bg-blue-900/50 text-blue-400' 
        : 'bg-blue-100 text-blue-600';
    }
    
    return theme === 'dark' 
      ? 'text-gray-400 hover:text-gray-200' 
      : 'text-gray-400 hover:text-gray-600';
  };

  // Eksik olan getActivityIconBackground fonksiyonunu ekleyelim
  // Activity icon için background rengi belirleyen fonksiyon
  const getActivityIconBackground = (type: ActivityItem['type']) => {
    switch (type) {
      case 'lead':
        return 'bg-blue-100 text-blue-600';
      case 'deal':
        return 'bg-green-100 text-green-600';
      case 'task':
        return 'bg-amber-100 text-amber-600';
      case 'meeting':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <PageContainer noPadding className={`${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-center font-medium text-gray-500">Loading your dashboard...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const statCards: StatCard[] = [
    {
      title: 'Total Leads',
      value: stats?.leads?.total || 0,
      change: stats?.leads?.new_last_30_days || 0,
      changeLabel: 'new leads',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600',
      onClick: () => navigate('/leads')
    },
    {
      title: 'Pipeline Value',
      value: `$${(stats?.opportunities?.pipeline_value || 0).toLocaleString()}`,
      change: stats?.opportunities?.total || 0,
      changeLabel: 'total opportunities',
      icon: TrendingUp,
      color: 'bg-green-500/10 text-green-600',
      onClick: () => navigate('/deals')
    },
    {
      title: 'Open Tasks',
      value: stats?.tasks?.open || 0,
      change: -(stats?.tasks?.overdue || 0),
      changeLabel: 'overdue',
      icon: ClipboardList,
      color: 'bg-purple-500/10 text-purple-600',
      onClick: () => navigate('/tasks')
    },
    {
      title: 'Upcoming Meetings',
      value: stats?.meetings?.upcoming || 0,
      change: 0,
      changeLabel: 'scheduled',
      icon: Calendar,
      color: 'bg-orange-500/10 text-orange-600',
      onClick: () => navigate('/calendar')
    }
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      // Show error toast for invalid file type
      toast.error('Please select a valid CSV file');
    }
  };

  // Notification'ı okundu olarak işaretle
  const handleNotificationClick = (notification: Notification) => {
    // Handle notification click
  };

  // Enhanced visualization for charts - Gerçek verileri kullan
  const renderLeadChart = () => {
    // API'den gelen trend verilerini kullan, yoksa boş diziyi göster
    const leadData = stats?.leads.trend || [];
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={leadData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="convertedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => format(new Date(date), 'MMM d')}
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
          />
          <YAxis 
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
          />
          <Tooltip 
            labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
              border: theme === 'dark' ? '1px solid #374151' : '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend 
            formatter={(value) => {
              if (value === 'new_leads') return 'New Leads';
              if (value === 'converted') return 'Converted';
              return value;
            }}
          />
          <Area
            type="monotone"
            dataKey="new_leads"
            name="New Leads"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#leadGradient)"
          />
          <Area
            type="monotone"
            dataKey="converted"
            name="Converted"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#convertedGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderPipelineChart = () => {
    // API'den gelen pipeline trend verilerini kullan
    const pipelineData = stats?.opportunities.pipeline_trend || [];
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
          <XAxis 
            dataKey="close_date"
            tickFormatter={(date) => format(new Date(date), 'MMM d')}
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
          />
          <YAxis 
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
          />
          <Tooltip 
            labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
            formatter={(value: number, name: string) => {
              if (name === 'value') return [`$${value.toLocaleString()}`, 'Value'];
              if (name === 'deal_count') return [value, 'Deals'];
              return [value, name];
            }}
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
              border: theme === 'dark' ? '1px solid #374151' : '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend />
          <Bar 
            dataKey="value" 
            name="Pipeline Value"
            fill={theme === 'dark' ? '#34D399' : '#22C55E'}
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="deal_count" 
            name="Number of Deals"
            fill={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <PageContainer className="pb-10">
      {/* Dashboard Header */}
      <div className={cn("flex justify-between items-center mb-6 p-4 rounded-lg", themeColors['light'].gradient)}>
        <div>
          <h2 className={cn("text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent", themeColors['light'].textGradient)}>
            {greeting}, {user?.first_name || 'User'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening with your CRM today
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/leads')}>
            <UserPlus className="w-4 h-4 mr-1" />
            New Lead
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/deals')}>
            <DollarSign className="w-4 h-4 mr-1" />
            New Deal
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/tasks')}>
            <ClipboardList className="w-4 h-4 mr-1" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filtreleme seçeneklerini tamamen kaldırıyorum */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium">Dashboard Summary</h2>
          <p className="text-sm text-gray-500">Latest statistics and activities in your CRM</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-center text-lg">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Ana İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((card, index) => (
              <Card 
                key={index} 
                className={cn("hover:shadow-md transition-all cursor-pointer", 
                  themeColors['light'].cardBg, 
                  themeColors['light'].cardBorder
                )}
                onClick={card.onClick}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={cn("p-2 rounded-full", card.color)}>
                    <card.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={cn(
                      "inline-flex items-center",
                      card.change > 0 ? "text-green-500" : 
                      card.change < 0 ? "text-red-500" : 
                      "text-gray-500"
                    )}>
                      {card.change !== 0 && (
                        card.change > 0 ? 
                          <ArrowUp className="mr-1 h-3 w-3" /> : 
                          <ArrowDown className="mr-1 h-3 w-3" />
                      )}
                      {Math.abs(card.change)} {card.changeLabel}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Activities and Notifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Recent Activity Card */}
            <Card className={cn("hover:shadow-md transition-all", 
              themeColors['light'].cardBg, 
              themeColors['light'].cardBorder)}>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-4 p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => handleActivityClick(activity)}
                      >
                        <div className={cn("rounded-full p-2", getActivityIconBackground(activity.type))}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-3">
                        <Bell className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium">No recent activities</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Activities will appear here as you use the CRM
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notifications Card */}
            <Card className={cn("hover:shadow-md transition-all", 
              themeColors['light'].cardBg, 
              themeColors['light'].cardBorder)}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                {notifications.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {/* Mark all as read */}}
                  >
                    Mark all as read
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start space-x-4 p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                          <Bell className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-3">
                        <Bell className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium">No new notifications</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        You're all caught up!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lead ve Pipeline verilerini daha belirgin şekilde gösterme - Debug bilgisi */}
          {process.env.NODE_ENV === 'development' && stats && (
            <Card className="mb-6 p-4 bg-yellow-50 border border-yellow-200 hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs mb-2"><strong>API Response Values:</strong></p>
                <ul className="text-xs space-y-1">
                  <li><strong>Leads Total:</strong> {JSON.stringify(stats.leads?.total)}</li>
                  <li><strong>Leads New Today:</strong> {JSON.stringify(stats.leads?.new_today)}</li>
                  <li><strong>Tasks Open:</strong> {JSON.stringify(stats.tasks?.open)}</li>
                  <li><strong>Tasks Overdue:</strong> {JSON.stringify(stats.tasks?.overdue)}</li>
                  <li><strong>Opportunities Total:</strong> {JSON.stringify(stats.opportunities?.total)}</li>
                  <li><strong>Opportunities Won:</strong> {JSON.stringify(stats.opportunities?.won)}</li>
                  <li><strong>Pipeline Value:</strong> {JSON.stringify(stats.opportunities?.pipeline_value)}</li>
                  <li><strong>Meetings Upcoming:</strong> {JSON.stringify(stats.meetings?.upcoming)}</li>
                </ul>
                <p className="text-xs mt-2 text-red-500">If values show "undefined", there may be a data structure mismatch.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageContainer>
  );
}
