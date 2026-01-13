import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddEmailSuccess() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get the email passed from the previous screen (or fallback)
  const email = params.email as string || "your email";

  // Optional: Auto-redirect after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)/profile");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Add personal email</Text>

      <View style={styles.circle}>
        <Ionicons name="checkmark" size={60} color="#0a8f6d" />
      </View>

      <Text style={styles.message}>
        A verification link has been sent to{"\n"}
        <Text style={{ fontWeight: "700" }}>
          {email}!
        </Text>
      </Text>

      <TouchableOpacity 
        style={styles.doneBtn} 
        onPress={() => router.replace("/(tabs)/profile")}
      >
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#1b8a50",
    fontSize: 22,
    fontWeight: "700",
    marginTop: -50,
    marginBottom: 20,
  },
  circle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#c7f8e4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  message: {
    textAlign: "center",
    fontSize: 15,
    marginBottom: 40,
    color: "#444",
    lineHeight: 22,
  },
  doneBtn: {
    backgroundColor: "#06b06f",
    paddingVertical: 12,
    width: "50%",
    borderRadius: 8,
  },
  doneText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
