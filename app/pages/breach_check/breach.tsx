import { breachCheck } from '@/services/calls/breach'
import { setLastBreachResult } from '@/services/storage/breachStore'
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

const { width } = Dimensions.get('window')

type Tab = 'Email Check' | 'Password Check'
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
    title: 'email@example.com found in 3 breaches',
    time: '16:32',
    risk: 'HIGH',
    score: 94,
  },
  {
    id: '2',
    title: 'Password exposed on paste site',
    time: '15:05',
    risk: 'MEDIUM',
    score: 55,
  },
]

type BreachHeaderProps = {
  activeTab: Tab
  setActiveTab: (t: Tab) => void
  text: string
  setText: (s: string) => void
  emailValid: boolean
  loading: boolean
  scansLength: number
  onAnalyze: () => void
}

function BreachScanHeader({ activeTab, setActiveTab, text, setText, emailValid, loading, scansLength, onAnalyze }: BreachHeaderProps) {
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
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Breach Exposure Checker</Text>
        <Text style={styles.headerAction}>⟳</Text>
      </View>
      <Text style={styles.headerSubtitle}>Check if your email or password appeared in known data breaches</Text>

      <View style={styles.card}>
        <View style={styles.tabRow}>{(['Email Check', 'Password Check'] as Tab[]).map(renderTab)}</View>

        <Text style={styles.label}>{activeTab === 'Email Check' ? 'Email Address' : 'Password'}</Text>
        <TextInput
          style={styles.textArea}
          placeholder={activeTab === 'Email Check' ? 'Enter email address' : 'Enter password (never stored)'}
          value={text}
          onChangeText={setText}
          keyboardType={activeTab === 'Email Check' ? 'email-address' : 'default'}
          secureTextEntry={activeTab === 'Password Check'}
          autoCapitalize="none"
          textContentType={activeTab === 'Email Check' ? 'emailAddress' : 'none'}
        />
        {activeTab === 'Email Check' && text.trim() !== '' && !emailValid && (
          <Text style={styles.errorText}>Please enter a valid email address.</Text>
        )}
        {activeTab === 'Password Check' && (
          <Text style={styles.helperText}>Password is checked using k-anonymity. It is never sent or stored.</Text>
        )}

        <TouchableOpacity style={[styles.analyzeBtn, (loading || (activeTab === 'Email Check' && !emailValid)) && styles.analyzeBtnDisabled]} disabled={loading || (activeTab === 'Email Check' && !emailValid)} onPress={onAnalyze}>
          <Text style={styles.analyzeBtnText}>{activeTab === 'Email Check' ? 'Check Email Exposure' : 'Check Password Exposure'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>🔐 Security Tips</Text>
        <Text style={styles.tip}>• Use unique passwords for every site</Text>
        <Text style={styles.tip}>• Enable 2FA wherever possible</Text>
        <Text style={styles.tip}>• Change passwords after a breach</Text>
        <Text style={styles.tip}>• Never reuse breached passwords</Text>
      </View>

      <View style={styles.recent}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Checks</Text>
          <Text style={styles.scanCount}>{scansLength} scans</Text>
        </View>
      </View>
    </View>
  )
}

export default function Breach() {
  const [activeTab, setActiveTab] = useState<Tab>('Email Check')
  const [text, setText] = useState('')
  const [scans, setScans] = useState<Scan[]>(initialScans)
  const [loading, setLoading] = useState(false)
  // Simple email validation (must contain '@' and '.')
  const emailValid = activeTab === 'Email Check' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim()) : true

  const analyze = async () => {
    if (!text.trim()) {
      const emptyInputAlert = 'Please enter some content to analyze.'
      alert(emptyInputAlert)
      return
    }

    // If checking email, ensure it looks valid
    if (activeTab === 'Email Check' && !emailValid) {
      alert('Please enter a valid email address.')
      return
    }

    setLoading(true)

    try {
      if (activeTab === 'Email Check') {
        const res = await breachCheck(text.trim(), 'Email')
        setLoading(false)
        const breachesCount = res.breaches.length
        let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
        let score = 100
        if (breachesCount === 0) {
          risk = 'LOW'
          score = 100
        } else if (breachesCount <= 2) {
          risk = 'MEDIUM'
          score = 60
        } else {
          risk = 'HIGH'
          score = breachesCount >= 5 ? 20 : 40
        }
        const reason = breachesCount === 0 ? 'No breaches found for this email.' : `Found in ${breachesCount} breach(es): ${res.breaches.slice(0,3).map(b => b.Name).join(', ')}`

        // Store result in memory (avoid sending sensitive data as URL params)
        setLastBreachResult({ risk, score, reason, content: text.trim() })
        router.push({ pathname: '/pages/breach_check/breach_result' })
        setText('')
        return
      }

      // Password check
      const res = await breachCheck(text, 'PASSWORD')
      setLoading(false)
      const count = res.count
      let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
      let score = 100
      if (count === 0) {
        risk = 'LOW'
        score = 100
      } else if (count < 100) {
        risk = 'MEDIUM'
        score = 70
      } else if (count < 1000) {
        risk = 'HIGH'
        score = 40
      } else {
        risk = 'HIGH'
        score = 20
      }
      const reason = count === 0 ? 'Password not found in Pwned Passwords.' : `Found ${count} times in Pwned Passwords.`

      // Store result in memory (avoid sending sensitive data as URL params)
      setLastBreachResult({ risk, score, reason, content: 'Password (hidden for security)' })
      router.push({ pathname: '/pages/breach_check/breach_result' })
      setText('')
    } catch (error: any) {
      setLoading(false)
      const message = error?.message || 'An error occurred during analysis'
      alert(message)
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
    <View style={styles.container}>
      <FlatList
        data={scans}
        keyExtractor={(i) => i.id}
        renderItem={ScanHistory}
        ListHeaderComponent={<BreachScanHeader activeTab={activeTab} setActiveTab={setActiveTab} text={text} setText={setText} emailValid={emailValid} loading={loading} scansLength={scans.length} onAnalyze={analyze} />}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loaderText}>Checking breach databases...</Text>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FB' },
  headerRow: { paddingHorizontal: 16, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  headerAction: { fontSize: 18, color: '#6B7280' },
  headerSubtitle: { paddingHorizontal: 16, color: '#6B7280', marginTop: 4, marginBottom: 12 },

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
    minHeight: 56,
    borderRadius: 10,
    backgroundColor: '#F8FAFF',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    marginBottom: 8,
  },
  helperText: { color: '#475569', fontSize: 12, marginBottom: 8 },
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
  errorText: { color: '#FF4D4F', fontSize: 12, marginBottom: 8 },
})