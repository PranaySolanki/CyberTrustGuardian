import { useAuth } from '@/services/auth/authContext'
import { analyzePhisingAttempt } from '@/services/calls/gemini'
import { setLastPhishingResult } from '@/services/storage/phishingStore'
import { recordScan } from '@/services/storage/scanHistory'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
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
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

type Tab = 'Email' | 'SMS' | 'URL'
type Scan = {
  id: string
  title: string
  time: string
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  score: number // 0-100
}

const initialScans: Scan[] = [
  {
    id: '1',
    title: 'Your account has been suspended. Click here to verify...',
    time: '16:32',
    risk: 'HIGH',
    score: 10,
  },
  {
    id: '2',
    title: 'Win a free gift card now — confirm details',
    time: '15:05',
    risk: 'MEDIUM',
    score: 45,
  },
]

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
  const renderTab = (tab: Tab) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tab, activeTab === tab && styles.tabActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.content}>
      {/* Standard Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phishing Detector</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.tabRow}>
          {(['Email', 'SMS', 'URL'] as Tab[]).map(renderTab)}
        </View>

        <Text style={styles.label}>Paste {activeTab} Content</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder={`Paste ${activeTab} content here...`}
          value={text}
          onChangeText={setText}
          numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.analyzeBtn} disabled={loading} onPress={onAnalyze}>
          <Text style={styles.analyzeBtnText}>Analyze Content</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>🛡️ Security Tips</Text>
        <Text style={styles.tip}>• Never share passwords or sensitive info via email/SMS</Text>
        <Text style={styles.tip}>• Verify sender identity through official channels</Text>
        <Text style={styles.tip}>• Hover over links to check actual destination</Text>
        <Text style={styles.tip}>• Be suspicious of urgent or threatening messages</Text>
      </View>

      <View style={styles.recent}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Scans</Text>
          <Text style={styles.scanCount}>{scansLength} scans</Text>
        </View>
      </View>
    </View>
  )
}

export default function Phishing() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Email')
  const [text, setText] = useState('')
  const [scans, setScans] = useState<Scan[]>(initialScans)
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!text.trim()) {
      const emptyInputAlert = 'Please enter some content to analyze.'
      alert(emptyInputAlert)
      return
    }
    setLoading(true);
    try {
      const analysis = await analyzePhisingAttempt(text, activeTab.toUpperCase() as any);
      setLoading(false);
      setText('');
      // Store result in memory (avoid sending potentially sensitive data as URL params)
      setLastPhishingResult({ risk: analysis.risk, score: analysis.score, reason: analysis.reason, content: text.slice(0, 200) + '...' })

      // Record scan
      if (user) {
        const status = analysis.risk === 'HIGH' ? 'Dangerous' : analysis.risk === 'MEDIUM' ? 'Suspicious' : 'Safe';
        recordScan(user.id, activeTab === 'URL' ? 'URL' : activeTab === 'SMS' ? 'SMS' : 'Email', status, text.slice(0, 30), {
          risk: analysis.risk,
          score: analysis.score,
          reason: analysis.reason,
          content: text.slice(0, 200) + '...'
        });
      }

      router.push({ pathname: '/pages/phishing/scan_result' })
    } catch (error) {

      setLoading(false);
      const errorMessage = error;
      alert(errorMessage);
    }
  }

  const renderTab = (tab: Tab) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tab, activeTab === tab && styles.tabActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
    </TouchableOpacity>
  )



  const ScanHistory = ({ item }: { item: Scan }) => {
    const riskColor = item.risk === 'HIGH' ? '#FF4D4F' : item.risk === 'MEDIUM' ? '#FFA940' : '#2ECC71'
    return (
      <View style={styles.scanItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.scanTitle}>{item.title}</Text>
          <Text style={styles.scanTime}>{item.time}</Text>
        </View>
        <View style={styles.scanMeta}>
          <Text style={[styles.riskBadge, { borderColor: riskColor, color: riskColor }]}>{item.risk}</Text>
          <Text style={[styles.score, { color: riskColor }]}>{item.score}%</Text>
        </View>
      </View>
    )
  }



  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={scans}
        keyExtractor={i => i.id}
        renderItem={ScanHistory}
        ListHeaderComponent={<PhishingScanHeader activeTab={activeTab} setActiveTab={setActiveTab} text={text} setText={setText} loading={loading} onAnalyze={analyze} scansLength={scans.length} />}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* --- LOADING OVERLAY --- */}
      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loaderText}>Analyzing with AI...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: 0.5 },
  iconBtn: { padding: 8, backgroundColor: "#FFF", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },

  content: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  tabRow: { flexDirection: 'row', marginBottom: 12, alignSelf: 'center' },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F2F4F8',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#2563EB',
  },
  tabText: { color: '#334155' },
  tabTextActive: { color: '#fff', fontWeight: '600' },

  label: { marginBottom: 8, color: '#64748B', fontSize: 13 },
  textArea: {
    minHeight: 110,
    maxHeight: 220,
    borderRadius: 10,
    backgroundColor: '#F8FAFF',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    marginBottom: 12,
  },
  analyzeBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  analyzeBtnText: { color: '#fff', fontWeight: '600' },
  analyzeBtnDisabled: { backgroundColor: '#94A3B8' },

  tipsCard: {
    backgroundColor: '#c8dcfa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6EEF8',
  },
  tipsTitle: { fontWeight: '700', marginBottom: 8, color: '#367cec' },
  tip: { color: '#475569', marginBottom: 4, fontSize: 13 },

  recent: { marginTop: 4 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  recentTitle: { fontWeight: '700', fontSize: 16 },
  scanCount: { color: '#64748B' },

  scanItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginLeft: 16,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: width - 32,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  scanTitle: { fontWeight: '600', color: '#0F172A' },
  scanTime: { color: '#94A3B8', marginTop: 4, fontSize: 12 },
  scanMeta: { alignItems: 'flex-end', marginLeft: 8 },
  riskBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16, fontSize: 12 },
  score: { marginTop: 6, fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dims the background
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
})

