import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Switch } from './ui/switch';
import { Label } from './ui/Label';
import { 
  Calendar, 
  ExternalLink, 
  Settings, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import { calendlyService, CalendlyUser, CalendlyEventType } from '../services/calendly';
import { toast } from 'react-hot-toast';
import { VITE_CALENDLY_CLIENT_ID, isCalendlyConfigured } from '@/config/env';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CalendlyIntegrationProps {
  onEventsToggle: (show: boolean) => void;
  showEvents: boolean;
}

export const CalendlyIntegration: React.FC<CalendlyIntegrationProps> = ({
  onEventsToggle,
  showEvents
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  // Check Calendly connection status
  const { data: isConnected, isLoading: checkingConnection } = useQuery({
    queryKey: ['calendly-connection'],
    queryFn: () => calendlyService.checkConnection(),
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Get Calendly user info
  const { data: calendlyUser, isLoading: loadingUser } = useQuery({
    queryKey: ['calendly-user'],
    queryFn: () => calendlyService.getCurrentUser(),
    enabled: !!isConnected,
  });

  // Get Calendly event types
  const { data: eventTypes = [], isLoading: loadingEventTypes } = useQuery({
    queryKey: ['calendly-event-types'],
    queryFn: () => calendlyService.getEventTypes(),
    enabled: !!isConnected,
  });

  // Connect to Calendly
  const connectMutation = useMutation({
    mutationFn: async () => {
      const redirectUri = `${window.location.origin}/calendar/calendly-callback`;
      
      if (!isCalendlyConfigured) {
        throw new Error('Calendly Client ID not configured. Please contact your administrator.');
      }
      
      const authUrl = calendlyService.getAuthUrl(VITE_CALENDLY_CLIENT_ID!, redirectUri);
      window.location.href = authUrl;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to connect to Calendly');
      setIsConnecting(false);
    }
  });

  // Disconnect from Calendly
  const disconnectMutation = useMutation({
    mutationFn: () => calendlyService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendly-connection'] });
      queryClient.invalidateQueries({ queryKey: ['calendly-user'] });
      queryClient.invalidateQueries({ queryKey: ['calendly-event-types'] });
      toast.success('Calendly account disconnected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disconnect from Calendly');
    }
  });

  const handleConnect = () => {
    setIsConnecting(true);
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect your Calendly account?')) {
      disconnectMutation.mutate();
    }
  };

  // Don't show component if Calendly is not configured
  if (!isCalendlyConfigured) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Calendly Integration Unavailable</h3>
            <p className="text-sm text-gray-600">
              Calendly integration is not configured. Please contact your administrator to set up this feature.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (checkingConnection) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Checking Calendly connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendly Integration
          {isConnected ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              <XCircle className="h-3 w-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Connect Your Calendly Account</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Connect your Calendly account to see your scheduled meetings alongside your LeadLab events.
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect Calendly Account
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Info */}
            {loadingUser ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Loading user info...</span>
              </div>
            ) : calendlyUser ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">{calendlyUser.name}</h4>
                    <p className="text-sm text-green-700">{calendlyUser.email}</p>
                    <p className="text-xs text-green-600">Timezone: {calendlyUser.timezone}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(calendlyUser.scheduling_url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Profile
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Event Types */}
            {loadingEventTypes ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Loading event types...</span>
              </div>
            ) : eventTypes.length > 0 ? (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Your Calendly Event Types:</h5>
                <div className="space-y-2">
                  {eventTypes.map((eventType) => (
                    <div key={eventType.uri} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h6 className="font-medium text-gray-900">{eventType.name}</h6>
                        <p className="text-sm text-gray-600">{eventType.duration} minutes</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={eventType.active ? "default" : "secondary"}>
                          {eventType.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(eventType.scheduling_url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Book
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Settings */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show-calendly-events">Show Calendly Events</Label>
                  <p className="text-sm text-gray-600">
                    Display your Calendly scheduled meetings in the calendar
                  </p>
                </div>
                <Switch
                  id="show-calendly-events"
                  checked={showEvents}
                  onCheckedChange={onEventsToggle}
                />
              </div>
            </div>

            {/* Disconnect */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="w-full"
              >
                {disconnectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Disconnect Calendly Account
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 