import * as Crypto from 'expo-crypto';

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
    const email = content.trim()
    const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`

    const headers: Record<string, string> = {
      'user-agent': HIBP_USER_AGENT,
      Accept: 'application/vnd.haveibeenpwned.v3+json',
      'hibp-api-key': HIBP_TEST_KEY,
    }

    try {
      const resp = await fetch(url, { method: 'GET', headers })
      if (resp.status === 404) {
        // No breaches found
        const result: EmailResult = { found: false, breaches: [] }
        return result
      }
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`HIBP email lookup failed: ${resp.status} ${text}`)
      }

      const json = await resp.json()
      const breaches = (json || []).map((b: any) => ({ Name: b.Name, Domain: b.Domain, BreachDate: b.BreachDate }))
      const result: EmailResult = { found: breaches.length > 0, breaches }
      return result
    } catch (error) {
      throw error
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