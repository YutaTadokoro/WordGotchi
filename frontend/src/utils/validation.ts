// Input validation utilities

/**
 * Check if text is empty or contains only whitespace
 */
export function isEmptyOrWhitespace(text: string): boolean {
  return text.trim().length === 0;
}

/**
 * Truncate text to maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength);
}

/**
 * Strip invalid characters from text
 * Removes control characters except newlines and tabs
 */
export function stripInvalidCharacters(text: string): string {
  // Remove control characters (0x00-0x1F) except newline (0x0A) and tab (0x09)
  // Also remove other problematic characters
  return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate and sanitize input text
 * Returns sanitized text or null if invalid
 */
export function validateAndSanitizeInput(
  text: string,
  maxLength: number = 500
): { valid: boolean; sanitized: string; error?: string } {
  // Check if empty or whitespace only
  if (isEmptyOrWhitespace(text)) {
    return {
      valid: false,
      sanitized: '',
      error: 'Please enter some text to feed your Gotchi',
    };
  }

  // Strip invalid characters
  let sanitized = stripInvalidCharacters(text);

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = truncateText(sanitized, maxLength);
  }

  // Check again after sanitization
  if (isEmptyOrWhitespace(sanitized)) {
    return {
      valid: false,
      sanitized: '',
      error: 'Text contains only invalid characters',
    };
  }

  return {
    valid: true,
    sanitized,
  };
}
