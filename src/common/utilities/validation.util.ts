import { ValidationError } from 'class-validator';

/**
 * Format validation errors into a readable format
 */
export function formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};

  errors.forEach((error) => {
    if (error.constraints) {
      formattedErrors[error.property] = Object.values(error.constraints);
    }

    // Handle nested validation errors
    if (error.children && error.children.length > 0) {
      const nestedErrors = formatValidationErrors(error.children);
      Object.keys(nestedErrors).forEach((key) => {
        formattedErrors[`${error.property}.${key}`] = nestedErrors[key];
      });
    }
  });

  return formattedErrors;
}

/**
 * Check if a value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Sanitize string input by removing potentially harmful characters
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}