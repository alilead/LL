import { z } from 'zod';

// General validation messages
const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  min: (field: string, length: number) => `${field} must be at least ${length} characters`,
  max: (field: string, length: number) => `${field} must be at most ${length} characters`,
  matches: (field: string) => `${field} is not in a valid format`,
  number: 'Please enter a valid number',
  phone: 'Please enter a valid phone number',
  url: 'Please enter a valid URL',
};

// User schema
export const userSchema = z.object({
  email: z.string()
    .email(validationMessages.email)
    .min(1, validationMessages.required),

  password: z.string()
    .min(8, validationMessages.min('Password', 8))
    .max(100, validationMessages.max('Password', 100))
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  name: z.string()
    .min(2, validationMessages.min('Name', 2))
    .max(50, validationMessages.max('Name', 50)),

  phone: z.string()
    .regex(
      /^(\+90|0)?[0-9]{10}$/,
      validationMessages.phone
    )
    .optional(),
});

// Lead schema
export const leadSchema = z.object({
  firstName: z.string()
    .min(2, validationMessages.min('First Name', 2))
    .max(50, validationMessages.max('First Name', 50)),

  lastName: z.string()
    .min(2, validationMessages.min('Last Name', 2))
    .max(50, validationMessages.max('Last Name', 50)),

  email: z.string()
    .email(validationMessages.email)
    .min(1, validationMessages.required),

  phone: z.string()
    .regex(
      /^(\+90|0)?[0-9]{10}$/,
      validationMessages.phone
    )
    .optional(),

  company: z.string()
    .min(2, validationMessages.min('Company', 2))
    .max(100, validationMessages.max('Company', 100))
    .optional(),

  status: z.enum(['new', 'contacted', 'qualified', 'lost']),

  source: z.enum(['website', 'referral', 'advertisement', 'other']),

  notes: z.string()
    .max(1000, validationMessages.max('Notes', 1000))
    .optional(),
});

// Task schema
export const taskSchema = z.object({
  title: z.string()
    .min(3, validationMessages.min('Title', 3))
    .max(100, validationMessages.max('Title', 100)),

  description: z.string()
    .max(1000, validationMessages.max('Description', 1000))
    .optional(),

  dueDate: z.date()
    .min(new Date(), 'Due date cannot be in the past'),

  priority: z.enum(['low', 'medium', 'high']),

  status: z.enum(['todo', 'in_progress', 'done', 'cancelled']),

  assignedTo: z.string().uuid('Please select a valid user'),
});

// Deal schema
export const dealSchema = z.object({
  title: z.string()
    .min(3, validationMessages.min('Title', 3))
    .max(100, validationMessages.max('Title', 100)),

  amount: z.number()
    .min(0, 'Amount must be greater than 0'),

  currency: z.enum(['TRY', 'USD', 'EUR']),

  stage: z.enum(['initial', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),

  probability: z.number()
    .min(0, 'Probability cannot be less than 0')
    .max(100, 'Probability cannot be greater than 100'),

  expectedCloseDate: z.date()
    .min(new Date(), 'Close date cannot be in the past'),

  notes: z.string()
    .max(1000, validationMessages.max('Notes', 1000))
    .optional(),
});

// Form validation helper functions
export const validateForm = async <T extends z.ZodType>(
  schema: T,
  data: z.infer<T>
): Promise<{ success: boolean; errors?: z.ZodError }> => {
  try {
    await schema.parseAsync(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

// Format validation error messages
export const formatValidationErrors = (errors: z.ZodError) => {
  return errors.errors.reduce((acc, error) => {
    const path = error.path.join('.');
    acc[path] = error.message;
    return acc;
  }, {} as Record<string, string>);
};
