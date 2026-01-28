export interface EventUpdateInput {
  title: string;
  description: string | null | undefined;
  start_date: string;
  end_date: string;
  location: string | null | undefined;
  event_type: string;
  is_all_day: boolean;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  timezone: string;
} 