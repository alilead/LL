import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import api from '@/services/axios';
import { VITE_LINKEDIN_CLIENT_ID, VITE_LINKEDIN_REDIRECT_URI } from '@/config/env';

interface CommunicationPanelProps {
  leadId: number;
  leadLinkedIn?: string;
}

export const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  leadId,
  leadLinkedIn,
}) => {
  const [linkedInMessage, setLinkedInMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleLinkedInAuth = async () => {
    // Redirect to LinkedIn OAuth page
    const clientId = VITE_LINKEDIN_CLIENT_ID;
    const redirectUri = encodeURIComponent(VITE_LINKEDIN_REDIRECT_URI);
    const scope = encodeURIComponent('openid profile email w_member_social');
    
    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  const handleLinkedInMessage = async () => {
    if (!leadLinkedIn) {
      toast.error('No LinkedIn profile available for this lead');
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/communications/linkedin/message/${leadId}`, {
        message: linkedInMessage,
      });

      toast.success('LinkedIn message sent successfully');
      setLinkedInMessage('');
      queryClient.invalidateQueries({ queryKey: ['communications', leadId] });
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Need to authenticate with LinkedIn
        handleLinkedInAuth();
      } else {
        toast.error(error.response?.data?.detail || 'Failed to send LinkedIn message');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!leadLinkedIn) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">No LinkedIn profile available for this lead.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">LinkedIn Message</label>
          <textarea
            value={linkedInMessage}
            onChange={(e) => setLinkedInMessage(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter your LinkedIn message"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            onClick={handleLinkedInMessage}
            disabled={isLoading || !linkedInMessage}
            className="w-32"
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </div>
    </div>
  );
};
