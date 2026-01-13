// app/(tabs)/capture/result.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🔹 IMPORTS FOR LOGIC
import { auth } from "../../../firebase/firebaseConfig";
import { saveStudentScore } from "../../../services/class.service";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // 🔹 1. SAFELY READ PARAMS (From AI)
  const getParam = (p: any, fb: string) => Array.isArray(p) ? p[0] : p || fb;

  const score = Number(getParam(params.score, "0"));
  const feedback = getParam(params.feedback, "No feedback provided.");
  const studentName = getParam(params.studentName, "Student");
  
  // IDs needed for saving
  const classId = getParam(params.classId, "");
  const activityId = getParam(params.activityId, "");
  const studentId = getParam(params.studentId, "");

  const [saving, setSaving] = useState(false);

  // 🔹 2. SAVE FUNCTION
  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
        Alert.alert("Error", "You are not logged in.");
        return;
    }

    try {
      setSaving(true);
      
      // Save to Firebase
      await saveStudentScore(uid, classId, studentId, activityId, {
        score: score,
        feedback: feedback,
        gradedAt: new Date().toISOString()
      });

      // Navigate back or to a success screen
      Alert.alert("Success", "Score saved to database!", [
        { text: "OK", onPress: () => router.dismissAll() }
      ]);

    } catch (error) {
      Alert.alert("Error", "Failed to save score.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={["#00b679", "#009e60"]}  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}  style={[styles.header, {paddingTop: insets.top + 20}]}>
        <TouchableOpacity onPress={() => router.back()} style={{marginRight: 15}}>
           <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Scorer</Text>
      </LinearGradient>

      {/* MAIN CONTENT */}
      <ScrollView contentContainerStyle={styles.centerContent}>
        
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>

        <Text style={styles.title}>Analysis Complete</Text>
        <Text style={styles.studentName}>{studentName}</Text>
        
        <Text style={styles.scoreText}>
          Score: <Text style={styles.scoreBold}>{score}</Text> / 100
        </Text>

        {/* Breakdown Card */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>AI Analysis:</Text>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Calculated Score</Text>
            <Text style={styles.breakdownValue}>{score}</Text>
          </View>
          
          <View style={styles.separator} />

          <Text style={[styles.breakdownLabel, {marginTop: 10, marginBottom: 5}]}>Feedback:</Text>
          <Text style={styles.feedbackText}>"{feedback}"</Text>
        </View>

      </ScrollView>

      {/* BOTTOM BUTTON */}
      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && {opacity: 0.7}]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
             <ActivityIndicator color="#000" />
          ) : (
             <Text style={styles.saveText}>Save Score to Class</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const GREEN = "#00b679";

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

  /* CENTER CONTENT */
  centerContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
  },

  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#00b679", shadowOpacity: 0.4, shadowRadius: 10, elevation: 10
  },

  title: { fontSize: 22, fontWeight: "800", marginBottom: 5, color: "#333" },
  studentName: { fontSize: 16, color: "#666", marginBottom: 15 },

  scoreText: { fontSize: 18, color: "#444", marginBottom: 30, textAlign: "center" },
  scoreBold: { fontWeight: "900", color: GREEN, fontSize: 24 },

  breakdownCard: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  breakdownTitle: { fontWeight: "700", marginBottom: 15, color: "#333", fontSize: 16 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  breakdownLabel: { color: "#555", fontSize: 14, fontWeight: "500" },
  breakdownValue: { fontWeight: "700", color: "#222", fontSize: 16 },
  
  separator: { height: 1, backgroundColor: "#eee", marginVertical: 10 },
  feedbackText: { color: "#555", fontStyle: "italic", lineHeight: 22 },

  /* BOTTOM BUTTON */
  bottomArea: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10 },
  saveBtn: {
    backgroundColor: "#CCFFE1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  saveText: { color: "#00b679", fontWeight: "800", fontSize: 16 },
});