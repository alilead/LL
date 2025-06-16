// Takvim sayfası
import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, formatInTimeZone } from 'date-fns-tz';
import { parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { enUS } from 'date-fns/locale/en-US';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Calendar, Plus, Globe, Clock, MapPin, CalendarDays, CheckCircle2, Calendar as CalendarIcon, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import eventsAPI from '../../services/api/events';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '../../store/auth';
import EventDetailModal from './EventDetailModal';
import { Event, EventCreateInput } from '../../services/api/events';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';

const locales = {
  'tr': tr,
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  description: string | null;
  location: string | null;
  event_type: string;
  is_all_day: boolean;
  allDay: boolean;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  organization_id: number;
  user_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  timezone: string;
}

const eventTypes = [
  { value: 'meeting', label: 'Meeting', color: '#3b82f6', bg: 'bg-blue-50', textColor: 'text-blue-600' },
  { value: 'task', label: 'Task', color: '#10b981', bg: 'bg-emerald-50', textColor: 'text-emerald-600' },
  { value: 'reminder', label: 'Reminder', color: '#f59e0b', bg: 'bg-amber-50', textColor: 'text-amber-600' }
];

const TIMEZONE_OPTIONS = [
  { value: 'Pacific/Wake', label: 'UTC-12 (Baker Island)' },
  { value: 'Pacific/Midway', label: 'UTC-11 (Samoa, Midway)' },
  { value: 'Pacific/Honolulu', label: 'UTC-10 (Hawaii, Tahiti)' },
  { value: 'America/Anchorage', label: 'UTC-9 (Anchorage, Juneau)' },
  { value: 'America/Los_Angeles', label: 'UTC-8 (Los Angeles, Vancouver, Tijuana)' },
  { value: 'America/Denver', label: 'UTC-7 (Denver, Phoenix, Calgary)' },
  { value: 'America/Chicago', label: 'UTC-6 (Chicago, Mexico City, Winnipeg)' },
  { value: 'America/New_York', label: 'UTC-5 (New York, Toronto, Miami)' },
  { value: 'America/Halifax', label: 'UTC-4 (Halifax, Santiago, Manaus)' },
  { value: 'America/Sao_Paulo', label: 'UTC-3 (São Paulo, Buenos Aires, Montevideo)' },
  { value: 'America/Noronha', label: 'UTC-2 (Fernando de Noronha)' },
  { value: 'Atlantic/Azores', label: 'UTC-1 (Azores, Cape Verde)' },
  { value: 'Europe/London', label: 'UTC+0 (London, Dublin, Lisbon)' },
  { value: 'Europe/Paris', label: 'UTC+1 (Paris, Berlin, Rome)' },
  { value: 'Europe/Cairo', label: 'UTC+2 (Cairo, Athens, Bucharest)' },
  { value: 'Europe/Istanbul', label: 'UTC+3 (Istanbul, Moscow, Riyadh)' },
  { value: 'Asia/Dubai', label: 'UTC+4 (Dubai, Baku, Tbilisi)' },
  { value: 'Asia/Karachi', label: 'UTC+5 (Karachi, Tashkent, Maldives)' },
  { value: 'Asia/Dhaka', label: 'UTC+6 (Dhaka, Almaty, Novosibirsk)' },
  { value: 'Asia/Bangkok', label: 'UTC+7 (Bangkok, Jakarta, Hanoi)' },
  { value: 'Asia/Singapore', label: 'UTC+8 (Singapore, Hong Kong, Beijing)' },
  { value: 'Asia/Tokyo', label: 'UTC+9 (Tokyo, Seoul, Pyongyang)' },
  { value: 'Australia/Sydney', label: 'UTC+10 (Sydney, Melbourne, Brisbane)' },
  { value: 'Pacific/Noumea', label: 'UTC+11 (Noumea, Solomon Islands)' },
  { value: 'Pacific/Auckland', label: 'UTC+12 (Auckland, Fiji, Marshall Islands)' },
  { value: 'Pacific/Apia', label: 'UTC+13 (Samoa, Tonga)' },
  { value: 'Pacific/Kiritimati', label: 'UTC+14 (Kiritimati)' }
];

const getSystemTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error detecting system timezone:', error);
    return 'UTC';  // Fallback to UTC if detection fails
  }
};

const query = async ({ start, end }: { start: Date; end: Date }): Promise<CalendarEvent[]> => {
  try {
    
    // Convert dates to UTC ISO strings
    const startUTC = start.toISOString();
    const endUTC = end.toISOString();
    
    const events = await eventsAPI.list({
      start_date: startUTC,
      end_date: endUTC
    });
    
    if (!Array.isArray(events.items)) {
      console.warn('Invalid response format:', events);
      return [];
    }
    
    // Convert UTC dates back to local timezone for display
    return events.items.map((event): CalendarEvent => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_date),
      end: new Date(event.end_date),
      description: event.description,
      location: event.location,
      event_type: event.event_type,
      is_all_day: event.is_all_day,
      allDay: event.is_all_day,
      status: event.status,
      organization_id: event.organization_id,
      user_id: event.user_id,
      created_by: event.created_by,
      created_at: event.created_at,
      updated_at: event.updated_at,
      timezone: event.timezone
    }));
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const CalendarPage = () => {
  const { user } = useAuthStore();
  const [isNewEventDialogOpen, setNewEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    const savedTimezone = localStorage.getItem('calendar_timezone');
    return savedTimezone || getSystemTimezone();
  });
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_time: format(new Date(new Date().getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    event_type: 'meeting',
    organization_id: user?.organization_id,
    user_id: user?.id,
    is_all_day: false,
    location: ''
  });
  const navigate = useNavigate();
  const [timezones, setTimezones] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };
  });

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['events', selectedTimezone, dateRange],
    queryFn: async () => {
      try {
        const response = await eventsAPI.list({
          start_date: formatInTimeZone(dateRange.start, selectedTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
          end_date: formatInTimeZone(dateRange.end, selectedTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
          timezone: selectedTimezone
        });
        
        
        if (!response.items || !Array.isArray(response.items)) {
          console.error('Invalid response format:', response);
          return [];
        }
        
        return response.items.map((event) => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start_date),
          end: new Date(event.end_date),
          description: event.description,
          location: event.location,
          event_type: event.event_type,
          is_all_day: event.is_all_day,
          allDay: event.is_all_day,
          status: event.status,
          organization_id: event.organization_id,
          user_id: event.user_id,
          created_by: event.created_by,
          created_at: event.created_at,
          updated_at: event.updated_at,
          timezone: event.timezone
        }));
      } catch (error) {
        console.error('Error fetching events:', error);
        return [];
      }
    },
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    const fetchTimezones = async () => {
      try {
        const response = await eventsAPI.getTimezones();
        setTimezones(response.timezones);
        
        // Automatically select system timezone if available
        const systemTz = getSystemTimezone();
        if (response.timezones.includes(systemTz)) {
          setSelectedTimezone(systemTz);
        }
      } catch (error) {
        console.error('Error fetching timezones:', error);
        toast({
          title: "Error",
          description: "Failed to load timezone information",
          variant: "destructive"
        });
      }
    };

    fetchTimezones();
  }, []);

  // Save selected timezone to localStorage
  useEffect(() => {
    localStorage.setItem('calendar_timezone', selectedTimezone);
  }, [selectedTimezone]);

  // Reset the form when the dialog is opened or closed
  useEffect(() => {
    if (!isNewEventDialogOpen) {
      // Reset the form after it's closed
      setTimeout(() => {
        setNewEvent({
          title: '',
          description: '',
          start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          end_time: format(new Date(new Date().getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
          event_type: 'meeting',
          organization_id: user?.organization_id,
          user_id: user?.id,
          is_all_day: false,
          location: ''
        });
      }, 300); // Short delay to ensure the dialog is fully closed
    }
  }, [isNewEventDialogOpen, user]);

  const handleRangeChange = (range: any) => {
    if (Array.isArray(range)) {
      setDateRange({
        start: range[0],
        end: range[range.length - 1]
      });
    } else {
      setDateRange({
        start: range.start,
        end: range.end
      });
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setNewEvent({
      ...newEvent,
      start_time: format(start, "yyyy-MM-dd'T'HH:mm"),
      end_time: format(end, "yyyy-MM-dd'T'HH:mm")
    });
    setNewEventDialogOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDetailModalOpen(true);
  };

  const handleEditEvent = async (updatedEvent: CalendarEvent) => {
    try {

      const formattedEvent = {
        title: updatedEvent.title,
        description: updatedEvent.description,
        start_date: formatInTimeZone(updatedEvent.start, selectedTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        end_date: formatInTimeZone(updatedEvent.end, selectedTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        location: updatedEvent.location,
        event_type: updatedEvent.event_type,
        is_all_day: updatedEvent.is_all_day,
        status: updatedEvent.status,
        timezone: selectedTimezone,
        user_id: updatedEvent.user_id,
        organization_id: updatedEvent.organization_id
      };

      await eventsAPI.update(updatedEvent.id, formattedEvent);
      
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      setDetailModalOpen(false);
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEvent = (eventId: number) => {
    if (!selectedEvent) return;
    
    eventsAPI.remove(eventId)
      .then(() => {
        if (selectedEvent) {
          query({ start: selectedEvent.start, end: selectedEvent.end });
        }
        setDetailModalOpen(false);
        toast({
          title: "Success",
          description: "Event deleted successfully",
        });
      })
      .catch((error) => {
        console.error('Error deleting event:', error);
        toast({
          title: "Error",
          description: "Failed to delete event",
          variant: "destructive"
        });
      });
  };

  const handleCreateEvent = (formattedEvent: EventCreateInput) => {
    
    // Check for user info
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "User information is missing. Please log in again.",
        variant: "destructive"
      });
      return;
    }
    
    // Ensure we have all required fields, explicitly setting created_by
    const cleanData = { 
      title: formattedEvent.title,
      description: formattedEvent.description || '',
      start_date: formattedEvent.start_date,
      end_date: formattedEvent.end_date,
      event_type: formattedEvent.event_type,
      location: formattedEvent.location || '',
      is_all_day: formattedEvent.is_all_day,
      organization_id: user.organization_id || 0,
      timezone: formattedEvent.timezone || selectedTimezone,
      status: formattedEvent.status || 'scheduled' as const,
      created_by: user.id
    };
    
    
    eventsAPI.create(cleanData)
      .then((createdEvent) => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        setNewEventDialogOpen(false);
        
        // Reset form state with a delay to ensure the modal is closed first
        setTimeout(() => {
          setNewEvent({
            title: '',
            description: '',
            start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            end_time: format(new Date(new Date().getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
            event_type: 'meeting',
            organization_id: user?.organization_id,
            user_id: user?.id,
            is_all_day: false,
            location: ''
          });
        }, 300);
        
        toast({
          title: "Success",
          description: "Event created successfully",
        });
      })
      .catch((error) => {
        console.error('Error creating event:', error);
        console.error('Request payload that caused error:', cleanData);
        
        // Enhanced error handling
        let errorMessage = "Failed to create event";
        
        if (error.message === 'Network Error') {
          errorMessage = "Network error - CORS issue or server not responding";
          console.error('Possible CORS issue - check server configuration');
        } else if (error.response) {
          // Server responded with error
          console.error('Server error response:', error.response.data);
          errorMessage = error.response.data?.detail || `Server error: ${error.response.status}`;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      });
  };

  const handleCreateNewEvent = () => {
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "User information is missing. Please log in again.",
        variant: "destructive"
      });
      return;
    }
    
    
    const formattedEvent = {
        title: newEvent.title,
        description: newEvent.description,
        start_date: formatInTimeZone(new Date(newEvent.start_time), selectedTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        end_date: formatInTimeZone(new Date(newEvent.end_time), selectedTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        event_type: newEvent.event_type,
        location: newEvent.location || '',
        is_all_day: newEvent.is_all_day,
        organization_id: user.organization_id || 0,
        timezone: selectedTimezone,
        status: 'scheduled' as const,
        created_by: user.id,
        user_id: user.id
    };

    // Debug info
    
    handleCreateEvent(formattedEvent as any);
  };

  // Find event type details for a given value
  const getEventTypeDetails = (typeValue: string) => {
    return eventTypes.find(type => type.value === typeValue) || eventTypes[0];
  };

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Calendar</h1>
            <p className="text-gray-500 mt-1">Manage your schedule and events</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                  <SelectTrigger className="w-full bg-white border-gray-200">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={() => setNewEventDialogOpen(true)} 
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="h-4 w-4" /> New Event
            </Button>
          </div>
        </div>

        <div className="px-4">
          <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <div className="p-0">
              <div className={`relative rounded-lg overflow-hidden ${isLoading ? 'opacity-50' : ''}`}>
                <BigCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  titleAccessor="title"
                  allDayAccessor="allDay"
                  style={{ height: 'calc(100vh - 250px)' }}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  selectable={false}
                  popup
                  defaultView="month"
                  views={['month', 'week', 'day', 'agenda']}
                  messages={{
                    next: "Next",
                    previous: "Previous",
                    today: "Today",
                    month: "Month",
                    week: "Week",
                    day: "Day",
                    agenda: "Agenda",
                    date: "Date",
                    time: "Time",
                    event: "Event",
                    noEventsInRange: "No events in this range",
                    showMore: (total) => `+${total} more`
                  }}
                  onRangeChange={handleRangeChange}
                  eventPropGetter={(event) => {
                    const typeDetails = getEventTypeDetails(event.event_type);
                    return {
                      className: `rounded-md px-2 py-1`,
                      style: {
                        backgroundColor: typeDetails.color,
                        border: `1px solid ${typeDetails.color}`,
                        color: 'white',
                      }
                    };
                  }}
                  dayPropGetter={(date) => ({
                    style: {
                      backgroundColor: date.getDay() === 0 || date.getDay() === 6 
                        ? '#f9fafb' // Light gray for weekends
                        : 'transparent',
                    },
                  })}
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <EventDetailModal
            open={isDetailModalOpen}
            event={selectedEvent}
            onClose={() => setDetailModalOpen(false)}
            onEdit={handleEditEvent}
            onDelete={(eventId) => handleDeleteEvent(eventId)}
            timezone={selectedTimezone}
          />
        )}

        {/* New Event Modal */}
        <Dialog 
          open={isNewEventDialogOpen} 
          onOpenChange={(open) => {
            setNewEventDialogOpen(open);
            
            // If dialog is closing, reset the form
            if (!open) {
              setTimeout(() => {
                setNewEvent({
                  title: '',
                  description: '',
                  start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                  end_time: format(new Date(new Date().getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
                  event_type: 'meeting',
                  organization_id: user?.organization_id,
                  user_id: user?.id,
                  is_all_day: false,
                  location: ''
                });
              }, 300);
            }
          }}
        >
          <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-xl">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
              <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                New Event
              </DialogTitle>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700 block mb-1">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="border-gray-200 focus:border-primary"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 block mb-1">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="border-gray-200 focus:border-primary min-h-[80px]"
                    placeholder="Enter event description"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700 block mb-1">
                    Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      className="pl-9 border-gray-200 focus:border-primary"
                      placeholder="Enter location (optional)"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Event Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {eventTypes.map(type => (
                      <div 
                        key={type.value}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors flex flex-col items-center justify-center ${
                          newEvent.event_type === type.value
                            ? `${type.bg} border-${type.textColor.replace('text-', '')} ring-1 ring-${type.textColor.replace('text-', '')}`
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setNewEvent({ ...newEvent, event_type: type.value })}
                      >
                        <div className={`w-full text-center ${newEvent.event_type === type.value ? type.textColor : 'text-gray-700'}`}>
                          {type.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time" className="text-sm font-medium text-gray-700 block mb-1">
                      Start Date/Time
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="start_time"
                        type="datetime-local"
                        value={newEvent.start_time}
                        onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                        className="pl-9 border-gray-200 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="end_time" className="text-sm font-medium text-gray-700 block mb-1">
                      End Date/Time
                    </Label>
                    <div className="relative">
                      <Clock3 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="end_time"
                        type="datetime-local"
                        value={newEvent.end_time}
                        onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                        className="pl-9 border-gray-200 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Improved All-day Toggle */}
                <div className="mt-2">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium text-gray-700">Event Duration</Label>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`flex items-center justify-center px-4 py-2 border rounded-lg transition-colors ${
                        !newEvent.is_all_day
                          ? 'bg-blue-50 border-blue-200 text-blue-600 font-medium'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
                      }`}
                      onClick={() => setNewEvent({ ...newEvent, is_all_day: false })}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Time Specific
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center px-4 py-2 border rounded-lg transition-colors ${
                        newEvent.is_all_day
                          ? 'bg-blue-50 border-blue-200 text-blue-600 font-medium'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
                      }`}
                      onClick={() => setNewEvent({ ...newEvent, is_all_day: true })}
                    >
                      <CalendarDays className="h-4 w-4 mr-2" />
                      All Day
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setNewEventDialogOpen(false)}
                className="border-gray-200 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateNewEvent}
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={!newEvent.title}
              >
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
};
