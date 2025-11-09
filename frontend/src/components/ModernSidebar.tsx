/**
 * Modern Sidebar Navigation
 * Clean, intuitive, professional
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  LayoutDashboard,
  Users,
  Mail,
  Calendar,
  Target,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Search,
  LogOut,
  User,
  Building2,
  Workflow,
  MessageSquare,
  FileText,
  Database,
  CheckSquare,
  Sparkles,
  Coins,
  Map,
  ShoppingCart,
  TrendingUp,
  Phone
} from 'lucide-react';

interface NavItem {
  name: string;
  icon: any;
  path: string;
  badge?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    name: 'Leads',
    icon: Users,
    path: '/leads',
    badge: '12',
  },
  {
    name: 'Deals',
    icon: Target,
    path: '/deals',
  },
  {
    name: 'Tasks',
    icon: CheckSquare,
    path: '/tasks',
  },
  {
    name: 'Email',
    icon: Mail,
    path: '/emails',
    children: [
      { name: 'Inbox', icon: Mail, path: '/emails' },
      { name: 'Sequences', icon: Zap, path: '/email-sequences' },
    ],
  },
  {
    name: 'Messages',
    icon: MessageSquare,
    path: '/messages',
  },
  {
    name: 'Calendar',
    icon: Calendar,
    path: '/calendar',
  },
  {
    name: 'Sales',
    icon: ShoppingCart,
    path: '/cpq/quotes', // Fixed: now points to actual route
    children: [
      { name: 'Quotes', icon: FileText, path: '/cpq/quotes' },
      { name: 'Products', icon: ShoppingCart, path: '/cpq/products' },
    ],
  },
  {
    name: 'Workflows',
    icon: Workflow,
    path: '/workflows',
  },
  {
    name: 'Forecasting',
    icon: TrendingUp,
    path: '/forecasting',
  },
  {
    name: 'Conversations',
    icon: Phone,
    path: '/conversations',
  },
  {
    name: 'Reports',
    icon: BarChart3,
    path: '/reports',
  },
  {
    name: 'AI Insights',
    icon: Sparkles,
    path: '/ai-insights',
  },
  {
    name: 'Organization',
    icon: Building2,
    path: '/organization',
    children: [
      { name: 'Settings', icon: Building2, path: '/organization' },
      { name: 'Territories', icon: Map, path: '/territories' },
    ],
  },
  {
    name: 'Data',
    icon: Database,
    path: '/data-import/wizard', // Fixed: now points to actual route
    children: [
      { name: 'Import Wizard', icon: Database, path: '/data-import/wizard' },
      { name: 'Import History', icon: Database, path: '/data-import/history' },
    ],
  },
];

const bottomNavigation: NavItem[] = [
  {
    name: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

export function ModernSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const { user } = useAuthStore();

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-neutral-900 dark:text-neutral-50">
              LeadLab
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          )}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Quick search..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isExpanded = expandedItems.includes(item.name);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.name}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                      active
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    )}
                  </button>
                  {isExpanded && !collapsed && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.path);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                              childActive
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <ChildIcon className="w-4 h-4" />
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 space-y-1 border-t border-neutral-200 dark:border-neutral-800">
        {bottomNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                active
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      {!collapsed && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email || 'User'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {user?.email || ''}
              </p>
            </div>
            <LogOut className="w-4 h-4 text-neutral-400" />
          </div>
        </div>
      )}
    </div>
  );
}
