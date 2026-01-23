import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { validateForm, formatValidationErrors } from '../schemas/validation';

interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodType<T>;
  onSubmit: (values: T) => Promise<void> | void;
}

interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  });

  // Form değerlerini güncelle
  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      setFormState((prev) => ({
        ...prev,
        values: {
          ...prev.values,
          [field]: value,
        },
        touched: {
          ...prev.touched,
          [field]: true,
        },
      }));
    },
    []
  );

  // Form alanına dokunuldu olarak işaretle
  const setFieldTouched = useCallback(
    (field: keyof T, isTouched: boolean = true) => {
      setFormState((prev) => ({
        ...prev,
        touched: {
          ...prev.touched,
          [field]: isTouched,
        },
      }));
    },
    []
  );

  // Form hatasını güncelle
  const setFieldError = useCallback(
    (field: keyof T, error: string | undefined) => {
      setFormState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: error,
        },
      }));
    },
    []
  );

  // Formu doğrula
  const validateField = useCallback(
    async (field: keyof T) => {
      if (!validationSchema) return;

      try {
        const schema = validationSchema.pick({ [field]: true });
        await schema.parseAsync({ [field]: formState.values[field] });
        setFieldError(field, undefined);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = formatValidationErrors(error);
          setFieldError(field, errors[field as string]);
        }
      }
    },
    [formState.values, validationSchema, setFieldError]
  );

  // Tüm formu doğrula
  const validateForm = useCallback(async () => {
    if (!validationSchema) return true;

    try {
      await validationSchema.parseAsync(formState.values);
      setFormState((prev) => ({
        ...prev,
        errors: {},
        isValid: true,
      }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = formatValidationErrors(error);
        setFormState((prev) => ({
          ...prev,
          errors,
          isValid: false,
        }));
      }
      return false;
    }
  }, [formState.values, validationSchema]);

  // Form gönderimi
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setFormState((prev) => ({
        ...prev,
        isSubmitting: true,
      }));

      const isValid = await validateForm();

      if (isValid) {
        try {
          await onSubmit(formState.values);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }

      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
      }));
    },
    [formState.values, validateForm, onSubmit]
  );

  // Form değerleri değiştiğinde doğrulama yap
  useEffect(() => {
    if (validationSchema) {
      validateForm();
    }
  }, [formState.values, validationSchema, validateForm]);

  // Form resetleme
  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
    });
  }, [initialValues]);

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    validateField,
    handleSubmit,
    resetForm,
  };
}

// Form alanı için özel hook
export function useField<T extends Record<string, any>>(
  name: keyof T,
  form: ReturnType<typeof useForm<T>>
) {
  const {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateField,
  } = form;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
      setFieldValue(name, value);
    },
    [name, setFieldValue]
  );

  const handleBlur = useCallback(() => {
    setFieldTouched(name, true);
    validateField(name);
  }, [name, setFieldTouched, validateField]);

  return {
    value: values[name],
    error: errors[name as string],
    touched: touched[name as string],
    onChange: handleChange,
    onBlur: handleBlur,
  };
}
