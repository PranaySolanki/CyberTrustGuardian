import { db } from '@/services/firebase/firebase';
import { addDoc, collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export type ScanType = 'QR' | 'Email' | 'SMS' | 'URL' | 'App' | 'Breach' | 'System';
export type ScanStatus = 'Safe' | 'Suspicious' | 'Dangerous' | 'Unknown';

export const recordScan = async (
    userId: string,
    type: ScanType,
    status: ScanStatus,
    details: string = '',
    additionalData: any = {}
) => {
    if (!userId) return;

    try {
        const userRef = doc(db, 'users', userId);
        const historyRef = collection(db, 'users', userId, 'history');

        // Add to history
        await addDoc(historyRef, {
            type,
            status,
            details,
            timestamp: serverTimestamp(),
            ...additionalData
        });

        // Update stats transactionally
        const isThreat = status === 'Dangerous' || status === 'Suspicious';
        const isApp = type === 'App';

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                // Initialize user doc if missing (e.g. new DB)
                const newStats = {
                    scansToday: 1,
                    threatsBlocked: isThreat ? 1 : 0,
                    appsAnalyzed: isApp ? 1 : 0,
                    safetyScore: 100
                };
                transaction.set(userRef, { stats: newStats }, { merge: true });
            } else {
                const userData = userDoc.data();
                const currentStats = userData.stats || { scansToday: 0, threatsBlocked: 0, appsAnalyzed: 0, safetyScore: 100 };

                // Calculate cumulative penalties
                let newSafetyScore = (currentStats.safetyScore || 100);

                if (type === 'System' && status === 'Dangerous') {
                    // Critical system failure - drop score below 50 immediately
                    newSafetyScore = Math.min(newSafetyScore - 10, 45);
                } else if (status === 'Dangerous') {
                    newSafetyScore -= 10;
                } else if (status === 'Suspicious') {
                    newSafetyScore -= 5;
                }

                // Keep score between 0 and 100
                newSafetyScore = Math.max(0, Math.min(100, newSafetyScore));

                const newStats = {
                    scansToday: (currentStats.scansToday || 0) + 1,
                    threatsBlocked: (currentStats.threatsBlocked || 0) + (isThreat ? 1 : 0),
                    appsAnalyzed: (currentStats.appsAnalyzed || 0) + (isApp ? 1 : 0),
                    safetyScore: newSafetyScore
                };

                transaction.update(userRef, { stats: newStats });
            }
        });

        console.log(`Scan recorded: ${type} - ${status}`);
    } catch (error: any) {
        console.error("Error recording scan:", error);
    }
};
