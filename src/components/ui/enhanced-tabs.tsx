import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion, AnimatePresence } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const enhancedTabsVariants = cva(
  "w-full",
  {
    variants: {
      variant: {
        default: "",
        pills: "",
        underline: "",
        cards: "",
        modern: "",
      },
      size: {
        sm: "",
        default: "",
        lg: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const enhancedTabsListVariants = cva(
  "inline-flex items-center justify-start",
  {
    variants: {
      variant: {
        default: "h-10 rounded-lg bg-neutral-100 p-1 text-neutral-500",
        pills: "gap-2 bg-transparent",
        underline: "border-b border-neutral-200 bg-transparent gap-6",
        cards: "gap-1 bg-neutral-50 p-1 rounded-lg",
        modern: "gap-1 bg-gradient-to-r from-neutral-50 to-neutral-100 p-1 rounded-xl shadow-sm",
      },
      size: {
        sm: "h-8 text-xs",
        default: "h-10 text-sm",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const enhancedTabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative",
  {
    variants: {
      variant: {
        default: "rounded-md px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm hover:bg-white/50",
        pills: "rounded-full px-4 py-2 bg-neutral-100 text-neutral-600 data-[state=active]:bg-accent-500 data-[state=active]:text-white hover:bg-neutral-200 data-[state=active]:hover:bg-accent-600",
        underline: "px-4 py-2 border-b-2 border-transparent data-[state=active]:border-accent-500 data-[state=active]:text-accent-600 hover:text-neutral-700",
        cards: "rounded-lg px-4 py-2 bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm hover:bg-white/50",
        modern: "rounded-lg px-4 py-2 bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-accent-600 hover:bg-white/50",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        default: "px-3 py-1.5 text-sm",
        lg: "px-4 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedTabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
    VariantProps<typeof enhancedTabsVariants> {}

const EnhancedTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  EnhancedTabsProps
>(({ className, variant, size, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn(enhancedTabsVariants({ variant, size, className }))}
    {...props}
  />
))
EnhancedTabs.displayName = TabsPrimitive.Root.displayName

export interface EnhancedTabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof enhancedTabsListVariants> {}

const EnhancedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  EnhancedTabsListProps
>(({ className, variant, size, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(enhancedTabsListVariants({ variant, size, className }))}
    {...props}
  />
))
EnhancedTabsList.displayName = TabsPrimitive.List.displayName

export interface EnhancedTabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof enhancedTabsTriggerVariants> {
  badge?: string | number
  icon?: React.ReactNode
}

const EnhancedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  EnhancedTabsTriggerProps
>(({ className, variant, size, badge, icon, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(enhancedTabsTriggerVariants({ variant, size, className }))}
    {...props}
  >
    <motion.div
      className="flex items-center gap-2"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {badge && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-1 px-1.5 py-0.5 text-xs bg-accent-100 text-accent-700 rounded-full"
        >
          {badge}
        </motion.span>
      )}
    </motion.div>
    
    {/* Active indicator for underline variant */}
    {variant === "underline" && (
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        exit={{ scaleX: 0 }}
        transition={{ duration: 0.2 }}
      />
    )}
  </TabsPrimitive.Trigger>
))
EnhancedTabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const EnhancedTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  >
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  </TabsPrimitive.Content>
))
EnhancedTabsContent.displayName = TabsPrimitive.Content.displayName

// Vertical Tabs Component
interface VerticalTabsProps {
  children: React.ReactNode
  className?: string
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const VerticalTabs: React.FC<VerticalTabsProps> = ({
  children,
  className,
  ...props
}) => (
  <EnhancedTabs
    orientation="vertical"
    className={cn("flex gap-6", className)}
    {...props}
  >
    {children}
  </EnhancedTabs>
)

const VerticalTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex flex-col gap-1 bg-neutral-50 p-2 rounded-lg min-w-[200px]",
      className
    )}
    {...props}
  />
))
VerticalTabsList.displayName = "VerticalTabsList"

const VerticalTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  EnhancedTabsTriggerProps
>(({ className, icon, children, badge, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all",
      "text-neutral-600 hover:text-neutral-900 hover:bg-white",
      "data-[state=active]:bg-white data-[state=active]:text-accent-600 data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  >
    <motion.div
      className="flex items-center gap-3 w-full"
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {badge && (
        <span className="px-1.5 py-0.5 text-xs bg-accent-100 text-accent-700 rounded-full">
          {badge}
        </span>
      )}
    </motion.div>
  </TabsPrimitive.Trigger>
))
VerticalTabsTrigger.displayName = "VerticalTabsTrigger"

const VerticalTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("flex-1", className)}
    {...props}
  >
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  </TabsPrimitive.Content>
))
VerticalTabsContent.displayName = "VerticalTabsContent"

export {
  EnhancedTabs,
  EnhancedTabsList,
  EnhancedTabsTrigger,
  EnhancedTabsContent,
  VerticalTabs,
  VerticalTabsList,
  VerticalTabsTrigger,
  VerticalTabsContent,
}
