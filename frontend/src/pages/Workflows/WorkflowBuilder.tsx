/**
 * 🎨 WORKFLOW VISUAL BUILDER
 *
 * A drag-and-drop workflow canvas that makes automation feel like art.
 * Inspired by: Zapier, n8n, but infinitely better integrated.
 *
 * Features:
 * - Visual node-based workflow design
 * - Drag-and-drop action blocks
 * - Live connection drawing
 * - Real-time collaboration (coming soon)
 * - Undo/redo support
 * - Auto-save
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsAPI, Workflow, WorkflowNode, WorkflowEdge } from '@/services/api/workflows';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/Badge';
import {
  Save, Play, ArrowLeft, Settings, Plus, Trash2, GitBranch,
  Mail, Database, Webhook, Clock, User, CheckCircle, Zap,
  MessageSquare, Calendar, FileText, Bell, Copy, Edit3,
  Loader2, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// NODE TYPES & TEMPLATES
// ============================================================================

interface NodeTemplate {
  type: string;
  label: string;
  icon: any;
  color: string;
  description: string;
  category: 'trigger' | 'action' | 'condition' | 'end';
}

const NODE_TEMPLATES: NodeTemplate[] = [
  // Triggers
  { type: 'record_created', label: 'Record Created', icon: Plus, color: 'bg-green-100 text-green-600', description: 'When a record is created', category: 'trigger' },
  { type: 'record_updated', label: 'Record Updated', icon: Edit3, color: 'bg-blue-100 text-blue-600', description: 'When a record is updated', category: 'trigger' },
  { type: 'field_changed', label: 'Field Changed', icon: GitBranch, color: 'bg-purple-100 text-purple-600', description: 'When a specific field changes', category: 'trigger' },
  { type: 'time_based', label: 'Time-Based', icon: Clock, color: 'bg-orange-100 text-orange-600', description: 'On a schedule', category: 'trigger' },

  // Actions
  { type: 'send_email', label: 'Send Email', icon: Mail, color: 'bg-blue-100 text-blue-600', description: 'Send an email to someone', category: 'action' },
  { type: 'update_field', label: 'Update Field', icon: Database, color: 'bg-indigo-100 text-indigo-600', description: 'Update a field value', category: 'action' },
  { type: 'create_task', label: 'Create Task', icon: CheckCircle, color: 'bg-green-100 text-green-600', description: 'Create a new task', category: 'action' },
  { type: 'send_notification', label: 'Send Notification', icon: Bell, color: 'bg-yellow-100 text-yellow-600', description: 'Send in-app notification', category: 'action' },
  { type: 'webhook', label: 'Call Webhook', icon: Webhook, color: 'bg-purple-100 text-purple-600', description: 'Call external API', category: 'action' },
  { type: 'assign_user', label: 'Assign User', icon: User, color: 'bg-pink-100 text-pink-600', description: 'Assign to a user', category: 'action' },

  // Conditions
  { type: 'condition', label: 'If/Then/Else', icon: GitBranch, color: 'bg-orange-100 text-orange-600', description: 'Conditional logic', category: 'condition' },
  { type: 'wait', label: 'Wait', icon: Clock, color: 'bg-gray-100 text-gray-600', description: 'Wait for a duration', category: 'condition' },
];

const NODE_W = 256;
const NODE_BODY_H = 96;

function templateCategory(type: string) {
  return NODE_TEMPLATES.find((t) => t.type === type)?.category;
}

/** Maps first trigger node to API WorkflowTriggerType */
function deriveTriggerType(nodes: WorkflowNode[]): string {
  const trigger = nodes.find((n) => templateCategory(n.type) === 'trigger');
  if (!trigger) return 'manual';
  const allowed = new Set([
    'record_created',
    'record_updated',
    'record_deleted',
    'field_changed',
    'time_based',
    'webhook',
    'manual',
  ]);
  return allowed.has(trigger.type) ? trigger.type : 'manual';
}

function normalizeFlowDefinition(flow: { nodes?: WorkflowNode[]; edges?: WorkflowEdge[] }) {
  const nodes = (flow.nodes || []).map((n) => ({
    id: String(n.id),
    type: String(n.type),
    label: String(n.label || 'Step'),
    position: {
      x: Number(n.position?.x ?? 0),
      y: Number(n.position?.y ?? 0),
    },
    data: typeof n.data === 'object' && n.data !== null ? { ...(n.data as object) } : {},
  }));
  const edges = (flow.edges || []).map((e) => {
    const edge: WorkflowEdge = {
      id: String(e.id),
      source: String(e.source),
      target: String(e.target),
    };
    if (e.label) edge.label = e.label;
    if (e.data && typeof e.data === 'object') edge.data = e.data;
    return edge;
  });
  return { nodes, edges };
}

function parseApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { detail?: unknown } } }).response?.data;
    const d = data?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d.map((x) => JSON.stringify(x)).join('; ');
  }
  if (err instanceof Error) return err.message;
  return 'Could not save workflow';
}

// ============================================================================
// WORKFLOW NODE COMPONENT (Make-style ports: in top+left, out bottom)
// ============================================================================

interface WorkflowNodeComponentProps {
  node: WorkflowNode;
  isSelected: boolean;
  connectionFromId: string | null;
  onCardClick: (event: React.MouseEvent, nodeId: string) => void;
  onInputPort: (targetNodeId: string) => void;
  onOutputPort: (sourceNodeId: string) => void;
  onDelete: () => void;
  onDragStart: (event: React.MouseEvent, nodeId: string) => void;
}

const WorkflowNodeComponent: React.FC<WorkflowNodeComponentProps> = ({
  node,
  isSelected,
  connectionFromId,
  onCardClick,
  onInputPort,
  onOutputPort,
  onDelete,
  onDragStart,
}) => {
  const template = NODE_TEMPLATES.find((t) => t.type === node.type);
  const Icon = template?.icon || Zap;
  const highlightIn =
    connectionFromId && connectionFromId !== node.id ? 'ring-2 ring-amber-400 ring-offset-1' : '';
  const highlightOut = connectionFromId === node.id ? 'ring-2 ring-green-500 ring-offset-1' : '';

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className={`absolute cursor-default ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-xl' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: NODE_W,
      }}
      onClick={(e) => onCardClick(e, node.id)}
      onMouseDown={(e) => onDragStart(e, node.id)}
    >
      <Card className="relative w-64 shadow-lg hover:shadow-xl transition-all pointer-events-auto">
        <CardContent className="p-4 relative">
          {/* Input — top (incoming) */}
          <button
            type="button"
            data-workflow-port="in-top"
            title="Input: connect to this step"
            className={`absolute -top-2 left-1/2 z-20 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-blue-500 shadow transition hover:scale-110 ${highlightIn}`}
            onClick={(e) => {
              e.stopPropagation();
              onInputPort(node.id);
            }}
          />
          {/* Input — left (merge / branch in) */}
          <button
            type="button"
            data-workflow-port="in-left"
            title="Input: alternate entry"
            className={`absolute left-[-10px] top-1/2 z-20 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500 shadow transition hover:scale-110 ${highlightIn}`}
            onClick={(e) => {
              e.stopPropagation();
              onInputPort(node.id);
            }}
          />
          {/* Output — bottom (outgoing) */}
          <button
            type="button"
            data-workflow-port="out"
            title="Output: click then click another step’s top or left input"
            className={`absolute -bottom-2 left-1/2 z-20 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-blue-600 shadow transition hover:scale-110 ${highlightOut}`}
            onClick={(e) => {
              e.stopPropagation();
              onOutputPort(node.id);
            }}
          />

          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${template?.color || 'bg-gray-100'}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{node.label}</h4>
              <p className="text-xs text-gray-500 mt-1">{template?.description}</p>
              {node.data && Object.keys(node.data).length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  {Object.keys(node.data).filter((k) => node.data[k] !== '' && node.data[k] != null).length}{' '}
                  field(s) set
                </div>
              )}
            </div>
            {isSelected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ============================================================================
// MAIN WORKFLOW BUILDER COMPONENT
// ============================================================================

function NodeConfigEditor({
  node,
  onChange,
}: {
  node: WorkflowNode;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const d = (node.data || {}) as Record<string, unknown>;
  const val = (k: string) => (d[k] != null ? String(d[k]) : '');
  const setField = (key: string, value: unknown) => onChange({ ...d, [key]: value });

  const commonObject = (
    <div>
      <Label className="text-xs">Record type</Label>
      <select
        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-600"
        value={val('object_type') || 'lead'}
        onChange={(e) => setField('object_type', e.target.value)}
      >
        <option value="lead">Lead</option>
        <option value="deal">Deal</option>
        <option value="contact">Contact</option>
        <option value="account">Account</option>
      </select>
    </div>
  );

  switch (node.type) {
    case 'record_created':
    case 'record_updated':
    case 'field_changed':
      return (
        <div className="space-y-3">
          {commonObject}
          {node.type === 'field_changed' && (
            <div>
              <Label className="text-xs">Field name</Label>
              <Input
                className="mt-1"
                placeholder="e.g. status"
                value={val('field_name')}
                onChange={(e) => setField('field_name', e.target.value)}
              />
            </div>
          )}
        </div>
      );
    case 'send_email':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">To (email or merge field)</Label>
            <Input
              className="mt-1"
              value={val('to')}
              onChange={(e) => setField('to', e.target.value)}
              placeholder="{{lead.email}}"
            />
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input className="mt-1" value={val('subject')} onChange={(e) => setField('subject', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Body</Label>
            <Textarea
              className="mt-1 min-h-[100px]"
              value={val('body')}
              onChange={(e) => setField('body', e.target.value)}
            />
          </div>
        </div>
      );
    case 'webhook':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">URL</Label>
            <Input className="mt-1" type="url" value={val('url')} onChange={(e) => setField('url', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Method</Label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
              value={val('method') || 'POST'}
              onChange={(e) => setField('method', e.target.value)}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
            </select>
          </div>
        </div>
      );
    case 'update_field':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Field</Label>
            <Input className="mt-1" value={val('field')} onChange={(e) => setField('field', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Value</Label>
            <Input className="mt-1" value={val('value')} onChange={(e) => setField('value', e.target.value)} />
          </div>
        </div>
      );
    case 'condition':
      return (
        <div>
          <Label className="text-xs">Condition (expression)</Label>
          <Textarea
            className="mt-1 min-h-[88px] font-mono text-xs"
            value={val('expression')}
            onChange={(e) => setField('expression', e.target.value)}
            placeholder="e.g. lead.stage == 'qualified'"
          />
        </div>
      );
    case 'wait':
      return (
        <div>
          <Label className="text-xs">Wait (minutes)</Label>
          <Input
            type="number"
            min={1}
            className="mt-1"
            value={val('minutes') || '5'}
            onChange={(e) => setField('minutes', Number(e.target.value))}
          />
        </div>
      );
    case 'time_based':
      return (
        <div>
          <Label className="text-xs">Cron / schedule (human-readable)</Label>
          <Input
            className="mt-1"
            value={val('schedule')}
            onChange={(e) => setField('schedule', e.target.value)}
            placeholder="0 9 * * MON"
          />
        </div>
      );
    default:
      return (
        <div>
          <Label className="text-xs">Notes (stored on this step)</Label>
          <Textarea
            className="mt-1 min-h-[80px] text-sm"
            value={val('notes')}
            onChange={(e) => setField('notes', e.target.value)}
          />
        </div>
      );
  }
}

export const WorkflowBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [workflow, setWorkflow] = useState<Partial<Workflow>>({
    name: 'Untitled Workflow',
    description: '',
    trigger_type: 'manual',
    trigger_object: 'lead',
    flow_definition: {
      nodes: [],
      edges: []
    },
    is_active: false
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectionFromId, setConnectionFromId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Fetch existing workflow if editing
  const { data: existingWorkflow, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowsAPI.getById(Number(id)),
    enabled: !!id && id !== 'new'
  });

  useEffect(() => {
    if (existingWorkflow) {
      setWorkflow(existingWorkflow);
    }
  }, [existingWorkflow]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConnectionFromId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Save mutation — payload matches FastAPI WorkflowCreate / WorkflowUpdate
  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = workflow.flow_definition || { nodes: [], edges: [] };
      const flow = normalizeFlowDefinition(fd);
      const trigger_type = deriveTriggerType(flow.nodes as WorkflowNode[]);
      const baseName = (workflow.name || 'Untitled Workflow').trim() || 'Untitled Workflow';

      if (id && id !== 'new') {
        return workflowsAPI.update(Number(id), {
          name: baseName,
          description: workflow.description || undefined,
          trigger_type: trigger_type as Workflow['trigger_type'],
          trigger_object: workflow.trigger_object || 'lead',
          flow_definition: flow as Workflow['flow_definition'],
          is_active: !!workflow.is_active,
        });
      }

      return workflowsAPI.create({
        name: baseName,
        description: workflow.description || undefined,
        trigger_type,
        trigger_object: workflow.trigger_object || 'lead',
        flow_definition: flow as Workflow['flow_definition'],
        is_active: false,
        status: 'draft',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Saved',
        description: 'Workflow saved successfully.',
      });
      if (id === 'new') {
        navigate(`/workflows/${data.id}`);
      }
    },
    onError: (error: unknown) => {
      toast({
        title: 'Could not save',
        description: parseApiError(error),
        variant: 'destructive',
      });
    },
  });

  // ============================================================================
  // NODE OPERATIONS
  // ============================================================================

  const addNode = useCallback((template: NodeTemplate) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: template.type,
      label: template.label,
      position: {
        x: 400 + Math.random() * 100,
        y: 200 + Math.random() * 100
      },
      data: {}
    };

    setWorkflow(prev => ({
      ...prev,
      flow_definition: {
        nodes: [...(prev.flow_definition?.nodes || []), newNode],
        edges: prev.flow_definition?.edges || []
      }
    }));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      flow_definition: {
        nodes: (prev.flow_definition?.nodes || []).filter(n => n.id !== nodeId),
        edges: (prev.flow_definition?.edges || []).filter(e => e.source !== nodeId && e.target !== nodeId)
      }
    }));
    setSelectedNodeId(null);
  }, []);

  const updateNode = useCallback((nodeId: string, patch: { label?: string; data?: Record<string, unknown> }) => {
    setWorkflow(prev => ({
      ...prev,
      flow_definition: {
        nodes: (prev.flow_definition?.nodes || []).map((n) => {
          if (n.id !== nodeId) return n;
          return {
            ...n,
            ...(patch.label !== undefined ? { label: patch.label } : {}),
            data:
              patch.data !== undefined
                ? { ...n.data, ...patch.data }
                : n.data,
          };
        }),
        edges: prev.flow_definition?.edges || [],
      },
    }));
  }, []);

  const selectedNode = workflow.flow_definition?.nodes?.find(n => n.id === selectedNodeId);

  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setWorkflow(prev => ({
      ...prev,
      flow_definition: {
        nodes: (prev.flow_definition?.nodes || []).map(n => n.id === nodeId ? { ...n, position: { x, y } } : n),
        edges: prev.flow_definition?.edges || []
      }
    }));
  }, []);

  const addEdge = useCallback((from: string, to: string) => {
    if (from === to) return;
    const edgeId = `edge-${from}-${to}`;
    setWorkflow((prev) => {
      const edges = prev.flow_definition?.edges || [];
      if (edges.some((e) => e.id === edgeId || (e.source === from && e.target === to))) return prev;
      return {
        ...prev,
        flow_definition: {
          nodes: prev.flow_definition?.nodes || [],
          edges: [...edges, { id: edgeId, source: from, target: to }],
        },
      };
    });
  }, []);

  const handleOutputPort = useCallback(
    (nodeId: string) => {
      setConnectionFromId(nodeId);
      setSelectedNodeId(nodeId);
      toast({
        title: 'Connection started',
        description: 'Click the top or left blue input on another step to complete the link.',
      });
    },
    [toast],
  );

  const handleInputPort = useCallback(
    (targetId: string) => {
      if (connectionFromId && connectionFromId !== targetId) {
        addEdge(connectionFromId, targetId);
        setConnectionFromId(null);
        toast({ title: 'Connected', description: 'Steps are linked.' });
        setSelectedNodeId(targetId);
        return;
      }
      setSelectedNodeId(targetId);
    },
    [connectionFromId, addEdge, toast],
  );

  const handleDragStart = useCallback((event: React.MouseEvent, nodeId: string) => {
    if ((event.target as HTMLElement).closest('[data-workflow-port]')) return;
    const node = workflow.flow_definition?.nodes?.find(n => n.id === nodeId);
    if (!node) return;
    event.preventDefault();
    event.stopPropagation();
    setDraggingNodeId(nodeId);
    setDragOffset({ x: event.clientX - node.position.x, y: event.clientY - node.position.y });
  }, [workflow.flow_definition?.nodes]);

  const handleCanvasMove = useCallback((event: React.MouseEvent) => {
    if (!draggingNodeId) return;
    updateNodePosition(draggingNodeId, Math.max(0, event.clientX - dragOffset.x), Math.max(0, event.clientY - dragOffset.y));
  }, [draggingNodeId, dragOffset, updateNodePosition]);

  const handleNodeClick = useCallback((event: React.MouseEvent, nodeId: string) => {
    if ((event.target as HTMLElement).closest('[data-workflow-port]')) return;
    if (event.shiftKey && selectedNodeId && selectedNodeId !== nodeId) {
      event.preventDefault();
      event.stopPropagation();
      addEdge(selectedNodeId, nodeId);
      toast({ title: 'Linked (Shift)', description: 'Shortcut: Shift+click between cards.' });
      return;
    }
    setSelectedNodeId(nodeId);
  }, [selectedNodeId, addEdge, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <Input
                value={workflow.name}
                onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                className="text-xl font-bold border-none focus:ring-0 px-2"
                placeholder="Workflow Name"
              />
              <Input
                value={workflow.description || ''}
                onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
                className="text-sm text-gray-600 border-none focus:ring-0 px-2 mt-1"
                placeholder="Add a description..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
              {workflow.is_active ? 'Active' : 'Draft'}
            </Badge>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            <Button variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Action Palette */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-4">
          <p className="text-xs text-gray-600 mb-3 rounded-md bg-blue-50 border border-blue-100 px-3 py-2">
            <strong>Connect:</strong> click the <span className="font-medium text-blue-700">bottom</span> blue port on a
            step, then click the <span className="font-medium text-blue-700">top or left</span> input on the next step.
            Press <kbd className="rounded bg-white px-1">Esc</kbd> to cancel. Optional:{' '}
            <kbd className="rounded bg-white px-1">Shift</kbd>+click between two cards.
          </p>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Actions & Triggers</h3>

          {/* Triggers */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Triggers</p>
            <div className="space-y-2">
              {NODE_TEMPLATES.filter(t => t.category === 'trigger').map(template => {
                const Icon = template.icon;
                return (
                  <motion.div
                    key={template.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addNode(template)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${template.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{template.label}</p>
                            <p className="text-xs text-gray-500">{template.description}</p>
                          </div>
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Actions</p>
            <div className="space-y-2">
              {NODE_TEMPLATES.filter(t => t.category === 'action').map(template => {
                const Icon = template.icon;
                return (
                  <motion.div
                    key={template.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addNode(template)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${template.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{template.label}</p>
                            <p className="text-xs text-gray-500">{template.description}</p>
                          </div>
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Logic</p>
            <div className="space-y-2">
              {NODE_TEMPLATES.filter(t => t.category === 'condition').map(template => {
                const Icon = template.icon;
                return (
                  <motion.div
                    key={template.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addNode(template)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${template.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{template.label}</p>
                            <p className="text-xs text-gray-500">{template.description}</p>
                          </div>
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div
          role="presentation"
          className="flex-1 relative overflow-hidden bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"
          onMouseMove={handleCanvasMove}
          onMouseUp={() => setDraggingNodeId(null)}
          onMouseLeave={() => setDraggingNodeId(null)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConnectionFromId(null);
          }}
        >
          <svg className="absolute inset-0 pointer-events-none h-full w-full" aria-hidden>
            {(workflow.flow_definition?.edges || []).map((edge) => {
              const source = workflow.flow_definition?.nodes?.find((n) => n.id === edge.source);
              const target = workflow.flow_definition?.nodes?.find((n) => n.id === edge.target);
              if (!source || !target) return null;
              const x1 = source.position.x + NODE_W / 2;
              const y1 = source.position.y + NODE_BODY_H;
              const x2 = target.position.x + NODE_W / 2;
              const y2 = target.position.y;
              return (
                <line
                  key={edge.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#2563eb"
                  strokeWidth="2"
                  markerEnd="url(#workflow-arrow)"
                />
              );
            })}
            <defs>
              <marker id="workflow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#2563eb" />
              </marker>
            </defs>
          </svg>
          <AnimatePresence>
            {workflow.flow_definition?.nodes?.map(node => (
              <WorkflowNodeComponent
                key={node.id}
                node={node}
                isSelected={node.id === selectedNodeId}
                connectionFromId={connectionFromId}
                onCardClick={handleNodeClick}
                onInputPort={handleInputPort}
                onOutputPort={handleOutputPort}
                onDelete={() => deleteNode(node.id)}
                onDragStart={handleDragStart}
              />
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {(!workflow.flow_definition?.nodes || workflow.flow_definition.nodes.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md">
                <Zap className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Building Your Workflow</h3>
                <p className="text-gray-500 mb-6">
                  Add steps from the left, then use the blue ports: output (bottom) → input (top or left) on the next
                  step.
                </p>
                <Button onClick={() => addNode(NODE_TEMPLATES[0])}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Action
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="w-96 bg-white border-l border-gray-200 overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Node Properties</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNodeId(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Node Type</Label>
                <div className="mt-1 text-sm text-gray-600">{selectedNode.type}</div>
              </div>

              <div>
                <Label>Label</Label>
                <Input
                  value={selectedNode.label}
                  onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Configuration</Label>
                <div className="mt-2">
                  <NodeConfigEditor
                    node={selectedNode}
                    onChange={(data) => updateNode(selectedNode.id, { data })}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;
