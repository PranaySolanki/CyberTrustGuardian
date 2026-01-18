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
                let systemRiskPenalty = currentStats.systemRiskPenalty || 0;
                let isSystemRiskActive = currentStats.isSystemRiskActive || false;

                if (type === 'System') {
                    if (status === 'Dangerous') {
                        if (!isSystemRiskActive) {
                            // First time detection: Apply penalty
                            // Critical system failure - drop score below 50 immediately if it was high
                            // Or just subtract a large chunk. 
                            // Current logic was: newSafetyScore = Math.min(newSafetyScore - 10, 45);
                            // Let's cap the max score at 45.

                            const scoreBefore = newSafetyScore;
                            const targetMax = 45;

                            if (newSafetyScore > targetMax) {
                                // Calculate how much we need to drop to hit 45
                                const penalty = newSafetyScore - targetMax;
                                systemRiskPenalty = penalty;
                                newSafetyScore = targetMax;
                            } else {
                                // Already low? Maybe just a flat 10 drop? 
                                // Let's stick to the targetMax logic for consistency or add a flat 10 if already low.
                                const penalty = 10;
                                systemRiskPenalty = penalty;
                                newSafetyScore -= penalty;
                            }

                            isSystemRiskActive = true;
                        }
                    } else if (status === 'Safe') {
                        if (isSystemRiskActive) {
                            // Risk resolved: Restore penalty
                            newSafetyScore += systemRiskPenalty;
                            systemRiskPenalty = 0;
                            isSystemRiskActive = false;
                        }
                    }
                } else if (type !== 'Breach') {
                    if (status === 'Dangerous') {
                        newSafetyScore -= 2;
                    } else if (status === 'Suspicious') {
                        newSafetyScore -= 1;
                    }
                }

                // Keep score between 0 and 100
                newSafetyScore = Math.max(0, Math.min(100, newSafetyScore));

                const newStats = {
                    scansToday: (currentStats.scansToday || 0) + 1,
                    threatsBlocked: (currentStats.threatsBlocked || 0) + (isThreat ? 1 : 0),
                    appsAnalyzed: (currentStats.appsAnalyzed || 0) + (isApp ? 1 : 0),
                    safetyScore: newSafetyScore,
                    isSystemRiskActive,
                    systemRiskPenalty
                };

                transaction.update(userRef, { stats: newStats });
            }
        });

        console.log(`Scan recorded: ${type} - ${status}`);
    } catch (error: any) {
        console.error("Error recording scan:", error);
    }
};
