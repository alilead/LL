import { Workflow, WorkflowEdge, WorkflowNode } from '@/services/api/workflows';

export function deriveTriggerType(nodes: WorkflowNode[]): string {
  const first = nodes.find((n) => ['record_created', 'record_updated', 'field_changed', 'time_based', 'webhook'].includes(n.type));
  return first?.type || 'manual';
}

export function migrateLegacyFlow(flow: Workflow['flow_definition'] | undefined): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const rawNodes = flow?.nodes || [];
  const rawEdges = flow?.edges || [];
  const nodes = rawNodes.map((n) => ({
    id: String(n.id),
    type: String(n.type || 'free_text'),
    label: String(n.label || 'Untitled'),
    position: { x: Number(n.position?.x ?? 0), y: Number(n.position?.y ?? 0) },
    data: {
      ...(n.data || {}),
      kind: (n.data as any)?.kind || (n.type === 'free_text' ? 'free_text' : 'standard'),
    },
  }));
  const edges = rawEdges.map((e) => ({ id: String(e.id), source: String(e.source), target: String(e.target), label: e.label, data: e.data }));
  return { nodes, edges };
}

export function bezierPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const dx = Math.max(60, Math.abs(toX - fromX) * 0.45);
  return `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`;
}
