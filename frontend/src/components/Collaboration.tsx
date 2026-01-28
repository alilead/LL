/**
 * Real-time Collaboration - See Who's Viewing!
 *
 * SALESFORCE: No idea who else is editing, conflicts everywhere (CHAOS!)
 * LEADLAB: See live cursors, who's viewing, prevent conflicts! (MODERN!)
 *
 * Enterprise teams need this!
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Edit, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string; // For cursor color
}

export interface ViewingUser extends CollaborationUser {
  isEditing: boolean;
  cursorPosition?: { x: number; y: number };
  editingField?: string;
}

// User avatar colors
const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

/**
 * Avatar Stack - Show who's viewing
 */
interface AvatarStackProps {
  users: ViewingUser[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarStack({ users, max = 5, size = 'md', className }: AvatarStackProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const displayedUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-2">
        {displayedUsers.map((user) => (
          <div
            key={user.id}
            className={cn(
              'relative rounded-full border-2 border-white flex items-center justify-center font-medium text-white',
              sizeClasses[size]
            )}
            style={{ backgroundColor: user.color }}
            title={`${user.name}${user.isEditing ? ' (editing)' : ' (viewing)'}`}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
            {user.isEditing && (
              <Circle
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-green-500 fill-current"
              />
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              'relative rounded-full border-2 border-white flex items-center justify-center font-medium text-gray-700 bg-gray-200',
              sizeClasses[size]
            )}
            title={`+${remainingCount} more`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Live Cursor - Show where others are
 */
interface LiveCursorProps {
  user: ViewingUser;
  position: { x: number; y: number };
}

export function LiveCursor({ user, position }: LiveCursorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="fixed pointer-events-none z-50"
      style={{ color: user.color }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" />
      </svg>
      <div
        className="ml-2 mt-1 px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap shadow-lg"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>
    </motion.div>
  );
}

/**
 * Collaboration Panel - Full collaboration UI
 */
interface CollaborationPanelProps {
  users: ViewingUser[];
  currentUser: CollaborationUser;
  className?: string;
}

export function CollaborationPanel({ users, currentUser, className }: CollaborationPanelProps) {
  return (
    <div className={cn('bg-white rounded-lg border shadow-lg p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Active Now</h3>
        <span className="text-sm text-gray-500">{users.length + 1} online</span>
      </div>

      <div className="space-y-2">
        {/* Current user */}
        <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full" />
            ) : (
              currentUser.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">You</div>
            <div className="text-xs text-gray-500">{currentUser.email}</div>
          </div>
        </div>

        {/* Other users */}
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium relative"
              style={{ backgroundColor: user.color }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
              {user.isEditing && (
                <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-green-500 fill-current" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-500">
                {user.isEditing ? (
                  <span className="flex items-center gap-1">
                    <Edit className="w-3 h-3" />
                    Editing{user.editingField ? `: ${user.editingField}` : ''}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Viewing
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Editing Indicator - Show when field is being edited by someone
 */
interface EditingIndicatorProps {
  user: ViewingUser;
  className?: string;
}

export function EditingIndicator({ user, className }: EditingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white',
        className
      )}
      style={{ backgroundColor: user.color }}
    >
      <Edit className="w-3 h-3" />
      <span>{user.name} is editing</span>
    </motion.div>
  );
}

/**
 * Hook for collaboration
 */
export function useCollaboration(recordId: string) {
  const [users, setUsers] = useState<ViewingUser[]>([]);
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Mock: Connect to WebSocket in real implementation
  useEffect(() => {
    // Simulate other users
    const mockUsers: ViewingUser[] = [
      {
        id: '1',
        name: 'Jane Smith',
        email: 'jane@company.com',
        color: AVATAR_COLORS[0],
        isEditing: true,
        editingField: 'Company Name',
      },
      {
        id: '2',
        name: 'Bob Johnson',
        email: 'bob@company.com',
        color: AVATAR_COLORS[1],
        isEditing: false,
      },
    ];

    // Simulate: In real app, this would be WebSocket connection
    setTimeout(() => setUsers(mockUsers), 1000);

    return () => {
      // Cleanup: Disconnect from WebSocket
    };
  }, [recordId]);

  return {
    users,
    cursors,
  };
}
