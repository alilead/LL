/**
 * Email Campaign Automation
 *
 * SALESFORCE: Manual emails, no automation, clunky interface (PAINFUL!)
 * LEADLAB: Drag & drop campaigns, smart automation, A/B testing! (POWERFUL!)
 *
 * Marketing automation made easy!
 */

import { useState } from 'react';
import { Mail, Send, Clock, Users, TrendingUp, Zap, Plus, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

export interface CampaignStep {
  id: string;
  type: 'email' | 'wait' | 'condition';
  config: any;
}

export interface EmailCampaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  steps: CampaignStep[];
  targetAudience: {
    segment?: string;
    filters: any[];
    count: number;
  };
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  schedule?: {
    startDate: Date;
    endDate?: Date;
    frequency?: 'once' | 'daily' | 'weekly';
  };
}

// Campaign Builder Component
export function CampaignBuilder() {
  const [campaign, setCampaign] = useState<EmailCampaign>({
    id: 'new',
    name: 'New Campaign',
    status: 'draft',
    steps: [],
    targetAudience: {
      filters: [],
      count: 0,
    },
    metrics: {
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
    },
  });

  const addStep = (type: CampaignStep['type']) => {
    const newStep: CampaignStep = {
      id: `step-${Date.now()}`,
      type,
      config: getDefaultConfig(type),
    };

    setCampaign(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaign Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Create automated email sequences</p>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Save Draft
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Send className="w-4 h-4" />
            Launch Campaign
          </button>
        </div>
      </div>

      {/* Campaign Setup */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main Builder */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Campaign Steps</h3>

            {/* Steps */}
            <div className="space-y-3">
              {campaign.steps.map((step, idx) => (
                <StepCard key={step.id} step={step} index={idx} />
              ))}

              {/* Add Step Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => addStep('email')}
                  className="flex-1 py-3 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Add Email
                </button>
                <button
                  onClick={() => addStep('wait')}
                  className="flex-1 py-3 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Clock className="w-4 h-4" />
                  Add Wait
                </button>
                <button
                  onClick={() => addStep('condition')}
                  className="flex-1 py-3 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Zap className="w-4 h-4" />
                  Add Condition
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Target Audience */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Target Audience</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Total Recipients</span>
                </div>
                <span className="text-lg font-bold text-gray-900">1,247</span>
              </div>

              <button className="w-full py-2 border rounded-lg hover:bg-gray-50 text-sm">
                Configure Filters
              </button>
            </div>
          </div>

          {/* Performance Preview */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Expected Performance</h3>
            <div className="space-y-3">
              <MetricRow label="Open Rate" value="35%" trend={+5.2} />
              <MetricRow label="Click Rate" value="12%" trend={+2.1} />
              <MetricRow label="Conversion" value="3.5%" trend={+0.8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDefaultConfig(type: CampaignStep['type']): any {
  switch (type) {
    case 'email':
      return { template: '', subject: '', from: '' };
    case 'wait':
      return { duration: 24, unit: 'hours' };
    case 'condition':
      return { field: '', operator: '', value: '' };
    default:
      return {};
  }
}

function StepCard({ step, index }: { step: CampaignStep; index: number }) {
  const stepIcons = {
    email: Mail,
    wait: Clock,
    condition: Zap,
  };

  const Icon = stepIcons[step.type];

  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg hover:border-blue-300 transition-colors">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
        {index + 1}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900 capitalize">{step.type}</h4>
        </div>

        {step.type === 'email' && (
          <p className="text-sm text-gray-600">Email: Welcome Message</p>
        )}
        {step.type === 'wait' && (
          <p className="text-sm text-gray-600">Wait: 24 hours</p>
        )}
        {step.type === 'condition' && (
          <p className="text-sm text-gray-600">Condition: Email opened</p>
        )}
      </div>

      <div className="flex gap-1">
        <button className="p-1 hover:bg-gray-100 rounded">
          <Copy className="w-4 h-4 text-gray-400" />
        </button>
        <button className="p-1 hover:bg-gray-100 rounded">
          <Trash2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

function MetricRow({ label, value, trend }: { label: string; value: string; trend: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{value}</span>
        <span className={cn('text-xs font-medium', trend > 0 ? 'text-green-600' : 'text-red-600')}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      </div>
    </div>
  );
}

// Email Templates
export const emailTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to {{company_name}}!',
    content: 'Hi {{first_name}}, Welcome aboard!',
    variables: ['first_name', 'company_name'],
  },
  {
    id: '2',
    name: 'Follow Up',
    subject: 'Following up on our conversation',
    content: 'Hi {{first_name}}, Just wanted to follow up...',
    variables: ['first_name'],
  },
];
