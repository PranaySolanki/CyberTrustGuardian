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

    // Hardcoded results for testing
    const MOCK_BREACH_DATA: Record<string, EmailResult> = {
      'test@gmail.com': {
        found: true,
        breaches: [
          { Name: 'Adobe', Domain: 'adobe.com', BreachDate: '2013-10-04' },
          { Name: 'Canva', Domain: 'canva.com', BreachDate: '2019-05-24' }
        ]
      },
      'admin@gmail.com': {
        found: true,
        breaches: [
          { Name: 'LinkedIn', Domain: 'linkedin.com', BreachDate: '2016-05-17' },
          { Name: 'MySpace', Domain: 'myspace.com', BreachDate: '2016-05-31' },
          { Name: 'Dropbox', Domain: 'dropbox.com', BreachDate: '2012-08-31' }
        ]
      },
      'user@yahoo.com': {
        found: true,
        breaches: [{ Name: 'Yahoo', Domain: 'yahoo.com', BreachDate: '2013-08-01' }]
      },
      'dev@gmail.com': {
        found: true,
        breaches: [
          { Name: 'GitHub', Domain: 'github.com', BreachDate: '2018-06-04' },
          { Name: 'StackOverflow', Domain: 'stackoverflow.com', BreachDate: '2021-05-11' }
        ]
      },
      'shiva@gmail.com': {
        found: true,
        breaches: [
          { Name: 'Facebook', Domain: 'facebook.com', BreachDate: '2019-04-03' },
          { Name: 'Zomato', Domain: 'zomato.com', BreachDate: '2017-05-18' }
        ]
      },
      'demo@outlook.com': {
        found: true,
        breaches: [{ Name: 'Wattpad', Domain: 'wattpad.com', BreachDate: '2020-07-01' }]
      },
      'support@amazon.com': {
        found: true,
        breaches: [
          { Name: 'Twitch', Domain: 'twitch.tv', BreachDate: '2021-10-06' },
          { Name: 'Bitly', Domain: 'bitly.com', BreachDate: '2014-05-08' }
        ]
      },
      'hack@protonmail.com': {
        found: true,
        breaches: [
          { Name: 'Ledger', Domain: 'ledger.com', BreachDate: '2020-06-01' },
          { Name: 'NitroPDF', Domain: 'nitropdf.com', BreachDate: '2020-10-01' }
        ]
      },
      'gamer@twitch.tv': {
        found: true,
        breaches: [{ Name: 'Discord', Domain: 'discord.com', BreachDate: '2023-03-22' }]
      },
      'finance@bank.com': {
        found: true,
        breaches: [{ Name: 'CoinMarketCap', Domain: 'coinmarketcap.com', BreachDate: '2021-10-12' }]
      },
      'staff@company.in': {
        found: true,
        breaches: [
          { Name: 'BigBasket', Domain: 'bigbasket.com', BreachDate: '2020-10-14' },
          { Name: 'AirIndia', Domain: 'airindia.in', BreachDate: '2021-02-01' }
        ]
      },
      'student@university.edu': {
        found: true,
        breaches: [{ Name: 'Chegg', Domain: 'chegg.com', BreachDate: '2018-04-29' }]
      },
      'movie@netflix.com': {
        found: true,
        breaches: [{ Name: 'Hulu', Domain: 'hulu.com', BreachDate: '2020-01-15' }]
      },
      'shop@walmart.com': {
        found: true,
        breaches: [{ Name: 'HomeDepot', Domain: 'homedepot.com', BreachDate: '2014-09-01' }]
      },
      'travel@tripadvisor.com': {
        found: true,
        breaches: [{ Name: 'Booking.com', Domain: 'booking.com', BreachDate: '2018-11-01' }]
      },
      'fitness@strava.com': {
        found: true,
        breaches: [{ Name: 'MyFitnessPal', Domain: 'myfitnesspal.com', BreachDate: '2018-02-01' }]
      }
    };

    if (MOCK_BREACH_DATA[email]) {
      return MOCK_BREACH_DATA[email];
    }

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