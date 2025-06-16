import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { formatInTimeZone } from 'date-fns-tz';
import { useQueryClient } from '@tanstack/react-query';
import { Event, EventUpdateInput } from '../services/api/events';
import eventsAPI from '../services/api/events';

interface EventDetailModalProps {
  event?: Event;
  onClose: () => void;
}

export default function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const [editedEvent, setEditedEvent] = useState<EventUpdateInput>({});
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (event) {
      setEditedEvent({
        title: event.title,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        location: event.location,
        event_type: event.event_type,
        is_all_day: event.is_all_day,
        status: event.status,
      });
    }
  }, [event]);

  const handleSave = async () => {
    if (!event) return;
    
    try {
      setIsSaving(true);
      const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const formattedEvent = {
        ...editedEvent,
        start_date: formatInTimeZone(new Date(editedEvent.start_date || ''), systemTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        end_date: formatInTimeZone(new Date(editedEvent.end_date || ''), systemTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      };

      
      await eventsAPI.update(event.id, formattedEvent);
      toast.success('Event updated successfully');
      onClose();
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to update event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (field: 'start_date' | 'end_date') => (date: Date | null) => {
    if (!date) return;
    
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formattedDate = formatInTimeZone(date, systemTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
    
    setEditedEvent(prev => ({
      ...prev,
      [field]: formattedDate
    }));
  };

  // ... rest of the component code ...
} 