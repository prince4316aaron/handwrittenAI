import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { httpsCallable } from "firebase/functions"; // 1. Import callable
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
import { functions } from "../../firebase/firebaseConfig"; // 2. Import functions

export default function ForgotPass() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    isError: false,
    icon: "mail-unread-outline" as any
  });

  const handleSendOtp = async () => {
    if (!email) {
      setModalContent({
        title: "Missing Email",
        message: "Please enter your university email address.",
        isError: true,
        icon: "alert-circle-outline"
      });
      setModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      // 3. Call the Cloud Function
      const sendOtpFn = httpsCallable(functions, 'sendOtpEmail');
      await sendOtpFn({ email });

      // 4. Success handling
      setModalContent({
        title: "OTP Sent",
        message: `We sent a 6-digit code to ${email}. Check your inbox and spam folder.`,
        isError: false,
        icon: "mail-unread-outline"
      });
      setModalVisible(true);

    } catch (error: any) {
      console.error(error);
      setModalContent({
        title: "Error",
        message: error.message || "Failed to send OTP.",
        isError: true,
        icon: "alert-circle-outline"
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    // If success, navigate to OTP screen
    if (!modalContent.isError) {
      router.push({
        pathname: "/(auth)/otp",
        params: { email } // Pass email to next screen
      });
    }
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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive a verification code.</Text>

          <TextInput 
            style={styles.input} 
            placeholder="University Email Address" 
            placeholderTextColor="#888" 
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
               <ActivityIndicator size="small" color="#000" />
            ) : (
               <Text style={styles.buttonText}>Send Code</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* --- MODAL --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
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
                onPress={handleCloseModal}
              >
                <Text style={styles.modalButtonText}>
                  {modalContent.isError ? "Try Again" : "Enter Code"}
                </Text>
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
  header: { paddingHorizontal: 20, paddingTop: 10, justifyContent: 'flex-start' },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 30, paddingBottom: 100 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 5 },
  title: { fontSize: 28, color: "#fff", fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#e0e0e0", textAlign: "center", marginBottom: 40 },
  input: { backgroundColor: "#DCFCE7", borderRadius: 8, paddingHorizontal: 15, paddingVertical: 14, marginBottom: 20, fontSize: 14, color: '#333' },
  button: { backgroundColor: "#DCFCE7", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, alignItems: "center", alignSelf: "flex-end", minWidth: 100 },
  buttonText: { color: "#000", fontWeight: "bold", fontSize: 14 },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalView: { width: '85%', backgroundColor: 'white', borderRadius: 15, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalText: { marginBottom: 25, textAlign: 'center', color: '#666', fontSize: 15, lineHeight: 20 },
  modalButton: { borderRadius: 10, paddingVertical: 12, width: '100%', alignItems: 'center', justifyContent: 'center' },
  modalButtonText: { color: 'white', fontWeight: 'bold' },
});