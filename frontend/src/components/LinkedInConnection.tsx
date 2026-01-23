import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../services/axios';
import toast from 'react-hot-toast';

interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  profilePicture?: string;
  publicProfileUrl: string;
  connectedAt: string;
}

interface LinkedInResponse {
  connected: boolean;
  profile?: LinkedInProfile;
  message?: string;
}

interface LinkedInConnectionProps {
  className?: string;
}

export function LinkedInConnection({ className = '' }: LinkedInConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  // Check LinkedIn connection status
  const { data: linkedInResponse, refetch: refetchProfile } = useQuery<LinkedInResponse>({
    queryKey: ['linkedin-profile'],
    queryFn: () => api.get('/auth/linkedin/profile').then(res => res.data),
    retry: false,
  });

  // Disconnect LinkedIn mutation
  const disconnectMutation = useMutation({
    mutationFn: () => api.delete('/auth/linkedin/disconnect'),
    onSuccess: () => {
      toast.success('LinkedIn account disconnected successfully');
      refetchProfile();
    },
    onError: (error) => {
      toast.error('Failed to disconnect LinkedIn account');
      console.error('LinkedIn disconnect error:', error);
    },
  });

  // Handle LinkedIn OAuth
  const handleLinkedInConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Get the LinkedIn OAuth URL from backend
      const response = await api.get('/auth/linkedin/authorize');
      
      // If backend returns a redirect URL, use it
      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      } else {
        // Fallback to direct redirect
        window.location.href = `/api/v1/auth/linkedin/authorize`;
      }
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      toast.error('Failed to start LinkedIn connection');
      setIsConnecting(false);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      toast.error('LinkedIn connection failed');
      setIsConnecting(false);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && state) {
      // Exchange code for tokens
      api.post('/auth/linkedin/callback', { code, state })
        .then(() => {
          toast.success('LinkedIn connected successfully!');
          refetchProfile();
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((error) => {
          toast.error('Failed to connect LinkedIn account');
          console.error('LinkedIn callback error:', error);
        })
        .finally(() => {
          setIsConnecting(false);
        });
    }
  }, [refetchProfile]);

  const isConnected = linkedInResponse?.connected;
  const linkedInProfile = linkedInResponse?.profile;

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden mb-8 ${className}`}>
      <div className="p-6 border-b border-gray-200 bg-blue-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn Connection
        </h3>
      </div>
      <div className="p-6">
        {isConnected && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-4">
            Connected
          </span>
        )}

        {isConnected && linkedInProfile ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {linkedInProfile.profilePicture && (
                <img
                  src={linkedInProfile.profilePicture}
                  alt="LinkedIn Profile"
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {linkedInProfile.firstName} {linkedInProfile.lastName}
                </h4>
                <p className="text-sm text-gray-500">{linkedInProfile.headline}</p>
                <p className="text-xs text-gray-400">
                  Connected on {new Date(linkedInProfile.connectedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <a
                href={linkedInProfile.publicProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Profile
              </a>
              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex">
                <svg className="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium">LinkedIn Integration Active</p>
                  <p>Your LinkedIn profile data will be used to enhance lead personality analysis and provide more accurate insights.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No LinkedIn Connection</h3>
              <p className="mt-1 text-sm text-gray-500">
                Connect your LinkedIn account to enhance AI insights and personality analysis.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Benefits of LinkedIn Connection:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Enhanced personality analysis for leads</li>
                    <li>More accurate DISC profiling</li>
                    <li>Better lead scoring and insights</li>
                    <li>Automatic profile enrichment</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLinkedInConnect}
                disabled={isConnecting}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                {isConnecting ? 'Connecting...' : 'Connect LinkedIn Account'}
              </button>
              
              {/* Mock Test Button for Development */}
              <button
                onClick={() => {
                  api.post('/auth/linkedin/mock-connect')
                    .then(() => {
                      toast.success('Mock LinkedIn connected successfully!');
                      refetchProfile();
                    })
                    .catch((error) => {
                      toast.error('Failed to create mock LinkedIn connection');
                      console.error('Mock LinkedIn error:', error);
                    });
                }}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Test with Mock Data
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By connecting your LinkedIn account, you agree to our privacy policy and terms of service.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 