import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { X, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { EnhancedButton } from "./enhanced-button"

const enhancedModalVariants = cva(
  "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        default: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        "2xl": "max-w-6xl",
        full: "max-w-[95vw] max-h-[95vh]",
      },
      variant: {
        default: "border-neutral-200 bg-white shadow-xl",
        glass: "border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl",
        modern: "border-neutral-200 bg-gradient-to-br from-white to-neutral-50 shadow-2xl",
        dark: "border-neutral-800 bg-neutral-900 text-white shadow-2xl",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

interface EnhancedModalProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>,
    VariantProps<typeof enhancedModalVariants> {
  title?: string
  description?: string
  children?: React.ReactNode
  trigger?: React.ReactNode
  footer?: React.ReactNode
  closable?: boolean
  maximizable?: boolean
  onClose?: () => void
  className?: string
}

const EnhancedModal: React.FC<EnhancedModalProps> = ({
  title,
  description,
  children,
  trigger,
  footer,
  size,
  variant,
  closable = true,
  maximizable = false,
  onClose,
  className,
  ...props
}) => {
  const [isMaximized, setIsMaximized] = React.useState(false)

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  }

  return (
    <DialogPrimitive.Root {...props}>
      {trigger && (
        <DialogPrimitive.Trigger asChild>
          {trigger}
        </DialogPrimitive.Trigger>
      )}
      
      <AnimatePresence>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay asChild>
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            />
          </DialogPrimitive.Overlay>
          
          <DialogPrimitive.Content asChild>
            <motion.div
              className={cn(
                enhancedModalVariants({ 
                  size: isMaximized ? "full" : size, 
                  variant, 
                  className 
                })
              )}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              {(title || description || closable || maximizable) && (
                <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
                  <div className="flex-1">
                    {title && (
                      <DialogPrimitive.Title className="text-lg font-semibold text-neutral-900">
                        {title}
                      </DialogPrimitive.Title>
                    )}
                    {description && (
                      <DialogPrimitive.Description className="text-sm text-neutral-600 mt-1">
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    {maximizable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsMaximized(!isMaximized)}
                      >
                        {isMaximized ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {closable && (
                      <DialogPrimitive.Close asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={onClose}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Close</span>
                        </Button>
                      </DialogPrimitive.Close>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

// Confirmation Modal
interface ConfirmationModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
  loading?: boolean
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
}) => {
  return (
    <EnhancedModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.()
              onOpenChange?.(false)
            }}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <EnhancedButton
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </EnhancedButton>
        </div>
      }
    />
  )
}

// Form Modal
interface FormModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  submitText?: string
  cancelText?: string
  onSubmit?: () => void
  onCancel?: () => void
  loading?: boolean
  size?: "sm" | "default" | "lg" | "xl" | "2xl"
}

const FormModal: React.FC<FormModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitText = "Save",
  cancelText = "Cancel",
  onSubmit,
  onCancel,
  loading = false,
  size = "default",
}) => {
  return (
    <EnhancedModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size={size}
      variant="modern"
      maximizable
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.()
              onOpenChange?.(false)
            }}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <EnhancedButton
            onClick={onSubmit}
            loading={loading}
            variant="gradient"
          >
            {submitText}
          </EnhancedButton>
        </div>
      }
    >
      {children}
    </EnhancedModal>
  )
}

// Quick Action Modal
interface QuickActionModalProps {
  trigger: React.ReactNode
  title: string
  children: React.ReactNode
  size?: "sm" | "default" | "lg"
}

const QuickActionModal: React.FC<QuickActionModalProps> = ({
  trigger,
  title,
  children,
  size = "sm",
}) => {
  return (
    <EnhancedModal
      trigger={trigger}
      title={title}
      size={size}
      variant="glass"
    >
      {children}
    </EnhancedModal>
  )
}

export {
  EnhancedModal,
  ConfirmationModal,
  FormModal,
  QuickActionModal,
  enhancedModalVariants,
}
