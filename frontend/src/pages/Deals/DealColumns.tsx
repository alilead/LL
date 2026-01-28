import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings2 } from 'lucide-react';

export type Deal = {
  id: number;
  title: string;
  description?: string;
  value: number;
  stage: string;
  probability: number;
  expected_close_date?: string;
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, any>;
};

export type CustomColumn = {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
};

export const useCustomColumns = () => {
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>(() => {
    const saved = localStorage.getItem('dealCustomColumns');
    return saved ? JSON.parse(saved) : [];
  });

  const addCustomColumn = (column: CustomColumn) => {
    setCustomColumns(prev => {
      const updated = [...prev, column];
      localStorage.setItem('dealCustomColumns', JSON.stringify(updated));
      return updated;
    });
  };

  const removeCustomColumn = (columnId: string) => {
    setCustomColumns(prev => {
      const updated = prev.filter(col => col.id !== columnId);
      localStorage.setItem('dealCustomColumns', JSON.stringify(updated));
      return updated;
    });
  };

  return {
    customColumns,
    addCustomColumn,
    removeCustomColumn,
  };
};

export const getDefaultColumns = (): ColumnDef<Deal>[] => [
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'value',
    header: 'Value',
    cell: ({ row }) => {
      const value = row.getValue('value');
      return value ? `$${Number(value).toLocaleString()}` : '';
    },
  },
  {
    accessorKey: 'stage',
    header: 'Stage',
  },
  {
    accessorKey: 'probability',
    header: 'Probability',
    cell: ({ row }) => {
      const probability = row.getValue('probability');
      return probability ? `${probability}%` : '';
    },
  },
  {
    accessorKey: 'expected_close_date',
    header: 'Expected Close',
    cell: ({ row }) => {
      const date = row.getValue('expected_close_date');
      return date ? new Date(date as string).toLocaleDateString() : '';
    },
  },
];
