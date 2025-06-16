import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import logo from '../../assets/leadlab-logo.png';
import { Button } from '../ui';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Calendar,
  ClipboardList,
  BarChart2,
  DollarSign,
  Settings,
  LogOut,
  Shield,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/signin');
  };

  const isAdmin = Boolean(user?.is_admin);

  const menuItems = [
    { name: 'Admin', icon: Shield, path: '/admin', show: isAdmin },
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', show: true },
    { name: 'Leads', icon: Users, path: '/leads', show: true },
    { name: 'Tasks', icon: ClipboardList, path: '/tasks', show: true },
    { name: 'Calendar', icon: Calendar, path: '/calendar', show: true },
    { name: 'Deals', icon: DollarSign, path: '/deals', show: true },
    { name: 'Profile', icon: UserCircle, path: '/profile', show: true },
    { name: 'Settings', icon: Settings, path: '/settings', show: isAdmin },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/dashboard" 
            className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity"
          >
            <img className="h-12 w-auto" src={logo} alt="Logo" />
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {menuItems
              .filter(item => item.show)
              .map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                      isActive
                        ? 'text-indigo-600 bg-indigo-50/80'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                    )}
                  >
                    <Icon className="h-5 w-5 mr-1.5" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          {/* User Menu & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden md:flex items-center text-gray-700 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn(
        "lg:hidden border-t border-gray-200 transition-all duration-200 ease-in-out",
        isMobileMenuOpen ? "max-h-96" : "max-h-0 overflow-hidden"
      )}>
        <div className="grid grid-cols-4 gap-y-2 px-2 py-3">
          {menuItems
            .filter(item => item.show)
            .map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center px-2 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200',
                    isActive
                      ? 'text-indigo-600 bg-indigo-50/80'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                  )}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  {item.name}
                </Link>
              );
            })}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="md:hidden col-span-4 mt-2 w-full justify-center text-gray-700 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
        </div>
      </div>
    </header>
  );
}
