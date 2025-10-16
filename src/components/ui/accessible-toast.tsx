import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { announceUtils } from "@/utils/accessibility"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-white text-neutral-900",
        destructive:
          "destructive group border-red-500 bg-red-50 text-red-900",
        success:
          "border-green-500 bg-green-50 text-green-900",
        warning:
          "border-yellow-500 bg-yellow-50 text-yellow-900",
        info:
          "border-blue-500 bg-blue-50 text-blue-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-neutral-500 opacity-0 transition-opacity hover:text-neutral-900 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    aria-label="Close notification"
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

// Enhanced toast with accessibility features
interface AccessibleToastProps {
  title: string
  description?: string
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  onOpenChange?: (open: boolean) => void
  announceToScreenReader?: boolean
}

const AccessibleToast: React.FC<AccessibleToastProps> = ({
  title,
  description,
  variant = "default",
  action,
  duration = 5000,
  onOpenChange,
  announceToScreenReader = true
}) => {
  const [open, setOpen] = React.useState(true)

  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
      case "destructive":
        return <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
      case "info":
        return <Info className="h-5 w-5 text-blue-600" aria-hidden="true" />
      default:
        return null
    }
  }

  const getAriaRole = () => {
    switch (variant) {
      case "destructive":
      case "warning":
        return "alert"
      default:
        return "status"
    }
  }

  const getPoliteness = () => {
    switch (variant) {
      case "destructive":
      case "warning":
        return "assertive" as const
      default:
        return "polite" as const
    }
  }

  React.useEffect(() => {
    if (open && announceToScreenReader) {
      const message = description ? `${title}. ${description}` : title
      announceUtils.announce(message, getPoliteness())
    }
  }, [open, title, description, announceToScreenReader])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <Toast 
      variant={variant} 
      open={open} 
      onOpenChange={handleOpenChange}
      duration={duration}
      role={getAriaRole()}
      aria-live={getPoliteness()}
      aria-atomic="true"
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 space-y-1">
          <ToastTitle>{title}</ToastTitle>
          {description && (
            <ToastDescription>{description}</ToastDescription>
          )}
        </div>
      </div>
      {action && (
        <ToastAction 
          onClick={action.onClick}
          aria-label={action.label}
        >
          {action.label}
        </ToastAction>
      )}
      <ToastClose />
    </Toast>
  )
}

// Toast hook with accessibility features
interface ToastOptions {
  title: string
  description?: string
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  announceToScreenReader?: boolean
}

const useAccessibleToast = () => {
  const [toasts, setToasts] = React.useState<Array<ToastOptions & { id: string }>>([])

  const toast = React.useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...options, id }])
    
    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, options.duration || 5000)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const dismissAll = React.useCallback(() => {
    setToasts([])
  }, [])

  return {
    toast,
    dismiss,
    dismissAll,
    toasts
  }
}

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  AccessibleToast,
  useAccessibleToast,
}
