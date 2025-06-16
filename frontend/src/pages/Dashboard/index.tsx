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
  Laptop,
  CreditCard,
  UserCheck,
  Target,
  Mail,
  Phone,
  FileText,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/axios';
import { useAuthStore } from '../../store/auth';
import { creditsAPI } from '../../services/api/credits';
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
import { leadsAPI, type LeadStats } from '@/services/leads';

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

  // Fetch credit balance
  const { data: creditBalance } = useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: creditsAPI.getBalance,
    retry: 1,
    refetchOnWindowFocus: false
  });

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', pastRange, futureRange],
    queryFn: () => api.get(`/dashboard/stats?past_range=${pastRange}&future_range=${futureRange}`)
      .then(res => {
        // API yanıtını tam olarak görelim
        console.log('Full API Response:', res);
        console.log('Dashboard API data:', res.data);
        
        // data.data içindeki gerçek verileri görelim
        const apiData = res.data.data || {};
        console.log('Extracted API data:', apiData);
        
        // Leads, tasks, deals gibi kritik alanları kontrol edelim
        console.log('Leads data:', apiData.leads);
        console.log('Tasks data:', apiData.tasks);
        console.log('Opportunities data:', apiData.opportunities);
        console.log('Meetings data:', apiData.meetings);
        
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
        
        return activities.map((item: any) => {
          console.log('Activity item:', item); // Debug log
          
          // Clean up the description to remove activity type prefixes
          let cleanDescription = item.description || '';
          cleanDescription = cleanDescription.replace(/^Activity type:\s*/i, '');
          cleanDescription = cleanDescription.replace(/^ActivityType\./i, '');
          
          return {
            id: item.id || String(Math.random()),
            title: item.title || getActivityTypeLabel(item.type || 'activity'),
            description: cleanDescription || getActivityTypeLabel(item.type || 'activity'),
            timestamp: item.created_at || new Date().toISOString(), // created_at API'den gelen alan adı
            type: item.type || 'other',
            entityId: item.entity_id || undefined
          };
        });
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Function to get user-friendly activity type label
  const getActivityTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return 'Email Sent';
      case 'call':
        return 'Phone Call';
      case 'meeting':
        return 'Meeting';
      case 'note':
        return 'Note Added';
      case 'stage_change':
        return 'Stage Changed';
      case 'task_created':
        return 'Task Created';
      case 'task_completed':
        return 'Task Completed';
      case 'lead':
        return 'Lead Activity';
      case 'deal':
        return 'Deal Activity';
      default:
        return 'Activity';
    }
  };

  // Function to get icon based on activity type - type için güvenlik ekleyelim
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type.toLowerCase()) {
      case 'lead':
        return <UserPlus className="h-4 w-4" />;
      case 'deal':
        return <DollarSign className="h-4 w-4" />;
      case 'task':
      case 'task_created':
      case 'task_completed':
        return <ClipboardList className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'stage_change':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Function to navigate to the relevant entity
  const handleActivityClick = (activity: ActivityItem) => {
    if (!activity.entityId) return;
    
    switch (activity.type.toLowerCase()) {
      case 'lead':
        navigate(`/leads/${activity.entityId}`);
        break;
      case 'deal':
        navigate(`/deals/${activity.entityId}`);
        break;
      case 'task':
      case 'task_created':
      case 'task_completed':
        navigate(`/tasks/${activity.entityId}`);
        break;
      case 'meeting':
        navigate(`/calendar?event=${activity.entityId}`);
        break;
      case 'email':
      case 'call':
      case 'note':
      case 'stage_change':
        // For these activity types, navigate to the related lead or deal
        if (activity.entityId.includes('lead_')) {
          navigate(`/leads/${activity.entityId.replace('lead_', '')}`);
        } else if (activity.entityId.includes('deal_')) {
          navigate(`/deals/${activity.entityId.replace('deal_', '')}`);
        }
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

  // Activity icon için background rengi belirleyen fonksiyon
  const getActivityIconBackground = (type: ActivityItem['type']) => {
    switch (type.toLowerCase()) {
      case 'lead':
        return 'bg-blue-100 text-blue-600';
      case 'deal':
        return 'bg-green-100 text-green-600';
      case 'task':
      case 'task_created':
      case 'task_completed':
        return 'bg-amber-100 text-amber-600';
      case 'meeting':
        return 'bg-purple-100 text-purple-600';
      case 'email':
        return 'bg-indigo-100 text-indigo-600';
      case 'call':
        return 'bg-emerald-100 text-emerald-600';
      case 'note':
        return 'bg-slate-100 text-slate-600';
      case 'stage_change':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Fetch lead statistics
  const { data: leadStatsData } = useQuery({
    queryKey: ['leadStats'],
    queryFn: leadsAPI.getLeadStats,
    refetchOnWindowFocus: false,
  });

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
      value: leadStatsData?.total || stats?.leads?.total || 0,
      change: stats?.leads?.new_last_30_days || 0,
      changeLabel: 'new leads',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600',
      onClick: () => navigate('/leads')
    },
    {
      title: 'Qualified Leads',
      value: leadStatsData?.qualified || 0,
      change: leadStatsData?.qualified || 0,
      changeLabel: `${leadStatsData?.qualification_rate || 0}% qualification rate`,
      icon: UserCheck,
      color: 'bg-green-500/10 text-green-600',
      onClick: () => navigate('/leads')
    },
    {
      title: 'Hot Prospects',
      value: leadStatsData?.hot_prospects || 0,
      change: leadStatsData?.total ? Math.round((leadStatsData.hot_prospects / leadStatsData.total) * 100) : 0,
      changeLabel: 'of total leads',
      icon: Target,
      color: 'bg-purple-500/10 text-purple-600',
      onClick: () => navigate('/leads')
    },
    {
      title: 'Pipeline Value',
      value: `$${(stats?.opportunities?.pipeline_value || 0).toLocaleString()}`,
      change: stats?.opportunities?.total || 0,
      changeLabel: 'total opportunities',
      icon: TrendingUp,
      color: 'bg-orange-500/10 text-orange-600',
      onClick: () => navigate('/deals')
    },
    {
      title: 'Open Tasks',
      value: stats?.tasks?.open || 0,
      change: -(stats?.tasks?.overdue || 0),
      changeLabel: 'overdue',
      icon: ClipboardList,
      color: 'bg-amber-500/10 text-amber-600',
      onClick: () => navigate('/tasks')
    },
    {
      title: 'Credits',
      value: creditBalance?.credit_balance?.toLocaleString() || '0',
      change: creditBalance?.subscription_status === 'trial' ? 500 : 0,
      changeLabel: creditBalance?.subscription_status === 'trial' ? 'trial credits' : 'available',
      icon: CreditCard,
      color: 'bg-yellow-500/10 text-yellow-600',
      onClick: () => navigate('/credits')
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
    console.log('Notification clicked:', notification);
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
      {/* Modern Dashboard Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {greeting}, {user?.first_name || 'User'}
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your CRM today
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button size="sm" variant="outline" onClick={() => navigate('/leads')} className="flex items-center gap-2 bg-white border border-gray-200">
              <UserPlus className="w-4 h-4" />
              New Lead
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/deals')} className="flex items-center gap-2 bg-white border border-gray-200">
              <DollarSign className="w-4 h-4" />
              New Deal
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/tasks')} className="flex items-center gap-2 bg-white border border-gray-200">
              <ClipboardList className="w-4 h-4" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-center text-lg text-gray-600">Loading dashboard data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Statistics Cards */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {statCards.map((card, index) => (
                                 <Card 
                   key={index} 
                   className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-white border border-gray-200"
                   onClick={card.onClick}
                 >
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
                    <div className={cn("p-3 rounded-xl", card.color)}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{card.value}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className={cn(
                        "inline-flex items-center font-medium",
                        card.change > 0 ? "text-green-600" : 
                        card.change < 0 ? "text-red-600" : 
                        "text-gray-500"
                      )}>
                        {card.change !== 0 && (
                          card.change > 0 ? 
                            <ArrowUp className="mr-1 h-4 w-4" /> : 
                            <ArrowDown className="mr-1 h-4 w-4" />
                        )}
                        {Math.abs(card.change)} {card.changeLabel}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Activities and Notifications Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                             {/* Recent Activity Card */}
               <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Latest Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group"
                          onClick={() => handleActivityClick(activity)}
                        >
                          <div className={cn("rounded-xl p-3 transition-all duration-200 group-hover:scale-110", getActivityIconBackground(activity.type))}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="space-y-1 flex-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{activity.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4">
                          <Bell className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-base font-medium text-gray-900 dark:text-white">No recent activities</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Activities will appear here as you use the CRM
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

                             {/* Notifications Card */}
               <Card className="bg-white border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                  {notifications.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => {/* Mark all as read */}}
                    >
                      Mark all as read
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 transition-all duration-200 group-hover:scale-110">
                            <Bell className="h-5 w-5" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{notification.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4">
                          <Bell className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-base font-medium text-gray-900 dark:text-white">No new notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          You're all caught up!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Debug Information - Development Only */}
          {process.env.NODE_ENV === 'development' && stats && (
            <Card className="border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs mb-3 font-medium text-amber-800 dark:text-amber-200">API Response Values:</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div><strong>Leads Total:</strong> {JSON.stringify(stats.leads?.total)}</div>
                    <div><strong>Leads New Today:</strong> {JSON.stringify(stats.leads?.new_today)}</div>
                    <div><strong>Tasks Open:</strong> {JSON.stringify(stats.tasks?.open)}</div>
                    <div><strong>Tasks Overdue:</strong> {JSON.stringify(stats.tasks?.overdue)}</div>
                  </div>
                  <div className="space-y-1">
                    <div><strong>Opportunities Total:</strong> {JSON.stringify(stats.opportunities?.total)}</div>
                    <div><strong>Opportunities Won:</strong> {JSON.stringify(stats.opportunities?.won)}</div>
                    <div><strong>Pipeline Value:</strong> {JSON.stringify(stats.opportunities?.pipeline_value)}</div>
                    <div><strong>Meetings Upcoming:</strong> {JSON.stringify(stats.meetings?.upcoming)}</div>
                  </div>
                </div>
                <p className="text-xs mt-3 text-amber-700 dark:text-amber-300">If values show "undefined", there may be a data structure mismatch.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}
