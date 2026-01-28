/**
 * Slack & Microsoft Teams Integration
 *
 * SALESFORCE: No Slack/Teams integration (or expensive add-on!)
 * LEADLAB: Native Slack & Teams integration, free! (AMAZING!)
 *
 * Get CRM notifications where you work!
 */

import { useState } from 'react';
import { Send, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Slack Webhook Integration
export async function sendSlackNotification(
  webhookUrl: string,
  message: SlackMessage
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return response.ok;
  } catch (error) {
    console.error('Slack notification failed:', error);
    return false;
  }
}

export interface SlackMessage {
  text?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

export interface SlackBlock {
  type: 'section' | 'header' | 'divider' | 'actions';
  text?: {
    type: 'plain_text' | 'mrkdwn';
    text: string;
  };
  fields?: Array<{
    type: 'mrkdwn';
    text: string;
  }>;
  accessory?: any;
  elements?: any[];
}

export interface SlackAttachment {
  color?: string;
  title?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
}

// Microsoft Teams Webhook Integration
export async function sendTeamsNotification(
  webhookUrl: string,
  message: TeamsMessage
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return response.ok;
  } catch (error) {
    console.error('Teams notification failed:', error);
    return false;
  }
}

export interface TeamsMessage {
  '@type': string;
  '@context': string;
  summary: string;
  themeColor?: string;
  title?: string;
  sections?: TeamsSection[];
  potentialAction?: TeamsAction[];
}

export interface TeamsSection {
  activityTitle?: string;
  activitySubtitle?: string;
  activityImage?: string;
  facts?: Array<{
    name: string;
    value: string;
  }>;
  text?: string;
}

export interface TeamsAction {
  '@type': string;
  name: string;
  targets?: Array<{
    os: string;
    uri: string;
  }>;
}

// Notification Templates
export function createLeadAssignedSlackMessage(lead: any): SlackMessage {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎯 New Lead Assigned',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Name:*\n${lead.name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Company:*\n${lead.company || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${lead.email}`,
          },
          {
            type: 'mrkdwn',
            text: `*Score:*\n${lead.score || 'N/A'}/100`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<https://app.leadlab.com/leads/${lead.id}|View Lead in CRM →>`,
        },
      },
    ],
  };
}

export function createDealWonSlackMessage(deal: any): SlackMessage {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 Deal Won!',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Deal:*\n${deal.name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Value:*\n$${deal.amount.toLocaleString()}`,
          },
          {
            type: 'mrkdwn',
            text: `*Company:*\n${deal.company}`,
          },
          {
            type: 'mrkdwn',
            text: `*Owner:*\n${deal.owner}`,
          },
        ],
      },
    ],
    attachments: [
      {
        color: '#10b981',
        text: '🏆 Congratulations on closing this deal!',
      },
    ],
  };
}

export function createLeadAssignedTeamsMessage(lead: any): TeamsMessage {
  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: 'New Lead Assigned',
    themeColor: '3b82f6',
    title: '🎯 New Lead Assigned',
    sections: [
      {
        activityTitle: lead.name,
        activitySubtitle: lead.company || 'No company',
        facts: [
          {
            name: 'Email:',
            value: lead.email,
          },
          {
            name: 'Score:',
            value: `${lead.score || 'N/A'}/100`,
          },
          {
            name: 'Source:',
            value: lead.source || 'Unknown',
          },
        ],
      },
    ],
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: 'View in CRM',
        targets: [
          {
            os: 'default',
            uri: `https://app.leadlab.com/leads/${lead.id}`,
          },
        ],
      },
    ],
  };
}

export function createDealWonTeamsMessage(deal: any): TeamsMessage {
  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: 'Deal Won!',
    themeColor: '10b981',
    title: '🎉 Deal Won!',
    sections: [
      {
        activityTitle: deal.name,
        activitySubtitle: `$${deal.amount.toLocaleString()}`,
        facts: [
          {
            name: 'Company:',
            value: deal.company,
          },
          {
            name: 'Owner:',
            value: deal.owner,
          },
          {
            name: 'Close Date:',
            value: new Date(deal.closeDate).toLocaleDateString(),
          },
        ],
        text: '🏆 Congratulations on closing this deal!',
      },
    ],
  };
}

// Integration Setup Component
export function IntegrationSetup() {
  const [slackWebhook, setSlackWebhook] = useState('');
  const [teamsWebhook, setTeamsWebhook] = useState('');
  const [testStatus, setTestStatus] = useState<{
    slack?: 'success' | 'error' | 'loading';
    teams?: 'success' | 'error' | 'loading';
  }>({});

  const testSlackIntegration = async () => {
    setTestStatus(prev => ({ ...prev, slack: 'loading' }));

    const testMessage: SlackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '✅ LeadLab Integration Test',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Your Slack integration is working perfectly! You\'ll now receive CRM notifications here.',
          },
        },
      ],
    };

    const success = await sendSlackNotification(slackWebhook, testMessage);
    setTestStatus(prev => ({ ...prev, slack: success ? 'success' : 'error' }));
  };

  const testTeamsIntegration = async () => {
    setTestStatus(prev => ({ ...prev, teams: 'loading' }));

    const testMessage: TeamsMessage = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: 'LeadLab Integration Test',
      themeColor: '3b82f6',
      title: '✅ LeadLab Integration Test',
      sections: [
        {
          text: 'Your Teams integration is working perfectly! You\'ll now receive CRM notifications here.',
        },
      ],
    };

    const success = await sendTeamsNotification(teamsWebhook, testMessage);
    setTestStatus(prev => ({ ...prev, teams: success ? 'success' : 'error' }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Integrations</h2>
        <p className="text-gray-600">Connect LeadLab to Slack and Microsoft Teams</p>
      </div>

      {/* Slack Integration */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
            💬
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Slack</h3>
            <p className="text-sm text-gray-600">Get CRM notifications in Slack</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="text"
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Get your Slack webhook URL →
              </a>
            </p>
          </div>

          <button
            onClick={testSlackIntegration}
            disabled={!slackWebhook || testStatus.slack === 'loading'}
            className={cn(
              'w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2',
              testStatus.slack === 'success' && 'bg-green-100 text-green-700',
              testStatus.slack === 'error' && 'bg-red-100 text-red-700',
              !testStatus.slack && 'bg-blue-600 text-white hover:bg-blue-700',
              (!slackWebhook || testStatus.slack === 'loading') && 'opacity-50 cursor-not-allowed'
            )}
          >
            {testStatus.slack === 'loading' && <Send className="w-4 h-4 animate-pulse" />}
            {testStatus.slack === 'success' && <Check className="w-4 h-4" />}
            {testStatus.slack === 'error' && <X className="w-4 h-4" />}
            {testStatus.slack === 'success' && 'Test Successful!'}
            {testStatus.slack === 'error' && 'Test Failed'}
            {testStatus.slack === 'loading' && 'Testing...'}
            {!testStatus.slack && 'Test Integration'}
          </button>
        </div>
      </div>

      {/* Teams Integration */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
            👥
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Microsoft Teams</h3>
            <p className="text-sm text-gray-600">Get CRM notifications in Teams</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="text"
              value={teamsWebhook}
              onChange={(e) => setTeamsWebhook(e.target.value)}
              placeholder="https://outlook.office.com/webhook/..."
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              <a
                href="https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Get your Teams webhook URL →
              </a>
            </p>
          </div>

          <button
            onClick={testTeamsIntegration}
            disabled={!teamsWebhook || testStatus.teams === 'loading'}
            className={cn(
              'w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2',
              testStatus.teams === 'success' && 'bg-green-100 text-green-700',
              testStatus.teams === 'error' && 'bg-red-100 text-red-700',
              !testStatus.teams && 'bg-blue-600 text-white hover:bg-blue-700',
              (!teamsWebhook || testStatus.teams === 'loading') && 'opacity-50 cursor-not-allowed'
            )}
          >
            {testStatus.teams === 'loading' && <Send className="w-4 h-4 animate-pulse" />}
            {testStatus.teams === 'success' && <Check className="w-4 h-4" />}
            {testStatus.teams === 'error' && <X className="w-4 h-4" />}
            {testStatus.teams === 'success' && 'Test Successful!'}
            {testStatus.teams === 'error' && 'Test Failed'}
            {testStatus.teams === 'loading' && 'Testing...'}
            {!testStatus.teams && 'Test Integration'}
          </button>
        </div>
      </div>
    </div>
  );
}
