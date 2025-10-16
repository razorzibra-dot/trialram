import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge, StatusBadge, PriorityBadge } from "./badge"
import { Button } from "./button"
import { EnhancedButton } from "./enhanced-button"
import { Input } from "./input"
import { EnhancedInput } from "./enhanced-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Checkbox } from "./checkbox"
import {
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Plus,
  Edit2,
  Check,
  X,
  Search,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"

// Enhanced Monday.com Table Container
interface MondayTableProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  actions?: React.ReactNode
  searchable?: boolean
  onSearch?: (query: string) => void
  exportable?: boolean
  onExport?: () => void
  selectable?: boolean
  selectedCount?: number
  totalCount?: number
  loading?: boolean
}

const MondayTable = React.forwardRef<HTMLDivElement, MondayTableProps>(
  ({
    className,
    children,
    title,
    description,
    actions,
    searchable = false,
    onSearch,
    exportable = false,
    onExport,
    selectable = false,
    selectedCount = 0,
    totalCount = 0,
    loading = false,
    ...props
  }, ref) => {
    const [searchQuery, setSearchQuery] = React.useState("")

    const handleSearch = (query: string) => {
      setSearchQuery(query)
      onSearch?.(query)
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "w-full bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Table Header */}
        {(title || description || searchable || exportable || actions) && (
          <div className="border-b border-neutral-200 bg-neutral-50/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {title && (
                  <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                )}
                {description && (
                  <p className="text-sm text-neutral-600 mt-1">{description}</p>
                )}
                {selectable && totalCount > 0 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    {selectedCount > 0
                      ? `${selectedCount} of ${totalCount} selected`
                      : `${totalCount} items`
                    }
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {searchable && (
                  <div className="w-64">
                    <EnhancedInput
                      placeholder="Search table..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      leftIcon={<Search className="h-4 w-4" />}
                      clearable
                      onClear={() => handleSearch("")}
                    />
                  </div>
                )}

                {exportable && (
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={onExport}
                    icon={<Download className="h-4 w-4" />}
                  >
                    Export
                  </EnhancedButton>
                )}

                {actions}
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-neutral-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent-500 border-t-transparent" />
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              {children}
            </table>
          </div>
        </div>
      </motion.div>
    )
  }
)
MondayTable.displayName = "MondayTable"

// Enhanced Monday.com Table Header
const MondayTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200 sticky top-0 z-10",
      className
    )}
    {...props}
  />
))
MondayTableHeader.displayName = "MondayTableHeader"

// Monday.com Table Body
const MondayTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
MondayTableBody.displayName = "MondayTableBody"

// Monday.com Table Row
interface MondayTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean
  hoverable?: boolean
}

const MondayTableRow = React.forwardRef<HTMLTableRowElement, MondayTableRowProps>(
  ({ className, selected, hoverable = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-neutral-200 transition-colors",
        hoverable && "hover:bg-neutral-50",
        selected && "bg-accent-50 border-accent-200",
        className
      )}
      {...props}
    />
  )
)
MondayTableRow.displayName = "MondayTableRow"

// Enhanced Monday.com Table Head Cell
interface MondayTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
  resizable?: boolean
  filterable?: boolean
  onFilter?: () => void
  width?: string | number
}

const MondayTableHead = React.forwardRef<HTMLTableCellElement, MondayTableHeadProps>(
  ({
    className,
    children,
    sortable,
    sortDirection,
    onSort,
    resizable,
    filterable,
    onFilter,
    width,
    ...props
  }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false)

    const getSortIcon = () => {
      if (sortDirection === 'asc') return <ArrowUp className="h-3 w-3" />
      if (sortDirection === 'desc') return <ArrowDown className="h-3 w-3" />
      return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100" />
    }

    return (
      <th
        ref={ref}
        className={cn(
          "h-12 px-4 text-left align-middle font-semibold text-neutral-700 text-sm group relative",
          "border-r border-neutral-200 last:border-r-0 bg-gradient-to-b from-neutral-50 to-neutral-100",
          (sortable || filterable) && "cursor-pointer hover:bg-gradient-to-b hover:from-neutral-100 hover:to-neutral-200 select-none transition-all duration-200",
          resizable && "relative",
          className
        )}
        style={{ width }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 flex-1"
            onClick={sortable ? onSort : undefined}
          >
            <span className="truncate font-medium">{children}</span>
            {sortable && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: sortDirection || isHovered ? 1 : 0 }}
                className={cn(
                  "transition-colors",
                  sortDirection ? "text-accent-600" : "text-neutral-400"
                )}
              >
                {getSortIcon()}
              </motion.div>
            )}
          </div>

          {filterable && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              onClick={onFilter}
              className="p-1 hover:bg-neutral-300 rounded transition-colors ml-1"
            >
              <Filter className="h-3 w-3 text-neutral-500" />
            </motion.button>
          )}

          {resizable && (
            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent-500 transition-colors opacity-0 hover:opacity-100" />
          )}
        </div>
      </th>
    )
  }
)
MondayTableHead.displayName = "MondayTableHead"

// Monday.com Table Cell
interface MondayTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  editable?: boolean
  editing?: boolean
  onEdit?: () => void
  onSave?: (value: string) => void
  onCancel?: () => void
  type?: 'text' | 'status' | 'priority' | 'date' | 'number' | 'select'
  options?: string[]
}

const MondayTableCell = React.forwardRef<HTMLTableCellElement, MondayTableCellProps>(
  ({ 
    className, 
    children, 
    editable, 
    editing, 
    onEdit, 
    onSave, 
    onCancel, 
    type = 'text',
    options = [],
    ...props 
  }, ref) => {
    const [editValue, setEditValue] = React.useState('')

    React.useEffect(() => {
      if (editing && typeof children === 'string') {
        setEditValue(children)
      }
    }, [editing, children])

    const handleSave = () => {
      onSave?.(editValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave()
      } else if (e.key === 'Escape') {
        onCancel?.()
      }
    }

    return (
      <td
        ref={ref}
        className={cn(
          "p-4 align-middle border-r border-neutral-200 last:border-r-0 min-h-[52px]",
          editable && !editing && "hover:bg-neutral-50 cursor-pointer group",
          className
        )}
        onClick={editable && !editing ? onEdit : undefined}
        {...props}
      >
        {editing ? (
          <div className="flex items-center gap-2">
            {type === 'select' ? (
              <Select value={editValue} onValueChange={setEditValue}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm"
                autoFocus
              />
            )}
            <div className="flex gap-1">
              <Button size="icon-sm" variant="ghost" onClick={handleSave}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={onCancel}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {children}
            </div>
            {editable && (
              <Edit2 className="h-3 w-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        )}
      </td>
    )
  }
)
MondayTableCell.displayName = "MondayTableCell"

// Monday.com Table Checkbox Cell
interface MondayTableCheckboxCellProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}

const MondayTableCheckboxCell = React.forwardRef<HTMLTableCellElement, MondayTableCheckboxCellProps>(
  ({ checked, onCheckedChange, className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle border-r border-neutral-200 w-12",
        className
      )}
      {...props}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-accent-500 data-[state=checked]:border-accent-500"
      />
    </td>
  )
)
MondayTableCheckboxCell.displayName = "MondayTableCheckboxCell"

// Monday.com Table Status Cell
interface MondayTableStatusCellProps {
  status: 'done' | 'working' | 'stuck' | 'pending' | 'critical' | 'high' | 'medium' | 'low'
  editable?: boolean
  onStatusChange?: (status: string) => void
  className?: string
}

const MondayTableStatusCell = React.forwardRef<HTMLTableCellElement, MondayTableStatusCellProps>(
  ({ status, editable, onStatusChange, className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle border-r border-neutral-200 last:border-r-0",
        className
      )}
      {...props}
    >
      <StatusBadge status={status} />
    </td>
  )
)
MondayTableStatusCell.displayName = "MondayTableStatusCell"

// Monday.com Table Actions Cell
interface MondayTableActionsCellProps {
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  className?: string
}

const MondayTableActionsCell = React.forwardRef<HTMLTableCellElement, MondayTableActionsCellProps>(
  ({ onEdit, onDelete, onDuplicate, className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle border-r border-neutral-200 last:border-r-0 w-12",
        className
      )}
      {...props}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          {onDuplicate && (
            <DropdownMenuItem onClick={onDuplicate}>
              <Plus className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem onClick={onDelete} className="text-error-600">
              <X className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </td>
  )
)
MondayTableActionsCell.displayName = "MondayTableActionsCell"

export {
  MondayTable,
  MondayTableHeader,
  MondayTableBody,
  MondayTableRow,
  MondayTableHead,
  MondayTableCell,
  MondayTableCheckboxCell,
  MondayTableStatusCell,
  MondayTableActionsCell,
}
