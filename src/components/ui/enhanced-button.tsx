import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-accent-500 text-white shadow-lg hover:bg-accent-600 hover:shadow-xl active:bg-accent-700 active:scale-[0.98] hover:-translate-y-0.5",
        destructive: "bg-error-500 text-white shadow-lg hover:bg-error-600 hover:shadow-xl active:bg-error-700 active:scale-[0.98] hover:-translate-y-0.5",
        outline: "border-2 border-accent-200 bg-white text-accent-700 shadow-sm hover:bg-accent-50 hover:border-accent-300 hover:shadow-md active:scale-[0.98]",
        secondary: "bg-neutral-100 text-neutral-900 shadow-sm hover:bg-neutral-200 hover:shadow-md active:scale-[0.98] hover:-translate-y-0.5",
        ghost: "text-accent-700 hover:bg-accent-50 hover:text-accent-800 active:scale-[0.98]",
        link: "text-accent-600 underline-offset-4 hover:underline hover:text-accent-700 active:scale-[0.98]",
        gradient: "bg-gradient-to-r from-accent-500 to-indigo-600 text-white shadow-lg hover:from-accent-600 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98] hover:-translate-y-0.5",
        glass: "bg-white/80 backdrop-blur-sm border border-white/20 text-neutral-900 shadow-lg hover:bg-white/90 hover:shadow-xl active:scale-[0.98]",
        success: "bg-success-500 text-white shadow-lg hover:bg-success-600 hover:shadow-xl active:bg-success-700 active:scale-[0.98] hover:-translate-y-0.5",
        warning: "bg-warning-500 text-white shadow-lg hover:bg-warning-600 hover:shadow-xl active:bg-warning-700 active:scale-[0.98] hover:-translate-y-0.5",
        premium: "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg hover:from-purple-600 hover:to-pink-700 hover:shadow-xl active:scale-[0.98] hover:-translate-y-0.5",
        neon: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 active:scale-[0.98] hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2 sm:h-10 sm:px-4",
        sm: "h-8 rounded-md px-3 text-xs sm:h-8 sm:px-3",
        lg: "h-12 rounded-lg px-6 sm:px-8 text-base",
        icon: "h-10 w-10 sm:h-10 sm:w-10",
        xs: "h-7 rounded-sm px-2 text-xs",
        xl: "h-14 rounded-xl px-8 sm:px-10 text-lg font-semibold",
        mobile: "h-12 px-4 py-3 text-base min-h-[44px] touch-target",
      },
      glow: {
        none: "",
        primary: "hover:shadow-accent-500/25 hover:shadow-2xl",
        success: "hover:shadow-success-500/25 hover:shadow-2xl",
        warning: "hover:shadow-warning-500/25 hover:shadow-2xl",
        error: "hover:shadow-error-500/25 hover:shadow-2xl",
        purple: "hover:shadow-purple-500/25 hover:shadow-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  }
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  ariaLabel?: string
  shimmer?: boolean
  pulse?: boolean
  bounce?: boolean
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({
    className,
    variant,
    size,
    glow,
    asChild = false,
    loading = false,
    loadingText = "Loading...",
    ariaLabel,
    children,
    disabled,
    shimmer = false,
    pulse = false,
    bounce = false,
    icon,
    rightIcon,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    return (
      <motion.div
        whileHover={{ scale: bounce ? 1.05 : 1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Comp
          className={cn(enhancedButtonVariants({ variant, size, glow, className }))}
          ref={ref}
          disabled={isDisabled}
          aria-label={ariaLabel}
          aria-disabled={isDisabled}
          {...props}
        >
          {/* Shimmer Effect */}
          {shimmer && (
            <div className="absolute inset-0 -top-px overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
            </div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingText}
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                {icon && <span className="flex-shrink-0">{icon}</span>}
                {children}
                {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse Effect */}
          {pulse && !loading && (
            <div className="absolute inset-0 rounded-lg animate-pulse bg-white/10" />
          )}
        </Comp>
      </motion.div>
    )
  }
)
EnhancedButton.displayName = "EnhancedButton"

// Icon Button Component
interface IconButtonProps extends Omit<EnhancedButtonProps, 'children'> {
  icon: React.ReactNode
  tooltip?: string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, tooltip, className, ...props }, ref) => (
    <EnhancedButton
      ref={ref}
      size="icon"
      className={cn("rounded-full", className)}
      aria-label={tooltip}
      {...props}
    >
      {icon}
    </EnhancedButton>
  )
)
IconButton.displayName = "IconButton"

// Floating Action Button
interface FloatingActionButtonProps extends EnhancedButtonProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ position = "bottom-right", className, children, ...props }, ref) => {
    const positionClasses = {
      "bottom-right": "fixed bottom-6 right-6 z-50",
      "bottom-left": "fixed bottom-6 left-6 z-50",
      "top-right": "fixed top-6 right-6 z-50",
      "top-left": "fixed top-6 left-6 z-50",
    }

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={positionClasses[position]}
      >
        <EnhancedButton
          ref={ref}
          size="lg"
          variant="gradient"
          glow="primary"
          className={cn("rounded-full shadow-2xl", className)}
          {...props}
        >
          {children}
        </EnhancedButton>
      </motion.div>
    )
  }
)
FloatingActionButton.displayName = "FloatingActionButton"

// Button Group Component
interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: "horizontal" | "vertical"
  size?: "sm" | "default" | "lg"
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ children, className, orientation = "horizontal", size = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        "[&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none [&>*:not(:first-child)]:rounded-l-none",
        orientation === "vertical" && "[&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none [&>*:not(:first-child)]:rounded-t-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
ButtonGroup.displayName = "ButtonGroup"

export { 
  EnhancedButton, 
  IconButton, 
  FloatingActionButton, 
  ButtonGroup, 
  enhancedButtonVariants 
}
