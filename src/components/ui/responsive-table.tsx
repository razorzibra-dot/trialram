import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

interface ResponsiveTableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface ResponsiveTableCellProps {
  label: string
  children: React.ReactNode
  className?: string
  hideOnMobile?: boolean
}

interface ResponsiveTableActionsProps {
  children: React.ReactNode
  className?: string
}

// Main responsive table container
const ResponsiveTable = React.forwardRef<HTMLDivElement, ResponsiveTableProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="relative w-full overflow-auto rounded-lg border border-neutral-200">
          <table className="w-full caption-bottom text-sm">
            {children}
          </table>
        </div>
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {children}
      </div>
    </div>
  )
)
ResponsiveTable.displayName = "ResponsiveTable"

// Mobile-optimized table row (renders as card on mobile)
const ResponsiveTableRow = React.forwardRef<HTMLDivElement, ResponsiveTableRowProps>(
  ({ className, children, onClick, ...props }, ref) => (
    <>
      {/* Desktop Row */}
      <tr 
        className={cn(
          "hidden md:table-row border-b transition-colors hover:bg-neutral-50/50 data-[state=selected]:bg-neutral-100",
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </tr>
      
      {/* Mobile Card */}
      <Card 
        ref={ref}
        className={cn(
          "md:hidden border-0 shadow-sm bg-white",
          onClick && "cursor-pointer hover:shadow-md transition-shadow",
          className
        )}
        onClick={onClick}
        {...props}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {children}
          </div>
        </CardContent>
      </Card>
    </>
  )
)
ResponsiveTableRow.displayName = "ResponsiveTableRow"

// Responsive table cell (renders differently on mobile)
const ResponsiveTableCell = React.forwardRef<HTMLDivElement, ResponsiveTableCellProps>(
  ({ label, children, className, hideOnMobile = false, ...props }, ref) => (
    <>
      {/* Desktop Cell */}
      <td 
        className={cn(
          "hidden md:table-cell p-2 sm:p-4 align-middle [&:has([role=checkbox])]:pr-0",
          className
        )}
        {...props}
      >
        {children}
      </td>
      
      {/* Mobile Row */}
      {!hideOnMobile && (
        <div 
          ref={ref}
          className="md:hidden flex justify-between items-center py-1"
          {...props}
        >
          <span className="text-sm font-medium text-neutral-500 flex-shrink-0 min-w-0 mr-3">
            {label}
          </span>
          <div className="text-sm text-neutral-900 text-right flex-1 min-w-0">
            {children}
          </div>
        </div>
      )}
    </>
  )
)
ResponsiveTableCell.displayName = "ResponsiveTableCell"

// Actions cell for mobile (always shows at bottom of card)
const ResponsiveTableActions = React.forwardRef<HTMLDivElement, ResponsiveTableActionsProps>(
  ({ className, children, ...props }, ref) => (
    <>
      {/* Desktop Cell */}
      <td 
        className={cn(
          "hidden md:table-cell p-2 sm:p-4 align-middle",
          className
        )}
        {...props}
      >
        {children}
      </td>
      
      {/* Mobile Actions */}
      <div 
        ref={ref}
        className="md:hidden pt-3 mt-3 border-t border-neutral-100 flex justify-end gap-2"
        {...props}
      >
        {children}
      </div>
    </>
  )
)
ResponsiveTableActions.displayName = "ResponsiveTableActions"

// Table header (only shows on desktop)
const ResponsiveTableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("hidden md:table-header-group [&_tr]:border-b", className)} {...props} />
  )
)
ResponsiveTableHeader.displayName = "ResponsiveTableHeader"

// Table body
const ResponsiveTableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("hidden md:table-row-group [&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
)
ResponsiveTableBody.displayName = "ResponsiveTableBody"

// Table head cell
const ResponsiveTableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-2 sm:px-4 text-left align-middle font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0 whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
)
ResponsiveTableHead.displayName = "ResponsiveTableHead"

// Mobile section header (for grouping mobile cards)
const MobileSectionHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref}
      className={cn("md:hidden sticky top-0 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 border-b border-neutral-200", className)}
      {...props}
    >
      {children}
    </div>
  )
)
MobileSectionHeader.displayName = "MobileSectionHeader"

export {
  ResponsiveTable,
  ResponsiveTableRow,
  ResponsiveTableCell,
  ResponsiveTableActions,
  ResponsiveTableHeader,
  ResponsiveTableBody,
  ResponsiveTableHead,
  MobileSectionHeader,
}
