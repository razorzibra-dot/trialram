import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "./button"
import { focusUtils, announceUtils, keyboardUtils } from "@/utils/accessibility"

interface AccessibleModalProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  initialFocus?: React.RefObject<HTMLElement>
  returnFocus?: React.RefObject<HTMLElement>
}

interface ModalContentProps {
  children: React.ReactNode
  className?: string
}

interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "right" | "center" | "between"
}

const AccessibleModal = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Root>,
  AccessibleModalProps
>(({
  children,
  open,
  onOpenChange,
  title,
  description,
  className,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  initialFocus,
  returnFocus,
  ...props
}, ref) => {
  const [previousFocus, setPreviousFocus] = React.useState<HTMLElement | null>(null)
  const modalRef = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()
  const descriptionId = React.useId()

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full mx-4"
  }

  // Handle focus management
  React.useEffect(() => {
    if (open) {
      // Store current focus
      setPreviousFocus(focusUtils.getCurrentFocus())
      
      // Announce modal opening
      announceUtils.announce(`${title} dialog opened`)
      
      // Focus initial element or first focusable element
      setTimeout(() => {
        if (initialFocus?.current) {
          initialFocus.current.focus()
        } else if (modalRef.current) {
          focusUtils.focusFirst(modalRef.current)
        }
      }, 100)
    } else {
      // Restore focus when modal closes
      if (returnFocus?.current) {
        focusUtils.restoreFocus(returnFocus.current)
      } else if (previousFocus) {
        focusUtils.restoreFocus(previousFocus)
      }
      
      // Announce modal closing
      announceUtils.announce(`${title} dialog closed`)
    }
  }, [open, title, initialFocus, returnFocus, previousFocus])

  // Set up focus trap
  React.useEffect(() => {
    if (open && modalRef.current) {
      const cleanup = focusUtils.trapFocus(modalRef.current)
      return cleanup
    }
  }, [open])

  // Handle escape key
  React.useEffect(() => {
    if (open && closeOnEscape) {
      const cleanup = keyboardUtils.handleEscape(() => onOpenChange(false))
      return cleanup
    }
  }, [open, closeOnEscape, onOpenChange])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={closeOnOverlayClick ? () => onOpenChange(false) : undefined}
        />
        <DialogPrimitive.Content
          ref={modalRef}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
            sizeClasses[size],
            className
          )}
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
})
AccessibleModal.displayName = "AccessibleModal"

const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  )
)
ModalContent.displayName = "ModalContent"

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, level = 2, ...props }, ref) => {
    const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
    
    return (
      <div ref={ref} className={cn("flex items-center justify-between", className)} {...props}>
        <HeadingTag className="text-lg font-semibold text-neutral-900">
          {children}
        </HeadingTag>
        <DialogPrimitive.Close asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogPrimitive.Close>
      </div>
    )
  }
)
ModalHeader.displayName = "ModalHeader"

const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  )
)
ModalBody.displayName = "ModalBody"

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, align = "right", ...props }, ref) => {
    const alignClasses = {
      left: "justify-start",
      right: "justify-end", 
      center: "justify-center",
      between: "justify-between"
    }
    
    return (
      <div 
        ref={ref} 
        className={cn(
          "flex gap-3 pt-4 border-t border-neutral-200",
          alignClasses[align],
          className
        )} 
        role="group"
        aria-label="Dialog actions"
        {...props}
      >
        {children}
      </div>
    )
  }
)
ModalFooter.displayName = "ModalFooter"

// Accessible modal title component
interface ModalTitleProps {
  children: React.ReactNode
  className?: string
  id?: string
}

const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, children, id, ...props }, ref) => (
    <DialogPrimitive.Title
      ref={ref}
      id={id}
      className={cn("text-lg font-semibold text-neutral-900", className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Title>
  )
)
ModalTitle.displayName = "ModalTitle"

// Accessible modal description component
interface ModalDescriptionProps {
  children: React.ReactNode
  className?: string
  id?: string
}

const ModalDescription = React.forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ className, children, id, ...props }, ref) => (
    <DialogPrimitive.Description
      ref={ref}
      id={id}
      className={cn("text-sm text-neutral-600", className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Description>
  )
)
ModalDescription.displayName = "ModalDescription"

export {
  AccessibleModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
}
