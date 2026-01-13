import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PasswordSaved() {
  const insets = useSafeAreaInsets();

  // Optional: Auto-redirect after 2 seconds for smoother UX
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)/profile");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.circle}>
        <Ionicons name="checkmark" size={60} color="#0a8f6d" />
      </View>

      <Text style={styles.text}>Password Saved{"\n"}Successfully!</Text>

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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
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
  text: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 60,
    color: "#333", // Added explicit color
  },
  doneBtn: {
    backgroundColor: "#ccf6dd",
    paddingVertical: 12,
    width: "60%",
    borderRadius: 10,
    elevation: 3,
  },
  doneText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#0a8f6d",
  },
});