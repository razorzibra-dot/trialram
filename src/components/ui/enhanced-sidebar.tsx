import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobile: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
  defaultOpen?: boolean
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  defaultCollapsed = false,
  defaultOpen = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const value = {
    isCollapsed,
    setIsCollapsed,
    isMobile,
    isOpen,
    setIsOpen,
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

interface EnhancedSidebarProps {
  children: React.ReactNode
  className?: string
  logo?: React.ReactNode
  footer?: React.ReactNode
}

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  children,
  className,
  logo,
  footer,
}) => {
  const { isCollapsed, setIsCollapsed, isMobile, isOpen, setIsOpen } = useSidebar()

  const sidebarVariants = {
    expanded: {
      width: isMobile ? "100%" : "280px",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    collapsed: {
      width: isMobile ? "0px" : "80px",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  }

  const contentVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      transition: { delay: 0.1, duration: 0.2 }
    },
    collapsed: {
      opacity: isCollapsed ? 0 : 1,
      x: isCollapsed ? -20 : 0,
      transition: { duration: 0.2 }
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isMobile ? (isOpen ? "expanded" : "collapsed") : (isCollapsed ? "collapsed" : "expanded")}
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-white border-r border-neutral-200 shadow-lg lg:relative lg:z-auto",
          "flex flex-col overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <motion.div
            variants={contentVariants}
            animate={isCollapsed ? "collapsed" : "expanded"}
            className="flex items-center gap-3"
          >
            {logo}
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold text-lg text-neutral-900"
              >
                CRM Portal
              </motion.span>
            )}
          </motion.div>

          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isMobile) {
                setIsOpen(!isOpen)
              } else {
                setIsCollapsed(!isCollapsed)
              }
            }}
            className="h-8 w-8"
          >
            {isMobile ? (
              isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <motion.div
            variants={contentVariants}
            animate={isCollapsed ? "collapsed" : "expanded"}
          >
            {children}
          </motion.div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-neutral-200 p-4">
            <motion.div
              variants={contentVariants}
              animate={isCollapsed ? "collapsed" : "expanded"}
            >
              {footer}
            </motion.div>
          </div>
        )}
      </motion.aside>
    </>
  )
}

interface SidebarSectionProps {
  title?: string
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  const { isCollapsed } = useSidebar()

  return (
    <div className="space-y-2">
      {title && !isCollapsed && (
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-2">
            {title}
          </h3>
          {collapsible && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      )}

      <AnimatePresence>
        {(!collapsible || isExpanded) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface SidebarItemProps {
  icon?: React.ReactNode
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  badge?: string | number
  className?: string
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  children,
  active = false,
  onClick,
  badge,
  className,
}) => {
  const { isCollapsed } = useSidebar()

  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
        "hover:bg-accent-50 hover:text-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2",
        active
          ? "bg-accent-100 text-accent-700 shadow-sm"
          : "text-neutral-700 hover:text-neutral-900",
        className
      )}
    >
      {icon && (
        <div className={cn("flex-shrink-0", active ? "text-accent-600" : "text-neutral-500")}>
          {icon}
        </div>
      )}

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 text-left truncate"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {badge && !isCollapsed && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-accent-100 text-accent-700 rounded-full"
        >
          {badge}
        </motion.span>
      )}
    </motion.button>
  )
}

interface SidebarSubItemProps {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}

export const SidebarSubItem: React.FC<SidebarSubItemProps> = ({
  children,
  active = false,
  onClick,
  className,
}) => {
  const { isCollapsed } = useSidebar()

  if (isCollapsed) return null

  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 pl-9 pr-3 py-1.5 text-sm font-normal rounded-md transition-all duration-200",
        "hover:bg-accent-50 hover:text-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2",
        active
          ? "bg-accent-50 text-accent-700"
          : "text-neutral-600 hover:text-neutral-800",
        className
      )}
    >
      <div className="w-1 h-1 bg-current rounded-full opacity-50" />
      <span className="truncate">{children}</span>
    </motion.button>
  )
}
