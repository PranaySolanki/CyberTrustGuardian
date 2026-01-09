import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ScanResult() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Result</Text>
      <Text style={styles.subtitle}>
        Phishing result will appear here 🚀
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563EB",
  },
  subtitle: {
    marginTop: 8,
    color: "#475569",
  },
});
