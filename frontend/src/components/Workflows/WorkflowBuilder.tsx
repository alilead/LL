/**
 * Custom Workflow Builder
 *
 * SALESFORCE: Limited workflow automation, complex setup (RESTRICTIVE!)
 * LEADLAB: Visual workflow builder, any trigger, any action! (UNLIMITED!)
 *
 * Automate EVERYTHING!
 */

import { useState, useEffect } from 'react';
import { Zap, Plus, GitBranch, Clock, Mail, Users, Check, X, Save, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { workflowsAPI } from '@/services/api/workflows';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type TriggerType = 'lead_created' | 'deal_stage_changed' | 'task_completed' | 'form_submitted' | 'email_opened' | 'field_updated';
export type ActionType = 'send_email' | 'create_task' | 'update_field' | 'notify_slack' | 'webhook' | 'assign_owner';
export type ConditionOperator = 'equals' | 'contains' | 'greater_than' | 'less_than';

export interface WorkflowTrigger {
  type: TriggerType;
  config: any;
}

export interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  config: any;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  stats: {
    triggered: number;
    succeeded: number;
    failed: number;
  };
}

const triggerLabels: Record<TriggerType, string> = {
  lead_created: 'Lead Created',
  deal_stage_changed: 'Deal Stage Changed',
  task_completed: 'Task Completed',
  form_submitted: 'Form Submitted',
  email_opened: 'Email Opened',
  field_updated: 'Field Updated',
};

const actionLabels: Record<ActionType, string> = {
  send_email: 'Send Email',
  create_task: 'Create Task',
  update_field: 'Update Field',
  notify_slack: 'Notify Slack',
  webhook: 'Call Webhook',
  assign_owner: 'Assign Owner',
};

interface WorkflowBuilderProps {
  workflowId?: number;
}

export function WorkflowBuilder({ workflowId }: WorkflowBuilderProps = {}) {
  const queryClient = useQueryClient();
  const [workflow, setWorkflow] = useState<Workflow>({
    id: 'new',
    name: 'New Workflow',
    enabled: false,
    trigger: {
      type: 'lead_created',
      config: {},
    },
    conditions: [],
    actions: [],
    stats: {
      triggered: 0,
      succeeded: 0,
      failed: 0,
    },
  });
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Load workflow if editing
  const { data: existingWorkflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => workflowsAPI.getById(workflowId!),
    enabled: !!workflowId,
  });

  useEffect(() => {
    if (existingWorkflow) {
      // Map backend workflow to frontend format
      setWorkflow({
        id: String(existingWorkflow.id),
        name: existingWorkflow.name,
        description: existingWorkflow.description,
        enabled: existingWorkflow.is_active,
        trigger: {
          type: existingWorkflow.trigger_type as TriggerType,
          config: existingWorkflow.flow_definition || {},
        },
        conditions: [],
        actions: [],
        stats: { triggered: 0, succeeded: 0, failed: 0 },
      });
    }
  }, [existingWorkflow]);

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const data = {
        name: workflow.name,
        description: workflow.description,
        trigger_type: workflow.trigger.type,
        trigger_object: 'Lead', // Default to Lead
        flow_definition: {
          trigger: workflow.trigger,
          conditions: workflow.conditions,
          actions: workflow.actions,
        },
        is_active: isActive,
      };

      if (workflowId) {
        return workflowsAPI.update(workflowId, data);
      } else {
        return workflowsAPI.create(data);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
      if (!workflowId) {
        // Redirect to edit mode with the new ID
        window.history.pushState({}, '', `/workflows/${data.id}/edit`);
      }
    },
    onError: () => {
      setSaveStatus('Failed to save');
      setTimeout(() => setSaveStatus(''), 3000);
    },
  });

  const addCondition = () => {
    setWorkflow(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          field: 'status',
          operator: 'equals',
          value: '',
        },
      ],
    }));
  };

  const addAction = (type: ActionType) => {
    const newAction: WorkflowAction = {
      id: `action-${Date.now()}`,
      type,
      config: getDefaultActionConfig(type),
    };

    setWorkflow(prev => ({
      ...prev,
      actions: [...prev.actions, newAction],
    }));
  };

  const handleSaveDraft = () => {
    saveWorkflowMutation.mutate(false);
  };

  const handlePublish = () => {
    saveWorkflowMutation.mutate(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Automate your sales process</p>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus && (
            <span className="text-sm text-green-600 font-medium">{saveStatus}</span>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={workflow.enabled}
              onChange={(e) => setWorkflow(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm font-medium">Enabled</span>
          </label>

          <button
            onClick={handleSaveDraft}
            disabled={saveWorkflowMutation.isPending}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saveWorkflowMutation.isPending ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={saveWorkflowMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {saveWorkflowMutation.isPending ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Workflow Canvas */}
      <div className="bg-white rounded-lg border p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Trigger */}
          <div className="relative">
            <div className="flex items-center gap-3 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Trigger</h3>
                <select
                  value={workflow.trigger.type}
                  onChange={(e) =>
                    setWorkflow(prev => ({
                      ...prev,
                      trigger: { type: e.target.value as TriggerType, config: {} },
                    }))
                  }
                  className="mt-1 w-full px-3 py-1.5 border rounded text-sm"
                >
                  {Object.entries(triggerLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Connector */}
            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-300" />
          </div>

          {/* Conditions */}
          {workflow.conditions.length > 0 && (
            <div className="relative">
              <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-600 rounded-lg">
                    <GitBranch className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Conditions</h3>
                </div>

                <div className="space-y-2">
                  {workflow.conditions.map((condition, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded">
                      <select className="flex-1 px-2 py-1 border rounded text-sm">
                        <option>Status</option>
                        <option>Score</option>
                        <option>Source</option>
                      </select>
                      <select className="px-2 py-1 border rounded text-sm">
                        <option>equals</option>
                        <option>contains</option>
                        <option>greater than</option>
                      </select>
                      <input type="text" className="flex-1 px-2 py-1 border rounded text-sm" placeholder="Value" />
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connector */}
              <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-300" />
            </div>
          )}

          {/* Add Condition Button */}
          <div className="flex justify-center">
            <button
              onClick={addCondition}
              className="px-4 py-2 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Condition
            </button>
          </div>

          {/* Actions */}
          {workflow.actions.length > 0 && (
            <div className="space-y-3">
              {workflow.actions.map((action, idx) => (
                <div key={action.id} className="relative">
                  {idx > 0 && <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-300 -top-6" />}

                  <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{actionLabels[action.type]}</h4>
                      <p className="text-xs text-gray-600 mt-1">Configure action settings</p>
                    </div>
                    <button className="p-1 hover:bg-white rounded">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addAction('send_email')}
              className="py-3 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 text-sm flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
            <button
              onClick={() => addAction('create_task')}
              className="py-3 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Create Task
            </button>
            <button
              onClick={() => addAction('update_field')}
              className="py-3 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 text-sm flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Update Field
            </button>
            <button
              onClick={() => addAction('notify_slack')}
              className="py-3 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 text-sm flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Notify Slack
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600 mb-1">Times Triggered</p>
          <p className="text-2xl font-bold text-gray-900">{workflow.stats.triggered}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600 mb-1">Succeeded</p>
          <p className="text-2xl font-bold text-green-600">{workflow.stats.succeeded}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600 mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-600">{workflow.stats.failed}</p>
        </div>
      </div>
    </div>
  );
}

function getDefaultActionConfig(type: ActionType): any {
  switch (type) {
    case 'send_email':
      return { template: '', to: '' };
    case 'create_task':
      return { title: '', assignee: '' };
    case 'update_field':
      return { field: '', value: '' };
    case 'notify_slack':
      return { channel: '', message: '' };
    case 'webhook':
      return { url: '', method: 'POST' };
    case 'assign_owner':
      return { owner: '' };
    default:
      return {};
  }
}
