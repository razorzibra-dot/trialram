import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"
import { ScrollArea } from "./scroll-area"
import { Separator } from "./separator"
import { Menu, X } from "lucide-react"

interface MobileNavProps {
  children: React.ReactNode
  className?: string
  trigger?: React.ReactNode
  side?: "left" | "right" | "top" | "bottom"
  title?: string
}

interface MobileNavSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

interface MobileNavItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  active?: boolean
  disabled?: boolean
}

// Main mobile navigation component
const MobileNav = React.forwardRef<HTMLDivElement, MobileNavProps>(
  ({ className, children, trigger, side = "left", title, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)

    const defaultTrigger = (
      <Button variant="ghost" size="sm" className="md:hidden p-2">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation</span>
      </Button>
    )

    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || defaultTrigger}
        </SheetTrigger>
        <SheetContent 
          side={side} 
          className={cn("w-80 p-0", className)}
          {...props}
        >
          <div ref={ref} className="flex flex-col h-full">
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">{title}</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setOpen(false)}
                  className="p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {children}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    )
  }
)
MobileNav.displayName = "MobileNav"

// Navigation section with optional title
const MobileNavSection = React.forwardRef<HTMLDivElement, MobileNavSectionProps>(
  ({ title, children, className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      {title && (
        <>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-2">
            {title}
          </h3>
          <Separator className="my-2" />
        </>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
)
MobileNavSection.displayName = "MobileNavSection"

// Individual navigation item
const MobileNavItem = React.forwardRef<HTMLButtonElement, MobileNavItemProps>(
  ({ children, className, onClick, active = false, disabled = false, ...props }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      className={cn(
        "w-full justify-start h-auto p-3 text-left font-normal",
        active && "bg-accent-50 text-accent-600 border-r-2 border-accent-500",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  )
)
MobileNavItem.displayName = "MobileNavItem"

// Mobile navigation footer
const MobileNavFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("p-4 border-t bg-neutral-50", className)} 
      {...props}
    >
      {children}
    </div>
  )
)
MobileNavFooter.displayName = "MobileNavFooter"

// Mobile breadcrumb component
interface MobileBreadcrumbProps {
  items: Array<{
    name: string
    href?: string
    onClick?: () => void
  }>
  className?: string
}

const MobileBreadcrumb = React.forwardRef<HTMLDivElement, MobileBreadcrumbProps>(
  ({ items, className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("md:hidden p-4 bg-neutral-50 border-b", className)} 
      {...props}
    >
      <div className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <React.Fragment key={item.name}>
            {index > 0 && <span className="text-neutral-400">/</span>}
            {item.href || item.onClick ? (
              <button
                onClick={item.onClick}
                className="font-medium text-neutral-600 hover:text-neutral-900 truncate"
              >
                {item.name}
              </button>
            ) : (
              <span className="font-semibold text-neutral-900 truncate">
                {item.name}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
)
MobileBreadcrumb.displayName = "MobileBreadcrumb"

// Mobile action bar (sticky bottom actions)
const MobileActionBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-50",
        className
      )} 
      {...props}
    >
      <div className="flex gap-2">
        {children}
      </div>
    </div>
  )
)
MobileActionBar.displayName = "MobileActionBar"

// Mobile search bar
interface MobileSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
  className?: string
}

const MobileSearch = React.forwardRef<HTMLInputElement, MobileSearchProps>(
  ({ className, onSearch, ...props }, ref) => {
    const [value, setValue] = React.useState("")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      onSearch?.(newValue)
    }

    return (
      <div className={cn("md:hidden p-4 border-b", className)}>
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={handleChange}
          className="w-full h-10 px-3 py-2 text-sm border border-neutral-300 rounded-md bg-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          {...props}
        />
      </div>
    )
  }
)
MobileSearch.displayName = "MobileSearch"

export {
  MobileNav,
  MobileNavSection,
  MobileNavItem,
  MobileNavFooter,
  MobileBreadcrumb,
  MobileActionBar,
  MobileSearch,
}
