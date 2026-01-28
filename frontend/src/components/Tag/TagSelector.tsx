import { useQuery } from '@tanstack/react-query';
import { Tag, getTags } from '@/services/tags';
import { Select } from '@/components/ui/select';
import { TagChip } from './TagChip';

interface TagSelectorProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  className?: string;
}

export function TagSelector({ selectedTags, onChange, className = '' }: TagSelectorProps) {
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags()
  });

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <TagChip
            key={tag.id}
            tag={tag}
            onDelete={() => {
              onChange(selectedTags.filter((t) => t.id !== tag.id));
            }}
          />
        ))}
      </div>
      <Select
        items={tags}
        value={selectedTags}
        onChange={(tag) => {
          if (tag && !selectedTags.find((t) => t.id === tag.id)) {
            onChange([...selectedTags, tag]);
          }
        }}
        displayValue={(tag) => tag.name}
        placeholder="Select tags..."
      />
    </div>
  );
}
