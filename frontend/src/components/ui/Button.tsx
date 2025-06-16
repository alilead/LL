import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
    
    const variants = {
      default: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
      primary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
      destructive: 'bg-white border border-red-300 text-red-700 hover:bg-red-50',
      outline: 'bg-white border border-gray-300 hover:bg-gray-100',
      secondary: 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-100',
      ghost: 'bg-white hover:bg-gray-100',
      link: 'text-blue-600 underline-offset-4 hover:underline'
    }

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8'
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button, type ButtonProps }
