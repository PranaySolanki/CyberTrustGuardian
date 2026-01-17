import * as Crypto from 'expo-crypto';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

type EmailResult = {
  found: boolean
  breaches: Array<{ Name: string; Domain?: string; BreachDate?: string }>
}

type PasswordResult = {
  count: number
}

const HIBP_TEST_KEY = '00000000000000000000000000000000'
const HIBP_USER_AGENT = 'CyberGuardian/1.0'

async function sha1Hex(message: string): Promise<string> {
  // Use native Expo Crypto for SHA-1 digest (returns hex)
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    message,
    { encoding: Crypto.CryptoEncoding.HEX }
  )
  return digest.toUpperCase()
}

export function breachCheck(content: string, type: 'Email'): Promise<EmailResult>
export function breachCheck(content: string, type: 'PASSWORD'): Promise<PasswordResult>
export async function breachCheck(content: string, type: 'Email' | 'PASSWORD'): Promise<EmailResult | PasswordResult> {
  if (type === 'Email') {
    const email = content.trim().toLowerCase()
    try {
      const docRef = doc(db, 'breaches', email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          found: true,
          breaches: data.breaches || []
        };
      } else {
        return {
          found: false,
          breaches: []
        };
      }
    } catch (error) {
      console.error('Firestore breach lookup failed:', error);
      // Fallback to empty if Firestore fails or just throw
      throw error;
    }
  }

  // PASSWORD (k-Anonymity)
  if (type === 'PASSWORD') {
    // Normalize password to avoid accidental whitespace or unicode mismatches
    let pw = content
    pw = pw.trim().normalize ? pw.trim().normalize('NFKC') : pw.trim()
    // Compute SHA-1 of password (after normalization)
    const hash = await sha1Hex(pw)
    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)
    const url = `https://api.pwnedpasswords.com/range/${prefix}`

    try {
      const resp = await fetch(url, { method: 'GET' })
      if (!resp.ok) {
        throw new Error(`Pwned Passwords range lookup failed: ${resp.status}`)
      }
      const text = await resp.text()
      // Response lines: Suffix:Count
      const lines = text.split('\n')
      for (const line of lines) {
        const [hashSuffixRaw, countRaw] = line.split(':')
        if (!hashSuffixRaw) continue
        const hashSuffix = hashSuffixRaw.trim().toUpperCase()
        if (hashSuffix === suffix.toUpperCase()) {
          const count = parseInt((countRaw || '0').trim(), 10)
          const result: PasswordResult = { count: isNaN(count) ? 0 : count }
          return result
        }
      }

      return { count: 0 }
    } catch (error) {
      throw error
    }
  }

  throw new Error('Invalid type provided to breachCheck')
}