/**
 * Quick Actions Menu Component
 *
 * SALESFORCE: Hidden 3-dot menu → Click → Wait → Menu opens → Scroll to find action (5-8 clicks)
 * LEADLAB: Hover row → Actions appear instantly → Click action → Done (1-2 clicks)
 *
 * This is what power users dream about!
 */

import { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  Phone,
  Mail,
  Edit,
  Trash2,
  Archive,
  Copy,
  ExternalLink,
  Star,
  UserPlus,
  Calendar,
  MessageSquare,
  Download,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './Dropdown';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  shortcut?: string;
  disabled?: boolean;
  hidden?: boolean;
}

interface QuickActionsMenuProps {
  actions: QuickAction[];
  maxVisible?: number; // Number of actions to show inline before "More"
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showOnHover?: boolean; // Show actions on row hover
}

export function QuickActionsMenu({
  actions,
  maxVisible = 3,
  className,
  size = 'md',
  showOnHover = true,
}: QuickActionsMenuProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const visibleActions = actions.filter(a => !a.hidden).slice(0, maxVisible);
  const moreActions = actions.filter(a => !a.hidden).slice(maxVisible);

  const handleAction = async (action: QuickAction) => {
    if (action.disabled || isProcessing) return;

    try {
      setIsProcessing(action.id);
      await action.onClick();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleMouseEnter = () => {
    if (showOnHover) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsHovered(true), 100);
    }
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsHovered(false), 300);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const variantClasses = {
    default: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'hover:bg-destructive/10 hover:text-destructive',
    warning: 'hover:bg-yellow-500/10 hover:text-yellow-600',
    success: 'hover:bg-green-500/10 hover:text-green-600',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        showOnHover && !isHovered && 'opacity-0 group-hover:opacity-100',
        'transition-opacity duration-200',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Quick Action Buttons */}
      {visibleActions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleAction(action)}
          disabled={action.disabled || isProcessing === action.id}
          className={cn(
            'inline-flex items-center justify-center rounded transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            sizeClasses[size],
            variantClasses[action.variant || 'default']
          )}
          title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
        >
          {action.icon}
        </button>
      ))}

      {/* More Actions Dropdown */}
      {moreActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'inline-flex items-center justify-center rounded transition-colors',
                sizeClasses[size],
                variantClasses.default
              )}
              title="More actions"
            >
              <MoreHorizontal className={iconSizeClasses[size]} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {moreActions.map((action, index) => (
              <div key={action.id}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => handleAction(action)}
                  disabled={action.disabled || isProcessing === action.id}
                  className={cn(
                    action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                  )}
                >
                  {action.icon}
                  <span className="flex-1">{action.label}</span>
                  {action.shortcut && (
                    <span className="text-xs text-muted-foreground">{action.shortcut}</span>
                  )}
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// Row wrapper that shows quick actions on hover
interface QuickActionsRowProps {
  children: React.ReactNode;
  actions: QuickAction[];
  className?: string;
  actionsClassName?: string;
  maxVisible?: number;
}

export function QuickActionsRow({
  children,
  actions,
  className,
  actionsClassName,
  maxVisible = 3,
}: QuickActionsRowProps) {
  return (
    <div className={cn('group relative flex items-center gap-2', className)}>
      <div className="flex-1">{children}</div>
      <QuickActionsMenu
        actions={actions}
        maxVisible={maxVisible}
        showOnHover={true}
        className={actionsClassName}
      />
    </div>
  );
}

// Preset action creators for common CRM operations
export const createLeadActions = (
  leadId: string,
  callbacks: {
    onCall?: () => void;
    onEmail?: () => void;
    onEdit?: () => void;
    onConvert?: () => void;
    onArchive?: () => void;
    onDelete?: () => void;
    onViewDetails?: () => void;
  }
): QuickAction[] => [
  {
    id: 'call',
    label: 'Call Lead',
    icon: <Phone className="w-4 h-4" />,
    onClick: callbacks.onCall || (() => {}),
    shortcut: 'C',
  },
  {
    id: 'email',
    label: 'Send Email',
    icon: <Mail className="w-4 h-4" />,
    onClick: callbacks.onEmail || (() => {}),
    shortcut: 'E',
  },
  {
    id: 'edit',
    label: 'Edit Lead',
    icon: <Edit className="w-4 h-4" />,
    onClick: callbacks.onEdit || (() => {}),
    shortcut: 'CMD+E',
  },
  {
    id: 'view',
    label: 'View Details',
    icon: <Eye className="w-4 h-4" />,
    onClick: callbacks.onViewDetails || (() => {}),
    shortcut: 'Enter',
  },
  {
    id: 'convert',
    label: 'Convert to Deal',
    icon: <TrendingUp className="w-4 h-4" />,
    onClick: callbacks.onConvert || (() => {}),
    variant: 'success',
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: <Archive className="w-4 h-4" />,
    onClick: callbacks.onArchive || (() => {}),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    onClick: callbacks.onDelete || (() => {}),
    variant: 'destructive',
  },
];

export const createDealActions = (
  dealId: string,
  callbacks: {
    onCall?: () => void;
    onEmail?: () => void;
    onEdit?: () => void;
    onSchedule?: () => void;
    onNote?: () => void;
    onWon?: () => void;
    onLost?: () => void;
    onDelete?: () => void;
  }
): QuickAction[] => [
  {
    id: 'call',
    label: 'Call Contact',
    icon: <Phone className="w-4 h-4" />,
    onClick: callbacks.onCall || (() => {}),
    shortcut: 'C',
  },
  {
    id: 'email',
    label: 'Send Email',
    icon: <Mail className="w-4 h-4" />,
    onClick: callbacks.onEmail || (() => {}),
    shortcut: 'E',
  },
  {
    id: 'schedule',
    label: 'Schedule Meeting',
    icon: <Calendar className="w-4 h-4" />,
    onClick: callbacks.onSchedule || (() => {}),
  },
  {
    id: 'note',
    label: 'Add Note',
    icon: <MessageSquare className="w-4 h-4" />,
    onClick: callbacks.onNote || (() => {}),
    shortcut: 'N',
  },
  {
    id: 'edit',
    label: 'Edit Deal',
    icon: <Edit className="w-4 h-4" />,
    onClick: callbacks.onEdit || (() => {}),
    shortcut: 'CMD+E',
  },
  {
    id: 'won',
    label: 'Mark as Won',
    icon: <CheckCircle className="w-4 h-4" />,
    onClick: callbacks.onWon || (() => {}),
    variant: 'success',
  },
  {
    id: 'lost',
    label: 'Mark as Lost',
    icon: <XCircle className="w-4 h-4" />,
    onClick: callbacks.onLost || (() => {}),
    variant: 'warning',
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    onClick: callbacks.onDelete || (() => {}),
    variant: 'destructive',
  },
];

export const createContactActions = (
  contactId: string,
  callbacks: {
    onCall?: () => void;
    onEmail?: () => void;
    onEdit?: () => void;
    onSchedule?: () => void;
    onAddTag?: () => void;
    onExport?: () => void;
    onDelete?: () => void;
  }
): QuickAction[] => [
  {
    id: 'call',
    label: 'Call Contact',
    icon: <Phone className="w-4 h-4" />,
    onClick: callbacks.onCall || (() => {}),
    shortcut: 'C',
  },
  {
    id: 'email',
    label: 'Send Email',
    icon: <Mail className="w-4 h-4" />,
    onClick: callbacks.onEmail || (() => {}),
    shortcut: 'E',
  },
  {
    id: 'edit',
    label: 'Edit Contact',
    icon: <Edit className="w-4 h-4" />,
    onClick: callbacks.onEdit || (() => {}),
    shortcut: 'CMD+E',
  },
  {
    id: 'schedule',
    label: 'Schedule Meeting',
    icon: <Calendar className="w-4 h-4" />,
    onClick: callbacks.onSchedule || (() => {}),
  },
  {
    id: 'tag',
    label: 'Add Tag',
    icon: <Tag className="w-4 h-4" />,
    onClick: callbacks.onAddTag || (() => {}),
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download className="w-4 h-4" />,
    onClick: callbacks.onExport || (() => {}),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    onClick: callbacks.onDelete || (() => {}),
    variant: 'destructive',
  },
];
