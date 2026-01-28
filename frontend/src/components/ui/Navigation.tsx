import React, { forwardRef, useState, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown, Menu, X, Home, User, Settings, LogOut } from 'lucide-react'

// Navigation Item Interface
export interface NavigationItem {
  id: string
  label: string
  href?: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
  active?: boolean
  children?: NavigationItem[]
  onClick?: () => void
}

// Navigation Props
export interface NavigationProps {
  items: NavigationItem[]
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'pills' | 'underline' | 'sidebar'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onItemClick?: (item: NavigationItem) => void
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const navigationVariants = {
  default: {
    container: 'bg-white border-b border-gray-200',
    item: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
    activeItem: 'text-blue-600 bg-blue-50 border-blue-600'
  },
  pills: {
    container: 'bg-transparent',
    item: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md',
    activeItem: 'text-white bg-blue-600 rounded-md'
  },
  underline: {
    container: 'bg-transparent border-b border-gray-200',
    item: 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300',
    activeItem: 'text-blue-600 border-b-2 border-blue-600'
  },
  sidebar: {
    container: 'bg-gray-50 border-r border-gray-200',
    item: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md',
    activeItem: 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
  }
}

const navigationSizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}

// Main Navigation Component
export const Navigation = forwardRef<HTMLElement, NavigationProps>(
  ({
    items,
    orientation = 'horizontal',
    variant = 'default',
    size = 'md',
    className,
    onItemClick,
    collapsible = false,
    defaultCollapsed = false
  }, ref) => {
    const [collapsed, setCollapsed] = useState(defaultCollapsed)
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

    const handleItemClick = (item: NavigationItem) => {
      if (item.children && item.children.length > 0) {
        const newExpanded = new Set(expandedItems)
        if (newExpanded.has(item.id)) {
          newExpanded.delete(item.id)
        } else {
          newExpanded.add(item.id)
        }
        setExpandedItems(newExpanded)
      }
      
      item.onClick?.()
      onItemClick?.(item)
    }

    const renderNavigationItem = (item: NavigationItem, level = 0) => {
      const hasChildren = item.children && item.children.length > 0
      const isExpanded = expandedItems.has(item.id)
      const itemVariant = navigationVariants[variant]

      return (
        <div key={item.id} className={cn(level > 0 && 'ml-4')}>
          <div
            className={cn(
              'flex items-center justify-between cursor-pointer transition-colors',
              navigationSizes[size],
              itemVariant.item,
              item.active && itemVariant.activeItem,
              item.disabled && 'opacity-50 cursor-not-allowed',
              orientation === 'horizontal' && 'inline-flex',
              variant === 'underline' && orientation === 'horizontal' && 'border-b-2'
            )}
            onClick={() => !item.disabled && handleItemClick(item)}
          >
            <div className="flex items-center space-x-2">
              {item.icon && (
                <span className={cn(
                  'flex-shrink-0',
                  collapsed && orientation === 'vertical' && 'mx-auto'
                )}>
                  {item.icon}
                </span>
              )}
              {(!collapsed || orientation === 'horizontal') && (
                <span className="font-medium">{item.label}</span>
              )}
              {item.badge && (!collapsed || orientation === 'horizontal') && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {item.badge}
                </span>
              )}
            </div>
            {hasChildren && (!collapsed || orientation === 'horizontal') && (
              <ChevronDown 
                className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'transform rotate-180'
                )}
              />
            )}
          </div>
          
          {hasChildren && isExpanded && (!collapsed || orientation === 'horizontal') && (
            <div className={cn(
              'mt-1 space-y-1',
              orientation === 'horizontal' && 'absolute top-full left-0 bg-white border border-gray-200 rounded-md shadow-lg min-w-48 p-2'
            )}>
              {item.children!.map(child => renderNavigationItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <nav
        ref={ref}
        className={cn(
          'relative',
          navigationVariants[variant].container,
          orientation === 'horizontal' ? 'flex items-center space-x-1' : 'flex flex-col space-y-1 p-4',
          collapsed && orientation === 'vertical' && 'w-16',
          className
        )}
      >
        {collapsible && orientation === 'vertical' && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mb-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        )}
        
        {items.map(item => renderNavigationItem(item))}
      </nav>
    )
  }
)

Navigation.displayName = 'Navigation'

// Pagination Component
export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPrevNext?: boolean
  maxVisiblePages?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  ({
    currentPage,
    totalPages,
    onPageChange,
    showFirstLast = true,
    showPrevNext = true,
    maxVisiblePages = 5,
    size = 'md',
    className
  }, ref) => {
    const getVisiblePages = () => {
      const pages = []
      const halfVisible = Math.floor(maxVisiblePages / 2)
      
      let startPage = Math.max(1, currentPage - halfVisible)
      let endPage = Math.min(totalPages, currentPage + halfVisible)
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        if (startPage === 1) {
          endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
        } else {
          startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      return pages
    }

    const paginationSizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-2 text-base'
    }

    const buttonClass = cn(
      'inline-flex items-center border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 transition-colors',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      paginationSizes[size]
    )

    const activeButtonClass = cn(
      buttonClass,
      'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
    )

    return (
      <nav ref={ref} className={cn('flex items-center justify-center space-x-1', className)}>
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={buttonClass}
          >
            First
          </button>
        )}
        
        {showPrevNext && (
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={buttonClass}
          >
            Previous
          </button>
        )}
        
        {getVisiblePages().map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={page === currentPage ? activeButtonClass : buttonClass}
          >
            {page}
          </button>
        ))}
        
        {showPrevNext && (
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={buttonClass}
          >
            Next
          </button>
        )}
        
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={buttonClass}
          >
            Last
          </button>
        )}
      </nav>
    )
  }
)

Pagination.displayName = 'Pagination'