import React from 'react';

/** Toggle markdown-style wrap (e.g. **bold**, *italic*). */
export function toggleMindMapWrap(text: string, marker: '**' | '*'): string {
  const trimmed = text.trim();
  if (trimmed.startsWith(marker) && trimmed.endsWith(marker) && trimmed.length > marker.length * 2) {
    return trimmed.slice(marker.length, -marker.length);
  }
  return `${marker}${text}${marker}`;
}

/** Parse lightweight **bold** and *italic* / _italic_ markers for canvas labels. */
export function parseMindMapLabel(text: string): React.ReactNode[] {
  if (!text) return [];

  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      nodes.push(
        <strong key={`b-${key++}`} className="font-semibold">
          {match[2]}
        </strong>,
      );
    } else {
      const italicText = match[3] ?? match[4];
      if (italicText !== undefined) {
        nodes.push(
          <em key={`i-${key++}`} className="italic">
            {italicText}
          </em>,
        );
      }
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : [text];
}

interface MindMapFormattedTextProps {
  text: string;
  className?: string;
}

export function MindMapFormattedText({ text, className }: MindMapFormattedTextProps) {
  return <span className={className}>{parseMindMapLabel(text)}</span>;
}
