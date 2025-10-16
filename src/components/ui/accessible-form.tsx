import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Textarea } from "./textarea"

interface FormFieldProps {
  children: React.ReactNode
  className?: string
  error?: boolean
}

interface FormGroupProps {
  children: React.ReactNode
  className?: string
  legend?: string
  description?: string
}

interface FormErrorProps {
  children: React.ReactNode
  className?: string
  id?: string
}

interface FormHelperProps {
  children: React.ReactNode
  className?: string
  id?: string
}

interface AccessibleFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
  className?: string
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  noValidate?: boolean
}

// Main form wrapper with proper semantics
const AccessibleForm = React.forwardRef<HTMLFormElement, AccessibleFormProps>(
  ({ className, children, noValidate = true, ...props }, ref) => (
    <form
      ref={ref}
      className={cn("space-y-6", className)}
      noValidate={noValidate}
      {...props}
    >
      {children}
    </form>
  )
)
AccessibleForm.displayName = "AccessibleForm"

// Form field wrapper with proper spacing and error states
const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, error, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "space-y-2",
        error && "space-y-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
FormField.displayName = "FormField"

// Form group for related fields (uses fieldset for accessibility)
const FormGroup = React.forwardRef<HTMLFieldSetElement, FormGroupProps>(
  ({ className, children, legend, description, ...props }, ref) => (
    <fieldset
      ref={ref}
      className={cn("space-y-4 border-0 p-0 m-0", className)}
      {...props}
    >
      {legend && (
        <legend className="text-base font-semibold text-neutral-900 mb-4">
          {legend}
        </legend>
      )}
      {description && (
        <p className="text-sm text-neutral-600 mb-4">
          {description}
        </p>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  )
)
FormGroup.displayName = "FormGroup"

// Accessible error message component
const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, children, id, ...props }, ref) => (
    <p
      ref={ref}
      id={id}
      className={cn("text-sm text-red-600 font-medium", className)}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {children}
    </p>
  )
)
FormError.displayName = "FormError"

// Helper text component
const FormHelper = React.forwardRef<HTMLParagraphElement, FormHelperProps>(
  ({ className, children, id, ...props }, ref) => (
    <p
      ref={ref}
      id={id}
      className={cn("text-sm text-neutral-600", className)}
      {...props}
    >
      {children}
    </p>
  )
)
FormHelper.displayName = "FormHelper"

// Accessible label component with required indicator
interface AccessibleLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  children: React.ReactNode
}

const AccessibleLabel = React.forwardRef<HTMLLabelElement, AccessibleLabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <Label
      ref={ref}
      className={cn("text-sm font-medium text-neutral-700", className)}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required field">
          *
        </span>
      )}
    </Label>
  )
)
AccessibleLabel.displayName = "AccessibleLabel"

// Form section with proper heading hierarchy
interface FormSectionProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  level?: 2 | 3 | 4 | 5 | 6
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, children, title, description, level = 2, ...props }, ref) => {
    const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
    
    return (
      <section
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        {title && (
          <div className="space-y-1">
            <HeadingTag className="text-lg font-semibold text-neutral-900">
              {title}
            </HeadingTag>
            {description && (
              <p className="text-sm text-neutral-600">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </section>
    )
  }
)
FormSection.displayName = "FormSection"

// Form actions with proper button grouping
interface FormActionsProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "right" | "center" | "between"
}

const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
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
        aria-label="Form actions"
        {...props}
      >
        {children}
      </div>
    )
  }
)
FormActions.displayName = "FormActions"

// Skip link for keyboard navigation
const SkipLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ className, children = "Skip to main content", href = "#main", ...props }, ref) => (
    <a
      ref={ref}
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-accent-500 text-white px-4 py-2 rounded-md z-50 font-medium",
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
)
SkipLink.displayName = "SkipLink"

// Live region for dynamic content announcements
interface LiveRegionProps {
  children: React.ReactNode
  className?: string
  politeness?: "polite" | "assertive" | "off"
  atomic?: boolean
}

const LiveRegion = React.forwardRef<HTMLDivElement, LiveRegionProps>(
  ({ className, children, politeness = "polite", atomic = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("sr-only", className)}
      aria-live={politeness}
      aria-atomic={atomic}
      {...props}
    >
      {children}
    </div>
  )
)
LiveRegion.displayName = "LiveRegion"

export {
  AccessibleForm,
  FormField,
  FormGroup,
  FormError,
  FormHelper,
  AccessibleLabel,
  FormSection,
  FormActions,
  SkipLink,
  LiveRegion,
}
