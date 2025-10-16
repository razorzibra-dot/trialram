import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Menu,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Sparkles,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { EnhancedButton } from "./enhanced-button"
import { SearchInput } from "./enhanced-input"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Badge } from "./badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"

interface EnhancedHeaderProps {
  className?: string
  title?: string
  subtitle?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
    role?: string
  }
  notifications?: Array<{
    id: string
    title: string
    message: string
    time: string
    read: boolean
    type?: "info" | "success" | "warning" | "error"
  }>
  onSearch?: (query: string) => void
  onNotificationClick?: (id: string) => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onLogout?: () => void
  showSearch?: boolean
  showNotifications?: boolean
  showProfile?: boolean
  showThemeToggle?: boolean
}

export const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
  className,
  title,
  subtitle,
  breadcrumbs,
  actions,
  user,
  notifications = [],
  onSearch,
  onNotificationClick,
  onProfileClick,
  onSettingsClick,
  onLogout,
  showSearch = true,
  showNotifications = true,
  showProfile = true,
  showThemeToggle = true,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("system")
  
  const unreadNotifications = notifications.filter(n => !n.read).length

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }

  const ThemeIcon = themeIcons[theme]

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Title and Breadcrumbs */}
          <div className="flex flex-col">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center space-x-1 text-sm text-neutral-500">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span>/</span>}
                    {crumb.href ? (
                      <button className="hover:text-neutral-700 transition-colors">
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-neutral-900 font-medium">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}
            
            {title && (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
                {subtitle && (
                  <span className="text-sm text-neutral-500">• {subtitle}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Section - Search */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchInput
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Custom Actions */}
          {actions && (
            <div className="flex items-center gap-2 mr-2">
              {actions}
            </div>
          )}

          {/* Theme Toggle */}
          {showThemeToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ThemeIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Notifications */}
          {showNotifications && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center"
                    >
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </motion.span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications
                  {unreadNotifications > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadNotifications} new
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-neutral-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start p-3 cursor-pointer"
                        onClick={() => onNotificationClick?.(notification.id)}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-accent-500 rounded-full ml-2 mt-1" />
                          )}
                        </div>
                        <span className="text-xs text-neutral-400 mt-2">
                          {notification.time}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                
                {notifications.length > 5 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-center text-accent-600 font-medium">
                      View all notifications
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Profile */}
          {showProfile && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-2 gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{user.name}</span>
                    {user.role && (
                      <span className="text-xs text-neutral-500">{user.role}</span>
                    )}
                  </div>
                  <ChevronDown className="h-3 w-3 text-neutral-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-neutral-500">{user.email}</p>
                    {user.role && (
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span className="text-xs">{user.role}</span>
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={onProfileClick}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={onSettingsClick}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={onLogout} className="text-error-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      {showSearch && (
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-neutral-200 p-4"
          >
            <SearchInput
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </motion.div>
        </AnimatePresence>
      )}
    </motion.header>
  )
}
