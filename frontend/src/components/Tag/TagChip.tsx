import React from 'react';
import { Tag } from '@/services/api';

interface TagChipProps {
  tag: Tag;
  onDelete?: () => void;
  clickable?: boolean;
  onClick?: () => void;
}

const TagChip: React.FC<TagChipProps> = ({ tag, onDelete, clickable = false, onClick }) => {
  const defaultColor = '#3B82F6'; // Default blue color
  
  return (
    <div
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${clickable ? 'cursor-pointer' : ''}`}
      style={{
        backgroundColor: `${defaultColor}20`, // 20% opacity
        color: defaultColor,
        border: `1px solid ${defaultColor}40` // 40% opacity
      }}
      onClick={clickable ? onClick : undefined}
    >
      {tag.name}
      {onDelete && (
        <button
          type="button"
          className="ml-1 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default TagChip;
