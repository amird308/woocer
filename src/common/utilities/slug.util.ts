/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string, suffix?: string): string {
  const baseSlug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  return suffix ? `${baseSlug}-${suffix}` : baseSlug;
}

/**
 * Generate a unique slug with timestamp
 */
export function generateUniqueSlug(text: string): string {
  return generateSlug(text, Date.now().toString());
}

/**
 * Validate if a string is a valid slug format
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}