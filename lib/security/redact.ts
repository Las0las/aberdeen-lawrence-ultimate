/**
 * Redacts sensitive information from objects and error messages
 */
export function redact(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, '[EMAIL_REDACTED]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]')
      .replace(/\b\d{16}\b/g, '[CARD_REDACTED]');
  }
  
  if (typeof input === 'object' && input !== null) {
    const redacted: any = Array.isArray(input) ? [] : {};
    
    for (const key in input) {
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('secret') || 
          key.toLowerCase().includes('token')) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redact(input[key]);
      }
    }
    
    return redacted;
  }
  
  return input;
}
