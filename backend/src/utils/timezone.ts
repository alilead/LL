export const getSystemTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error detecting system timezone:', error);
    return 'UTC';  // Fallback to UTC if detection fails
  }
};

export const COMMON_TIMEZONES = [
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

export const formatDateWithTimezone = (date: Date | string): string => {
  try {
    const timezone = getSystemTimezone();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', { timeZone: timezone });
  } catch (error) {
    console.warn('Failed to format date with timezone:', error);
    return new Date(date).toISOString(); // Fallback to ISO string
  }
}; 