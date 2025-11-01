import * as React from 'react'
import { cn } from '../../lib/utils'
import { Eye, EyeOff, Search, X } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'underlined'
  inputSize?: 'sm' | 'md' | 'lg'
  state?: 'default' | 'error' | 'success' | 'warning'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  label?: string
  helperText?: string
  errorMessage?: string
  fullWidth?: boolean
}

const inputVariants = {
  default: 'border border-input bg-background hover:border-ring focus:border-ring',
  filled: 'border-0 bg-muted hover:bg-muted/80 focus:bg-background focus:ring-2 focus:ring-ring',
  underlined: 'border-0 border-b border-input bg-transparent hover:border-ring focus:border-ring rounded-none'
}

const inputSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base'
}

const inputStates = {
  default: '',
  error: 'border-destructive focus:border-destructive focus:ring-destructive',
  success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
  warning: 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    variant = 'default',
    inputSize = 'md',
    state = 'default',
    leftIcon,
    rightIcon,
    label,
    helperText,
    errorMessage,
    fullWidth = false,
    id,
    ...props
  }, ref) => {
    const inputId = id || React.useId()
    const hasError = state === 'error' || errorMessage
    const displayHelperText = hasError ? errorMessage : helperText

    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            id={inputId}
            className={cn(
              'flex w-full rounded-md font-medium transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              inputVariants[variant],
              inputSizes[inputSize],
              hasError ? inputStates.error : inputStates[state],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {displayHelperText && (
          <p className={cn(
            'mt-2 text-sm',
            hasError ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {displayHelperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// Password Input with toggle visibility
export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const togglePassword = () => setShowPassword(!showPassword)

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          showToggle ? (
            <button
              type="button"
              onClick={togglePassword}
              className="hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : undefined
        }
        {...props}
      />
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

// Search Input with clear functionality
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'rightIcon' | 'type'> {
  onClear?: () => void
  showClearButton?: boolean
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, showClearButton = true, value, ...props }, ref) => {
    const hasValue = value && value.toString().length > 0

    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={
          showClearButton && hasValue && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </button>
          ) : undefined
        }
        {...props}
      />
    )
  }
)
SearchInput.displayName = 'SearchInput'

// Textarea Component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'filled' | 'underlined'
  textareaSize?: 'sm' | 'md' | 'lg'
  state?: 'default' | 'error' | 'success' | 'warning'
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  autoResize?: boolean
  label?: string
  helperText?: string
  errorMessage?: string
  fullWidth?: boolean
}

const textareaSizes = {
  sm: 'min-h-[60px] px-3 py-2 text-sm',
  md: 'min-h-[80px] px-3 py-2 text-sm',
  lg: 'min-h-[100px] px-4 py-3 text-base'
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant = 'default',
    textareaSize = 'md',
    state = 'default',
    resize = 'vertical',
    autoResize = false,
    label,
    helperText,
    errorMessage,
    fullWidth = false,
    id,
    ...props 
  }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const textareaId = id || React.useId()
    const hasError = state === 'error' || errorMessage
    const displayHelperText = hasError ? errorMessage : helperText
    
    React.useImperativeHandle(ref, () => textareaRef.current!)

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (textarea && autoResize) {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [autoResize])

    React.useEffect(() => {
      adjustHeight()
    }, [props.value, adjustHeight])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (props.onChange) {
        props.onChange(e)
      }
      adjustHeight()
    }

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    }

    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <textarea
          ref={textareaRef}
          id={textareaId}
          className={cn(
            'flex w-full rounded-md border border-input bg-background font-medium transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            inputVariants[variant],
            textareaSizes[textareaSize],
            resizeClasses[resize],
            hasError ? inputStates.error : inputStates[state],
            className
          )}
          onChange={handleChange}
          {...props}
        />
        {displayHelperText && (
          <p className={cn(
            'mt-2 text-sm',
            hasError ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {displayHelperText}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Input }
