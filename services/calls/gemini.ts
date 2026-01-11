import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";


const api_key = (process.env.EXPO_PUBLIC_GEMINI_API_KEY)?.toString();

if (!api_key) {
  throw new Error("EXPO_PUBLIC_GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(api_key);

const schema: Schema = {
  type: SchemaType.OBJECT,
  description: "Security analysis result",
  properties: {
    risk: {
      type: SchemaType.STRING,
      description: "Risk level: LOW, MEDIUM, or HIGH",
      nullable: false,
    },
    score: {
      type: SchemaType.NUMBER,
      description: "Safety score from 0-100",
      nullable: false,
    },
    reason: {
      type: SchemaType.STRING,
      description: "Brief explanation of why this risk level was assigned",
      nullable: false,
    },
  },
  required: ["risk", "score", "reason"],
};

// Now pass it to the model
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema, 
  },
});



export const analyzePhisingAttempt = async (content: string, type: 'EMAIL' | 'SMS' | 'URL') => {
    const typeSpecificInstructions = {
        EMAIL: "Focus on brand impersonation, generic greetings, and mismatched link destinations, senders email address, tonality.",
        SMS: "Focus on extreme urgency, link shorteners, and requests for OTP/KYC updates online via links if it tells to visit a physical branch then it might be safe yet not completely safe.",
        URL: "Perform a deep domain audit. Check for homograph attacks (e.g., 'hbfc' vs 'hdfc') and character substitutions."
    };
    const prompt = `
        ACT AS A SENIOR CYBERSECURITY THREAT ANALYST. 
        Perform a STRICT, ZERO-TRUST analysis on the provided content. 
        Analyze the following ${type} content for phishing attempts, suspicious links, 
        urgency tactics, or credential harvesting patterns. Try to give short answers and precise with exact information about whats wrong in the link if there is a link within the content and Analyze the provided content for "Lookalike Domain" attacks (homograph attacks).
    
        STRICT AUDIT STEPS:
        1. IDENTIFY THE TARGET: Is this message pretending to be a known brand (e.g., HDFC, Amazon, Netflix, Google)?
        2. DOMAIN AUDIT: If a URL is present, compare it to the official domain of the identified brand. Flag "Lookalike" domains (e.g., 'hbfc.com' vs 'hdfc.com', 'micros0ft.com' vs 'microsoft.com') as HIGH RISK.
        3. LINGUISTIC ANALYSIS: Check for "Panic Inducers" (e.g., "Account suspended," "Unauthorized login," "Action required within 1 hour").
        4. REQUEST AUDIT: Does it ask for sensitive info (OTP, Password, KYC updates) via an unofficial link?
        Perform a deep domain audit. Check for homograph attacks (e.g., 'hbfc' vs 'hdfc') and character substitutions.

        TYPE-SPECIFIC FOCUS: ${typeSpecificInstructions[type]}

        OUTPUT FORMAT:
        You must return JSON with:
        - risk: "LOW", "MEDIUM", or "HIGH"
        - score: (0-100, where 100 is most dangerous)
        - reason: A technical explanation of the specific red flags found.
        
        Content to analyze: "${content}"
    `;

    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw error;
    }
};

export const analyzeQrCode = async (content: string, type: 'EMAIL' | 'SMS' | 'URL') => {
    const prompt = `
        ACT AS A SPECIALIST IN QR THREAT INTELLIGENCE (QUISHING).
        YOUR TASK: Analyze the provided URL extracted from a QR Code scan.

        STRICT AUDIT STEPS FOR QR:
        1. DE-OBFUSCATION: Is the URL using a common shortener (e.g., bit.ly, tinyurl, t.co)? If yes, flag as MEDIUM RISK and warn that the final destination is hidden.
        2. CREDENTIAL TRAP: Does the URL lead directly to a login page (e.g., /login, /sign-in, /auth)? Flag as HIGH RISK unless the domain is a verified, top-tier global entity (e.g., google.com, microsoft.com).
        3. REDIRECTION RISK: Check if the URL structure suggests a "hop" or "redirect" (e.g., using 'url=' or 'dest=' parameters).
        4. LOOKALIKES: Apply strict homograph detection (e.g., 'pay-pal.com' vs 'paypal.com' or 'hbfc.com' vs 'hdfc.com', 'micros0ft.com' vs 'microsoft.com').
        5. CONTEXTUAL RELEVANCE: If the QR code is said to be from a known brand, does the URL domain match the official brand domain?


        OUTPUT FORMAT (JSON ONLY):
        {
        "risk": "LOW" | "MEDIUM" | "HIGH",
        "score": 0-100,
        "reason": "Detailed explanation of red flags (e.g., 'Hidden redirect detected' or 'Impersonation of [Brand]')"
        }

        QR CONTENT TO ANALYZE: "${content}"
    `;

    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw error;
    }
};