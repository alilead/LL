import React from 'react';
import { AlertCircle, XCircle, WifiOff, UserX, ServerCrash, Search, HelpCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
  errorType?: 'network' | 'auth' | 'notFound' | 'server' | 'unknown';
  details?: string;
}

export function ErrorScreen({ message, onRetry, errorType = 'unknown', details }: ErrorScreenProps) {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (errorType) {
      case 'network':
        return <WifiOff data-testid="error-icon" className="w-20 h-20 text-orange-500 mx-auto mb-4" aria-hidden="true" />;
      case 'auth':
        return <UserX data-testid="error-icon" className="w-20 h-20 text-yellow-500 mx-auto mb-4" aria-hidden="true" />;
      case 'notFound':
        return <XCircle data-testid="error-icon" className="w-20 h-20 text-blue-500 mx-auto mb-4" aria-hidden="true" />;
      case 'server':
        return <ServerCrash data-testid="error-icon" className="w-20 h-20 text-red-500 mx-auto mb-4" aria-hidden="true" />;
      default:
        return <AlertCircle data-testid="error-icon" className="w-20 h-20 text-gray-500 mx-auto mb-4" aria-hidden="true" />;
    }
  };

  return (
    <div role="alert" aria-live="polite" className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm p-8">
      <div className="text-center max-w-lg">
        {getIcon()}
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">{message}</h2>
        {details && (
          <p className="text-gray-600 mb-8 text-lg">{details}</p>
        )}
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
              >
                <AlertCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                Try Again
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </button>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => navigate('/leads/search')}
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Search className="w-4 h-4 mr-2" aria-hidden="true" />
              Search New Leads
            </button>
            <button
              onClick={() => navigate('/help')}
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <HelpCircle className="w-4 h-4 mr-2" aria-hidden="true" />
              Get Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
