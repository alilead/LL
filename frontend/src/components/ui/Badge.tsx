import React, { HTMLAttributes, forwardRef } from "react"
import { cn } from "../../utils/cn"
import { X } from "lucide-react"

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
  size?: "sm" | "md" | "lg"
  removable?: boolean
  onRemove?: () => void
}

const badgeVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
  success: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
}

const badgeSizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm"
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "md", removable = false, onRemove, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          badgeVariants[variant],
          badgeSizes[size],
          removable && "pr-1",
          className
        )}
        {...props}
      >
        <span className={removable ? "mr-1" : ""}>{children}</span>
        {removable && onRemove && (
          <button
            onClick={onRemove}
            className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Remove badge"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }
)
Badge.displayName = "Badge"

// Status Badge for specific status indicators
export interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  status: "active" | "inactive" | "pending" | "completed" | "cancelled" | "draft"
  showDot?: boolean
}

const statusConfig = {
  active: { variant: "success" as const, label: "Active", dotColor: "bg-green-500" },
  inactive: { variant: "secondary" as const, label: "Inactive", dotColor: "bg-gray-500" },
  pending: { variant: "warning" as const, label: "Pending", dotColor: "bg-yellow-500" },
  completed: { variant: "success" as const, label: "Completed", dotColor: "bg-green-500" },
  cancelled: { variant: "destructive" as const, label: "Cancelled", dotColor: "bg-red-500" },
  draft: { variant: "outline" as const, label: "Draft", dotColor: "bg-gray-400" }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showDot = false,
  className,
  ...props
}) => {
  const config = statusConfig[status]
  
  return (
    <Badge variant={config.variant} className={className} {...props}>
      {showDot && (
        <span className={cn("w-2 h-2 rounded-full mr-2", config.dotColor)} />
      )}
      {config.label}
    </Badge>
  )
}

// Priority Badge for task/lead priorities
export interface PriorityBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  priority: "low" | "medium" | "high" | "urgent"
}

const priorityConfig = {
  low: { variant: "secondary" as const, label: "Low" },
  medium: { variant: "info" as const, label: "Medium" },
  high: { variant: "warning" as const, label: "High" },
  urgent: { variant: "destructive" as const, label: "Urgent" }
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className,
  ...props
}) => {
  const config = priorityConfig[priority]
  
  return (
    <Badge variant={config.variant} className={className} {...props}>
      {config.label}
    </Badge>
  )
}

// Count Badge for notifications and counters
export interface CountBadgeProps extends Omit<BadgeProps, "children"> {
  count: number
  max?: number
  showZero?: boolean
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  showZero = false,
  className,
  ...props
}) => {
  if (count === 0 && !showZero) {
    return null
  }

  const displayCount = count > max ? `${max}+` : count.toString()
  
  return (
    <Badge
      variant="destructive"
      size="sm"
      className={cn("min-w-[1.25rem] h-5 justify-center", className)}
      {...props}
    >
      {displayCount}
    </Badge>
  )
}

export { Badge }
