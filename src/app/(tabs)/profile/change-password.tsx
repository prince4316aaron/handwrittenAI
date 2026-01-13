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
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import { auth } from "../../../firebase/firebaseConfig"; // Adjust path if needed

export default function ChangePassword() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // 1. Input State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 2. UI State (Loading & Visibility Toggles)
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 3. Main Logic
  const handleChangePassword = async () => {
    // A. Basic Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert("Error", "User not found. Please login again.");
      return;
    }

    try {
      setLoading(true);

      // B. Re-authenticate User (Security Requirement)
      // We must prove it's really the user by checking 'currentPassword' against Firebase
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // C. Update Password
      await updatePassword(user, newPassword);

      // D. Success & Navigation
      // Assuming you create a success screen similar to name-saved
      router.replace("/profile/password-saved"); 

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        Alert.alert("Error", "Incorrect current password.");
      } else {
        Alert.alert("Error", error.message);
      }
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

      <Text style={styles.title}>Change Password</Text>

      {/* Current Password */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          placeholderTextColor="#999"
          secureTextEntry={!showCurrent}
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
          <Ionicons 
            name={showCurrent ? "eye-outline" : "eye-off-outline"} 
            size={20} 
            color="#777" 
          />
        </TouchableOpacity>
      </View>

      {/* New Password */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#999"
          secureTextEntry={!showNew}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity onPress={() => setShowNew(!showNew)}>
          <Ionicons 
            name={showNew ? "eye-outline" : "eye-off-outline"} 
            size={20} 
            color="#777" 
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
          <Ionicons 
            name={showConfirm ? "eye-outline" : "eye-off-outline"} 
            size={20} 
            color="#777" 
          />
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, loading && { opacity: 0.7 }]}
        onPress={handleChangePassword}
        disabled={loading}
      >
        {loading ? (
           <ActivityIndicator color="#fff" />
        ) : (
           <Text style={styles.saveText}>Save</Text>
        )}
      </TouchableOpacity>
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
    marginTop: 10,
    marginBottom: 30,
  },
  inputRow: {
    borderWidth: 1,
    borderColor: "#1b8a50",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: "#000" },
  saveBtn: {
    backgroundColor: "#06b06f",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center'
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});