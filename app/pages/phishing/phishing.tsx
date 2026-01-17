import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/services/auth/authContext'
import { analyzePhisingAttempt } from '@/services/calls/gemini'
import { safeBrowsingCheck } from '@/services/calls/safeBrowsing'
import { db } from '@/services/firebase/firebase'
import { setLastPhishingResult } from '@/services/storage/phishingStore'
import { recordScan } from '@/services/storage/scanHistory'
import { validateAndNormalizeUrl } from '@/services/utils/urlValidator'
import { router } from 'expo-router'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const { width } = Dimensions.get('window')

type Tab = 'Email' | 'SMS' | 'URL'

type PhishingHeaderProps = {
  activeTab: Tab
  setActiveTab: (t: Tab) => void
  text: string
  setText: (s: string) => void
  loading: boolean
  onAnalyze: () => void
  scansLength: number
}

function PhishingScanHeader({ activeTab, setActiveTab, text, setText, loading, onAnalyze, scansLength }: PhishingHeaderProps) {
  const { colors, isDarkMode } = useTheme();

  const renderTab = (tab: Tab) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.tab,
        { backgroundColor: isDarkMode ? colors.surface : '#F2F4F8' },
        activeTab === tab && { backgroundColor: colors.accent }
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabText,
        { color: isDarkMode ? colors.textSecondary : '#334155' },
        activeTab === tab && { color: colors.background, fontWeight: '600' }
      ]}>
        {tab}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.content}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Phishing Detector</Text>
        <Text style={[styles.headerAction, { color: colors.textSecondary }]}>⟳</Text>
      </View>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>AI-powered threat analysis</Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.tabRow}>
          {(['Email', 'SMS', 'URL'] as Tab[]).map(renderTab)}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Paste {activeTab} Content</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: isDarkMode ? colors.background : '#F8FAFF', borderColor: colors.border, color: colors.textPrimary }]}
          multiline
          placeholder={`Paste ${activeTab} content here...`}
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.analyzeBtn, { backgroundColor: colors.accent }, loading && styles.analyzeBtnDisabled]}
          disabled={loading}
          onPress={onAnalyze}
        >
          <Text style={[styles.analyzeBtnText, { color: colors.background }]}>Analyze Content</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.tipsCard, { backgroundColor: isDarkMode ? 'rgba(0, 242, 254, 0.1)' : '#EFF6FF', borderColor: isDarkMode ? colors.accent : '#DBEAFE' }]}>
        <Text style={[styles.tipsTitle, { color: colors.accent }]}>🛡️ Security Tips</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Never share passwords or sensitive info via email/SMS</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Verify sender identity through official channels</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Hover over links to check actual destination</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Be suspicious of urgent or threatening messages</Text>
      </View>

      <View style={styles.recent}>
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: colors.textPrimary }]}>Recent Scans</Text>
          <Text style={[styles.scanCount, { color: colors.textSecondary }]}>{scansLength} scans</Text>
        </View>
      </View>
    </View>
  )
}

export default function Phishing() {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('Email')
  const [text, setText] = useState('')
  const [scans, setScans] = useState<any[]>([])
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Listen to History
    const historyRef = collection(db, 'users', user.id, 'history');
    const q = query(
      historyRef,
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data(),
          time: d.data().timestamp?.toDate
            ? d.data().timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now'
        }))
        .filter((s: any) => ['Email', 'SMS', 'URL'].includes(s.type));
      setScans(historyData);
    });

    return () => unsub();
  }, [user]);

  const handleRecentPress = (scan: any) => {
    const params = { ...scan };
    if (scan.timestamp?.toDate) {
      params.timestamp = scan.timestamp.toDate().toISOString();
    }
    router.push({
      pathname: '/pages/phishing/scan_result',
      params
    });
  };

  const analyze = async () => {
    if (!text.trim()) {
      alert('Please enter some content to analyze.')
      return
    }

    let urlToAnalyze = text.trim();
    if (activeTab === 'URL') {
      const validation = validateAndNormalizeUrl(urlToAnalyze);
      if (!validation.isValid) {
        alert(validation.error || 'Please enter a valid URL.');
        return;
      }
      urlToAnalyze = validation.normalizedUrl!;
    }

    setLoading(true);
    try {
      let analysis: any;
      let sbResult: any = null;

      if (activeTab === 'URL') {
        const [geminiRes, sbRes] = await Promise.allSettled([
          analyzePhisingAttempt(urlToAnalyze, 'URL'),
          safeBrowsingCheck(urlToAnalyze)
        ]);

        if (geminiRes.status === 'fulfilled') {
          analysis = geminiRes.value;
        } else {
          analysis = { risk: 'UNKNOWN', score: 0, reason: 'AI analysis unavailable.' };
        }

        if (sbRes.status === 'fulfilled') {
          sbResult = sbRes.value;
        }
      } else {
        analysis = await analyzePhisingAttempt(text, activeTab.toUpperCase() as any);
      }

      setLoading(false);
      setText('');

      let finalRisk = analysis.risk;
      let finalScore = analysis.score;
      let finalReason = analysis.reason;
      let safeBrowsingText = 'Not checked';

      if (activeTab === 'URL') {
        if (sbResult && sbResult.matches && sbResult.matches.length > 0) {
          finalRisk = 'HIGH';
          finalScore = Math.min(finalScore, 10);
          const threats = sbResult.matches.map((m: any) => m.threatType).join(', ');
          finalReason = `WARNING: Google Safe Browsing detected threats (${threats}). ` + finalReason;
          safeBrowsingText = `⚠️ THREATS DETECTED: ${threats}`;
        } else if (sbResult === null) {
          safeBrowsingText = 'API key not configured - check skipped';
        } else {
          safeBrowsingText = '✓ No threats detected';
        }
      } else {
        safeBrowsingText = '';
      }

      const resultData = {
        risk: finalRisk,
        score: finalScore,
        reason: finalReason,
        content: urlToAnalyze.slice(0, 200) + (urlToAnalyze.length > 200 ? '...' : ''),
        safeBrowsingResult: safeBrowsingText,
        geminiResult: analysis.reason
      };

      setLastPhishingResult(resultData);

      if (user) {
        const status = finalRisk === 'HIGH' ? 'Dangerous' : finalRisk === 'MEDIUM' ? 'Suspicious' : 'Safe';
        recordScan(user.id, activeTab === 'URL' ? 'URL' : activeTab === 'SMS' ? 'SMS' : 'Email', status, urlToAnalyze.slice(0, 30), resultData);
      }

      router.push({ pathname: '/pages/phishing/scan_result' })
    } catch (error) {
      setLoading(false);
      alert('An error occurred during analysis. Please try again.');
    }
  }

  const ScanHistory = ({ item }: { item: any }) => {
    const riskColor = item.risk === 'HIGH' ? colors.danger : item.risk === 'MEDIUM' ? '#FFA940' : colors.success;
    return (
      <TouchableOpacity
        style={[styles.scanItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => handleRecentPress(item)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.scanTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.details || item.content || 'Scan'}</Text>
          <Text style={[styles.scanTime, { color: colors.textSecondary }]}>{item.time}</Text>
        </View>
        <View style={styles.scanMeta}>
          <Text style={[styles.riskBadge, { borderColor: riskColor, color: riskColor }]}>{item.risk}</Text>
          <Text style={[styles.score, { color: riskColor }]}>{item.score}%</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={scans}
        keyExtractor={i => i.id}
        renderItem={ScanHistory}
        ListHeaderComponent={<PhishingScanHeader activeTab={activeTab} setActiveTab={setActiveTab} text={text} setText={setText} loading={loading} onAnalyze={analyze} scansLength={scans.length} />}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.loaderContainer, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loaderText, { color: colors.textPrimary }]}>Analyzing with AI...</Text>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { paddingHorizontal: 16, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerAction: { fontSize: 18 },
  headerSubtitle: { paddingHorizontal: 16, marginTop: 4, marginBottom: 12 },

  content: { padding: 16 },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  tabRow: { flexDirection: 'row', marginBottom: 12, alignSelf: 'center' },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginRight: 8,
  },
  tabText: { fontSize: 14 },

  label: { marginBottom: 8, fontSize: 13 },
  textArea: {
    minHeight: 110,
    maxHeight: 220,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  analyzeBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  analyzeBtnText: { fontWeight: '600' },
  analyzeBtnDisabled: { opacity: 0.5 },

  tipsCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  tipsTitle: { fontWeight: '700', marginBottom: 8 },
  tip: { marginBottom: 4, fontSize: 13 },

  recent: { marginTop: 4 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  recentTitle: { fontWeight: '700', fontSize: 16 },
  scanCount: { fontSize: 13 },

  scanItem: {
    borderRadius: 12,
    padding: 12,
    marginLeft: 16,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: width - 32,
    borderWidth: 1,
  },
  scanTitle: { fontWeight: '600' },
  scanTime: { marginTop: 4, fontSize: 12 },
  scanMeta: { alignItems: 'flex-end', marginLeft: 8 },
  riskBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16, fontSize: 12 },
  score: { marginTop: 6, fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
  },
})

