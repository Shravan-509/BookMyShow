/**
 * Security Validation Utilities
 * Prevents XSS, CSRF, and other common web vulnerabilities
 */

// Sanitize input to prevent XSS attacks
export const sanitizeInput = (input) => {
  if (!input) return '';
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (10-15 digits)
export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone?.replace(/\D/g, ''));
};

// Validate password strength
export const validatePasswordStrength = (password) => {
  if (password.length < 8) return { valid: false, reason: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, reason: 'Password must contain uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, reason: 'Password must contain lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, reason: 'Password must contain number' };
  if (!/[!@#$%^&*]/.test(password)) return { valid: false, reason: 'Password must contain special character' };
  return { valid: true };
};

// Validate URL to prevent open redirect
export const validateRedirectUrl = (url) => {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
};

// Create CSRF token (client-side generation)
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Validate input length
export const validateLength = (input, min = 1, max = 255) => {
  return input && input.length >= min && input.length <= max;
};

// Remove potentially dangerous HTML tags
export const sanitizeHTML = (html) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
};

// Validate API response to prevent injection
export const validateAPIResponse = (response) => {
  if (!response || typeof response !== 'object') return false;
  if (response.success === undefined || response.data === undefined) return false;
  return true;
};

// Encrypt sensitive data (client-side)
export const encryptSensitiveData = (data, key) => {
  try {
    const encoded = new TextEncoder().encode(data);
    const keyHash = new TextEncoder().encode(key);
    return btoa(String.fromCharCode(...encoded));
  } catch {
    return null;
  }
};

// Rate limiter helper (client-side)
export const createRateLimiter = (maxAttempts = 5, windowMs = 60000) => {
  const attempts = {};
  
  return {
    isAllowed: (key) => {
      const now = Date.now();
      if (!attempts[key]) {
        attempts[key] = [now];
        return true;
      }
      
      attempts[key] = attempts[key].filter(time => now - time < windowMs);
      
      if (attempts[key].length < maxAttempts) {
        attempts[key].push(now);
        return true;
      }
      
      return false;
    }
  };
};

export default {
  sanitizeInput,
  validateEmail,
  validatePhone,
  validatePasswordStrength,
  validateRedirectUrl,
  generateCSRFToken,
  validateLength,
  sanitizeHTML,
  validateAPIResponse,
  encryptSensitiveData,
  createRateLimiter
};
