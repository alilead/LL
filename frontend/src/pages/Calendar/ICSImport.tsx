import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Upload, Calendar, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import eventsAPI from '@/services/api/events';
import { useAuthStore } from '@/store/auth';

export const ICSImport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { user } = useAuthStore();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.ics')) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid .ics calendar file",
        variant: "destructive"
      });
    }
  };

  const parseICSFile = (icsContent: string) => {
    const events = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.summary && currentEvent.dtstart) {
          events.push(currentEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        if (line.startsWith('SUMMARY:')) {
          currentEvent.summary = line.substring(8);
        } else if (line.startsWith('DTSTART:')) {
          currentEvent.dtstart = line.substring(8);
        } else if (line.startsWith('DTEND:')) {
          currentEvent.dtend = line.substring(6);
        } else if (line.startsWith('DESCRIPTION:')) {
          currentEvent.description = line.substring(12);
        } else if (line.startsWith('LOCATION:')) {
          currentEvent.location = line.substring(9);
        }
      }
    }

    return events;
  };

  const formatICSDate = (icsDate: string): string => {
    // ICS format: 20240625T140000Z or 20240625
    if (icsDate.includes('T')) {
      // DateTime format
      const year = icsDate.substring(0, 4);
      const month = icsDate.substring(4, 6);
      const day = icsDate.substring(6, 8);
      const hour = icsDate.substring(9, 11);
      const minute = icsDate.substring(11, 13);
      const second = icsDate.substring(13, 15);
      
      return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    } else {
      // Date only format
      const year = icsDate.substring(0, 4);
      const month = icsDate.substring(4, 6);
      const day = icsDate.substring(6, 8);
      
      return `${year}-${month}-${day}T00:00:00Z`;
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileContent = await file.text();
      const parsedEvents = parseICSFile(fileContent);

      let imported = 0;
      let failed = 0;

      for (const icsEvent of parsedEvents) {
        try {
          const eventData = {
            title: icsEvent.summary,
            description: icsEvent.description || '',
            start_date: formatICSDate(icsEvent.dtstart),
            end_date: formatICSDate(icsEvent.dtend || icsEvent.dtstart),
            location: icsEvent.location || '',
            event_type: 'meeting',
            is_all_day: !icsEvent.dtstart.includes('T'),
            status: 'scheduled' as const,
            organization_id: user.organization_id || 0,
            timezone: 'UTC'
          };

          await eventsAPI.create(eventData);
          imported++;
        } catch (error) {
          console.error('Failed to import event:', error);
          failed++;
        }
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${imported} events${failed > 0 ? `, ${failed} failed` : ''}`,
      });

    } catch (error) {
      console.error('ICS import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to parse ICS file",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Import Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Select ICS Calendar File
          </label>
          <Input
            type="file"
            accept=".ics"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
        </div>

        {file && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <Upload className="h-4 w-4" />
              <span className="text-sm">{file.name}</span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">How to export from your mail client:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Outlook: File → Export → Calendar (ICS)</li>
              <li>• Gmail: Settings → Import & Export</li>
              <li>• Apple Calendar: File → Export</li>
            </ul>
          </div>
        </div>

        <Button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full"
        >
          {loading ? 'Importing...' : 'Import Events'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ICSImport; 