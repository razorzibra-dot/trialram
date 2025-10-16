import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative",
  {
    variants: {
      variant: {
        default: "bg-accent-500 text-white shadow-sm hover:bg-accent-600 hover:shadow-md active:bg-accent-700 active:scale-[0.98]",
        destructive:
          "bg-error-500 text-white shadow-sm hover:bg-error-600 hover:shadow-md active:bg-error-700 active:scale-[0.98]",
        outline:
          "border border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100",
        secondary:
          "bg-neutral-100 text-neutral-900 shadow-sm hover:bg-neutral-200 active:bg-neutral-300 active:scale-[0.98]",
        ghost: "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200",
        link: "text-accent-600 underline-offset-4 hover:underline hover:text-accent-700 active:text-accent-800",
        success: "bg-success-500 text-white shadow-sm hover:bg-success-600 hover:shadow-md active:bg-success-700 active:scale-[0.98]",
        warning: "bg-warning-500 text-white shadow-sm hover:bg-warning-600 hover:shadow-md active:bg-warning-700 active:scale-[0.98]",
        gradient: "bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-sm hover:from-accent-600 hover:to-accent-700 hover:shadow-md active:scale-[0.98]",
        glass: "bg-white/80 backdrop-blur-sm border border-white/20 text-neutral-900 shadow-lg hover:bg-white/90 hover:shadow-xl",
      },
      size: {
        default: "h-10 px-4 py-2 sm:h-10 sm:px-4",
        sm: "h-8 rounded-md px-3 text-xs sm:h-8 sm:px-3",
        lg: "h-12 rounded-lg px-6 sm:px-8 text-base",
        icon: "h-10 w-10 sm:h-10 sm:w-10",
        xs: "h-7 rounded-sm px-2 text-xs",
        xl: "h-14 rounded-lg px-8 sm:px-10 text-lg font-semibold",
        mobile: "h-12 px-4 py-3 text-base min-h-[44px] touch-target",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  ariaLabel?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingText = "Loading...",
    ariaLabel,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {loading ? loadingText : children}
        {loading && <span className="sr-only">Loading</span>}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }