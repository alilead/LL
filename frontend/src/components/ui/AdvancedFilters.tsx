/**
 * Advanced Filter System - Save & Share Filters!
 *
 * SALESFORCE: Basic filters, can't save them, rebuild every time (PAINFUL!)
 * LEADLAB: Build once → Save → Share with team → Never rebuild! (GENIUS!)
 *
 * Power users will cry tears of joy!
 */

import { useState, useCallback } from 'react';
import {
  Filter,
  Plus,
  X,
  Save,
  Share2,
  Star,
  Trash2,
  ChevronDown,
  Calendar,
  DollarSign,
  Hash,
  Type,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './Dropdown';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty';

export type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  options?: { value: string; label: string }[]; // For select type
}

export interface FilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  rules: FilterRule[];
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: FilterGroup[];
  isPublic: boolean;
  isFavorite: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const operatorsByType: Record<FilterFieldType, FilterOperator[]> = {
  text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
  number: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'between'],
  date: ['equals', 'not_equals', 'greater_than', 'less_than', 'between'],
  select: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty'],
  boolean: ['equals'],
};

const operatorLabels: Record<FilterOperator, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  greater_than: 'greater than',
  less_than: 'less than',
  greater_or_equal: 'greater or equal',
  less_or_equal: 'less or equal',
  between: 'between',
  in: 'is one of',
  not_in: 'is not one of',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

interface AdvancedFiltersProps {
  fields: FilterField[];
  onApply: (filters: FilterGroup[]) => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (filter: Omit<SavedFilter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteFilter?: (filterId: string) => void;
  onToggleFavorite?: (filterId: string) => void;
  className?: string;
}

export function AdvancedFilters({
  fields,
  onApply,
  savedFilters = [],
  onSaveFilter,
  onDeleteFilter,
  onToggleFavorite,
  className,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: '1', logic: 'AND', rules: [] },
  ]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Add new rule to group
  const addRule = (groupId: string) => {
    setFilterGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              rules: [
                ...group.rules,
                {
                  id: `${Date.now()}-${Math.random()}`,
                  field: fields[0].key,
                  operator: operatorsByType[fields[0].type][0],
                  value: '',
                },
              ],
            }
          : group
      )
    );
  };

  // Remove rule
  const removeRule = (groupId: string, ruleId: string) => {
    setFilterGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? { ...group, rules: group.rules.filter(r => r.id !== ruleId) }
          : group
      )
    );
  };

  // Update rule
  const updateRule = (groupId: string, ruleId: string, updates: Partial<FilterRule>) => {
    setFilterGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              rules: group.rules.map(rule =>
                rule.id === ruleId ? { ...rule, ...updates } : rule
              ),
            }
          : group
      )
    );
  };

  // Add filter group
  const addGroup = () => {
    setFilterGroups(prev => [
      ...prev,
      { id: `${Date.now()}`, logic: 'AND', rules: [] },
    ]);
  };

  // Remove filter group
  const removeGroup = (groupId: string) => {
    setFilterGroups(prev => prev.filter(g => g.id !== groupId));
  };

  // Toggle group logic
  const toggleGroupLogic = (groupId: string) => {
    setFilterGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? { ...group, logic: group.logic === 'AND' ? 'OR' : 'AND' }
          : group
      )
    );
  };

  // Apply filters
  const handleApply = () => {
    const activeFilters = filterGroups.filter(g => g.rules.length > 0);
    onApply(activeFilters);
    setIsOpen(false);
  };

  // Clear all filters
  const handleClear = () => {
    setFilterGroups([{ id: '1', logic: 'AND', rules: [] }]);
  };

  // Save current filter
  const handleSave = () => {
    if (!onSaveFilter || !filterName) return;

    onSaveFilter({
      name: filterName,
      description: filterDescription,
      filters: filterGroups,
      isPublic,
      isFavorite: false,
      createdBy: 'current-user', // Replace with actual user
    });

    setFilterName('');
    setFilterDescription('');
    setIsPublic(false);
    setShowSaveDialog(false);
  };

  // Load saved filter
  const handleLoadFilter = (filter: SavedFilter) => {
    setFilterGroups(filter.filters);
    setIsOpen(true);
  };

  // Get field type
  const getFieldType = (fieldKey: string): FilterFieldType => {
    return fields.find(f => f.key === fieldKey)?.type || 'text';
  };

  // Get field options
  const getFieldOptions = (fieldKey: string) => {
    return fields.find(f => f.key === fieldKey)?.options || [];
  };

  // Count active filters
  const activeFilterCount = filterGroups.reduce(
    (sum, group) => sum + group.rules.length,
    0
  );

  return (
    <div className={className}>
      {/* Saved Filters Bar */}
      {savedFilters.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Saved Filters:</span>
          {savedFilters
            .filter(f => f.isFavorite)
            .map(filter => (
              <button
                key={filter.id}
                onClick={() => handleLoadFilter(filter)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm transition-colors"
              >
                <Star className="w-3 h-3 fill-current" />
                {filter.name}
              </button>
            ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm transition-colors">
                More <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {savedFilters.map(filter => (
                <DropdownMenuItem
                  key={filter.id}
                  onClick={() => handleLoadFilter(filter)}
                  className="flex items-center justify-between"
                >
                  <span>{filter.name}</span>
                  <div className="flex items-center gap-1">
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(filter.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Star
                          className={cn(
                            'w-3 h-3',
                            filter.isFavorite && 'fill-yellow-400 text-yellow-400'
                          )}
                        />
                      </button>
                    )}
                    {onDeleteFilter && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFilter(filter.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
          activeFilterCount > 0
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        )}
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-medium">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="mt-4 bg-white rounded-lg border shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Groups */}
          <div className="space-y-4">
            {filterGroups.map((group, groupIndex) => (
              <div key={group.id} className="border rounded-lg p-4">
                {/* Group Header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => toggleGroupLogic(group.id)}
                    className="px-3 py-1 rounded bg-gray-100 text-sm font-medium hover:bg-gray-200"
                  >
                    {group.logic}
                  </button>
                  {filterGroups.length > 1 && (
                    <button
                      onClick={() => removeGroup(group.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Rules */}
                <div className="space-y-2">
                  {group.rules.map((rule, ruleIndex) => {
                    const field = fields.find(f => f.key === rule.field);
                    const fieldType = field?.type || 'text';
                    const operators = operatorsByType[fieldType];

                    return (
                      <div key={rule.id} className="flex items-center gap-2">
                        {/* Field Select */}
                        <select
                          value={rule.field}
                          onChange={(e) => {
                            const newField = fields.find(f => f.key === e.target.value);
                            updateRule(group.id, rule.id, {
                              field: e.target.value,
                              operator: newField
                                ? operatorsByType[newField.type][0]
                                : rule.operator,
                            });
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg"
                        >
                          {fields.map(f => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </select>

                        {/* Operator Select */}
                        <select
                          value={rule.operator}
                          onChange={(e) =>
                            updateRule(group.id, rule.id, {
                              operator: e.target.value as FilterOperator,
                            })
                          }
                          className="flex-1 px-3 py-2 border rounded-lg"
                        >
                          {operators.map(op => (
                            <option key={op} value={op}>
                              {operatorLabels[op]}
                            </option>
                          ))}
                        </select>

                        {/* Value Input */}
                        {!['is_empty', 'is_not_empty'].includes(rule.operator) && (
                          <>
                            {fieldType === 'select' ? (
                              <select
                                value={rule.value}
                                onChange={(e) =>
                                  updateRule(group.id, rule.id, { value: e.target.value })
                                }
                                className="flex-1 px-3 py-2 border rounded-lg"
                              >
                                {getFieldOptions(rule.field).map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : fieldType === 'boolean' ? (
                              <select
                                value={rule.value}
                                onChange={(e) =>
                                  updateRule(group.id, rule.id, { value: e.target.value === 'true' })
                                }
                                className="flex-1 px-3 py-2 border rounded-lg"
                              >
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                            ) : (
                              <input
                                type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                                value={rule.value}
                                onChange={(e) =>
                                  updateRule(group.id, rule.id, { value: e.target.value })
                                }
                                className="flex-1 px-3 py-2 border rounded-lg"
                                placeholder="Value"
                              />
                            )}
                          </>
                        )}

                        {/* Remove Rule */}
                        <button
                          onClick={() => removeRule(group.id, rule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Rule */}
                <button
                  onClick={() => addRule(group.id)}
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4" />
                  Add condition
                </button>
              </div>
            ))}
          </div>

          {/* Add Group */}
          <button
            onClick={addGroup}
            className="mt-4 inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100"
          >
            <Plus className="w-4 h-4" />
            Add filter group
          </button>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>

            {onSaveFilter && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Save className="w-4 h-4" />
                Save Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="font-semibold text-lg mb-4">Save Filter</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="My Custom Filter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Describe what this filter is for..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isPublic" className="text-sm">
                  Share with team
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!filterName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Save Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
