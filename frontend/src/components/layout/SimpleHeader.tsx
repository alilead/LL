import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import logo from '../../assets/leadlab-logo.png';

export function SimpleHeader() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 mx-auto">
        <div className="flex h-16 items-center justify-between">
          <img className="h-12 w-auto" src={logo} alt="Logo" />
          <button
            onClick={handleSignOut}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium rounded-md transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
