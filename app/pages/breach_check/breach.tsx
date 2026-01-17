import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/services/auth/authContext'
import { breachCheck } from '@/services/calls/breach'
import { db } from '@/services/firebase/firebase'
import { setLastBreachResult } from '@/services/storage/breachStore'
import { recordScan } from '@/services/storage/scanHistory'
import { seedBreachData } from '@/services/utils/seedBreaches'
import { Ionicons } from '@expo/vector-icons'
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

type Tab = 'Email Check' | 'Password Check'

type BreachHeaderProps = {
  activeTab: Tab
  setActiveTab: (t: Tab) => void
  text: string
  setText: (s: string) => void
  emailValid: boolean
  loading: boolean
  scansLength: number
  onAnalyze: () => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  colors: any
  isDarkMode: boolean
}

function BreachScanHeader({ activeTab, setActiveTab, text, setText, emailValid, loading, scansLength, onAnalyze, showPassword, setShowPassword, colors, isDarkMode }: BreachHeaderProps) {
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
        { color: colors.textSecondary },
        activeTab === tab && { color: colors.background, fontWeight: '600' }
      ]}>{tab}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.content}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Breach Exposure Checker</Text>
        <TouchableOpacity>
          <Text style={[styles.headerAction, { color: colors.textSecondary }]}>⟳</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Check if your email or password appeared in known data breaches</Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.tabRow}>{(['Email Check', 'Password Check'] as Tab[]).map(renderTab)}</View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>{activeTab === 'Email Check' ? 'Email Address' : 'Password'}</Text>

        {activeTab === 'Password Check' ? (
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.textArea, { flex: 1, marginRight: 8, backgroundColor: isDarkMode ? colors.background : '#F8FAFF', color: colors.textPrimary, borderColor: colors.border }]}
              placeholder={'Enter password (never stored)'}
              placeholderTextColor={colors.textSecondary}
              value={text}
              onChangeText={setText}
              keyboardType={'default'}
              secureTextEntry={!showPassword}
              autoCapitalize={'none'}
              textContentType={'password'}
            />
            <TouchableOpacity style={[styles.eyeButton, { backgroundColor: isDarkMode ? colors.background : '#F8FAFF' }]} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TextInput
            style={[styles.textArea, { backgroundColor: isDarkMode ? colors.background : '#F8FAFF', color: colors.textPrimary, borderColor: colors.border }]}
            placeholder={'Enter email address'}
            placeholderTextColor={colors.textSecondary}
            value={text}
            onChangeText={setText}
            keyboardType={'email-address'}
            secureTextEntry={false}
            autoCapitalize={'none'}
            textContentType={'emailAddress'}
          />
        )}

        {activeTab === 'Email Check' && text.trim() !== '' && !emailValid && (
          <Text style={[styles.errorText, { color: colors.danger }]}>Please enter a valid email address.</Text>
        )}
        {activeTab === 'Password Check' && (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>Password is checked using k-anonymity. It is never sent or stored.</Text>
        )}

        <TouchableOpacity style={[styles.analyzeBtn, { backgroundColor: colors.accent }, (loading || (activeTab === 'Email Check' && !emailValid)) && styles.analyzeBtnDisabled]} disabled={loading || (activeTab === 'Email Check' && !emailValid)} onPress={onAnalyze}>
          <Text style={[styles.analyzeBtnText, { color: colors.background }]}>{activeTab === 'Email Check' ? 'Check Email Exposure' : 'Check Password Exposure'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.tipsCard, { backgroundColor: isDarkMode ? 'rgba(0, 242, 254, 0.1)' : '#E0ECFF', borderColor: colors.accent }]}>
        <Text style={[styles.tipsTitle, { color: colors.accent }]}>🔐 Security Tips</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Use unique passwords for every site</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Enable 2FA wherever possible</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Change passwords after a breach</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Never reuse breached passwords</Text>
      </View>

      <View style={styles.recent}>
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: colors.textPrimary }]}>Recent Checks</Text>
          <Text style={[styles.scanCount, { color: colors.textSecondary }]}>{scansLength} scans</Text>
        </View>
      </View>
    </View>
  )
}

export default function Breach() {
  const { colors, isDarkMode } = useTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('Email Check')
  const [text, setText] = useState('')
  const [scans, setScans] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)


  useEffect(() => {
    seedBreachData();
  }, []);

  useEffect(() => {
    if (!user) return;

    const historyRef = collection(db, 'users', user.id, 'history');
    const q = query(
      historyRef,
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const historyItems = snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data(),
          time: d.data().timestamp?.toDate
            ? d.data().timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now'
        }))
        .filter((s: any) => s.type === 'Breach');
      setScans(historyItems);
    });

    return () => unsub();
  }, [user]);

  const handleRecentPress = (scan: any) => {
    let pathname = "" as any;
    if (scan.type === "Breach") {
      pathname = "/pages/breach_check/breach_result";
    }

    if (pathname) {
      const params = { ...scan };
      if (scan.timestamp?.toDate) {
        params.timestamp = scan.timestamp.toDate().toISOString();
      }
      router.push({
        pathname,
        params
      });
    }
  };


  useEffect(() => {
    if (activeTab !== 'Password Check') setShowPassword(false)
  }, [activeTab])



  const emailValid = activeTab === 'Email Check' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim()) : true

  const handleTextChange = (s: string) => {
    setText(s)
  }

  const analyze = async () => {
    if (!text.trim()) {
      alert('Please enter some content to analyze.')
      return
    }

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
        const reason = breachesCount === 0 ? 'No breaches found for this email.' : `Found in ${breachesCount} breach(es): ${res.breaches.slice(0, 3).map(b => b.Name).join(', ')}`

        setLastBreachResult({ risk, score, reason, content: text.trim() })

        if (user) {
          const status = risk === 'HIGH' ? 'Dangerous' : risk === 'MEDIUM' ? 'Suspicious' : 'Safe';
          recordScan(user.id, 'Breach', status, `Email: ${text.trim()}`, {
            risk,
            score,
            reason,
            content: text.trim(),
            breachType: 'Email'
          });
        }

        router.push({ pathname: '/pages/breach_check/breach_result' })
        setText('')
        return
      }

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

      setLastBreachResult({ risk, score, reason, content: 'Password (hidden for security)' })

      if (user) {
        const status = risk === 'HIGH' ? 'Dangerous' : risk === 'MEDIUM' ? 'Suspicious' : 'Safe';
        recordScan(user.id, 'Breach', status, 'Password Check', {
          risk,
          score,
          reason,
          content: 'Password (hidden for security)',
          breachType: 'Password'
        });
      }

      router.push({ pathname: '/pages/breach_check/breach_result' })
      setText('')
    } catch (error: any) {
      setLoading(false)
      const message = error?.message || 'An error occurred during analysis'
      alert(message)
    }
  }

  const ScanHistory = ({ item }: { item: any }) => {
    const riskColor = item.risk === 'HIGH' ? colors.danger : item.risk === 'MEDIUM' ? '#FFA940' : colors.success
    return (
      <TouchableOpacity style={[styles.scanItem, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => handleRecentPress(item)}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.scanTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.details || item.reason || 'Breach Check'}</Text>
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
        keyExtractor={(i) => i.id}
        renderItem={ScanHistory}
        ListHeaderComponent={<BreachScanHeader activeTab={activeTab} setActiveTab={setActiveTab} text={text} setText={handleTextChange} emailValid={emailValid} loading={loading} scansLength={scans.length} onAnalyze={analyze} showPassword={showPassword} setShowPassword={setShowPassword} colors={colors} isDarkMode={isDarkMode} />}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.loaderContainer, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loaderText, { color: colors.textPrimary }]}>Checking breach databases...</Text>
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
    minHeight: 56,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  helperText: { fontSize: 12, marginBottom: 8 },
  analyzeBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  analyzeBtnText: { fontWeight: '600' },
  analyzeBtnDisabled: { opacity: 0.6 },

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
  errorText: { fontSize: 12, marginBottom: 8 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { padding: 8, borderRadius: 8 },
})
