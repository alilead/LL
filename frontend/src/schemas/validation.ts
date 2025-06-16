import { z } from 'zod';

// Genel validasyon mesajları
const validationMessages = {
  required: 'Bu alan zorunludur',
  email: 'Geçerli bir e-posta adresi giriniz',
  min: (field: string, length: number) => `${field} en az ${length} karakter olmalıdır`,
  max: (field: string, length: number) => `${field} en fazla ${length} karakter olmalıdır`,
  matches: (field: string) => `${field} geçerli bir format değil`,
  number: 'Lütfen geçerli bir sayı giriniz',
  phone: 'Geçerli bir telefon numarası giriniz',
  url: 'Geçerli bir URL giriniz',
};

// Kullanıcı şeması
export const userSchema = z.object({
  email: z.string()
    .email(validationMessages.email)
    .min(1, validationMessages.required),
  
  password: z.string()
    .min(8, validationMessages.min('Şifre', 8))
    .max(100, validationMessages.max('Şifre', 100))
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
    ),
    
  name: z.string()
    .min(2, validationMessages.min('İsim', 2))
    .max(50, validationMessages.max('İsim', 50)),
    
  phone: z.string()
    .regex(
      /^(\+90|0)?[0-9]{10}$/,
      validationMessages.phone
    )
    .optional(),
});

// Lead şeması
export const leadSchema = z.object({
  firstName: z.string()
    .min(2, validationMessages.min('Ad', 2))
    .max(50, validationMessages.max('Ad', 50)),
    
  lastName: z.string()
    .min(2, validationMessages.min('Soyad', 2))
    .max(50, validationMessages.max('Soyad', 50)),
    
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
    .min(2, validationMessages.min('Şirket', 2))
    .max(100, validationMessages.max('Şirket', 100))
    .optional(),
    
  status: z.enum(['new', 'contacted', 'qualified', 'lost']),
    
  source: z.enum(['website', 'referral', 'advertisement', 'other']),
    
  notes: z.string()
    .max(1000, validationMessages.max('Notlar', 1000))
    .optional(),
});

// Task şeması
export const taskSchema = z.object({
  title: z.string()
    .min(3, validationMessages.min('Başlık', 3))
    .max(100, validationMessages.max('Başlık', 100)),
    
  description: z.string()
    .max(1000, validationMessages.max('Açıklama', 1000))
    .optional(),
    
  dueDate: z.date()
    .min(new Date(), 'Bitiş tarihi geçmiş bir tarih olamaz'),
    
  priority: z.enum(['low', 'medium', 'high']),
    
  status: z.enum(['todo', 'in_progress', 'done', 'cancelled']),
    
  assignedTo: z.string().uuid('Geçerli bir kullanıcı seçiniz'),
});

// Deal şeması
export const dealSchema = z.object({
  title: z.string()
    .min(3, validationMessages.min('Başlık', 3))
    .max(100, validationMessages.max('Başlık', 100)),
    
  amount: z.number()
    .min(0, 'Tutar 0\'dan büyük olmalıdır'),
    
  currency: z.enum(['TRY', 'USD', 'EUR']),
    
  stage: z.enum(['initial', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
    
  probability: z.number()
    .min(0, 'Olasılık 0\'dan küçük olamaz')
    .max(100, 'Olasılık 100\'den büyük olamaz'),
    
  expectedCloseDate: z.date()
    .min(new Date(), 'Kapanış tarihi geçmiş bir tarih olamaz'),
    
  notes: z.string()
    .max(1000, validationMessages.max('Notlar', 1000))
    .optional(),
});

// Form validasyon yardımcı fonksiyonları
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

// Form hata mesajlarını formatlama
export const formatValidationErrors = (errors: z.ZodError) => {
  return errors.errors.reduce((acc, error) => {
    const path = error.path.join('.');
    acc[path] = error.message;
    return acc;
  }, {} as Record<string, string>);
};
