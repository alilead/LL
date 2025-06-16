import { Link, useNavigate } from 'react-router-dom';
import { Users, UserCircle, LogOut, Mail, Phone, Smartphone, Linkedin, Lock, Brain, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store';
import '../styles/beta-badge.css';

interface Credits {
  email: number;
  telephone: number;
  mobile: number;
  linkedin: number;
  unique_lead: number;
  ai_credits: number;
}

export function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const credits: Credits = user?.credits || {
    email: 0,
    telephone: 0,
    mobile: 0,
    linkedin: 0,
    unique_lead: 0,
    ai_credits: 0
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/signin');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="w-full max-w-[2000px] mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <Users className="h-14 w-14 text-indigo-600" />
              <span className="text-4xl font-bold text-gray-900">LeadLab</span>
              <span className="beta-badge">Beta</span>
            </Link>
            
            {user && (
              <div className="flex space-x-4">
                <Link
                  to="/leads"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Leads
                </Link>
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/tasks"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Tasks
                </Link>
                <Link
                  to="/deals"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Deals
                </Link>
                {user.is_superuser && (
                  <Link
                    to="/admin"
                    className="text-red-600 hover:text-red-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin Page
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-gray-600" title="Email Credits">
                    <Mail className="h-4 w-4" />
                    <span className="text-xs font-medium">{credits.email}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600" title="Phone Credits">
                    <Phone className="h-4 w-4" />
                    <span className="text-xs font-medium">{credits.telephone}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600" title="Mobile Credits">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-xs font-medium">{credits.mobile}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600" title="LinkedIn Credits">
                    <Linkedin className="h-4 w-4" />
                    <span className="text-xs font-medium">{credits.linkedin}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600" title="Unique Lead Credits">
                    <Lock className="h-4 w-4" />
                    <span className="text-xs font-medium">{credits.unique_lead}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600" title="AI Credits">
                    <Brain className="h-4 w-4" />
                    <span className="text-xs font-medium">{credits.ai_credits}</span>
                  </div>
                </div>

                <div className="h-6 w-px bg-gray-200" /> {/* Ayırıcı */}

                <Link
                  to="/profile"
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <UserCircle className="h-5 w-5" />
                  <span>{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/signin"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
