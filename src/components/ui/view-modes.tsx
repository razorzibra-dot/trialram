import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Badge, StatusBadge } from "./badge"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { 
  LayoutGrid, 
  Table, 
  Calendar, 
  BarChart3, 
  Plus, 
  Filter,
  Search,
  MoreHorizontal,
  GripVertical
} from "lucide-react"
import { Input } from "./input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"

// View Mode Selector
interface ViewModeSelectorProps {
  currentView: 'table' | 'kanban' | 'timeline' | 'dashboard'
  onViewChange: (view: 'table' | 'kanban' | 'timeline' | 'dashboard') => void
  className?: string
}

const ViewModeSelector = React.forwardRef<HTMLDivElement, ViewModeSelectorProps>(
  ({ currentView, onViewChange, className, ...props }, ref) => {
    const views = [
      { id: 'table' as const, label: 'Table', icon: Table },
      { id: 'kanban' as const, label: 'Kanban', icon: LayoutGrid },
      { id: 'timeline' as const, label: 'Timeline', icon: Calendar },
      { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    ]

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-1 p-1 bg-neutral-100 rounded-lg",
          className
        )}
        {...props}
      >
        {views.map((view) => {
          const Icon = view.icon
          return (
            <Button
              key={view.id}
              variant={currentView === view.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange(view.id)}
              className={cn(
                "gap-2 transition-all duration-200",
                currentView === view.id 
                  ? "bg-white shadow-sm text-accent-600" 
                  : "text-neutral-600 hover:text-neutral-700"
              )}
            >
              <Icon className="h-4 w-4" />
              {view.label}
            </Button>
          )
        })}
      </div>
    )
  }
)
ViewModeSelector.displayName = "ViewModeSelector"

// Kanban Board
interface KanbanBoardProps {
  columns: Array<{
    id: string
    title: string
    color: string
    items: Array<{
      id: string
      title: string
      status?: string
      priority?: string
      assignee?: string
      dueDate?: string
    }>
  }>
  onItemMove?: (itemId: string, fromColumn: string, toColumn: string) => void
  className?: string
}

const KanbanBoard = React.forwardRef<HTMLDivElement, KanbanBoardProps>(
  ({ columns, onItemMove, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex gap-6 overflow-x-auto pb-4",
        className
      )}
      {...props}
    >
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80"
        >
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <h3 className="font-semibold text-neutral-700">{column.title}</h3>
              <Badge variant="secondary" size="sm">
                {column.items.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-neutral-500">
              <Plus className="h-4 w-4 mr-2" />
              Add item
            </Button>
          </div>
          
          <div className="space-y-3">
            {column.items.map((item) => (
              <Card 
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4"
                style={{ borderLeftColor: column.color }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-neutral-700 line-clamp-2">
                      {item.title}
                    </h4>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.status && (
                      <StatusBadge 
                        status={item.status as any} 
                        size="sm"
                      />
                    )}
                    {item.priority && (
                      <Badge variant="outline" size="sm">
                        {item.priority}
                      </Badge>
                    )}
                  </div>
                  
                  {(item.assignee || item.dueDate) && (
                    <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
                      {item.assignee && (
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {item.assignee.charAt(0).toUpperCase()}
                          </div>
                          <span>{item.assignee}</span>
                        </div>
                      )}
                      {item.dueDate && (
                        <span>{item.dueDate}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
)
KanbanBoard.displayName = "KanbanBoard"

// Timeline View
interface TimelineViewProps {
  items: Array<{
    id: string
    title: string
    startDate: string
    endDate: string
    progress: number
    color: string
    assignee?: string
  }>
  className?: string
}

const TimelineView = React.forwardRef<HTMLDivElement, TimelineViewProps>(
  ({ items, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "space-y-4",
        className
      )}
      {...props}
    >
      {/* Timeline Header */}
      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-neutral-600 border-b border-neutral-200 pb-2">
        <div className="col-span-3">Task</div>
        <div className="col-span-2">Assignee</div>
        <div className="col-span-7">Timeline</div>
      </div>
      
      {/* Timeline Items */}
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-12 gap-4 items-center py-3 hover:bg-neutral-50 rounded-lg px-2 transition-colors">
          <div className="col-span-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-neutral-400" />
              <span className="font-medium text-sm text-neutral-700">{item.title}</span>
            </div>
          </div>
          
          <div className="col-span-2">
            {item.assignee && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {item.assignee.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-neutral-600">{item.assignee}</span>
              </div>
            )}
          </div>
          
          <div className="col-span-7">
            <div className="relative">
              <div className="h-8 bg-neutral-100 rounded-lg overflow-hidden">
                <div 
                  className="h-full rounded-lg flex items-center px-2 text-white text-xs font-medium"
                  style={{ 
                    backgroundColor: item.color,
                    width: `${item.progress}%`
                  }}
                >
                  {item.progress > 20 && `${item.progress}%`}
                </div>
              </div>
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>{item.startDate}</span>
                <span>{item.endDate}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
)
TimelineView.displayName = "TimelineView"

// Dashboard View
interface DashboardViewProps {
  widgets: Array<{
    id: string
    title: string
    type: 'chart' | 'stats' | 'list'
    data: any
  }>
  className?: string
}

const DashboardView = React.forwardRef<HTMLDivElement, DashboardViewProps>(
  ({ widgets, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
      {...props}
    >
      {widgets.map((widget) => (
        <Card key={widget.id} className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-neutral-700">
              {widget.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {widget.type === 'stats' && (
              <div className="space-y-2">
                <div className="text-3xl font-bold text-accent-600">
                  {widget.data.value}
                </div>
                <div className="text-sm text-neutral-500">
                  {widget.data.label}
                </div>
              </div>
            )}
            {widget.type === 'list' && (
              <div className="space-y-2">
                {widget.data.items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm text-neutral-700">{item.label}</span>
                    <Badge variant="secondary" size="sm">{item.value}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
)
DashboardView.displayName = "DashboardView"

// Workspace Header
interface WorkspaceHeaderProps {
  title: string
  description?: string
  currentView: 'table' | 'kanban' | 'timeline' | 'dashboard'
  onViewChange: (view: 'table' | 'kanban' | 'timeline' | 'dashboard') => void
  onSearch?: (query: string) => void
  onFilter?: () => void
  onAdd?: () => void
  className?: string
}

const WorkspaceHeader = React.forwardRef<HTMLDivElement, WorkspaceHeaderProps>(
  ({ 
    title, 
    description, 
    currentView, 
    onViewChange, 
    onSearch, 
    onFilter, 
    onAdd, 
    className, 
    ...props 
  }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
        className
      )}
      {...props}
    >
      <div>
        <h1 className="text-2xl font-bold text-neutral-700">{title}</h1>
        {description && (
          <p className="text-neutral-500 mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {onSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        )}
        
        <ViewModeSelector
          currentView={currentView}
          onViewChange={onViewChange}
        />
        
        {onFilter && (
          <Button variant="outline" size="sm" onClick={onFilter}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        )}
        
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>
    </div>
  )
)
WorkspaceHeader.displayName = "WorkspaceHeader"

export {
  ViewModeSelector,
  KanbanBoard,
  TimelineView,
  DashboardView,
  WorkspaceHeader,
}
