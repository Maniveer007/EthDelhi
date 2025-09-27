import * as React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    // Base styles
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus:ring-2 focus:ring-offset-2"
    
    // Variant styles
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      outline: "border border-gray-300 bg-white hover:bg-gray-50 focus:ring-blue-500",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
      ghost: "hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500",
      link: "text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500"
    }
    
    // Size styles
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 px-3 py-1.5 text-xs",
      lg: "h-10 px-6 py-2.5 text-base",
      icon: "h-9 w-9"
    }
    
    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`
    
    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }