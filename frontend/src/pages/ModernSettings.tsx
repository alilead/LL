/**
 * Modern Settings Page
 * Tab-based, clean, professional
 */

import React, { useEffect, useState } from 'react';
import {
  User,
  Building2,
  Bell,
  Lock,
  CreditCard,
  Users,
  Mail,
  Zap,
  Globe,
  Palette,
  Database,
  Save,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { updateProfile } from '@/services/users';
import { useAuthStore } from '@/store/auth';

type Tab = 'profile' | 'organization' | 'notifications' | 'security' | 'billing' | 'team' | 'integrations';

const tabs = [
  { id: 'profile' as Tab, name: 'Profile', icon: User },
  { id: 'organization' as Tab, name: 'Organization', icon: Building2 },
  { id: 'notifications' as Tab, name: 'Notifications', icon: Bell },
  { id: 'security' as Tab, name: 'Security', icon: Lock },
  { id: 'billing' as Tab, name: 'Billing', icon: CreditCard },
  { id: 'team' as Tab, name: 'Team', icon: Users },
  { id: 'integrations' as Tab, name: 'Integrations', icon: Zap },
];

export function ModernSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          Settings
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar Tabs */}
        <div className="col-span-3">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-9">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'organization' && <OrganizationSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'billing' && <BillingSettings />}
            {activeTab === 'team' && <TeamSettings />}
            {activeTab === 'integrations' && <IntegrationsSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const { user, fetchUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    if (!user) {
      fetchUser().catch(() => {
        toast.error('Failed to load user profile');
      });
    }
  }, [user, fetchUser]);

  useEffect(() => {
    if (user) {
      setFormState((prev) => ({
        ...prev,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    if (!user) {
      return;
    }
    setFormState((prev) => ({
      ...prev,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      phone: '',
      bio: ''
    }));
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('User profile not loaded yet');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        first_name: formState.firstName,
        last_name: formState.lastName,
        email: formState.email
      });
      await fetchUser();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-6">
        Profile Settings
      </h2>

      <div className="space-y-6">
        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Profile Photo
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                Upload new photo
              </button>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                JPG, PNG or GIF. Max 2MB
              </p>
            </div>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formState.firstName}
              onChange={(event) => handleChange('firstName', event.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formState.lastName}
              onChange={(event) => handleChange('lastName', event.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formState.email}
            onChange={(event) => handleChange('email', event.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={formState.phone}
            onChange={(event) => handleChange('phone', event.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Bio
          </label>
          <textarea
            rows={4}
            placeholder="Tell us about yourself..."
            value={formState.bio}
            onChange={(event) => handleChange('bio', event.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function OrganizationSettings() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-6">
        Organization Settings
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Company Name
          </label>
          <input
            type="text"
            defaultValue="LeadLab"
            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Website
          </label>
          <input
            type="url"
            placeholder="https://your-company.com"
            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Industry
          </label>
          <select className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>Technology</option>
            <option>Finance</option>
            <option>Healthcare</option>
            <option>Education</option>
          </select>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <button className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-6">
        Notification Preferences
      </h2>

      <div className="space-y-6">
        {[
          { title: 'New Leads', description: 'Get notified when a new lead is created' },
          { title: 'Deal Updates', description: 'Receive updates on deal status changes' },
          { title: 'Email Campaigns', description: 'Notifications about campaign performance' },
          { title: 'Team Activity', description: 'Updates from your team members' },
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                {item.title}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {item.description}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-6">
        Security Settings
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
            Change Password
          </h3>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Current password"
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="password"
              placeholder="New password"
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
              Update Password
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
            Two-Factor Authentication
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Add an extra layer of security to your account
          </p>
          <button className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-50 rounded-lg font-medium transition-colors">
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-6">
        Billing & Subscription
      </h2>

      <div className="space-y-6">
        <div className="p-6 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                Enterprise Plan
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                $99/month • Billed annually
              </p>
            </div>
            <span className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium">
              Active
            </span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Next billing date: January 15, 2025
          </p>
          <button className="px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-50 rounded-lg font-medium transition-colors border border-neutral-200 dark:border-neutral-700">
            Manage Subscription
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
            Payment Method
          </h3>
          <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  •••• •••• •••• 4242
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Expires 12/2025
                </p>
              </div>
            </div>
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamSettings() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Team Members
        </h2>
        <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
          Invite Member
        </button>
      </div>

      <div className="space-y-3">
        {[
          { name: 'Firat Celik', email: 'firat@the-leadlab.com', role: 'Owner' },
          { name: 'Mike Chen', email: 'mike@the-leadlab.com', role: 'Admin' },
          { name: 'Sarah Johnson', email: 'sarah@the-leadlab.com', role: 'Member' },
        ].map((member, index) => (
          <div key={index} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  {member.name}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {member.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full text-sm">
                {member.role}
              </span>
              {member.role !== 'Owner' && (
                <button className="text-red-600 hover:text-red-700">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationsSettings() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-6">
        Integrations
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {[
          { name: 'Salesforce', icon: Database, connected: true },
          { name: 'HubSpot', icon: Mail, connected: false },
          { name: 'Slack', icon: MessageSquare, connected: true },
          { name: 'Gmail', icon: Mail, connected: false },
        ].map((integration, index) => {
          const Icon = integration.icon;
          return (
            <div key={index} className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {integration.connected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              <button
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  integration.connected
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {integration.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
