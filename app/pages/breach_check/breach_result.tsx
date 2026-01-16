import { clearLastBreachResult, getLastBreachResult } from '@/services/storage/breachStore'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function BreachResult() {
  const [data, setData] = useState<{ risk?: string; score?: number; reason?: string; content?: string } | null>(null)

  useEffect(() => {
    const last = getLastBreachResult()
    if (last) {
      setData(last)
      clearLastBreachResult()
    } else {
      setData(null)
    }
  }, [])

  const maskContent = (c?: string) => {
    if (!c) return ''
    if (c.toString().includes('Password (hidden')) return c
    const s = c.toString().trim()
    const take = Math.min(3, s.length)
    return s.slice(0, take) + '***'
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
      <Text style={styles.header}>Breach Check Result</Text>

      <View style={styles.resultBox}>
        <Text style={styles.label}>Risk Level:</Text>
        <Text style={[styles.value, { color: risk === 'HIGH' ? '#FF4D4F' : risk === 'MEDIUM' ? '#FFA940' : '#2ECC71' }]}>
          {risk}
        </Text>

        <Text style={styles.label}>Safety Score:</Text>
        <Text style={styles.value}>{score}%</Text>

        <Text style={styles.label}>Conclusion:</Text>
        <Text style={styles.reasonText}>{reason}</Text>

        <Text style={styles.label}>Queried:</Text>
        <Text style={styles.contentPreview}>{maskContent(content)}</Text>
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
  button: { marginTop: 30, backgroundColor: '#2563EB', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
})