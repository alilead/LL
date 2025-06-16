import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Event, EventCreateInput } from '../../services/api/events';
import eventsAPI from '../../services/api/events';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useAuthStore } from '@/store/auth';
import { getSystemTimezone, COMMON_TIMEZONES } from '@/utils/timezone';
import { formatInTimeZone } from 'date-fns-tz';
import { Textarea } from '@/components/ui/Textarea';
import { Calendar, Clock, Globe, MapPin, CalendarDays, Clock3, AlarmCheck, AlertCircle, Trash2, Edit2 } from 'lucide-react';

interface EventDetailModalProps {
  event?: Event;
  onClose: () => void;
  onDelete?: (id: number) => void;
  open: boolean;
}

const formatDate = (date: string | Date | null | undefined, timezone: string): string => {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return '';
    }
    
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return '';
    }
    
    const formatted = formatInTimeZone(dateObj, timezone, "yyyy-MM-dd'T'HH:mm");
    return formatted;
  } catch (error) {
    console.error('Date formatting error:', error, { input: date });
    return '';
  }
};

const defaultEventData: EventCreateInput = {
  title: '',
  description: '',
  start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
  end_date: format(new Date(Date.now() + 30 * 60000), "yyyy-MM-dd'T'HH:mm:ss"),
  location: '',
  event_type: 'meeting',
  is_all_day: false,
  status: 'scheduled',
  organization_id: 0,
  user_id: 0,
  timezone: getSystemTimezone()
};

const eventTypes = [
  { value: 'meeting', label: 'Meeting', color: '#3b82f6', bg: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
  { value: 'task', label: 'Task', color: '#10b981', bg: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200' },
  { value: 'reminder', label: 'Reminder', color: '#f59e0b', bg: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' }
];

const eventStatusOptions = [
  { value: 'scheduled', label: 'Scheduled', color: '#3b82f6', bg: 'bg-blue-50', textColor: 'text-blue-600' },
  { value: 'in_progress', label: 'In Progress', color: '#8b5cf6', bg: 'bg-purple-50', textColor: 'text-purple-600' },
  { value: 'completed', label: 'Completed', color: '#10b981', bg: 'bg-emerald-50', textColor: 'text-emerald-600' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444', bg: 'bg-red-50', textColor: 'text-red-600' }
];

export default function EventDetailModal({ event, onClose, onDelete, open }: EventDetailModalProps) {
  const [editedEvent, setEditedEvent] = useState<EventCreateInput>(defaultEventData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(getSystemTimezone());
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (open && event) {
        event,
        hasStartDate: !!(event.start_date || event.start),
        hasEndDate: !!(event.end_date || event.end),
        startDateType: typeof (event.start_date || event.start),
        endDateType: typeof (event.end_date || event.end),
        timezone: event.timezone
      });
      
      try {
        const eventTimezone = event.timezone || getSystemTimezone();
        setSelectedTimezone(eventTimezone);
        
        // Get start and end dates from either start_date/end_date or start/end fields
        const startDateValue = event.start_date || event.start;
        const endDateValue = event.end_date || event.end;
        
        // Ensure we have valid date strings
        if (!startDateValue || !endDateValue) {
          console.error('Missing date values:', { 
            start: startDateValue, 
            end: endDateValue,
            eventObject: JSON.stringify(event, null, 2)
          });
          
          // Fallback to current time if dates are missing
          const now = new Date();
          const thirtyMinutesLater = new Date(now.getTime() + 30 * 60000);
          
          setEditedEvent({
            title: event.title || '',
            description: event.description || '',
            start_date: formatInTimeZone(now, eventTimezone, "yyyy-MM-dd'T'HH:mm"),
            end_date: formatInTimeZone(thirtyMinutesLater, eventTimezone, "yyyy-MM-dd'T'HH:mm"),
            location: event.location || '',
            event_type: event.event_type || 'meeting',
            is_all_day: event.is_all_day || event.allDay || false,
            status: event.status || 'scheduled',
            organization_id: user?.organization_id || 0,
            user_id: user?.id || 0,
            timezone: eventTimezone
          });
          
          toast.error('Event dates are missing, using current time as fallback');
          return;
        }

        // Parse dates and ensure they are in the event's timezone
        let startDate: Date;
        let endDate: Date;
        try {
          startDate = typeof startDateValue === 'string' 
            ? parseISO(startDateValue)
            : new Date(startDateValue);
            
          endDate = typeof endDateValue === 'string'
            ? parseISO(endDateValue)
            : new Date(endDateValue);
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date values');
          }
        } catch (error) {
          console.error('Date parsing error:', error, {
            startDate: startDateValue,
            endDate: endDateValue,
            eventObject: JSON.stringify(event, null, 2)
          });
          throw new Error('Failed to parse event dates');
        }
        
        // Format dates for datetime-local input in the event's timezone
        const formattedStartDate = formatInTimeZone(startDate, eventTimezone, "yyyy-MM-dd'T'HH:mm");
        const formattedEndDate = formatInTimeZone(endDate, eventTimezone, "yyyy-MM-dd'T'HH:mm");
        
          originalStartDate: startDateValue,
          parsedStartDate: startDate,
          formattedStartDate,
          originalEndDate: endDateValue,
          parsedEndDate: endDate,
          formattedEndDate,
          timezone: eventTimezone 
        });
        
        setEditedEvent({
          title: event.title || '',
          description: event.description || '',
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          location: event.location || '',
          event_type: event.event_type || 'meeting',
          is_all_day: event.is_all_day || event.allDay || false,
          status: event.status || 'scheduled',
          organization_id: user?.organization_id || 0,
          user_id: user?.id || 0,
          timezone: eventTimezone
        });
      } catch (error) {
        console.error('Error processing event dates:', error);
        toast.error('Error loading event details. Using default values.');
        
        // Fallback to current time
        const now = new Date();
        const thirtyMinutesLater = new Date(now.getTime() + 30 * 60000);
        const systemTimezone = getSystemTimezone();
        
        setEditedEvent({
          ...defaultEventData,
          title: event.title || '',
          description: event.description || '',
          start_date: formatInTimeZone(now, systemTimezone, "yyyy-MM-dd'T'HH:mm"),
          end_date: formatInTimeZone(thirtyMinutesLater, systemTimezone, "yyyy-MM-dd'T'HH:mm"),
          organization_id: user?.organization_id || 0,
          user_id: user?.id || 0,
          timezone: systemTimezone
        });
      }
    } else if (open) {
      // This is for new event creation
      const systemTimezone = getSystemTimezone();
      setSelectedTimezone(systemTimezone);
      
      const now = new Date();
      const thirtyMinutesLater = new Date(now.getTime() + 30 * 60000);
      
      // Format dates in system timezone
      const formattedStartDate = formatInTimeZone(now, systemTimezone, "yyyy-MM-dd'T'HH:mm");
      const formattedEndDate = formatInTimeZone(thirtyMinutesLater, systemTimezone, "yyyy-MM-dd'T'HH:mm");
      
      setEditedEvent({
        ...defaultEventData,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        organization_id: user?.organization_id || 0,
        user_id: user?.id || 0,
        timezone: systemTimezone
      });
    }
  }, [event, open, user, onClose]);

  const handleSave = async () => {
    if (!event?.id) return;
    
    try {
      setIsSaving(true);
      
      // Ensure we have valid timezone
      const timezone = editedEvent.timezone || getSystemTimezone();
      
      // Parse the input dates
      const startDate = parseISO(editedEvent.start_date);
      const endDate = parseISO(editedEvent.end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date values');
      }
      
      // Sadece Event modeli için gereken alanları içeren bir nesne oluştur
      const formattedEvent = {
        title: editedEvent.title,
        description: editedEvent.description,
        start_date: formatInTimeZone(startDate, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        end_date: formatInTimeZone(endDate, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        location: editedEvent.location,
        event_type: editedEvent.event_type,
        is_all_day: editedEvent.is_all_day,
        status: editedEvent.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
        timezone: timezone,
        organization_id: user?.organization_id || 0
      };

      // Debug için eventData içeriğini yazdır
      
      // attendee_ids ve diğer fazla alanları temizleme fonksiyonu eventsAPI içinde
      await eventsAPI.update(event.id, formattedEvent);
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event updated successfully');
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to update event. Please check the date values.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    try {
      setIsDeleting(true);
      await eventsAPI.remove(event.id);
      
      // Invalidate and refetch events
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.refetchQueries({ queryKey: ['events'] });
      
      toast.success('Event deleted successfully');
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'start_date' || name === 'end_date') {
      try {
        // Parse the input value in the selected timezone
        const localDate = parseISO(value);
        
        if (isNaN(localDate.getTime())) {
          console.error('Invalid date input:', value);
          return;
        }


        setEditedEvent(prev => ({
          ...prev,
          [name]: value
        }));
      } catch (error) {
        console.error('Error processing date input:', error);
      }
    } else {
      setEditedEvent(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Modal kapanırken formu temizle
  const handleClose = () => {
    setEditedEvent(defaultEventData);
    onClose();
  };

  // Get event type details for styling
  const getEventTypeDetails = (typeValue: string) => {
    return eventTypes.find(type => type.value === typeValue) || eventTypes[0];
  };
  
  // Get event status details
  const getStatusDetails = (statusValue: string) => {
    return eventStatusOptions.find(status => status.value === statusValue) || eventStatusOptions[0];
  };

  const typeDetails = getEventTypeDetails(event.event_type);
  const statusDetails = getStatusDetails(event.status);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-xl">
        {isConfirmingDelete ? (
          <div className="p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl font-semibold mb-2">Delete Event</DialogTitle>
              <p className="text-gray-500">
                Are you sure you want to delete this event? This action cannot be undone.
              </p>
            </div>
            
            <div className="border border-gray-100 rounded-lg p-4 mb-6 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-1">{event.title}</h4>
              <p className="text-gray-600">{formatDate(event.start_date)}</p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsConfirmingDelete(false)}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Event
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={`${typeDetails.bg} px-6 py-4 border-b ${typeDetails.borderColor}`}>
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  {isEditing ? 'Edit Event' : 'Event Details'}
                </DialogTitle>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${typeDetails.textColor} border ${typeDetails.borderColor} bg-white/80`}>
                  {typeDetails.label}
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700 block mb-1">Title</Label>
                    <Input
                      id="title"
                      value={editedEvent.title}
                      onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                      className="border-gray-200 focus:border-primary"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700 block mb-1">Description</Label>
                    <Textarea
                      id="description"
                      value={editedEvent.description || ''}
                      onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                      className="border-gray-200 focus:border-primary min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="text-sm font-medium text-gray-700 block mb-1">Start Date/Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="start_date"
                          type="datetime-local"
                          value={formatDate(editedEvent.start_date)}
                          onChange={(e) => setEditedEvent({ ...editedEvent, start_date: e.target.value })}
                          className="pl-9 border-gray-200 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="end_date" className="text-sm font-medium text-gray-700 block mb-1">End Date/Time</Label>
                      <div className="relative">
                        <Clock3 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="end_date"
                          type="datetime-local"
                          value={formatDate(editedEvent.end_date)}
                          onChange={(e) => setEditedEvent({ ...editedEvent, end_date: e.target.value })}
                          className="pl-9 border-gray-200 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event_type" className="text-sm font-medium text-gray-700 block mb-1">Event Type</Label>
                      <Select
                        value={editedEvent.event_type}
                        onValueChange={(value) => setEditedEvent({ ...editedEvent, event_type: value })}
                      >
                        <SelectTrigger className="border-gray-200">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: type.color }}></div>
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700 block mb-1">Status</Label>
                      <Select
                        value={editedEvent.status}
                        onValueChange={(value) => setEditedEvent({ ...editedEvent, status: value as any })}
                      >
                        <SelectTrigger className="border-gray-200">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventStatusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: status.color }}></div>
                                {status.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700 block mb-1">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="location"
                        value={editedEvent.location || ''}
                        onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
                        className="pl-9 border-gray-200 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Title</span>
                      <p className="font-medium text-gray-800">{event.title}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Start</span>
                        <p className="font-medium text-gray-800">{formatDate(event.start_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <Clock3 className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">End</span>
                        <p className="font-medium text-gray-800">{formatDate(event.end_date)}</p>
                      </div>
                    </div>
                  </div>

                  {event.description && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-1">
                        <AlarmCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Description</span>
                        <p className="text-gray-800 whitespace-pre-wrap">{event.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      <div className={`p-2 rounded-lg ${typeDetails.bg} ${typeDetails.textColor}`}>
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Type</span>
                        <p className={`font-medium ${typeDetails.textColor}`}>{typeDetails.label}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      <div className={`p-2 rounded-lg ${statusDetails.bg} ${statusDetails.textColor}`}>
                        <AlarmCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Status</span>
                        <p className={`font-medium ${statusDetails.textColor}`}>
                          {statusDetails.label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Location</span>
                        <p className="font-medium text-gray-800">{event.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-gray-200 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="border-gray-200 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={onClose}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
