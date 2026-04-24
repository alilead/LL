// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bezierPath, deriveTriggerType, migrateLegacyFlow } from './mindMapUtils';

describe('mindMapUtils', () => {
  it('derives trigger type from first trigger node', () => {
    const t = deriveTriggerType([
      { id: 'a', type: 'free_text', label: 'n', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', type: 'record_updated', label: 'n', position: { x: 0, y: 0 }, data: {} },
    ]);
    expect(t).toBe('record_updated');
  });

  it('falls back to manual trigger type', () => {
    const t = deriveTriggerType([{ id: 'a', type: 'send_email', label: 'n', position: { x: 0, y: 0 }, data: {} }]);
    expect(t).toBe('manual');
  });

  it('migrates legacy flow and fills defaults', () => {
    const migrated = migrateLegacyFlow({
      nodes: [{ id: 1 as any, type: '', label: '', position: { x: 2, y: 3 }, data: null as any }],
      edges: [{ id: 9 as any, source: 1 as any, target: 2 as any }],
    } as any);
    expect(migrated.nodes[0].id).toBe('1');
    expect(migrated.nodes[0].label).toBe('Untitled');
    expect(migrated.nodes[0].type).toBe('free_text');
    expect(migrated.edges[0].source).toBe('1');
  });

  it('builds cubic bezier path', () => {
    const d = bezierPath(10, 20, 100, 120);
    expect(d.startsWith('M 10 20 C')).toBe(true);
  });
});
