import { useAuth } from '@/services/auth/authContext'
import { analyzePhisingAttempt } from '@/services/calls/gemini'
import { safeBrowsingCheck } from '@/services/calls/safeBrowsing'
import { db } from '@/services/firebase/firebase'
import { setLastPhishingResult } from '@/services/storage/phishingStore'
import { recordScan } from '@/services/storage/scanHistory'
import { recognizeText } from '@/services/utils/mlKit'
import { validateAndNormalizeUrl } from '@/services/utils/urlValidator'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
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
  View
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

// Initial state for scans is empty
const initialScans: any[] = []

type PhishingHeaderProps = {
  activeTab: Tab
  setActiveTab: (t: Tab) => void
  text: string
  setText: (s: string) => void
  loading: boolean
  onAnalyze: () => void
  onPickImage: () => void
  scansLength: number
}

function PhishingScanHeader({ activeTab, setActiveTab, text, setText, loading, onAnalyze, onPickImage, scansLength }: PhishingHeaderProps) {
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
          placeholderTextColor={'#53647bff'}
        />

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.analyzeBtn, { flex: 1, marginRight: 8 }]}
            disabled={loading}
            onPress={onAnalyze}
          >
            <Text style={styles.analyzeBtnText}>Analyze Content</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.galleryBtn, loading && styles.analyzeBtnDisabled]}
            onPress={onPickImage}
            disabled={loading}
          >
            <Ionicons name="image-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>
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
  const [scans, setScans] = useState<any[]>(initialScans)
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Listen to History (Fetch recent and filter client-side to avoid index issues)
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
          // Format timestamp for display
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
    // Navigate to scan_result with parameters
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
      const emptyInputAlert = 'Please enter some content to analyze.'
      alert(emptyInputAlert)
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
      // Run analysis
      let analysis: any;
      let sbResult: any = null;

      if (activeTab === 'URL') {
        // Run both in parallel for URLs
        const [geminiRes, sbRes] = await Promise.allSettled([
          analyzePhisingAttempt(urlToAnalyze, 'URL'),
          safeBrowsingCheck(urlToAnalyze)
        ]);

        if (geminiRes.status === 'fulfilled') {
          analysis = geminiRes.value;
        } else {
          console.error('Gemini analysis failed:', geminiRes.reason);
        }

        if (sbRes.status === 'fulfilled') {
          sbResult = sbRes.value;
        }
      }
      else {
        // Just Gemini for Email/SMS
        analysis = await analyzePhisingAttempt(text, activeTab.toUpperCase() as any);
      }

      setLoading(false);
      setText('');

      // Combine Results if URL
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
        // No Safe Browsing for Email/SMS
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

      // Store result in memory
      setLastPhishingResult(resultData);

      // Record scan
      if (user) {
        const status = finalRisk === 'HIGH' ? 'Dangerous' : finalRisk === 'MEDIUM' ? 'Suspicious' : 'Safe';
        recordScan(user.id, activeTab === 'URL' ? 'URL' : activeTab === 'SMS' ? 'SMS' : 'Email', status, urlToAnalyze.slice(0, 30), resultData);
      }

      router.push({ pathname: '/pages/phishing/scan_result' })
    } catch (error) {
      setLoading(false);
      console.log('Analysis error:', error);
      alert('An error occurred during analysis. Please try again.');
    }
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setLoading(true);
        const imageUri = result.assets[0].uri;

        // Use ML Kit OCR
        const ocrResult = await recognizeText(imageUri);

        if (ocrResult) {
          const extractedUrls = extractUrlsFromText(ocrResult.text);

          if (extractedUrls.length > 0) {
            // Found URLs! Use the first one and switch to URL tab
            setActiveTab('URL');
            setText(extractedUrls[0]);

            if (extractedUrls.length > 1) {
              Alert.alert(
                'Multiple URLs Found',
                `We found ${extractedUrls.length} URLs in the image. We've pasted the first one for you.`,
                [{ text: 'OK' }]
              );
            }
          } else {
            // No URLs, just paste the raw text (likely an Email or SMS screenshot)
            setText(ocrResult.text);
          }
        } else {
          Alert.alert('No Text Found', 'Failed to extract text from the selected image.');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image from gallery.');
      setLoading(false);
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



  const ScanHistory = ({ item }: { item: any }) => {
    const riskColor = item.risk === 'HIGH' ? '#FF4D4F' : item.risk === 'MEDIUM' ? '#FFA940' : '#2ECC71'
    return (
      <TouchableOpacity style={styles.scanItem} onPress={() => handleRecentPress(item)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.scanTitle} numberOfLines={1}>{item.details || item.content || 'Scan'}</Text>
          <Text style={styles.scanTime}>{item.time}</Text>
        </View>
        <View style={styles.scanMeta}>
          <Text style={[styles.riskBadge, { borderColor: riskColor, color: riskColor }]}>{item.risk}</Text>
          <Text style={[styles.score, { color: riskColor }]}>{item.score}%</Text>
        </View>
      </TouchableOpacity>
    )
  }



  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={scans}
        keyExtractor={i => i.id}
        renderItem={ScanHistory}
        ListHeaderComponent={
          <PhishingScanHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            text={text}
            setText={setText}
            loading={loading}
            onAnalyze={analyze}
            onPickImage={pickImage}
            scansLength={scans.length}
          />
        }
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* --- LOADING OVERLAY --- */}
      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loaderText}>Processing...</Text>
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
    color: '#000000',
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
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  galleryBtn: {
    padding: 10,
    backgroundColor: '#F8FAFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },

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

