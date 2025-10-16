import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean
  errorMessage?: string
  helperText?: string
  label?: string
  required?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorMessage, helperText, label, required, id, ...props }, ref) => {
    const inputId = id || React.useId()
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700 block"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            )}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 sm:h-10 w-full rounded-md border bg-white px-3 py-2 text-sm sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 touch-target",
            error
              ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
              : "border-neutral-300 focus-visible:border-blue-500",
            className
          )}
          ref={ref}
          aria-invalid={error}
          aria-describedby={cn(
            errorMessage && errorId,
            helperText && helperId
          )}
          aria-required={required}
          {...props}
        />
        {helperText && !error && (
          <p id={helperId} className="text-sm text-neutral-600">
            {helperText}
          </p>
        )}
        {error && errorMessage && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Glass variant for special use cases
const GlassInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-white/30 bg-white/20 backdrop-blur-md px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:border-white/60 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
GlassInput.displayName = "GlassInput"

export { Input, GlassInput }