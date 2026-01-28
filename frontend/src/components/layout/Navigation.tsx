import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { 
  Home, 
  Users, 
  UserCircle, 
  Menu,
  X,
  LogOut,
  Settings,
  Info,
  Building2
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, protected: true },
  { name: 'Leads', href: '/leads', icon: Users, protected: true },
  { name: 'Profile', href: '/profile', icon: UserCircle, protected: true },
  { name: 'Organization', href: '/organization', icon: Building2, protected: true },
  { name: 'Admin', href: '/admin', icon: Settings, protected: true, adminOnly: true }
];

export function Navigation() {
  const { pathname } = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const visibleNavigation = navigation.filter(item => 
    (!item.protected || (item.protected && isAuthenticated)) &&
    (!item.adminOnly || (item.adminOnly && user?.is_admin))
  );

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="px-4 mx-auto max-w-[1400px]">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src="/images/leadlab-logo.png" 
                alt="LeadLab Logo" 
                className="h-8 w-auto"
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              {visibleNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {visibleNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors',
                      pathname === item.href
                        ? 'border-blue-500 text-blue-700 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                >
                  <div className="flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
      <div className="h-16" /> {/* Spacer for fixed navbar */}
    </>
  );
}
