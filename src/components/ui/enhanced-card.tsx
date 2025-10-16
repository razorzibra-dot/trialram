import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const enhancedCardVariants = cva(
  "rounded-xl border text-card-foreground shadow-sm transition-all duration-300 group",
  {
    variants: {
      variant: {
        default: "bg-white border-neutral-200 hover:shadow-lg hover:-translate-y-1",
        elevated: "bg-white border-neutral-200 shadow-lg hover:shadow-xl hover:-translate-y-2",
        glass: "bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:bg-white/90 hover:shadow-xl",
        gradient: "bg-gradient-to-br from-white to-neutral-50 border-neutral-200 hover:shadow-lg hover:-translate-y-1",
        outline: "bg-transparent border-2 border-neutral-200 hover:border-accent-300 hover:bg-accent-50/50",
        ghost: "bg-transparent border-transparent hover:bg-neutral-50 hover:border-neutral-200",
        premium: "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg hover:-translate-y-1",
        success: "bg-gradient-to-br from-success-50 to-emerald-50 border-success-200 hover:shadow-lg hover:-translate-y-1",
        warning: "bg-gradient-to-br from-warning-50 to-orange-50 border-warning-200 hover:shadow-lg hover:-translate-y-1",
        error: "bg-gradient-to-br from-error-50 to-red-50 border-error-200 hover:shadow-lg hover:-translate-y-1",
        dark: "bg-neutral-900 border-neutral-800 text-white hover:shadow-lg hover:-translate-y-1",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      glow: {
        none: "",
        primary: "hover:shadow-accent-500/20 hover:shadow-2xl",
        success: "hover:shadow-success-500/20 hover:shadow-2xl",
        warning: "hover:shadow-warning-500/20 hover:shadow-2xl",
        error: "hover:shadow-error-500/20 hover:shadow-2xl",
        purple: "hover:shadow-purple-500/20 hover:shadow-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  }
)

export interface EnhancedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedCardVariants> {
  hover?: boolean
  shimmer?: boolean
  pulse?: boolean
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, variant, size, glow, hover = true, shimmer = false, pulse = false, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn(enhancedCardVariants({ variant, size, glow, className }))}
      whileHover={hover ? { y: -4, scale: 1.02 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      {...props}
    >
      {/* Shimmer Effect */}
      {shimmer && (
        <div className="absolute inset-0 -top-px overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
        </div>
      )}
      
      {/* Pulse Effect */}
      {pulse && (
        <div className="absolute inset-0 rounded-xl animate-pulse bg-white/10" />
      )}
      
      {children}
    </motion.div>
  )
)
EnhancedCard.displayName = "EnhancedCard"

const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
))
EnhancedCardHeader.displayName = "EnhancedCardHeader"

const EnhancedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-neutral-900 group-hover:text-accent-700 transition-colors",
      className
    )}
    {...props}
  >
    {children}
  </h3>
))
EnhancedCardTitle.displayName = "EnhancedCardTitle"

const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-600 leading-relaxed", className)}
    {...props}
  />
))
EnhancedCardDescription.displayName = "EnhancedCardDescription"

const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
EnhancedCardContent.displayName = "EnhancedCardContent"

const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4 border-t border-neutral-100", className)}
    {...props}
  />
))
EnhancedCardFooter.displayName = "EnhancedCardFooter"

// Stats Card Component
interface StatsCardProps extends EnhancedCardProps {
  title: string
  value: string | number
  change?: {
    value: string | number
    type: "increase" | "decrease" | "neutral"
  }
  icon?: React.ReactNode
  description?: string
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, change, icon, description, className, ...props }, ref) => (
    <EnhancedCard
      ref={ref}
      variant="elevated"
      glow="primary"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <EnhancedCardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          {icon && (
            <div className="p-2 bg-accent-100 rounded-lg text-accent-600">
              {icon}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-3xl font-bold text-neutral-900">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  change.type === "increase" && "text-success-600",
                  change.type === "decrease" && "text-error-600",
                  change.type === "neutral" && "text-neutral-600"
                )}
              >
                {change.type === "increase" && "↗"}
                {change.type === "decrease" && "↘"}
                {change.value}
              </span>
            </div>
          )}
          {description && (
            <p className="text-xs text-neutral-500">{description}</p>
          )}
        </div>
      </EnhancedCardContent>
    </EnhancedCard>
  )
)
StatsCard.displayName = "StatsCard"

// Feature Card Component
interface FeatureCardProps extends EnhancedCardProps {
  title: string
  description: string
  icon?: React.ReactNode
  badge?: string
  action?: React.ReactNode
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ title, description, icon, badge, action, className, ...props }, ref) => (
    <EnhancedCard
      ref={ref}
      variant="gradient"
      className={cn("relative", className)}
      {...props}
    >
      <EnhancedCardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-3 bg-accent-100 rounded-xl text-accent-600">
                {icon}
              </div>
            )}
            <div>
              <EnhancedCardTitle className="text-lg">{title}</EnhancedCardTitle>
              {badge && (
                <span className="inline-block px-2 py-1 mt-1 text-xs font-medium bg-accent-100 text-accent-700 rounded-full">
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>
      </EnhancedCardHeader>
      
      <EnhancedCardContent>
        <EnhancedCardDescription className="text-base leading-relaxed">
          {description}
        </EnhancedCardDescription>
      </EnhancedCardContent>
      
      {action && (
        <EnhancedCardFooter>
          {action}
        </EnhancedCardFooter>
      )}
    </EnhancedCard>
  )
)
FeatureCard.displayName = "FeatureCard"

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardFooter,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
  StatsCard,
  FeatureCard,
  enhancedCardVariants,
}
