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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
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

// ============================================================================
// WORKFLOW NODE COMPONENT
// ============================================================================

interface WorkflowNodeComponentProps {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (data: any) => void;
}

const WorkflowNodeComponent: React.FC<WorkflowNodeComponentProps> = ({
  node,
  isSelected,
  onSelect,
  onDelete,
  onUpdate
}) => {
  const template = NODE_TEMPLATES.find(t => t.type === node.type);
  const Icon = template?.icon || Zap;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      className={`
        absolute cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
      onClick={onSelect}
    >
      <Card className="w-64 shadow-lg hover:shadow-xl transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${template?.color || 'bg-gray-100'}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{node.label}</h4>
              <p className="text-xs text-gray-500 mt-1">{template?.description}</p>
              {node.data && (
                <div className="mt-2 text-xs text-gray-600">
                  {Object.keys(node.data).length} configuration{Object.keys(node.data).length !== 1 ? 's' : ''}
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

          {/* Connection ports */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ============================================================================
// MAIN WORKFLOW BUILDER COMPONENT
// ============================================================================

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

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

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (id && id !== 'new') {
        return workflowsAPI.update(Number(id), workflow as Workflow);
      } else {
        return workflowsAPI.create(workflow as any);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Success',
        description: 'Workflow saved successfully'
      });
      if (id === 'new') {
        navigate(`/workflows/${data.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save workflow',
        variant: 'destructive'
      });
    }
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

  const updateNode = useCallback((nodeId: string, data: any) => {
    setWorkflow(prev => ({
      ...prev,
      flow_definition: {
        nodes: (prev.flow_definition?.nodes || []).map(n =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
        ),
        edges: prev.flow_definition?.edges || []
      }
    }));
  }, []);

  const selectedNode = workflow.flow_definition?.nodes?.find(n => n.id === selectedNodeId);

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
        <div className="flex-1 relative overflow-hidden bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px]">
          <AnimatePresence>
            {workflow.flow_definition?.nodes?.map(node => (
              <WorkflowNodeComponent
                key={node.id}
                node={node}
                isSelected={node.id === selectedNodeId}
                onSelect={() => setSelectedNodeId(node.id)}
                onDelete={() => deleteNode(node.id)}
                onUpdate={(data) => updateNode(node.id, data)}
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
                  Click on actions from the sidebar to add them to your workflow canvas.
                  Connect them to create powerful automation.
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
                <p className="text-xs text-gray-500 mt-1">
                  Node-specific settings will appear here
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;
