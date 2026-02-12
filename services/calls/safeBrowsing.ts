const raw_api_key = (process.env.EXPO_PUBLIC_SAFE_BROWSING_API_KEY)?.toString();

// Check if API key is set (but don't throw - allow app to work with just Gemini)
let api_key: string | null = null;

if (raw_api_key) {
    function rot13(str: string) {
        return str.replace(/[A-Za-z]/g, (c) => {
            const base = c <= "Z" ? 65 : 97;
            return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
        });
    }

    // Decode the ROT13-encoded value stored in the env var
    api_key = rot13(raw_api_key);
    
    // Basic validation - check if key looks valid (Google API keys are usually long)
    if (api_key.length < 20) {
        console.warn("Safe Browsing API key appears to be invalid (too short). Please check your EXPO_PUBLIC_SAFE_BROWSING_API_KEY.");
        api_key = null;
    }
} else {
    console.warn("EXPO_PUBLIC_SAFE_BROWSING_API_KEY environment variable is not set. Safe Browsing checks will be skipped.");
}

export async function safeBrowsingCheck(url: string): Promise<any> {
    // Check if API key is available
    if (!api_key) {
        // Return null result instead of throwing - allows graceful degradation
        // The calling code will handle this as a skipped check
        return null;
    }

    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${api_key}`;

    const payload = {
        client: {
            clientId: "my-qr-app",
            clientVersion: "1.0.0"
        },
        threatInfo: {
            threatTypes: [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION"
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }]
        }
    };

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: { message: errorText } };
            }

            // Check for specific API key errors - return null instead of throwing
            if (res.status === 400 && errorData.error?.message?.includes('API key')) {
                // API key is invalid - return null to allow graceful degradation
                // Don't throw error - just skip Safe Browsing check
                console.warn('Safe Browsing API key is invalid. Skipping Safe Browsing check.');
                console.log(errorData.error?.message);
                console.log(api_key);
                return null;
            }

            // For other errors, still throw but mark as non-critical
            const error = new Error(`SafeBrowsing API error: ${res.status} - ${errorData.error?.message || errorText}`);
            (error as any).isApiKeyError = false;
            throw error;
        }

        const data = await res.json();
        return data;
    } catch (error) {
        // Only log network/connection errors, not API key issues (those return null)
        // If we get here, it's a real error (network issue, etc.)
        console.warn("SafeBrowsing API Error (non-critical):", error);
        // Return null instead of throwing to allow graceful degradation
        return null;
    }
}
