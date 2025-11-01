import React, { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, forwardRef, useState, useMemo } from "react"
import { ChevronUp, ChevronDown, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { Input } from "./Input"

// Basic table components
const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
)
TableHeader.displayName = "TableHeader"

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
)
TableBody.displayName = "TableBody"

const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
)
TableCell.displayName = "TableCell"

// Advanced table interfaces
interface Column<T = any> {
  key: string
  title: string
  dataIndex?: string
  render?: (value: any, record: T, index: number) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
}

interface DataTableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    showSizeChanger?: boolean
    showQuickJumper?: boolean
    onChange?: (page: number, pageSize: number) => void
  }
  rowSelection?: {
    selectedRowKeys?: React.Key[]
    onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void
    getCheckboxProps?: (record: T) => { disabled?: boolean }
  }
  onRow?: (record: T, index: number) => {
    onClick?: () => void
    onDoubleClick?: () => void
    className?: string
  }
  scroll?: { x?: number | string; y?: number | string }
  size?: 'small' | 'middle' | 'large'
  bordered?: boolean
  showHeader?: boolean
  title?: () => React.ReactNode
  footer?: () => React.ReactNode
  expandable?: {
    expandedRowRender?: (record: T, index: number) => React.ReactNode
    expandedRowKeys?: React.Key[]
    onExpand?: (expanded: boolean, record: T) => void
  }
  className?: string
}

// Advanced DataTable component
const DataTable = <T extends Record<string, any>>({ 
  columns, 
  data, 
  loading = false,
  pagination,
  rowSelection,
  onRow,
  scroll,
  size = 'middle',
  bordered = false,
  showHeader = true,
  title,
  footer,
  expandable,
  className 
}: DataTableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [expandedRows, setExpandedRows] = useState<Set<React.Key>>(new Set())
  const [selectedRows, setSelectedRows] = useState<React.Key[]>(rowSelection?.selectedRowKeys || [])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig])

  // Filter data
  const filteredData = useMemo(() => {
    return sortedData.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true
        const itemValue = String(item[key] || '').toLowerCase()
        return itemValue.includes(value.toLowerCase())
      })
    })
  }, [sortedData, filters])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData
    const start = (pagination.current - 1) * pagination.pageSize
    return filteredData.slice(start, start + pagination.pageSize)
  }, [filteredData, pagination])

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null
      }
      return { key, direction: 'asc' }
    })
  }

  const handleFilter = (key: string, value: string) => {
    setFilters(current => ({ ...current, [key]: value }))
  }

  const handleRowSelect = (key: React.Key, selected: boolean) => {
    const newSelectedRows = selected 
      ? [...selectedRows, key]
      : selectedRows.filter(k => k !== key)
    
    setSelectedRows(newSelectedRows)
    rowSelection?.onChange?.(newSelectedRows, data.filter(item => newSelectedRows.includes(item.key || item.id)))
  }

  const handleSelectAll = (selected: boolean) => {
    const newSelectedRows = selected ? paginatedData.map(item => item.key || item.id) : []
    setSelectedRows(newSelectedRows)
    rowSelection?.onChange?.(newSelectedRows, selected ? paginatedData : [])
  }

  const toggleExpand = (key: React.Key) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(key)) {
      newExpandedRows.delete(key)
    } else {
      newExpandedRows.add(key)
    }
    setExpandedRows(newExpandedRows)
  }

  const sizeClasses = {
    small: 'text-xs',
    middle: 'text-sm',
    large: 'text-base'
  }

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <div className="mb-4">
          {title()}
        </div>
      )}
      
      <div className={cn(
        'relative w-full overflow-auto rounded-md border',
        bordered && 'border-border',
        sizeClasses[size]
      )}>
        <table className="w-full caption-bottom">
          {showHeader && (
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                {rowSelection && (
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border border-input"
                    />
                  </th>
                )}
                {expandable && (
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12" />
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'h-12 px-4 align-middle font-medium text-muted-foreground',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.sortable && 'cursor-pointer hover:bg-muted/50'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.title}
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp 
                            className={cn(
                              'h-3 w-3',
                              sortConfig?.key === column.key && sortConfig.direction === 'asc' 
                                ? 'text-foreground' 
                                : 'text-muted-foreground'
                            )} 
                          />
                          <ChevronDown 
                            className={cn(
                              'h-3 w-3 -mt-1',
                              sortConfig?.key === column.key && sortConfig.direction === 'desc' 
                                ? 'text-foreground' 
                                : 'text-muted-foreground'
                            )} 
                          />
                        </div>
                      )}
                      {column.filterable && (
                        <div className="relative">
                          <Filter className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {column.filterable && (
                      <div className="mt-2">
                        <Input
                          placeholder={`Filter ${column.title}`}
                          value={filters[column.key] || ''}
                          onChange={(e) => handleFilter(column.key, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="[&_tr:last-child]:border-0">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0)} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((record, index) => {
                const rowKey = record.key || record.id || index
                const rowProps = onRow?.(record, index) || {}
                const isExpanded = expandedRows.has(rowKey)
                const isSelected = selectedRows.includes(rowKey)
                
                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      className={cn(
                        'border-b transition-colors hover:bg-muted/50',
                        isSelected && 'bg-muted',
                        rowProps.className
                      )}
                      onClick={rowProps.onClick}
                      onDoubleClick={rowProps.onDoubleClick}
                    >
                      {rowSelection && (
                        <td className="p-4 align-middle w-12">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleRowSelect(rowKey, e.target.checked)}
                            disabled={rowSelection.getCheckboxProps?.(record)?.disabled}
                            className="rounded border border-input"
                          />
                        </td>
                      )}
                      {expandable && (
                        <td className="p-4 align-middle w-12">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(rowKey)}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronRight 
                              className={cn(
                                'h-4 w-4 transition-transform',
                                isExpanded && 'rotate-90'
                              )} 
                            />
                          </Button>
                        </td>
                      )}
                      {columns.map((column) => {
                        const value = column.dataIndex ? record[column.dataIndex] : record[column.key]
                        const cellContent = column.render ? column.render(value, record, index) : value
                        
                        return (
                          <td
                            key={column.key}
                            className={cn(
                              'p-4 align-middle',
                              column.align === 'center' && 'text-center',
                              column.align === 'right' && 'text-right'
                            )}
                            style={{ width: column.width }}
                          >
                            {cellContent}
                          </td>
                        )
                      })}
                    </tr>
                    {expandable && isExpanded && expandable.expandedRowRender && (
                      <tr>
                        <td colSpan={columns.length + (rowSelection ? 1 : 0) + 1} className="p-0">
                          <div className="p-4 bg-muted/25">
                            {expandable.expandedRowRender(record, index)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onChange?.(pagination.current - 1, pagination.pageSize)}
              disabled={pagination.current <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) }, (_, i) => i + 1)
                .filter(page => {
                  const current = pagination.current
                  return page === 1 || page === Math.ceil(pagination.total / pagination.pageSize) || 
                         (page >= current - 2 && page <= current + 2)
                })
                .map((page, index, array) => {
                  const showEllipsis = index > 0 && array[index - 1] !== page - 1
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-2">...</span>}
                      <Button
                        variant={page === pagination.current ? "default" : "outline"}
                        size="sm"
                        onClick={() => pagination.onChange?.(page, pagination.pageSize)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  )
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onChange?.(pagination.current + 1, pagination.pageSize)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {footer && (
        <div className="mt-4">
          {footer()}
        </div>
      )}
    </div>
  )
}

// Simple table for basic use cases
interface SimpleTableProps {
  headers: string[]
  rows: (string | React.ReactNode)[][]
  className?: string
  striped?: boolean
  hoverable?: boolean
  bordered?: boolean
}

const SimpleTable: React.FC<SimpleTableProps> = ({ 
  headers, 
  rows, 
  className, 
  striped = false, 
  hoverable = true, 
  bordered = false 
}) => {
  return (
    <div className={cn('relative w-full overflow-auto', bordered && 'rounded-md border', className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            {headers.map((header, index) => (
              <th key={index} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                'border-b transition-colors',
                hoverable && 'hover:bg-muted/50',
                striped && rowIndex % 2 === 1 && 'bg-muted/25'
              )}
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="p-4 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  DataTable,
  SimpleTable,
  type Column,
  type DataTableProps,
  type SimpleTableProps
}
