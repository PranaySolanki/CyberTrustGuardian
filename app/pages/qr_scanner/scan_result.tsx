import { useTheme } from '@/context/ThemeContext'
import { clearLastQrResult, getLastQrResult, QRResult } from '@/services/storage/qrStore'
import * as Clipboard from 'expo-clipboard'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function ScanResult() {
  const { colors } = useTheme();
  const params = useLocalSearchParams()
  const [data, setData] = useState<QRResult | null>(null)

  useEffect(() => {
    if (params.content) {
      // Historical data from params
      setData({
        risk: params.risk as any,
        score: parseInt(params.score as string) || 0,
        reason: params.reason as string,
        content: params.content as string,
        safeBrowsingResult: params.safeBrowsingResult as string,
        geminiResult: params.geminiResult as string,
      })
    } else if (!data) {
      // Only pull from last result if we don't have data yet
      const last = getLastQrResult()
      if (last) {
        setData(last)
        clearLastQrResult()
      }
    }
  }, [params.content, params.id])

  const handleCopy = async () => {
    if (data?.content) {
      await Clipboard.setStringAsync(data.content)
      Alert.alert('Copied', 'URL copied to clipboard')
    }
  }

  const handleOpen = async () => {
    if (!data?.content) return

    // Warn user if URL is high risk
    if (data.risk === 'HIGH') {
      Alert.alert(
        'High Risk URL',
        'This URL has been flagged as HIGH RISK. Opening it may expose you to malware, phishing, or other security threats. Are you sure you want to proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Anyway',
            style: 'destructive',
            onPress: async () => {
              try {
                await Linking.openURL(data.content!)
              } catch (error) {
                Alert.alert('Error', 'Unable to open the URL')
              }
            }
          }
        ]
      )
      return
    }

    // Medium risk warning
    if (data.risk === 'MEDIUM') {
      Alert.alert(
        'Medium Risk URL',
        'This URL has some security concerns. Do you want to proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open',
            onPress: async () => {
              try {
                await Linking.openURL(data.content!)
              } catch (error) {
                Alert.alert('Error', 'Unable to open the URL')
              }
            }
          }
        ]
      )
      return
    }

    // Low risk - open directly
    try {
      await Linking.openURL(data.content)
    } catch (error) {
      Alert.alert('Error', 'Unable to open the URL')
    }
  }

  if (!data) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.header, { color: colors.textPrimary }]}>No result available</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => router.dismiss()}>
          <Text style={[styles.buttonText, { color: colors.background }]}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  const { risk, score, reason, content, safeBrowsingResult, geminiResult } = data

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.textPrimary }]}>Scan Result</Text>

      <View style={[styles.resultBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>URL:</Text>
        <Text style={[styles.contentPreview, { color: colors.textSecondary }]}>{content}</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Risk Level:</Text>
        <Text style={[styles.value, { color: risk === 'HIGH' ? colors.danger : risk === 'MEDIUM' ? '#FFA940' : colors.success }]}>
          {risk}
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Safety Score:</Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>{score}%</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Safe Browsing Result:</Text>
        <Text style={[styles.resultText, { color: safeBrowsingResult?.includes('THREATS') ? colors.danger : colors.success }]}>
          {safeBrowsingResult || 'Not available'}
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Conclusion:</Text>
        <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{geminiResult || reason}</Text>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => router.dismiss()}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  resultBox: { padding: 15, borderRadius: 12, borderWidth: 1 },
  label: { fontSize: 13, marginTop: 15, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  resultText: { fontSize: 15, lineHeight: 20, marginTop: 4, fontWeight: '500' },
  reasonText: { fontSize: 16, lineHeight: 22, marginTop: 4 },
  contentPreview: { fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  button: { marginTop: 30, padding: 15, borderRadius: 28, alignItems: 'center' },
  buttonText: { fontWeight: 'bold', fontSize: 16 }
})
