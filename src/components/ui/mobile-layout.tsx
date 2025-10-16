import * as React from "react"
import { cn } from "@/lib/utils"
import { useResponsive } from "@/hooks/use-mobile"

interface MobileLayoutProps {
  children: React.ReactNode
  className?: string
}

interface MobileContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

interface MobileGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: "sm" | "md" | "lg"
}

interface MobileStackProps {
  children: React.ReactNode
  className?: string
  direction?: "vertical" | "horizontal"
  spacing?: "sm" | "md" | "lg"
  responsive?: boolean
}

// Main mobile layout wrapper
const MobileLayout = React.forwardRef<HTMLDivElement, MobileLayoutProps>(
  ({ className, children, ...props }, ref) => {
    const { isMobile } = useResponsive()
    
    return (
      <div 
        ref={ref} 
        className={cn(
          "min-h-screen bg-neutral-50",
          isMobile && "pb-20", // Add bottom padding for mobile action bars
          className
        )} 
        {...props}
      >
        {children}
      </div>
    )
  }
)
MobileLayout.displayName = "MobileLayout"

// Responsive container with proper padding and max-width
const MobileContainer = React.forwardRef<HTMLDivElement, MobileContainerProps>(
  ({ className, children, maxWidth = "2xl", ...props }, ref) => {
    const maxWidthClasses = {
      sm: "max-w-sm",
      md: "max-w-md", 
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      full: "max-w-full"
    }

    return (
      <div 
        ref={ref} 
        className={cn(
          "w-full mx-auto px-4 sm:px-6 lg:px-8",
          maxWidthClasses[maxWidth],
          className
        )} 
        {...props}
      >
        {children}
      </div>
    )
  }
)
MobileContainer.displayName = "MobileContainer"

// Responsive grid system
const MobileGrid = React.forwardRef<HTMLDivElement, MobileGridProps>(
  ({ className, children, cols = { mobile: 1, tablet: 2, desktop: 3 }, gap = "md", ...props }, ref) => {
    const gapClasses = {
      sm: "gap-2 sm:gap-3",
      md: "gap-4 sm:gap-6", 
      lg: "gap-6 sm:gap-8"
    }

    const gridClasses = cn(
      "grid",
      `grid-cols-${cols.mobile}`,
      cols.tablet && `sm:grid-cols-${cols.tablet}`,
      cols.desktop && `lg:grid-cols-${cols.desktop}`,
      gapClasses[gap]
    )

    return (
      <div 
        ref={ref} 
        className={cn(gridClasses, className)} 
        {...props}
      >
        {children}
      </div>
    )
  }
)
MobileGrid.displayName = "MobileGrid"

// Responsive stack layout
const MobileStack = React.forwardRef<HTMLDivElement, MobileStackProps>(
  ({ className, children, direction = "vertical", spacing = "md", responsive = true, ...props }, ref) => {
    const spacingClasses = {
      sm: direction === "vertical" ? "space-y-2" : "space-x-2",
      md: direction === "vertical" ? "space-y-4" : "space-x-4",
      lg: direction === "vertical" ? "space-y-6" : "space-x-6"
    }

    const directionClasses = direction === "vertical" ? "flex-col" : "flex-row"
    const responsiveClasses = responsive ? "flex-col sm:flex-row sm:space-y-0 sm:space-x-4" : directionClasses

    return (
      <div 
        ref={ref} 
        className={cn(
          "flex",
          responsive ? responsiveClasses : directionClasses,
          spacingClasses[spacing],
          className
        )} 
        {...props}
      >
        {children}
      </div>
    )
  }
)
MobileStack.displayName = "MobileStack"

// Mobile-optimized card layout
const MobileCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "bg-white rounded-lg border border-neutral-200 shadow-sm p-4 sm:p-6",
        "touch-card", // Apply touch optimizations
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
)
MobileCard.displayName = "MobileCard"

// Mobile section with proper spacing
const MobileSection = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <section 
      ref={ref} 
      className={cn("py-6 sm:py-8 lg:py-12", className)} 
      {...props}
    >
      {children}
    </section>
  )
)
MobileSection.displayName = "MobileSection"

// Mobile header with responsive typography
interface MobileHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

const MobileHeader = React.forwardRef<HTMLDivElement, MobileHeaderProps>(
  ({ className, title, subtitle, actions, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("responsive-header mb-6 sm:mb-8", className)} 
      {...props}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm sm:text-base text-neutral-600">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
)
MobileHeader.displayName = "MobileHeader"

// Mobile-optimized button group
const MobileButtonGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("responsive-button-group", className)} 
      {...props}
    >
      {children}
    </div>
  )
)
MobileButtonGroup.displayName = "MobileButtonGroup"

// Mobile safe area (accounts for notches, etc.)
const MobileSafeArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right",
        className
      )} 
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)"
      }}
      {...props}
    >
      {children}
    </div>
  )
)
MobileSafeArea.displayName = "MobileSafeArea"

// Mobile viewport height container
const MobileViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("min-h-screen sm:min-h-0", className)}
      style={{ minHeight: "100vh", minHeight: "100dvh" }}
      {...props}
    >
      {children}
    </div>
  )
)
MobileViewport.displayName = "MobileViewport"

export {
  MobileLayout,
  MobileContainer,
  MobileGrid,
  MobileStack,
  MobileCard,
  MobileSection,
  MobileHeader,
  MobileButtonGroup,
  MobileSafeArea,
  MobileViewport,
}
