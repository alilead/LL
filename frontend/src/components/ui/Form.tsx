import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "../../lib/utils"
import { Label } from "./Label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

// Form layout components
interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-6", className)} {...props}>
        {(title || description) && (
          <div className="space-y-2">
            {title && (
              <h3 className="text-lg font-medium leading-6 text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        <div className="space-y-4">{children}</div>
      </div>
    )
  }
)
FormSection.displayName = "FormSection"

interface FormGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

const FormGrid = React.forwardRef<HTMLDivElement, FormGridProps>(
  ({ className, columns = 2, gap = 'md', children, ...props }, ref) => {
    const gridClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    }

    const gapClasses = {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          gridClasses[columns],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FormGrid.displayName = "FormGrid"

interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between'
  sticky?: boolean
}

const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
  ({ className, align = 'right', sticky = false, children, ...props }, ref) => {
    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 pt-6',
          alignClasses[align],
          sticky && 'sticky bottom-0 bg-background border-t border-border py-4 -mx-6 px-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FormActions.displayName = "FormActions"

// Form field group component
interface FieldGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  description?: string
  required?: boolean
  error?: string
  orientation?: 'vertical' | 'horizontal'
}

const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  ({ 
    className, 
    label, 
    description, 
    required, 
    error, 
    orientation = 'vertical',
    children, 
    ...props 
  }, ref) => {
    const id = React.useId()

    return (
      <div
        ref={ref}
        className={cn(
          'space-y-2',
          orientation === 'horizontal' && 'flex items-start gap-4 space-y-0',
          className
        )}
        {...props}
      >
        {label && (
          <div className={cn(
            orientation === 'horizontal' && 'min-w-0 flex-1'
          )}>
            <Label 
              htmlFor={id}
              className={cn(
                'text-sm font-medium',
                required && 'after:content-["*"] after:ml-0.5 after:text-destructive',
                error && 'text-destructive'
              )}
            >
              {label}
            </Label>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        )}
        <div className={cn(
          orientation === 'horizontal' && 'min-w-0 flex-1'
        )}>
          <div id={id}>
            {children}
          </div>
          {error && (
            <p className="text-sm font-medium text-destructive mt-1">
              {error}
            </p>
          )}
        </div>
      </div>
    )
  }
)
FieldGroup.displayName = "FieldGroup"

// Inline form component for compact layouts
interface InlineFormProps extends React.HTMLAttributes<HTMLFormElement> {
  gap?: 'sm' | 'md' | 'lg'
}

const InlineForm = React.forwardRef<HTMLFormElement, InlineFormProps>(
  ({ className, gap = 'md', children, ...props }, ref) => {
    const gapClasses = {
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4'
    }

    return (
      <form
        ref={ref}
        className={cn(
          'flex items-end flex-wrap',
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </form>
    )
  }
)
InlineForm.displayName = "InlineForm"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormSection,
  FormGrid,
  FormActions,
  FieldGroup,
  InlineForm,
  type FormSectionProps,
  type FormGridProps,
  type FormActionsProps,
  type FieldGroupProps,
  type InlineFormProps
}
