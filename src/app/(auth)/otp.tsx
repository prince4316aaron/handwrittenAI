import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function OTP() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");

  const handleVerify = () => {
    if (!otp || otp.length < 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code sent to your email.");
      return;
    }
    // Navigate to NewPassword, passing Email AND OTP
    router.push({
      pathname: "/(auth)/newpass",
      params: { email, otp }
    });
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
          <Text style={styles.title}>Enter Code</Text>
          <Text style={styles.subtitle}>We sent a code to {email}</Text>

          <TextInput 
            style={styles.input} 
            placeholder="Enter 6-digit Code" 
            placeholderTextColor="#888"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />

          <TouchableOpacity style={styles.button} onPress={handleVerify}>
            <Text style={styles.buttonText}>Verify</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 30, paddingBottom: 100 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 5 },
  title: { fontSize: 28, color: "#fff", fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#e0e0e0", textAlign: "center", marginBottom: 40 },
  input: { backgroundColor: "#DCFCE7", borderRadius: 8, paddingHorizontal: 15, paddingVertical: 14, marginBottom: 20, fontSize: 18, color: '#333', textAlign: 'center', letterSpacing: 5 },
  button: { backgroundColor: "#DCFCE7", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, alignItems: "center", alignSelf: "center", minWidth: 150 },
  buttonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
});