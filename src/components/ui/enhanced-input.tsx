import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

const enhancedInputVariants = cva(
  "flex w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-neutral-200 focus:border-accent-500 hover:border-neutral-300",
        filled: "bg-neutral-50 border-neutral-200 focus:bg-white focus:border-accent-500 hover:bg-neutral-100",
        outline: "border-2 border-neutral-200 focus:border-accent-500 hover:border-neutral-300",
        ghost: "border-transparent bg-neutral-50 focus:bg-white focus:border-accent-500 hover:bg-neutral-100",
        success: "border-success-300 focus:border-success-500 focus:ring-success-500",
        warning: "border-warning-300 focus:border-warning-500 focus:ring-warning-500",
        error: "border-error-300 focus:border-error-500 focus:ring-error-500",
      },
      size: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3",
        lg: "h-12 px-4 text-base",
        xl: "h-14 px-5 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof enhancedInputVariants> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  floating?: boolean
  clearable?: boolean
  onClear?: () => void
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({
    className,
    variant,
    size,
    type,
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    floating = false,
    clearable = false,
    onClear,
    value,
    placeholder,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(Boolean(value))

    React.useEffect(() => {
      setHasValue(Boolean(value))
    }, [value])

    const handleClear = () => {
      if (onClear) {
        onClear()
      }
    }

    const inputVariant = error ? "error" : variant

    return (
      <div className="space-y-2">
        <div className="relative">
          {/* Floating Label */}
          {floating && label && (
            <motion.label
              className={cn(
                "absolute left-3 text-sm text-neutral-500 pointer-events-none transition-all duration-200",
                (isFocused || hasValue) 
                  ? "top-2 text-xs text-accent-600 bg-white px-1 -translate-y-1/2" 
                  : "top-1/2 -translate-y-1/2"
              )}
              animate={{
                y: (isFocused || hasValue) ? -20 : 0,
                scale: (isFocused || hasValue) ? 0.85 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.label>
          )}

          {/* Static Label */}
          {!floating && label && (
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {label}
            </label>
          )}

          <div className="relative">
            {/* Left Icon */}
            {leftIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                {leftIcon}
              </div>
            )}

            <input
              type={type}
              className={cn(
                enhancedInputVariants({ variant: inputVariant, size, className }),
                leftIcon && "pl-10",
                (rightIcon || clearable) && "pr-10"
              )}
              ref={ref}
              value={value}
              placeholder={floating ? "" : placeholder}
              onFocus={(e) => {
                setIsFocused(true)
                props.onFocus?.(e)
              }}
              onBlur={(e) => {
                setIsFocused(false)
                props.onBlur?.(e)
              }}
              {...props}
            />

            {/* Right Icon or Clear Button */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {clearable && hasValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {rightIcon && (
                <div className="text-neutral-400">
                  {rightIcon}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Helper Text or Error */}
        <AnimatePresence>
          {(helperText || error) && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "text-xs",
                error ? "text-error-600" : "text-neutral-500"
              )}
            >
              {error || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
EnhancedInput.displayName = "EnhancedInput"

// Search Input Component
interface SearchInputProps extends Omit<EnhancedInputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onSearch?.(e.target.value)
    }

    return (
      <EnhancedInput
        ref={ref}
        type="search"
        leftIcon={<Search className="h-4 w-4" />}
        placeholder="Search..."
        clearable
        onChange={handleChange}
        {...props}
      />
    )
  }
)
SearchInput.displayName = "SearchInput"

// Password Input Component
interface PasswordInputProps extends Omit<EnhancedInputProps, 'type' | 'rightIcon'> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <EnhancedInput
        ref={ref}
        type={showPassword ? "text" : "password"}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...props}
      />
    )
  }
)
PasswordInput.displayName = "PasswordInput"

// Number Input Component
interface NumberInputProps extends Omit<EnhancedInputProps, 'type'> {
  min?: number
  max?: number
  step?: number
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ min, max, step = 1, ...props }, ref) => (
    <EnhancedInput
      ref={ref}
      type="number"
      min={min}
      max={max}
      step={step}
      {...props}
    />
  )
)
NumberInput.displayName = "NumberInput"

// Textarea Component
interface EnhancedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof enhancedInputVariants> {
  label?: string
  helperText?: string
  error?: string
  floating?: boolean
  resize?: boolean
}

const EnhancedTextarea = React.forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  ({
    className,
    variant,
    label,
    helperText,
    error,
    floating = false,
    resize = true,
    value,
    placeholder,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(Boolean(value))

    React.useEffect(() => {
      setHasValue(Boolean(value))
    }, [value])

    const textareaVariant = error ? "error" : variant

    return (
      <div className="space-y-2">
        <div className="relative">
          {/* Floating Label */}
          {floating && label && (
            <motion.label
              className={cn(
                "absolute left-3 text-sm text-neutral-500 pointer-events-none transition-all duration-200",
                (isFocused || hasValue) 
                  ? "top-2 text-xs text-accent-600 bg-white px-1" 
                  : "top-3"
              )}
              animate={{
                y: (isFocused || hasValue) ? -10 : 0,
                scale: (isFocused || hasValue) ? 0.85 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.label>
          )}

          {/* Static Label */}
          {!floating && label && (
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {label}
            </label>
          )}

          <textarea
            className={cn(
              enhancedInputVariants({ variant: textareaVariant, className }),
              "min-h-[80px] py-3",
              !resize && "resize-none"
            )}
            ref={ref}
            value={value}
            placeholder={floating ? "" : placeholder}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
        </div>

        {/* Helper Text or Error */}
        <AnimatePresence>
          {(helperText || error) && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "text-xs",
                error ? "text-error-600" : "text-neutral-500"
              )}
            >
              {error || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
EnhancedTextarea.displayName = "EnhancedTextarea"

export {
  EnhancedInput,
  SearchInput,
  PasswordInput,
  NumberInput,
  EnhancedTextarea,
  enhancedInputVariants,
}
