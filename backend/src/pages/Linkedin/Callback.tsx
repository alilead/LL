import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { linkedinAPI } from '@/services/linkedin';
import { toast } from 'react-hot-toast';

export function LinkedInCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for errors
        if (error || errorDescription) {
          console.error('LinkedIn OAuth error:', error, errorDescription);
          toast.error(errorDescription || 'LinkedIn authentication failed');
          navigate('/profile');
          return;
        }

        // Validate state
        const savedState = localStorage.getItem('linkedin_state');
        if (!state || state !== savedState) {
          console.error('Invalid state parameter');
          toast.error('Invalid authentication state');
          navigate('/profile');
          return;
        }

        // Clear saved state
        localStorage.removeItem('linkedin_state');

        if (!code) {
          console.error('No code parameter in URL');
          toast.error('Authentication code missing');
          navigate('/profile');
          return;
        }

        // Exchange code for token
        const response = await linkedinAPI.setCredentials(code);
        toast.success('LinkedIn connected successfully');

        // Redirect to profile page
        navigate('/profile');
      } catch (error: any) {
        console.error('LinkedIn callback error:', error);
        toast.error('Failed to connect LinkedIn account');
        navigate('/profile');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Connecting to LinkedIn...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
} 