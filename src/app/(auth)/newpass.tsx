import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { httpsCallable } from "firebase/functions";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { functions } from "../../firebase/firebaseConfig";

export default function NewPassword() {
  const router = useRouter();
  // Get Email and OTP passed from previous screen
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    isError: false,
    icon: "checkmark-circle-outline" as any
  });

  const ruleText = `Passwords must contain:
• a minimum of 1 lower case letter [a-z] and
• a minimum of 1 upper case letter [A-Z] and
• a minimum of 1 numeric character [0-9] and
• a minimum of 1 special character: ~\`!@#$%^&*()-_+={}[]|\\;:"<>,./?`;

  const isValidPassword = (pass: string) => {
    const hasLower = /[a-z]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[~`!@#$%^&*()-_+={}[\]|\\;:"<>,./?]/.test(pass);
    return hasLower && hasUpper && hasNumber && hasSpecial;
  };

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      showModal("Missing Fields", "Please enter and confirm your new password.", true);
      return;
    }

    if (password !== confirmPassword) {
      showModal("Mismatch", "Passwords do not match.", true);
      return;
    }

    if (!isValidPassword(password)) {
      showModal("Weak Password", "Please follow the password rules displayed below.", true);
      return;
    }

    setLoading(true);
    try {
      // 1. Call the Cloud Function
      const resetFn = httpsCallable(functions, 'resetPasswordWithOtp');
      
      // 2. Pass all 3 required fields
      await resetFn({ 
        email, 
        otp, 
        newPassword: password 
      });
      
      showModal("Success", "Your password has been reset successfully!", false);
      
      setTimeout(() => {
        setModalVisible(false);
        router.replace("/(auth)/reset-success");
      }, 1500);

    } catch (error: any) {
      console.error(error);
      let msg = error.message || "Failed to reset password.";
      
      // Handle cloud function specific errors
      if (msg.includes("Invalid code") || msg.includes("Incorrect code")) {
        msg = "The verification code is incorrect.";
      } else if (msg.includes("Code expired")) {
        msg = "The code has expired. Please request a new one.";
      }

      showModal("Reset Failed", msg, true);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (title: string, message: string, isError: boolean) => {
    setModalContent({
      title,
      message,
      isError,
      icon: isError ? "alert-circle-outline" : "checkmark-circle-outline"
    });
    setModalVisible(true);
  };

  return (
    <LinearGradient colors={['#0EA47A', '#017EBA']} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Set New Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter New Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Text style={styles.rules}>{ruleText}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* --- CUSTOM MODAL --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Ionicons 
                name={modalContent.icon} 
                size={45} 
                color={modalContent.isError ? "#cc1b1b" : "#1b8a50"} 
                style={{ marginBottom: 15 }} 
              />
              <Text style={[styles.modalTitle, { color: modalContent.isError ? "#cc1b1b" : "#333" }]}>
                {modalContent.title}
              </Text>
              <Text style={styles.modalText}>{modalContent.message}</Text>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: modalContent.isError ? "#cc1b1b" : "#1b8a50" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 30, paddingBottom: 50 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 5 },
  title: { fontSize: 28, color: "#fff", fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  input: { backgroundColor: "#DCFCE7", borderRadius: 8, paddingHorizontal: 15, paddingVertical: 14, marginBottom: 12, fontSize: 14, color: '#333' },
  rules: { color: "#fff", fontSize: 11, marginTop: 5, marginBottom: 25, lineHeight: 18, opacity: 0.9 },
  button: { backgroundColor: "#DCFCE7", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: "center", alignSelf: "flex-end", minWidth: 150 },
  buttonText: { color: "#000", fontWeight: "bold" },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalView: { width: '85%', backgroundColor: 'white', borderRadius: 15, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalText: { marginBottom: 25, textAlign: 'center', color: '#666', fontSize: 15, lineHeight: 20 },
  modalButton: { borderRadius: 10, paddingVertical: 12, width: '100%', alignItems: 'center', justifyContent: 'center' },
  modalButtonText: { color: 'white', fontWeight: 'bold' },
});