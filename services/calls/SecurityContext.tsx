import Constants from 'expo-constants';
import { ThreatEventActions, removeThreatListener, setThreatListeners, talsecStart } from 'freerasp-react-native';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Define the Talsec configuration as a factory to ensure fresh arrays/objects on every init 
const getTalsecConfig = () => ({
    androidConfig: {
        packageName: 'com.cyberguardian.app',
        certificateHashes: ['+sYXRdwJA3hvue3mKpYrOZ9zSPC7b4mbgzJmdZEDO5w='],
        supportedAlternativeStores: ['com.sec.android.app.samsungapps'],
    },
    iosConfig: {
        appBundleId: 'com.cyberguardian.app',
        appTeamId: 'TE78901234',
    },
    watcherMail: 'alert@example.com',
    isProd: false,
});

type SecurityState = {
    isRooted: boolean;
    isEmulator: boolean;
    isTampered: boolean;
    passcodeSet?: boolean;
    status: 'GREEN' | 'ORANGE' | 'RED';
};

type SecurityContextType = {
    securityState: SecurityState;
    updateSecurityState: (key: keyof SecurityState, value: any) => void;
};

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [securityState, setSecurityState] = useState<SecurityState>({
        isRooted: false,
        isEmulator: false,
        isTampered: false,
        passcodeSet: true, 
        status: 'GREEN',
    });

    const updateSecurityState = (key: keyof SecurityState, value: any) => {
        setSecurityState((prev) => {
            const newState = { ...prev, [key]: value };

            // Calculate derived status
            let newStatus: 'GREEN' | 'ORANGE' | 'RED' = 'GREEN';
            if (newState.isRooted || newState.isTampered) {
                newStatus = 'RED';
            } else if (newState.isEmulator || newState.passcodeSet === false) {
                newStatus = 'ORANGE'; // Warning
            }

            return { ...newState, status: newStatus };
        });
    };

    // Define actions for Talsec (memoized to prevent unnecessary re-creation)
    const actions: ThreatEventActions = useMemo(() => ({
        privilegedAccess: () => {
            console.log('Root/Privileged Access Detected by Talsec');
            updateSecurityState('isRooted', true);
        },
        simulator: () => {
            console.log('Emulator Detected by Talsec');
            updateSecurityState('isEmulator', true);
        },
        secureHardwareNotAvailable: () => {
            console.log('Secure Hardware Not Available');
        },
        passcode: () => {
            console.log('Passcode not set');
            updateSecurityState('passcodeSet', false);
        },
        deviceID: () => {
            // Optional
        }
    }), []);

    // Manual Talsec Initialization to handle Hot Reload crashes
    useEffect(() => {
        const initTalsec = async () => {
            // Talsec requires native code not available in Expo Go
            if (Constants.appOwnership === 'expo') {
                console.log('Skipping Talsec initialization in Expo Go');
                return;
            }

            try {
                await setThreatListeners(actions);
                const config = getTalsecConfig();
                const response = await talsecStart(config);
                console.log('Talsec started:', response);
            } catch (e: any) {
                // Suppress "Array already consumed" and "already started" errors typical in Dev Hot Reload
                if (e?.message?.includes('already consumed') || e?.code?.includes('consume')) {
                } else {
                    console.error('Talsec Initialization Error:', e);
                }
            }
        };

        initTalsec();

        return () => {
            removeThreatListener();
        };
    }, []); // Run once on mount

    return (
        <SecurityContext.Provider value={{ securityState, updateSecurityState }}>
            {children}
        </SecurityContext.Provider>
    );
};

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (!context) {
        throw new Error('useSecurity must be used within a SecurityProvider');
    }
    return context;
};
