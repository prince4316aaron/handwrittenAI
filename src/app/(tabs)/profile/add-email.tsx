import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// FIREBASE IMPORTS
import { ref, update } from "firebase/database";
import { auth, db } from "../../../firebase/firebaseConfig";

export default function AddEmail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // 1. Basic Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);

      // 2. Save to Realtime Database
      // Path: professors/{uid}/personalEmail
      const professorRef = ref(db, `professors/${user.uid}`);
      await update(professorRef, {
        personalEmail: email.trim()
      });

      // 3. Navigate to Success Screen
      router.replace({
        pathname: "/profile/add-email-success",
        params: { email: email.trim() }
      });

    } catch (error: any) {
      Alert.alert("Error", "Failed to add email: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Add personal email</Text>

      <Text style={styles.subtitle}>
        Enter your personal email to store it{"\n"}as a secondary contact method.
      </Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. jane.doe@gmail.com"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity 
          style={styles.cancelBtn} 
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sendBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.sendText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  backBtn: { alignSelf: 'flex-start' },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1b8a50",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: 30,
    fontSize: 14,
  },
  label: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#333"
  },
  input: {
    borderWidth: 1,
    borderColor: "#1b8a50",
    borderRadius: 8,
    padding: 12,
    marginBottom: 30,
    fontSize: 16
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelBtn: {
    width: "45%",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  sendBtn: {
    width: "45%",
    backgroundColor: "#1b8a50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  sendText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});