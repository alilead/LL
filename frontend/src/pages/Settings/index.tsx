import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Switch } from '../../components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '../../components/ui/Form';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Simplified user settings schema
const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});

type UserSettingsFormValues = z.infer<typeof userSettingsSchema>;

export function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  // Default values
  const defaultSettings: UserSettingsFormValues = {
    theme: 'light',
    emailNotifications: true,
    pushNotifications: true,
  };

  // Form oluştur
  const form = useForm<UserSettingsFormValues>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: defaultSettings,
  });

  // Handle form submission
  const onSubmit = async (data: UserSettingsFormValues) => {
    try {
      setLoading(true);
      // Mock API call
      
      // Apply theme change
      const html = document.querySelector('html');
      if (html) {
        // Remove existing theme classes
        html.classList.remove('light', 'dark');
        
        // Apply new theme
        if (data.theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          html.classList.add(systemTheme);
          localStorage.setItem('theme', 'system');
        } else {
          html.classList.add(data.theme);
          localStorage.setItem('theme', data.theme);
        }
      }
      
      // Handle email notifications
      if (data.emailNotifications) {
        // This would connect to a real email notification service in production
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Theme */}
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent position="popper">
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose your preferred theme
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notification Preferences */}
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-medium">Notification Preferences</h3>
                  
                  <FormField
                    control={form.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive email notifications for lead assignments, deal updates, task reminders, and meeting notifications. Emails will be sent to your registered email address.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pushNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">In-App Notifications</FormLabel>
                          <FormDescription>
                            In-app notifications appear in the top-right corner of the screen. Receive instant notifications for lead assignments, deal updates, task reminders, and meeting notifications.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
