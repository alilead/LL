import { describe, expect, it } from 'vitest';
import { toggleMindMapWrap } from './mindMapTextFormat';

describe('toggleMindMapWrap', () => {
  it('wraps plain text with bold markers', () => {
    expect(toggleMindMapWrap('Hello', '**')).toBe('**Hello**');
  });

  it('unwraps text already wrapped in bold markers', () => {
    expect(toggleMindMapWrap('**Hello**', '**')).toBe('Hello');
  });

  it('wraps plain text with italic markers', () => {
    expect(toggleMindMapWrap('Note', '*')).toBe('*Note*');
  });

  it('unwraps italic-wrapped text', () => {
    expect(toggleMindMapWrap('*Note*', '*')).toBe('Note');
  });
});
