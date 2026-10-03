// Phishing keyword dictionary & pattern matcher

const SUSPICIOUS_WORDS = [
  // Urgency & Threat
  'urgent', 'urgently', 'immediate', 'immediately', 'suspended', 'suspend',
  'blocked', 'deactivated', 'deactivate', 'expiring', 'expire', 'expires',
  'terminated', 'warning', 'alert', 'action required', 'limited time',
  'unusual activity', 'unauthorized', 'lock', 'locked', 'breach', 'security alert',

  // Credential & Financial Harvesting
  'password', 'passcode', 'otp', 'pin', 'cvv', 'ssn', 'kyc', 'account',
  'bank', 'banking', 'credit card', 'debit card', 'netbanking', 'credentials',
  'login', 'signin', 'sign-in', 'log-in', 'verify', 'verification', 'confirm',
  'confirmation', 're-activate', 'reactivate', 'restore', 'update', 're-verify',

  // Scam / Prize / Rewards
  'winner', 'won', 'prize', 'lottery', 'reward', 'rewards', 'claim',
  'cash', 'free', 'gift', 'bonus', 'investment', 'refund', 'selected',
  'congratulations', 'congrats', 'payout', 'jackpot',

  // Impersonation & Security Traps
  'customer care', 'helpdesk', 'support team', 'security team', 'billing',
  'invoice', 'receipt', 'overdue', 'payment failed', 'parcel', 'package',
  'delivery failed', 'customs fee'
];

/**
 * Extracts flagged suspicious words and URLs from content text.
 */
export function extractFlaggedWords(text: string): string[] {
  if (!text) return [];

  const found = new Set<string>();
  const lowerText = text.toLowerCase();

  // 1. Check against suspicious keywords
  for (const word of SUSPICIOUS_WORDS) {
    // Regex boundary check for clean word matching
    const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      // Retain original capitalization from first match
      found.add(matches[0]);
    }
  }

  // 2. Extract URLs and link shorteners
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+\.(?:bit\.ly|tinyurl|t\.co|is\.gd|cutt\.ly|xyz|top|site|online|tk|ml|ga|cf|gq)\b)/gi;
  const urlMatches = text.match(urlRegex);
  if (urlMatches) {
    urlMatches.forEach(url => found.add(url));
  }

  return Array.from(found);
}

/**
 * Splits text into highlighted segments for rendering in UI.
 */
export interface TextSegment {
  text: string;
  isFlagged: boolean;
}

export function parseHighlightedSegments(text: string, flaggedWords: string[]): TextSegment[] {
  if (!text) return [];
  if (!flaggedWords || flaggedWords.length === 0) {
    return [{ text, isFlagged: false }];
  }

  // Sort flagged words by length descending so longer phrases match first
  const sortedWords = [...flaggedWords]
    .map(w => escapeRegExp(w))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (sortedWords.length === 0) {
    return [{ text, isFlagged: false }];
  }

  const pattern = new RegExp(`(${sortedWords.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts
    .filter(part => part.length > 0)
    .map(part => {
      const isFlagged = sortedWords.some(w => new RegExp(`^${w}$`, 'i').test(part));
      return { text: part, isFlagged };
    });
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
