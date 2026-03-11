// ── Feature columns matching apps_dataset.csv training order ─────────────────
export const FEATURE_COLUMNS: string[] = [
  'ACCESS_ALL_DOWNLOADS',
  'ACCESS_CACHE_FILESYSTEM',
  'ACCESS_CHECKIN_PROPERTIES',
  'ACCESS_COARSE_LOCATION',
  'ACCESS_COARSE_UPDATES',
  'ACCESS_FINE_LOCATION',
  'ACCESS_LOCATION_EXTRA_COMMANDS',
  'ACCESS_MOCK_LOCATION',
  'ACCESS_MTK_MMHW',
  'ACCESS_NETWORK_STATE',
  'ACCESS_PROVIDER',
  'ACCESS_SERVICE',
  'ACCESS_SHARED_DATA',
  'ACCESS_SUPERUSER',
  'ACCESS_SURFACE_FLINGER',
  'ACCESS_WIFI_STATE',
  'activityCalled',
  'ACTIVITY_RECOGNITION',
  'ACCOUNT_MANAGER',
  'ADD_VOICEMAIL',
  'ANT',
  'ANT_ADMIN',
  'AUTHENTICATE_ACCOUNTS',
  'AUTORUN_MANAGER_LICENSE_MANAGER',
  'AUTORUN_MANAGER_LICENSE_SERVICE(.autorun)',
  'BATTERY_STATS',
  'BILLING',
  'BIND_ACCESSIBILITY_SERVICE',
  'BIND_APPWIDGET',
  'BIND_CARRIER_MESSAGING_SERVICE',
  'BIND_DEVICE_ADMIN',
  'BIND_DREAM_SERVICE',
  'BIND_GET_INSTALL_REFERRER_SERVICE',
  'BIND_INPUT_METHOD',
  'BIND_NFC_SERVICE',
  'BIND_0TIFICATION_LISTENER_SERVICE',
  'BIND_PRINT_SERVICE',
  'BIND_REMOTEVIEWS',
  'BIND_TEXT_SERVICE',
  'BIND_TV_INPUT',
  'BIND_VOICE_INTERACTION',
  'BIND_VPN_SERVICE',
  'BIND_WALLPAPER',
  'BLUETOOTH',
  'BLUETOOTH_ADMIN',
  'BLUETOOTH_PRIVILEGED',
  'BODY_SENSORS',
  'BRICK',
  'BROADCAST_PACKAGE_REMOVED',
  'BROADCAST_SMS',
  'BROADCAST_STICKY',
  'BROADCAST_WAP_PUSH',
  'C2D_MESSAGE',
  'CALL_PHONE',
  'CALL_PRIVILEGED',
  'CAMERA',
  'CAPTURE_AUDIO_OUTPUT',
  'CAPTURE_SECURE_VIDEO_OUTPUT',
  'CAPTURE_VIDEO_OUTPUT',
  'CHANGE_COMPONENT_ENABLED_STATE',
  'CHANGE_CONFIGURATION',
  'CHANGE_DISPLAY_MODE',
  'CHANGE_NETWORK_STATE',
  'CHANGE_WIFI_MULTICAST_STATE',
  'CHANGE_WIFI_STATE',
  'CHECK_LICENSE',
  'CLEAR_APP_CACHE',
  'CLEAR_APP_USER_DATA',
  'CONTROL_LOCATION_UPDATES',
  'DATABASE_INTERFACE_SERVICE',
  'DELETE_CACHE_FILES',
  'DELETE_PACKAGES',
  'DEVICE_POWER',
  'DIAG0STIC',
  'DISABLE_KEYGUARD',
  'DOWNLOAD_SERVICE',
  'DOWNLOAD_WITHOUT_0TIFICATION',
  'DUMP',
  'EXPAND_STATUS_BAR',
  'EXTENSION_PERMISSION',
  'FACTORY_TEST',
  'FLASHLIGHT',
  'FORCE_BACK',
  'FULLSCREEN.FULL',
  'GET_ACCOUNTS',
  'GET_PACKAGE_SIZE',
  'GET_TASKS',
  'GET_TOP_ACTIVITY_INFO',
  'GLOBAL_SEARCH',
  'GOOGLE_AUTH',
  'GOOGLE_PHOTOS',
  'HARDWARE_TEST',
  'INJECT_EVENTS',
  'INSTALL_LOCATION_PROVIDER',
  'INSTALL_PACKAGES',
  'INSTALL_SHORTCUT',
  'INTERACT_ACROSS_USERS',
  'INTERNAL_SYSTEM_WINDOW',
  'INTERNET',
  'JPUSH_MESSAGE',
  'KILL_BACKGROUND_PROCESSES',
  'LOCATION_HARDWARE',
  'MANAGE_ACCOUNTS',
  'MANAGE_APP_TOKENS',
  'MANAGE_DOCUMENTS',
  'MAPS_RECEIVE',
  'MASTER_CLEAR',
  'MEDIA_BUTTON',
  'MEDIA_CONTENT_CONTROL',
  'MESSAGE',
  'MODIFY_AUDIO_SETTINGS',
  'MODIFY_PHONE_STATE',
  'MOUNT_FORMAT_FILESYSTEMS',
  'MOUNT_UNMOUNT_FILESYSTEMS',
  'NFC',
  'PERSISTENT_ACTIVITY',
  'PERMISSION',
  'PERMISSION_RUN_TASKS',
  'PLUGIN',
  'PROCESS_OUTGOING_CALLS',
  'READ',
  'READ_ATTACHMENT',
  'READ_AVESTTINGS',
  'READ_CALENDAR',
  'READ_CALL_LOG',
  'READ_CONTACTS',
  'READ_CONTENT_PROVIDER',
  'READ_DATA',
  'READ_DATABASES',
  'READ_EXTERNAL_STORAGE',
  'READ_FRAME_BUFFER',
  'READ_GMAIL',
  'READ_GSERVICES',
  'READ_HISTORY_BOOKMARKS',
  'READ_INPUT_STATE',
  'READ_LOGS',
  'READ_MESSAGES',
  'READ_OWNER_DATA',
  'READ_PHONE_STATE',
  'READ_PROFILE',
  'READ_SETTINGS',
  'READ_SMS',
  'READ_SOCIAL_STREAM',
  'READ_SYNC_SETTINGS',
  'READ_SYNC_STATS',
  'READ_USER_DICTIONARY',
  'READ_VOICEMAIL',
  'REBOOT',
  'RECEIVE',
  'RECEIVE_BOOT_COMPLETED',
  'RECEIVE_MMS',
  'RECEIVE_SIGNED_DATA_RESULT',
  'RECEIVE_SMS',
  'RECEIVE_USER_PRESENT',
  'RECEIVE_WAP_PUSH',
  'RECORD_AUDIO',
  'REORDER_TASKS',
  'RESPOND',
  'RESTART_PACKAGES',
  'REQUEST',
  'SDCARD_WRITE',
  'SEND',
  'SEND_RESPOND_VIA_MESSAGE',
  'SEND_SMS',
  'SET_ACTIVITY_WATCHER',
  'SET_ALARM',
  'SET_ALWAYS_FINISH',
  'SET_ANIMATION_SCALE',
  'SET_DEBUG_APP',
  'SET_ORIENTATION',
  'SET_POINTER_SPEED',
  'SET_PREFERRED_APPLICATIONS',
  'SET_PROCESS_LIMIT',
  'SET_TIME',
  'SET_TIME_ZONE',
  'SET_WALLPAPER',
  'SET_WALLPAPER_HINTS',
  'SIGNAL_PERSISTENT_PROCESSES',
  'STATUS_BAR',
  'STORAGE',
  'SUBSCRIBED_FEEDS_READ',
  'SUBSCRIBED_FEEDS_WRITE',
  'SYSTEM_ALERT_WINDOW',
  'TRANSMIT_IR',
  'UNINSTALL_SHORTCUT',
  'UPDATE_DEVICE_STATS',
  'USES_POLICY_FORCE_LOCK',
  'USE_CREDENTIALS',
  'USE_FINGERPRINT',
  'USE_SIP',
  'VIBRATE',
  'WAKE_LOCK',
  'WRITE',
  'WRITE_APN_SETTINGS',
  'WRITE_AVSETTING',
  'WRITE_CALENDAR',
  'WRITE_CALL_LOG',
  'WRITE_CONTACTS',
  'WRITE_DATA',
  'WRITE_DATABASES',
  'WRITE_EXTERNAL_STORAGE',
  'WRITE_GSERVICES',
  'WRITE_HISTORY_BOOKMARKS',
  'WRITE_INTERNAL_STORAGE',
  'WRITE_MEDIA_STORAGE',
  'WRITE_OWNER_DATA',
  'WRITE_PROFILE',
  'WRITE_SECURE_SETTINGS',
  'WRITE_SETTINGS',
  'WRITE_SMS',
  'WRITE_SOCIAL_STREAM',
  'WRITE_SYNC_SETTINGS',
  'WRITE_USER_DICTIONARY',
  'WRITE_VOICEMAIL',
  'Ljava/lang/reflect/Method;->invoke',
  'Ljavax/crypto/Cipher;->doFinal',
  'Ljava/lang/Runtime;->exec','Ljava/lang/System;->load',
  'Ldalvik/system/DexClassLoader;->loadClass',
  'Ljava/lang/System;->loadLibrary',
  'Ljava/net/URL;->openConnection',
  'Landroid/hardware/Camera;->open',
  'Landroid/hardware/Camera;->takePicture',
  'Landroid/telephony/SmsManager;->sendMultipartTextMessage',
  'Landroid/telephony/SmsManager;->sendTextMessage',
  'Landroid/media/AudioRecord;->startRecording',
  'Landroid/telephony/TelephonyManager;->getCellLocation',
  'Lcom/google/android/gms/location/LocationClient;->getLastLocation',
  'Landroid/location/LocationManager;->getLastK0wnLocation',
  'Landroid/telephony/TelephonyManager;->getDeviceId',
  'Landroid/content/pm/PackageManager;->getInstalledApplications',
  'Landroid/content/pm/PackageManager;->getInstalledPackages',
  'Landroid/telephony/TelephonyManager;->getLine1Number',
  'Landroid/telephony/TelephonyManager;->getNetworkOperator',
  'Landroid/telephony/TelephonyManager;->getNetworkOperatorName',
  'Landroid/telephony/TelephonyManager;->getNetworkCountryIso',
  'Landroid/telephony/TelephonyManager;->getSimOperator',
  'Landroid/telephony/TelephonyManager;->getSimOperatorName',
  'Landroid/telephony/TelephonyManager;->getSimCountryIso',
  'Landroid/telephony/TelephonyManager;->getSimSerialNumber',
  'Lorg/apache/http/impl/client/DefaultHttpClient;->execute',
];
export type AnalysisResult = {
    risk: 'HIGH' | 'MEDIUM' | 'LOW';
    /** 0 = completely safe, 100 = fully malicious */
    riskScore: number;
    reason: string;
    recommendation: string;
};

// ── Permission weights — covers ALL common Android permissions ─────────────────
// Critical/dangerous (15–20 pts), Sensitive (8–14 pts), Moderate (3–7 pts), Low (1–2 pts)
const PERMISSION_WEIGHTS: Record<string, number> = {
    // ── CRITICAL (20) ──────────────────────────────────────────────────────────
    BRICK: 20, READ_SMS: 20, SEND_SMS: 20, BIND_NOTIFICATION_LISTENER_SERVICE: 20,
    // ── HIGH DANGER (18) ──────────────────────────────────────────────────────
    BROADCAST_SMS: 18, RECEIVE_SMS: 18, RECORD_AUDIO: 18,
    // ── DANGEROUS (14–16) ─────────────────────────────────────────────────────
    READ_CALL_LOG: 16, WRITE_CALL_LOG: 16,
    ACCESS_FINE_LOCATION: 15, BIND_ACCESSIBILITY_SERVICE: 15,
    INSTALL_PACKAGES: 14, MASTER_CLEAR: 14, BIND_DEVICE_ADMIN: 14,
    INJECT_EVENTS: 14, CALL_PRIVILEGED: 14, 
    // ── SENSITIVE (10–12) ─────────────────────────────────────────────────────
    RECEIVE_MMS: 12, MODIFY_PHONE_STATE: 12, WRITE_SECURE_SETTINGS: 12,
    READ_CONTACTS: 12, REBOOT: 12,
    SYSTEM_ALERT_WINDOW: 10, MOUNT_UNMOUNT_FILESYSTEMS: 10, READ_LOGS: 10,
    CAMERA: 10, WRITE_CONTACTS: 10, CALL_PHONE: 10,
    // ── MODERATE RISK (6–8) ───────────────────────────────────────────────────
    WRITE_SETTINGS: 8, READ_PHONE_STATE: 8,
    RECEIVE_BOOT_COMPLETED: 8,  // auto-start = persistence mechanism
    GET_TASKS: 7,               // can see running apps
    PROCESS_OUTGOING_CALLS: 7,
    READ_CALENDAR: 6, WRITE_CALENDAR: 6,
    WRITE_EXTERNAL_STORAGE: 6, ACCESS_COARSE_LOCATION: 6,
    READ_EXTERNAL_STORAGE: 5, NFC: 5,
    GET_ACCOUNTS: 5, USE_CREDENTIALS: 5, MANAGE_ACCOUNTS: 5,
    BLUETOOTH_ADMIN: 5, BLUETOOTH_PRIVILEGED: 5,
    // ── LOWER RISK (2–4) — common but worth noting ────────────────────────────
    INTERNET: 2, ACCESS_NETWORK_STATE: 1, ACCESS_WIFI_STATE: 1,
    BLUETOOTH: 3, BODY_SENSORS: 4,
    CHANGE_WIFI_STATE: 2, READ_PHONE_NUMBERS: 4,
    CHANGE_NETWORK_STATE: 2, VIBRATE: 0, WAKE_LOCK: 2,
    FLASHLIGHT: 1, READ_SYNC_SETTINGS: 1, WRITE_SYNC_SETTINGS: 1,
    FOREGROUND_SERVICE: 2,
    POST_NOTIFICATIONS: 1, SCHEDULE_EXACT_ALARM: 3,
    USE_BIOMETRIC: 3, USE_FINGERPRINT: 3,
    MODIFY_AUDIO_SETTINGS: 2, DISABLE_KEYGUARD: 3,
    KILL_BACKGROUND_PROCESSES: 2, RESTART_PACKAGES: 3,
};

// ── Dangerous COMBINATIONS — pairs that together indicate spyware/malware ─────
// Score added if BOTH permissions are present
const DANGEROUS_COMBOS: Array<{ perms: string[]; bonus: number; label: string }> = [
    { perms: ['RECORD_AUDIO', 'INTERNET'], bonus: 15, label: 'audio exfiltration' },
    { perms: ['READ_SMS', 'INTERNET'], bonus: 15, label: 'SMS exfiltration' },
    { perms: ['ACCESS_FINE_LOCATION', 'INTERNET'], bonus: 12, label: 'location tracking' },
    { perms: ['READ_CONTACTS', 'INTERNET'], bonus: 10, label: 'contact harvesting' },
    { perms: ['RECEIVE_BOOT_COMPLETED', 'INTERNET'], bonus: 10, label: 'persistent background' },
    { perms: ['CAMERA', 'INTERNET'], bonus: 8, label: 'camera exfiltration' },
    { perms: ['READ_CALL_LOG', 'INTERNET'], bonus: 10, label: 'call log exfiltration' },
    { perms: ['BIND_ACCESSIBILITY_SERVICE', 'INTERNET'], bonus: 15, label: 'accessibility abuse' },
    { perms: ['SEND_SMS', 'RECEIVE_SMS'], bonus: 12, label: 'SMS intercept & send' },
    { perms: ['READ_SMS', 'SEND_SMS'], bonus: 12, label: 'full SMS control' },
    { perms: ['RECEIVE_BOOT_COMPLETED', 'BIND_DEVICE_ADMIN'], bonus: 18, label: 'device admin persistence' },
    { perms: ['RECORD_AUDIO', 'RECEIVE_BOOT_COMPLETED'], bonus: 14, label: 'background audio recording' },
    { perms: ['READ_CONTACTS', 'READ_CALL_LOG', 'INTERNET'], bonus: 15, label: 'PII harvesting' },
];

/** Converts a permission list to a Float32Array in training column order */
export const buildFeatureVector = (permissions: string[]): Float32Array => {
    const cleanedPerms = new Set(
        permissions.map(p => { const parts = p.split('.'); return parts[parts.length - 1]; })
    );
    return new Float32Array(FEATURE_COLUMNS.map(col => cleanedPerms.has(col) ? 1.0 : 0.0));
};

/** Int32Array version — for quantized/integer-input TFLite models */
export const buildFeatureVectorInt = (permissions: string[]): Int32Array => {
    const cleanedPerms = new Set(
        permissions.map(p => { const parts = p.split('.'); return parts[parts.length - 1]; })
    );
    return new Int32Array(FEATURE_COLUMNS.map(col => cleanedPerms.has(col) ? 1 : 0));
};

/** Reads sigmoid model output → risk score 0–100 */
export const interpretModelOutput = (outputData: Float32Array): number => {
    const maliciousProb = outputData.length >= 2 ? outputData[1] : outputData[0];
    const score = Math.round(maliciousProb * 100);
    return isNaN(score) || !isFinite(score) ? -1 : Math.min(100, Math.max(0, score));
};

/**
 * FACTOR 1 (35%): Dangerous permission scoring.
 * Returns 0–100 based on individual permission weights.
 */
function permissionScore(shortPerms: Set<string>): { score: number; flagged: string[] } {
    let total = 0;
    const flagged: string[] = [];
    let criticalCount = 0;

    for (const [perm, weight] of Object.entries(PERMISSION_WEIGHTS)) {
        if (weight > 0 && shortPerms.has(perm)) {
            total += weight;
            if (weight >= 14) criticalCount++; // Track highly dangerous permissions
            if (weight >= 20) criticalCount += 10; // Track highly dangerous permissions
            if (weight >= 6) flagged.push(perm);
        }
    }

    // Non-linear scoring: prevents permission bloat bias.
    // Having 10 normal permissions won't equal 1 critical one.
    const finalScore = (criticalCount * 25) + (flagged.length * 5);
    return { score: Math.min(100, finalScore), flagged }; // Allow it to hit 100 on severe permissions
}

/**
 * FACTOR 2 (25%): Dangerous combination detection.
 * Returns 0–100 based on risky permission pairs/triples.
 */
function comboScore(shortPerms: Set<string>): { score: number; combos: string[] } {
    let total = 0;
    const combos: string[] = [];
    for (const combo of DANGEROUS_COMBOS) {
        if (combo.perms.every(p => shortPerms.has(p))) {
            total += combo.bonus;
            combos.push(combo.label);
        }
    }
    return { score: Math.min(100, total), combos };
}

/**
 * Builds the final human-readable summary from scoring factors.
 */
function buildReason(
    permScore: number,
    flaggedPerms: string[],
    comboSc: number,
    detectedCombos: string[],
    mlScore: number,
    source: 'ai' | 'rules',
): string {
    const parts: string[] = [];
    if (flaggedPerms.length > 0) {
        parts.push(`risky permissions: ${flaggedPerms.slice(0, 3).join(', ')}${flaggedPerms.length > 3 ? ` +${flaggedPerms.length - 3} more` : ''}`);
    }
    if (detectedCombos.length > 0) {
        parts.push(`dangerous patterns: ${detectedCombos.slice(0, 2).join(', ')}`);
    }
    if (parts.length === 0) return 'No significant threat indicators found.';
    return parts.join(' | ') + '.';
}

export const buildAnalysisResult = (
    permSc: number,
    flaggedPerms: string[],
    comboSc: number,
    detectedCombos: string[],
    mlRiskScore: number,
    source: 'ai' | 'rules',
    isSystemApp: boolean = false,
    packageName: string = '',
): AnalysisResult => {
    // ── Weighted formula ───────────────────────────────────────────
    let riskScore: number;
    if (source === 'ai' && mlRiskScore >= 0) {
        riskScore = Math.round(mlRiskScore * 0.40 + permSc * 0.35 + comboSc * 0.25);
        // If ML yields a false negative, don't let it drag down an obviously dangerous app.
        riskScore = Math.max(riskScore, permSc, comboSc);
    } else {
        riskScore = Math.round(permSc * 0.60 + comboSc * 0.40);
        riskScore = Math.max(riskScore, permSc, comboSc);
    }

    // ── 🛡️ Trust Dampener ───────────────────────────────────────────
    // System apps are pre-verified — reduce risk by 60%
    if (isSystemApp) {
        riskScore = Math.round(riskScore * 0.4);
    }
    // Trusted publishers use many permissions legitimately — reduce risk by 80%
    const TRUSTED_PUBLISHERS = [
        // Global Giants
        'com.google', 'com.whatsapp', 'com.instagram', 'com.facebook',
        'com.microsoft', 'com.samsung', 'com.spotify', 'com.amazon',
        'com.netflix', 'com.twitter', 'com.snapchat', 'com.linkedin',
        'com.apple.android', 'com.adobe', 'com.yahoo', 'com.skype',
        'org.mozilla', 'com.brave', 'com.opera', 'com.discord',
        'com.ubercab', 'com.zhiliaoapp.musically', // Uber, TikTok

        // Indian/Regional Context (Based on user's current additions)
        'com.myairtelapp', 'com.myntra.android', 'com.flipkart.android',
        'net.one97.paytm', 'com.phonepe.app', 'com.google.android.apps.nbu.paisa.user', // GPay
        // Major Indian Banks
        'com.sbi.YONO', 'com.sbi.SBIFreedomPlus', // SBI
        'com.snapwork.hdfc', // HDFC
        'com.csam.icici.bank.imobile', // ICICI
        'com.axis.mobile', // Axis
        'com.pnb.mBanking', 'com.pnb.PnbPassbook', // PNB
        'com.bankofindia.boiMobile', // BOI
        'com.bom.mahaconnect', // Bank of Maharashtra
        'com.canarabank.mobil', // Canara Bank
        'com.infrasoft.ubimobility', // Union Bank of India
        'com.kotak811mobilebankingapp' // Kotak
    ];
    if (TRUSTED_PUBLISHERS.some(pub => packageName.startsWith(pub))) {
        riskScore = Math.round(riskScore * 0.25);
    }

    riskScore = isNaN(riskScore) ? 0 : Math.min(100, Math.max(0, riskScore));
    const reason = buildReason(permSc, flaggedPerms, comboSc, detectedCombos, mlRiskScore, source);

    if (riskScore >= 71) {
        return { risk: 'HIGH', riskScore, reason, recommendation: 'Uninstall this app immediately — it exhibits malware-like behavior.' };
    } else if (riskScore >= 31) {
        return { risk: 'MEDIUM', riskScore, reason, recommendation: 'Review permissions carefully before granting further access.' };
    } else {
        return { risk: 'LOW', riskScore, reason, recommendation: 'App appears safe based on its permission profile.' };
    }
};

/** Rule-based analysis when TFLite model is not loaded */
export const ruleBasedAnalysis = (
    permissions: string[],
    isSystemApp: boolean = false,
    packageName: string = '',
): AnalysisResult => {
    if (permissions.length === 0) {
        return {
        risk: 'MEDIUM',
        riskScore: isSystemApp ? 10 : 30,
        reason: 'Could not read app permissions — treating as moderate risk.',
        recommendation: 'Grant QUERY_ALL_PACKAGES permission for accurate scanning.',
    };
  }
    const cleanedPerms = new Set(
        permissions.map(p => { const parts = p.split('.'); return parts[parts.length - 1]; })
    );
    const { score: permSc, flagged } = permissionScore(cleanedPerms);
    const { score: comboSc, combos } = comboScore(cleanedPerms);
    return buildAnalysisResult(permSc, flagged, comboSc, combos, -1, 'rules', isSystemApp, packageName);
};

/** Full analysis with TFLite output + rule-based factors */
export const fullAnalysis = (
    permissions: string[],
    mlRiskScore: number,
    isSystemApp: boolean = false,
    packageName: string = '',
): AnalysisResult => {
    const cleanedPerms = new Set(
        permissions.map(p => { const parts = p.split('.'); return parts[parts.length - 1]; })
    );
    const { score: permSc, flagged } = permissionScore(cleanedPerms);
    const { score: comboSc, combos } = comboScore(cleanedPerms);
    return buildAnalysisResult(permSc, flagged, comboSc, combos, mlRiskScore, 'ai', isSystemApp, packageName);
};