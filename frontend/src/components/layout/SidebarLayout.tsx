import { ReactNode, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { 
  Home, 
  Users, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  MessageSquare,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Menu,
  X,
  Zap,
  Target,
  PieChart,
  CreditCard,
  UserPlus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from '../../hooks/useMediaQuery'

interface SidebarLayoutProps {
  children: ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuthStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 1024px)')

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home,
      description: 'Overview & Analytics'
    },
    { 
      name: 'Leads', 
      href: '/leads', 
      icon: Users,
      description: 'Manage your leads'
    },
    { 
      name: 'Deals', 
      href: '/deals', 
      icon: Target,
      description: 'Sales pipeline'
    },
    { 
      name: 'Calendar', 
      href: '/calendar', 
      icon: Calendar,
      description: 'Schedule & Events'
    },
    { 
      name: 'Tasks', 
      href: '/tasks', 
      icon: CheckSquare,
      description: 'To-do & Follow-ups'
    },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: MessageSquare,
      description: 'Communications'
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: BarChart3,
      description: 'Analytics & Insights'
    },
    { 
      name: 'AI Insights', 
      href: '/ai-insights', 
      icon: Zap,
      description: 'Smart Analytics',
      badge: 'New'
    },
    { 
      name: 'Credits', 
      href: '/credits', 
      icon: CreditCard,
      description: 'Manage Credits',
      badge: 'Pro'
    },
  ]

  const organizationItems = [
    { 
      name: 'Team', 
      href: '/team', 
      icon: UserPlus,
      description: 'Manage team members'
    },
  ]

  const bottomNavigationItems = [
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: Settings,
      description: 'Preferences'
    },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo & Collapse Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <Link 
          to="/dashboard" 
          className={`flex items-center transition-all duration-200 ${
            isCollapsed ? 'justify-center' : 'space-x-3'
          }`}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">LL</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 dark:text-white">LeadLab</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">CRM Platform</span>
            </div>
          )}
        </Link>
        
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                onClick={() => isMobile && setIsMobileSidebarOpen(false)}
              >
                <Icon className={`flex-shrink-0 w-5 h-5 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Organization Section */}
        {!isCollapsed && (
          <div className="px-3 mt-6">
            <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Organization
            </h3>
          </div>
        )}
        
        <nav className="px-3 mt-2 space-y-1">
          {organizationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                onClick={() => isMobile && setIsMobileSidebarOpen(false)}
              >
                <Icon className={`flex-shrink-0 w-5 h-5 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                
                {!isCollapsed && (
                  <span className="ml-3 flex-1">{item.name}</span>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <nav className="space-y-1">
          {bottomNavigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                onClick={() => isMobile && setIsMobileSidebarOpen(false)}
              >
                <Icon className={`flex-shrink-0 w-5 h-5 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="mt-4 relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-full flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 ${
              isCollapsed ? 'justify-center' : 'space-x-3'
            }`}
          >
            <img
              src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3e%3ccircle cx='16' cy='16' r='16' fill='%236366F1'/%3e%3ccircle cx='16' cy='12' r='5' fill='white'/%3e%3cpath d='M6.5 26.5c0-5.5 4.5-10 10-10s10 4.5 10 10' fill='white'/%3e%3c/svg%3e"
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">{user?.first_name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                </div>
                <LogOut className="w-4 h-4 text-gray-400" />
              </>
            )}
          </button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`absolute ${isCollapsed ? 'left-full ml-2 bottom-0' : 'left-0 bottom-full mb-2'} w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50`}
              >
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          animate={{ width: isCollapsed ? 80 : 280 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0"
        >
          <SidebarContent />
        </motion.aside>
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-blue-600 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
} 