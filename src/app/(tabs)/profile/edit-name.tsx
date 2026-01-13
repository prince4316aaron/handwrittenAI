import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// FIREBASE IMPORTS
import { updateProfile } from "firebase/auth";
import { ref, update } from "firebase/database"; // Import DB functions
import { auth, db } from "../../../firebase/firebaseConfig";

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // 1. Get Current User Data
  const user = auth.currentUser;

  // 2. State for the input field
  const [name, setName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);

  // 3. Save Function
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }

    if (!user) return;

    try {
      setLoading(true);

      // A. Update Firebase Auth Profile (Standard)
      const authUpdatePromise = updateProfile(user, {
        displayName: name.trim()
      });

      // B. Update Realtime Database (The Source of Truth for your App)
      // Path: professors/{uid}/name
      const dbRef = ref(db, `professors/${user.uid}`);
      const dbUpdatePromise = update(dbRef, {
        name: name.trim()
      });

      // Wait for both to finish
      await Promise.all([authUpdatePromise, dbUpdatePromise]);

      // Success Feedback & Navigation
      router.replace("/profile/name-saved");

    } catch (error: any) {
      Alert.alert("Error", "Failed to update profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Edit Profile</Text>

      {/* Profile Image */}
      <Image
        source={{ uri: user?.photoURL || "https://i.imgur.com/4YQZ6uM.png" }}
        style={styles.profileImage}
      />

      <Text style={styles.label}>Name</Text>
      <TextInput 
        style={styles.input} 
        value={name}
        onChangeText={setName} 
        placeholder="Enter your full name"
        placeholderTextColor="#999"
      />

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, loading && { opacity: 0.7 }]}
        onPress={handleSave}
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
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: "#1b8a50",
    marginTop: 30,
    marginBottom: 15,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignSelf: "center",
    marginVertical: 20,
    backgroundColor: "#eee", 
  },
  label: { fontSize: 14, marginBottom: 8, fontWeight: "600", color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#1b8a50",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    color: "#000",
  },
  saveBtn: {
    backgroundColor: "#06b06f",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});