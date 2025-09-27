import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react"

const alertVariants = {
  default: "bg-background text-foreground",
  destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  success: "border-green-500/50 text-green-600 [&>svg]:text-green-600",
  info: "border-blue-500/50 text-blue-600 [&>svg]:text-blue-600",
}

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof alertVariants
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:pl-7",
        alertVariants[variant],
        className
      )}
      {...props}
    >
      {variant === "destructive" && <AlertTriangle className="h-4 w-4" />}
      {variant === "success" && <CheckCircle2 className="h-4 w-4" />}
      {variant === "info" && <Info className="h-4 w-4" />}
      <div>{children}</div>
    </div>
  )
)
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }
