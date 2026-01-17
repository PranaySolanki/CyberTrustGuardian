import { useTheme } from '@/context/ThemeContext';
import { clearLastPhishingResult, getLastPhishingResult } from '@/services/storage/phishingStore';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PhishingScanResult() {
  const { colors } = useTheme();
  const params = useLocalSearchParams()
  const [data, setData] = useState<{
    risk?: string;
    score?: number;
    reason?: string;
    content?: string;
    safeBrowsingResult?: string;
    geminiResult?: string;
  } | null>(null)

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
      <Text style={[styles.header, { color: colors.textPrimary }]}>Scan Analysis Result</Text>

      <View style={[styles.resultBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Risk Level:</Text>
        <Text style={[styles.value, { color: risk === 'HIGH' ? colors.danger : colors.success }]}>
          {risk}
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Safety Score:</Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>{score}%</Text>

        {safeBrowsingResult && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Google Safe Browsing:</Text>
            <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{safeBrowsingResult}</Text>
          </>
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>AI Analysis Reason:</Text>
        <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{geminiResult || reason}</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Original Content:</Text>
        <Text style={[styles.contentPreview, { color: colors.textSecondary }]} numberOfLines={3}>{content}</Text>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => router.dismiss()}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  resultBox: { padding: 15, borderRadius: 12, borderWidth: 1 },
  label: { fontSize: 13, marginTop: 15, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  reasonText: { fontSize: 16, lineHeight: 22, marginTop: 4 },
  contentPreview: { fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  button: { marginTop: 30, padding: 15, borderRadius: 28, alignItems: 'center' },
  buttonText: { fontWeight: 'bold', fontSize: 16 }
});
