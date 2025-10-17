import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { announceUtils, keyboardUtils } from "@/utils/accessibility"

interface AccessibleTableProps {
  children: React.ReactNode
  className?: string
  caption?: string
  summary?: string
  "aria-label"?: string
  "aria-labelledby"?: string
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
  sortable?: boolean
  sortDirection?: "asc" | "desc" | "none"
  onSort?: () => void
  scope?: "col" | "row"
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
  scope?: "col" | "row" | "colgroup" | "rowgroup"
  headers?: string
  role?: string
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  selected?: boolean
  onSelect?: (selected: boolean) => void
  selectable?: boolean
  rowIndex?: number
}

interface SelectionState {
  selectedRows: Set<number>
  selectAll: boolean
  indeterminate: boolean
}

// Main accessible table component
const AccessibleTable = React.forwardRef<HTMLTableElement, AccessibleTableProps>(
  ({ className, children, caption, summary, ...props }, ref) => {
    const tableId = React.useId()
    
    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          id={tableId}
          className={cn("w-full caption-bottom text-sm", className)}
          role="table"
          {...props}
        >
          {caption && (
            <caption className="mt-4 text-sm text-neutral-500 text-left font-medium">
              {caption}
            </caption>
          )}
          {summary && (
            <caption className="sr-only">
              {summary}
            </caption>
          )}
          {children}
        </table>
      </div>
    )
  }
)
AccessibleTable.displayName = "AccessibleTable"

// Accessible table header with sorting
const AccessibleTableHeader = React.forwardRef<HTMLTableCellElement, TableHeaderProps>(
  ({ 
    className, 
    children, 
    sortable = false, 
    sortDirection = "none", 
    onSort, 
    scope = "col",
    ...props 
  }, ref) => {
    const headerId = React.useId()
    
    const getSortIcon = () => {
      if (!sortable) return null
      
      switch (sortDirection) {
        case "asc":
          return <ChevronUp className="ml-2 h-4 w-4" aria-hidden="true" />
        case "desc":
          return <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
        default:
          return <ChevronsUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
      }
    }
    
    const getSortLabel = () => {
      switch (sortDirection) {
        case "asc":
          return "sorted ascending"
        case "desc":
          return "sorted descending"
        default:
          return "not sorted"
      }
    }
    
    const handleSort = () => {
      if (sortable && onSort) {
        onSort()
        // Announce sort change to screen readers
        const direction = sortDirection === "asc" ? "descending" : "ascending"
        announceUtils.announce(`Column sorted ${direction}`)
      }
    }
    
    if (sortable) {
      return (
        <th
          ref={ref}
          id={headerId}
          scope={scope}
          className={cn(
            "h-12 px-4 text-left align-middle font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0",
            className
          )}
          {...props}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 font-medium text-neutral-500 hover:text-neutral-900 focus-ring"
            onClick={handleSort}
            aria-label={`Sort by ${children}, currently ${getSortLabel()}`}
            aria-sort={sortDirection === "none" ? "none" : sortDirection}
          >
            <span className="flex items-center">
              {children}
              {getSortIcon()}
            </span>
          </Button>
        </th>
      )
    }
    
    return (
      <th
        ref={ref}
        id={headerId}
        scope={scope}
        className={cn(
          "h-12 px-4 text-left align-middle font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0",
          className
        )}
        {...props}
      >
        {children}
      </th>
    )
  }
)
AccessibleTableHeader.displayName = "AccessibleTableHeader"

// Accessible table cell
const AccessibleTableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, scope, headers, role, ...props }, ref) => {
    const cellId = React.useId()
    
    return (
      <td
        ref={ref}
        id={cellId}
        scope={scope}
        headers={headers}
        role={role}
        className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
        {...props}
      >
        {children}
      </td>
    )
  }
)
AccessibleTableCell.displayName = "AccessibleTableCell"

// Accessible table row with selection
const AccessibleTableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ 
    className, 
    children, 
    selected = false, 
    onSelect, 
    selectable = false,
    rowIndex,
    ...props 
  }, ref) => {
    const rowId = React.useId()
    
    const handleSelect = (checked: boolean) => {
      if (onSelect) {
        onSelect(checked)
        // Announce selection change
        const action = checked ? "selected" : "deselected"
        announceUtils.announce(`Row ${rowIndex !== undefined ? rowIndex + 1 : ''} ${action}`)
      }
    }
    
    return (
      <tr
        ref={ref}
        id={rowId}
        className={cn(
          "border-b transition-colors hover:bg-neutral-50/50 data-[state=selected]:bg-neutral-100",
          selected && "bg-neutral-100",
          className
        )}
        aria-selected={selectable ? selected : undefined}
        role={selectable ? "row" : undefined}
        {...props}
      >
        {selectable && (
          <AccessibleTableCell className="w-12">
            <Checkbox
              checked={selected}
              onCheckedChange={handleSelect}
              aria-label={`Select row ${rowIndex !== undefined ? rowIndex + 1 : ''}`}
            />
          </AccessibleTableCell>
        )}
        {children}
      </tr>
    )
  }
)
AccessibleTableRow.displayName = "AccessibleTableRow"

// Table with bulk selection capabilities
interface BulkSelectTableProps<T = unknown> extends AccessibleTableProps {
  data: T[]
  onSelectionChange?: (selectedRows: number[]) => void
  selectable?: boolean
}

const BulkSelectTable = React.forwardRef<HTMLTableElement, BulkSelectTableProps>(
  ({ 
    children, 
    data, 
    onSelectionChange, 
    selectable = false,
    ...props 
  }: BulkSelectTableProps, ref) => {
    const [selection, setSelection] = React.useState<SelectionState>({
      selectedRows: new Set(),
      selectAll: false,
      indeterminate: false
    })
    
    const updateSelection = React.useCallback((newSelection: SelectionState) => {
      setSelection(newSelection)
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelection.selectedRows))
      }
    }, [onSelectionChange])
    
    const handleSelectAll = (checked: boolean) => {
      if (checked) {
        const allRows = new Set(data.map((_, index) => index))
        updateSelection({
          selectedRows: allRows,
          selectAll: true,
          indeterminate: false
        })
        announceUtils.announce(`All ${data.length} rows selected`)
      } else {
        updateSelection({
          selectedRows: new Set(),
          selectAll: false,
          indeterminate: false
        })
        announceUtils.announce("All rows deselected")
      }
    }
    
    const handleRowSelect = (rowIndex: number, checked: boolean) => {
      const newSelectedRows = new Set(selection.selectedRows)
      
      if (checked) {
        newSelectedRows.add(rowIndex)
      } else {
        newSelectedRows.delete(rowIndex)
      }
      
      const selectAll = newSelectedRows.size === data.length
      const indeterminate = newSelectedRows.size > 0 && newSelectedRows.size < data.length
      
      updateSelection({
        selectedRows: newSelectedRows,
        selectAll,
        indeterminate
      })
    }
    
    // Provide selection context to children
    const contextValue = {
      selection,
      handleSelectAll,
      handleRowSelect,
      selectable
    }
    
    return (
      <SelectionContext.Provider value={contextValue}>
        <AccessibleTable ref={ref} {...props}>
          {children}
        </AccessibleTable>
      </SelectionContext.Provider>
    )
  }
)
BulkSelectTable.displayName = "BulkSelectTable"

// Selection context for sharing state
const SelectionContext = React.createContext<{
  selection: SelectionState
  handleSelectAll: (checked: boolean) => void
  handleRowSelect: (rowIndex: number, checked: boolean) => void
  selectable: boolean
} | null>(null)

// Hook to use selection context
const useTableSelection = () => {
  const context = React.useContext(SelectionContext)
  if (!context) {
    throw new Error("useTableSelection must be used within a BulkSelectTable")
  }
  return context
}

// Accessible table header with select all
const SelectAllHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { selection, handleSelectAll, selectable } = useTableSelection()
  
  if (!selectable) return null
  
  return (
    <AccessibleTableHeader className="w-12">
      <Checkbox
        checked={selection.selectAll}
        indeterminate={selection.indeterminate}
        onCheckedChange={handleSelectAll}
        aria-label="Select all rows"
      />
      {children}
    </AccessibleTableHeader>
  )
}

export {
  AccessibleTable,
  AccessibleTableHeader,
  AccessibleTableCell,
  AccessibleTableRow,
  BulkSelectTable,
  SelectAllHeader,
  useTableSelection,
}
