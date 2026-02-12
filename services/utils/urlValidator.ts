/**
 * URL Validation Utility
 * Provides comprehensive URL validation with clear error messages
 */

export interface ValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
}

/**
 * Validates and normalizes a URL string
 * @param url - The URL string to validate
 * @returns ValidationResult with isValid flag, normalized URL, and error message if invalid
 */
export function validateAndNormalizeUrl(url: string): ValidationResult {
  // Step 1: Check if URL is empty or only whitespace
  const trimmed = url.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'URL cannot be empty. Please enter a valid URL.'
    };
  }

  // Step 2: Remove all whitespace from the URL
  let cleaned = trimmed.replace(/\s/g, '');
  
  if (!cleaned) {
    return {
      isValid: false,
      error: 'URL contains only whitespace. Please enter a valid URL.'
    };
  }

  // Step 3: Check for dangerous protocols (security check)
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  const lowerUrl = cleaned.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return {
        isValid: false,
        error: `URLs starting with "${protocol}" are not allowed for security reasons.`
      };
    }
  }

  // Step 4: Check for basic URL structure (must have at least a domain)
  // Remove protocol if present to check domain
  let urlToCheck = cleaned;
  if (cleaned.includes('://')) {
    const parts = cleaned.split('://');
    if (parts.length > 2) {
      return {
        isValid: false,
        error: 'Invalid URL format. Multiple "://" found.'
      };
    }
    urlToCheck = parts[1];
  }

  // Step 5: Validate domain structure
  if (!urlToCheck || urlToCheck.length === 0) {
    return {
      isValid: false,
      error: 'URL must contain a domain name.'
    };
  }

  // Check for invalid characters in domain
  const invalidDomainChars = /[<>"{}|\\^`\[\]]/;
  if (invalidDomainChars.test(urlToCheck.split('/')[0])) {
    return {
      isValid: false,
      error: 'URL contains invalid characters. Please check the domain name.'
    };
  }

  // Step 6: Add protocol if missing (default to https)
  let normalizedUrl = cleaned;
  if (!normalizedUrl.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
    // Check if it looks like a domain (has dots or is localhost)
    if (normalizedUrl.includes('.') || normalizedUrl.toLowerCase().startsWith('localhost')) {
      normalizedUrl = 'https://' + normalizedUrl;
    } else {
      return {
        isValid: false,
        error: 'Invalid URL format. Please include a protocol (http:// or https://) or a valid domain name.'
      };
    }
  }

  // Step 7: Validate URL using URL constructor
  try {
    const urlObj = new URL(normalizedUrl);
    
    // Additional validations on the URL object
    
    // Check protocol
    const protocol = urlObj.protocol.toLowerCase();
    if (!['http:', 'https:'].includes(protocol)) {
      return {
        isValid: false,
        error: `Protocol "${protocol}" is not supported. Only http:// and https:// are allowed.`
      };
    }

    // Check hostname (domain)
    const hostname = urlObj.hostname;
    if (!hostname || hostname.length === 0) {
      return {
        isValid: false,
        error: 'URL must contain a valid domain name.'
      };
    }

    // Check for valid hostname format
    // Allow: domain.com, subdomain.domain.com, localhost, IP addresses
    const hostnamePattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$|^localhost$|^(\d{1,3}\.){3}\d{1,3}$|^\[([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\]$/;
    
    if (!hostnamePattern.test(hostname) && hostname !== 'localhost') {
      // More lenient check for IP addresses and IPv6
      const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6Pattern = /^\[([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\]$/;
      
      if (!ipv4Pattern.test(hostname) && !ipv6Pattern.test(hostname) && hostname !== 'localhost') {
        return {
          isValid: false,
          error: `"${hostname}" is not a valid domain name, IP address, or localhost.`
        };
      }
    }

    // Check URL length (prevent extremely long URLs)
    if (normalizedUrl.length > 2048) {
      return {
        isValid: false,
        error: 'URL is too long. Maximum length is 2048 characters.'
      };
    }

    // Success - return normalized URL
    return {
      isValid: true,
      normalizedUrl: normalizedUrl
    };

  } catch (error) {
    // URL constructor threw an error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Provide user-friendly error messages
    if (errorMessage.includes('Invalid URL')) {
      return {
        isValid: false,
        error: 'Invalid URL format. Please check that the URL is correctly formatted.\n\nExample: https://example.com'
      };
    }
    
    return {
      isValid: false,
      error: `Invalid URL: ${errorMessage}`
    };
  }
}

/**
 * Quick validation check (returns boolean)
 * @param url - The URL string to validate
 * @returns true if URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  return validateAndNormalizeUrl(url).isValid;
}
