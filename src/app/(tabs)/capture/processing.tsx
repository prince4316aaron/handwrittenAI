// app/(tabs)/capture/processing.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Fake analyzed score – you can replace these later
      router.replace({
        pathname: "/capture/result",
        params: {
          uris: params.uris,
          score: "27",
          total: "30",
          mcScore: "9",
          mcTotal: "10",
          essayScore: "18",
          essayTotal: "20",
        },
      });
    }, 2000); // 2s fake processing

    return () => clearTimeout(timer);
  }, [params.uris, router]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#00b679", "#009e60"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}  style={[styles.header, {paddingTop: insets.top + 20}]}>
        <Text style={styles.headerTitle}>AI scorer</Text>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.title}>Processing</Text>
        <Text style={styles.subtitle}>
          Please wait while the test paper is being analyzed
        </Text>

        <ActivityIndicator size="large" color="#00b679" style={{ marginTop: 20 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 18,
    paddingTop: 45,
    paddingBottom: 25,
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", flex: 1 },

  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
});
