import { clearLastPhishingResult, getLastPhishingResult } from '@/services/storage/phishingStore';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PhishingScanResult() {
  const params = useLocalSearchParams()
  const [data, setData] = useState<{ risk?: string; score?: number; reason?: string; content?: string } | null>(null)

  useEffect(() => {
    if (params.content) {
      setData({
        risk: params.risk as string,
        score: parseInt(params.score as string) || 0,
        reason: params.reason as string,
        content: params.content as string,
      })
    } else if (!data) {
      const last = getLastPhishingResult()
      if (last) {
        setData(last)
        clearLastPhishingResult()
      }
    }
  }, [params.content, params.id])

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
      <Text style={styles.header}>Scan Analysis Result</Text>

      <View style={styles.resultBox}>
        <Text style={styles.label}>Risk Level:</Text>
        <Text style={[styles.value, { color: risk === 'HIGH' ? 'red' : 'green' }]}>
          {risk}
        </Text>

        <Text style={styles.label}>Safety Score:</Text>
        <Text style={styles.value}>{score}%</Text>

        <Text style={styles.label}>AI Analysis Reason:</Text>
        <Text style={styles.reasonText}>{reason}</Text>

        <Text style={styles.label}>Original Content:</Text>
        <Text style={styles.contentPreview} numberOfLines={3}>{content}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.dismiss()}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
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
});