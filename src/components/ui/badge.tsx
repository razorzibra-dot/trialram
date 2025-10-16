import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent-500 text-white hover:bg-accent-600",
        secondary:
          "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        destructive:
          "border-transparent bg-error-500 text-white hover:bg-error-600",
        outline:
          "border-neutral-300 text-neutral-900 hover:bg-neutral-100",
        success:
          "border-transparent bg-success-500 text-white hover:bg-success-600",
        warning:
          "border-transparent bg-warning-500 text-white hover:bg-warning-600",
        info:
          "border-transparent bg-accent-100 text-accent-700 hover:bg-accent-200",
        glass:
          "border-white/30 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

// Status Badge Component
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'working' | 'done' | 'stuck' | 'pending' | 'active' | 'inactive' | 'draft' | 'published' | 'archived'
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, className, ...props }, ref) => {
    const getStatusVariant = (status: string) => {
      switch (status.toLowerCase()) {
        case 'working':
        case 'active':
        case 'published':
          return 'success'
        case 'done':
          return 'default'
        case 'stuck':
        case 'inactive':
        case 'archived':
          return 'destructive'
        case 'pending':
        case 'draft':
          return 'warning'
        default:
          return 'secondary'
      }
    }

    const getStatusLabel = (status: string) => {
      return status.charAt(0).toUpperCase() + status.slice(1)
    }

    return (
      <Badge
        ref={ref}
        variant={getStatusVariant(status)}
        className={cn("capitalize", className)}
        {...props}
      >
        {getStatusLabel(status)}
      </Badge>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

// Priority Badge Component
interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent'
}

const PriorityBadge = React.forwardRef<HTMLDivElement, PriorityBadgeProps>(
  ({ priority, className, ...props }, ref) => {
    const getPriorityVariant = (priority: string) => {
      switch (priority.toLowerCase()) {
        case 'low':
          return 'info'
        case 'medium':
          return 'secondary'
        case 'high':
          return 'warning'
        case 'critical':
        case 'urgent':
          return 'destructive'
        default:
          return 'secondary'
      }
    }

    const getPriorityLabel = (priority: string) => {
      return priority.charAt(0).toUpperCase() + priority.slice(1)
    }

    return (
      <Badge
        ref={ref}
        variant={getPriorityVariant(priority)}
        className={cn("capitalize", className)}
        {...props}
      >
        {getPriorityLabel(priority)}
      </Badge>
    )
  }
)
PriorityBadge.displayName = "PriorityBadge"

export { Badge, StatusBadge, PriorityBadge, badgeVariants }