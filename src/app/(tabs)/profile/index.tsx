import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { sendEmailVerification, signOut, updateProfile } from "firebase/auth";
import { get, ref } from "firebase/database";
import { httpsCallable } from "firebase/functions"; // 1. Import callable
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Ensure 'functions' is exported from your config
import { auth, db, functions, storage } from "../../../firebase/firebaseConfig";

export default function ProfileSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // User Data State
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  // Status Modal State (For Alerts)
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState({ 
    title: "", 
    message: "", 
    icon: "" as any,
    isError: false 
  });

  // Personal Email OTP Modal State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Image Upload State
  const [imageUploading, setImageUploading] = useState(false);

  // Logout State
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.reload();

          let dbName = null;
          let personalEmail = null;
          let personalEmailVerified = false;

          try {
            const professorRef = ref(db, `professors/${currentUser.uid}`);
            const snapshot = await get(professorRef);
            if (snapshot.exists()) {
              const data = snapshot.val();
              dbName = data.name;
              personalEmail = data.personalEmail;
              personalEmailVerified = data.personalEmailVerified || false;
            }
          } catch (error) {
            console.log("Error fetching DB data:", error);
          }

          setUser({
            name: dbName || currentUser.displayName || "No Name Set",
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
            personalEmail: personalEmail,
            personalEmailVerified: personalEmailVerified, // Added this
            photoURL: currentUser.photoURL || "https://i.imgur.com/4YQZ6uM.png",
          });
        }
        setLoading(false);
      };

      fetchData();
    }, [])
  );

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setImageUploading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = storageRef(storage, `professors/${currentUser.uid}/profile.jpg`);

      await uploadBytes(fileRef, blob);
      const downloadUrl = await getDownloadURL(fileRef);
      await updateProfile(currentUser, { photoURL: downloadUrl });

      setUser((prev: any) => ({ ...prev, photoURL: downloadUrl }));
      Alert.alert("Success", "Profile photo updated!");
    } catch (error: any) {
      Alert.alert("Upload Failed", error.message);
    } finally {
      setImageUploading(false);
    }
  };

  // --- PRIMARY EMAIL VERIFICATION (Firebase Auth) ---
  const handleVerifyEmail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      setVerifying(true);
      await currentUser.reload();

      if (currentUser.emailVerified) {
        showStatusModal("Already Verified", "Your email address is already verified.", "checkmark-circle-outline", false);
        return;
      }

      await sendEmailVerification(currentUser, {
        url: Platform.OS === "web" ? window.location.origin : "https://handwritten-ai-system.firebaseapp.com",
        handleCodeInApp: false,
      });

      showStatusModal(
        "Verification Sent",
        `A verification link has been sent to ${currentUser.email}. Please check your inbox and spam folder.`,
        "mail-unread-outline",
        false
      );

    } catch (error: any) {
      let msg = "Failed to send verification email.";
      if (error.code === "auth/too-many-requests") msg = "Too many attempts. Please wait a few minutes.";
      showStatusModal("Verification Error", msg, "alert-circle-outline", true);
    } finally {
      setVerifying(false);
    }
  };

  // --- PERSONAL EMAIL VERIFICATION FLOW ---
  
  // 1. Send OTP
  const handleVerifyPersonalEmail = async () => {
    if (!user?.personalEmail) return;
    setVerifying(true);

    try {
      const sendOtpFn = httpsCallable(functions, 'sendOtpEmail');
      await sendOtpFn({ email: user.personalEmail });

      // Open the input modal
      setOtpInput("");
      setOtpModalVisible(true);
      
    } catch (error: any) {
      console.error(error);
      showStatusModal("Error", "Failed to send OTP. Try again later.", "alert-circle-outline", true);
    } finally {
      setVerifying(false);
    }
  };

  // 2. Submit OTP
  const handleSubmitOtp = async () => {
    if (otpInput.length < 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code.");
      return;
    }
    setOtpLoading(true);

    try {
      const verifyFn = httpsCallable(functions, 'verifyPersonalEmail');
      await verifyFn({ 
        email: user.personalEmail, 
        otp: otpInput 
      });

      // Success! Update local state and close modal
      setOtpModalVisible(false);
      setUser((prev: any) => ({ ...prev, personalEmailVerified: true }));
      showStatusModal("Success", "Personal email has been verified successfully!", "checkmark-circle-outline", false);

    } catch (error: any) {
      console.error(error);
      Alert.alert("Verification Failed", error.message || "Invalid code.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Helper for Status Modal
  const showStatusModal = (title: string, message: string, icon: any, isError: boolean) => {
    setVerifyStatus({ title, message, icon, isError });
    setVerifyModalVisible(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      setLogoutModalVisible(false);
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Failed to logout.");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1b8a50" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>Profile & Settings</Text>

      <View style={styles.avatarContainer}>
        <Image source={{ uri: user?.photoURL }} style={styles.profileImage} />
        {imageUploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
        <TouchableOpacity style={styles.editIconContainer} onPress={handlePickImage} disabled={imageUploading}>
          <Ionicons name="camera" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Information</Text>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile/edit-name" as any)}>
            <Ionicons name="create-outline" size={20} color="#1b8a50" />
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 10 }}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Security</Text>
        <TouchableOpacity style={styles.securityRow} onPress={() => router.push("/profile/change-password" as any)}>
          <Text style={styles.menuText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={18} color="#333" />
        </TouchableOpacity>

        {/* Primary Email */}
        <View style={styles.securityEmail}>
          <Text style={styles.value}>{user?.email}</Text>
          {user?.emailVerified ? (
            <Text style={styles.verified}>✓ Verified</Text>
          ) : (
            <TouchableOpacity onPress={handleVerifyEmail} disabled={verifying}>
              <Text style={styles.unverified}>
                {verifying ? "Sending..." : "⚠ Unverified (Tap to verify)"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Email */}
        {user?.personalEmail && (
          <View style={[styles.securityEmail, { marginTop: 10, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 }]}>
            <Text style={styles.label}>Personal Email:</Text>
            <Text style={styles.value}>{user.personalEmail}</Text>
            
            {/* Logic for Personal Email Verification */}
            {user.personalEmailVerified ? (
              <Text style={styles.verified}>✓ Verified</Text>
            ) : (
              <TouchableOpacity onPress={handleVerifyPersonalEmail} disabled={verifying}>
                <Text style={styles.unverified}>
                  {verifying ? "Sending..." : "⚠ Unverified (Tap to verify)"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.addEmailBtn} onPress={() => router.push("/profile/add-email" as any)}>
          <Text style={styles.addEmailText}>{user?.personalEmail ? "Update personal email" : "+ Add personal email"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutModalVisible(true)}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* --- LOGOUT MODAL --- */}
      <Modal animationType="fade" transparent visible={logoutModalVisible} onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalText}>Are you sure you want to log out?</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setLogoutModalVisible(false)} disabled={loggingOut}>
                <Text style={styles.textCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonConfirm]} onPress={confirmLogout} disabled={loggingOut}>
                {loggingOut ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.textConfirm}>Logout</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- STATUS POPUP --- */}
      <Modal animationType="fade" transparent visible={verifyModalVisible} onRequestClose={() => setVerifyModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Ionicons name={verifyStatus.icon} size={45} color={verifyStatus.isError ? "#cc1b1b" : "#1b8a50"} style={{ marginBottom: 15 }} />
            <Text style={[styles.modalTitle, { color: verifyStatus.isError ? "#cc1b1b" : "#333" }]}>{verifyStatus.title}</Text>
            <Text style={styles.modalText}>{verifyStatus.message}</Text>
            <TouchableOpacity style={[styles.button, { backgroundColor: verifyStatus.isError ? "#cc1b1b" : "#1b8a50", width: '100%' }]} onPress={() => setVerifyModalVisible(false)}>
              <Text style={styles.textConfirm}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- OTP INPUT MODAL --- */}
      <Modal animationType="fade" transparent visible={otpModalVisible} onRequestClose={() => setOtpModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Enter Verification Code</Text>
            <Text style={styles.modalText}>Enter the 6-digit code sent to {user?.personalEmail}</Text>
            
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={otpInput}
              onChangeText={setOtpInput}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setOtpModalVisible(false)}>
                <Text style={styles.textCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: "#1b8a50" }]} onPress={handleSubmitOtp} disabled={otpLoading}>
                {otpLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.textConfirm}>Verify</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  center: { justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", color: "#1b8a50", marginBottom: 20 },
  avatarContainer: { alignSelf: "center", marginBottom: 10, position: 'relative' },
  profileImage: { width: 110, height: 110, borderRadius: 55, backgroundColor: "#eee" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  editIconContainer: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#1b8a50", width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  card: { backgroundColor: "#fff", padding: 18, borderRadius: 12, marginTop: 10, elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, borderWidth: 1, borderColor: "#f2f2f2" },
  cardTitle: { fontWeight: "700", fontSize: 15, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 13, color: "#666" },
  menuText: { fontSize: 14, color: "#333", fontWeight: "500" },
  value: { fontSize: 14, fontWeight: "600" },
  verified: { color: "green", marginTop: 5, fontWeight: "600" },
  unverified: { color: "#e67e22", marginTop: 5, fontWeight: "600", textDecorationLine: 'underline' },
  securityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee", marginBottom: 10 },
  securityEmail: { marginTop: 3 },
  addEmailBtn: { marginTop: 10, borderWidth: 1, borderColor: "#139f60", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  addEmailText: { color: "#139f60", fontWeight: "600" },
  logoutBtn: { backgroundColor: "#cc1b1b", marginTop: 15, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalView: { width: '85%', backgroundColor: 'white', borderRadius: 15, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  modalText: { marginBottom: 25, textAlign: 'center', color: '#666', fontSize: 15, lineHeight: 20 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  button: { borderRadius: 10, paddingVertical: 12, width: '45%', alignItems: 'center', justifyContent: 'center' },
  buttonCancel: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e0e0e0' },
  buttonConfirm: { backgroundColor: '#cc1b1b' },
  textCancel: { color: '#333', fontWeight: '600' },
  textConfirm: { color: 'white', fontWeight: '600' },
  // OTP Input Style
  otpInput: {
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 25,
    fontSize: 22,
    color: '#333',
    textAlign: 'center',
    letterSpacing: 8,
    width: '100%'
  },
});