import { clearLastQrResult, getLastQrResult } from '@/services/storage/qrStore'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function ScanResult() {
  const [data, setData] = useState<{ risk?: string; score?: number; reason?: string; content?: string } | null>(null)

  useEffect(() => {
    const last = getLastQrResult()
    if (last) {
      setData(last)
      clearLastQrResult()
    } else {
      setData(null)
    }
  }, [])

  const handleCopy = async () => {
    if (data?.content) {
      await Clipboard.setStringAsync(data.content)
      Alert.alert('Copied', 'URL copied to clipboard')
    }
  }

  const handleOpen = async () => {
    if (!data?.content) return
    try {
      await Linking.openURL(data.content)
    } catch (error) {
      Alert.alert('Error', 'Unable to open the URL')
    }
  }

  if (!data) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>No result available</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.dismiss()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  const { risk, score, reason, content } = data

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Scan Result</Text>

      <View style={styles.resultBox}>
        <Text style={styles.label}>URL:</Text>
        <Text style={styles.contentPreview}>{content}</Text>

        <Text style={styles.label}>Risk Level:</Text>
        <Text style={[styles.value, { color: risk === 'HIGH' ? '#FF4D4F' : risk === 'MEDIUM' ? '#FFA940' : '#2ECC71' }]}>
          {risk}
        </Text>

        <Text style={styles.label}>Safety Score:</Text>
        <Text style={styles.value}>{score}%</Text>

        <Text style={styles.label}>Conclusion:</Text>
        <Text style={styles.reasonText}>{reason}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleCopy}>
          <Text style={styles.secondaryButtonText}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleOpen}>
          <Text style={styles.primaryButtonText}>Open Link</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.dismiss()}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  resultBox: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  label: { fontSize: 14, color: '#666', marginTop: 15, fontWeight: '600' },
  value: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  reasonText: { fontSize: 16, lineHeight: 22, marginTop: 4, color: '#333' },
  contentPreview: { fontSize: 14, fontStyle: 'italic', color: '#888', marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  primaryButton: { flex: 1, backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems: 'center', marginLeft: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { flex: 1, backgroundColor: '#E6EEF8', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  secondaryButtonText: { color: '#2563EB', fontWeight: '700' },
  button: { marginTop: 30, backgroundColor: '#2563EB', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
})
