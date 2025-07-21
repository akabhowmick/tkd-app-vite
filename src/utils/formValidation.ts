/* eslint-disable no-useless-escape */
export interface ValidationRule {
  field: string;
  message: string;
  validate: (value: string) => boolean;
}

export const createValidationRules = (): ValidationRule[] => [
  {
    field: 'name',
    message: 'Please enter the student\'s name',
    validate: (value: string) => value.trim().length > 0
  },
  {
    field: 'name',
    message: 'Name must be at least 2 characters long', 
    validate: (value: string) => value.trim().length >= 2
  },
  {
    field: 'email',
    message: 'Please enter an email address',
    validate: (value: string) => value.trim().length > 0
  },
  {
    field: 'email', 
    message: 'Please enter a valid email address',
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  },
  {
    field: 'phone',
    message: 'Please enter a valid phone number',
    validate: (value: string) => {
      if (!value.trim()) return true; // Optional field
      const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
      return /^[\+]?[1-9][\d]{0,15}$/.test(cleanPhone) && cleanPhone.length >= 10;
    }
  }
];

export const validateFormData = (formData: Record<string, string>): string | null => {
  const rules = createValidationRules();
  
  for (const rule of rules) {
    const value = formData[rule.field] || '';
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  
  return null;
};