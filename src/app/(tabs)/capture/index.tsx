import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// FIREBASE & SERVICES
import { auth } from "../../../firebase/firebaseConfig";
import {
  getActivities,
  getStudentsInClass,
  listenToClasses
} from "../../../services/class.service";
import { gradeExamPaper } from "../../../services/ai.service"; // <--- IMPORT AI SERVICE

type PickerType = "section" | "activity" | "name" | null;

export default function Capture() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // --- DATA STATE ---
  const [classesList, setClassesList] = useState<any[]>([]);
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);

  // --- SELECTION STATE ---
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedClassName, setSelectedClassName] = useState<string>("");

  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [selectedActivityName, setSelectedActivityName] = useState<string>("");

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [fetchingSubData, setFetchingSubData] = useState(false);
  const [processingAI, setProcessingAI] = useState(false); // <--- New State for AI Loading

  // --- UI STATE ---
  const [confirmed, setConfirmed] = useState(false);
  const [pickerType, setPickerType] = useState<PickerType>(null);
  const [pickerY, setPickerY] = useState(0);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // 1. INITIAL LOAD
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = listenToClasses(uid, (data) => {
      const list = Object.keys(data).map(key => ({
        id: key,
        name: `${data[key].className} - ${data[key].section}`
      }));
      setClassesList(list);
      
      // Handle params from other screens
      if (params.classId) {
        const found = list.find(c => c.id === params.classId);
        if (found) {
          handleSelectClass(found.id, found.name);
          // If activity passed
          if (params.activityId) {
             // We can't set name immediately because we need to fetch activities first
             // For now, simpler to just set ID and let user select or improve logic
             setSelectedActivityId(params.activityId as string);
             if (params.activityName) setSelectedActivityName(params.activityName as string);
          }
          if (params.studentId) {
             setSelectedStudentId(params.studentId as string);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. FETCH SUB-DATA
  const handleSelectClass = async (classId: string, className: string) => {
    setSelectedClassId(classId);
    setSelectedClassName(className);
    setPickerType(null);

    setActivitiesList([]);
    setStudentsList([]);
    setSelectedActivityName("");
    setSelectedStudentName("");
    setFetchingSubData(true);

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const activities = await getActivities(uid, classId);
      setActivitiesList(activities);

      const students = await getStudentsInClass(uid, classId);
      setStudentsList(students);
    } catch (error) {
      console.error("Error fetching class data:", error);
    } finally {
      setFetchingSubData(false);
    }
  };

  const handleSelectActivity = (id: string, name: string) => {
    setSelectedActivityId(id);
    setSelectedActivityName(name);
    setPickerType(null);
  };

  const handleSelectStudent = (id: string, name: string) => {
    setSelectedStudentId(id);
    setSelectedStudentName(name);
    setPickerType(null);
  };

  // ---- IMAGE LOGIC ----
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "We need access to your gallery.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, // Optimized for AI upload
      allowsEditing: true, // Let user crop to the answer
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (!selectedClassId || !selectedActivityId || !selectedStudentId) {
        Alert.alert("Missing Fields", "Please select Section, Activity, and Name.");
        return;
    }
    setConfirmed(true);
  };

  // ---- 🚀 AI SCORING FUNCTION ----
  const handleProcessScore = async () => {
    if (!imageUri) return;

    try {
      setProcessingAI(true);

      // 1. Call the AI Service
      // Note: We use a generic rubric here, or you could fetch the activity description if you saved it
      const rubric = `Activity: ${selectedActivityName}. Grade strictly but fairly.`;
      
      const result = await gradeExamPaper(imageUri, rubric);

      // 2. Navigate to Result Screen with Data
      router.push({
        pathname: "/capture/result", // Ensure this file exists!
        params: {
          score: result.score,
          feedback: result.feedback,
          text: result.transcribed_text,
          studentId: selectedStudentId,
          activityId: selectedActivityId,
          classId: selectedClassId,
          studentName: selectedStudentName, // Pass name for display
          activityName: selectedActivityName
        }
      });

    } catch (error: any) {
      Alert.alert("Grading Failed", "Could not connect to AI Server. Check your Colab URL.");
      console.error(error);
    } finally {
      setProcessingAI(false);
    }
  };

  // Helper for picker
  const getPickerOptions = () => {
    if (pickerType === "section") return classesList.map(c => ({ id: c.id, label: c.name }));
    if (pickerType === "activity") return activitiesList.map(a => ({ id: a.id, label: a.title }));
    if (pickerType === "name") return studentsList.map(s => ({ id: s.id, label: s.name }));
    return [];
  };

  const handlePickerSelect = (id: string, label: string) => {
    if (pickerType === "section") handleSelectClass(id, label);
    if (pickerType === "activity") handleSelectActivity(id, label);
    if (pickerType === "name") handleSelectStudent(id, label);
  };

  return (
    <View style={styles.page}>
      {/* HEADER */}
      <LinearGradient colors={["#00b679", "#009e60"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}  style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Scorer</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        
        {loading ? (
           <ActivityIndicator size="large" color="#00b679" style={{marginTop: 50}} />
        ) : (
          <>
            {/* FIELDS */}
            {!confirmed ? (
              <>
                {/* SECTION */}
                <Text style={styles.label}>Section:</Text>
                <Pressable style={styles.dropdownBtn} onPress={(e) => { setPickerY(e.nativeEvent.pageY); setPickerType("section"); }}>
                  <Text style={!selectedClassName && {color: "#999"}}>{selectedClassName || "Select Section"}</Text>
                  <Ionicons name="chevron-down" size={20} color="#555" />
                </Pressable>

                {/* ACTIVITY */}
                <Text style={styles.label}>Activity:</Text>
                <Pressable 
                  style={[styles.dropdownBtn, !selectedClassId && { opacity: 0.5, backgroundColor: "#f9f9f9" }]}
                  disabled={!selectedClassId}
                  onPress={(e) => { setPickerY(e.nativeEvent.pageY); setPickerType("activity"); }}
                >
                  <Text style={!selectedActivityName && {color: "#999"}}>{fetchingSubData ? "Loading..." : selectedActivityName || "Select Activity"}</Text>
                  <Ionicons name="chevron-down" size={20} color="#555" />
                </Pressable>

                {/* NAME */}
                <Text style={styles.label}>Student Name:</Text>
                <Pressable 
                  style={[styles.dropdownBtn, !selectedClassId && { opacity: 0.5, backgroundColor: "#f9f9f9" }]}
                  disabled={!selectedClassId}
                  onPress={(e) => { setPickerY(e.nativeEvent.pageY); setPickerType("name"); }}
                >
                  <Text style={!selectedStudentName && {color: "#999"}}>{fetchingSubData ? "Loading..." : selectedStudentName || "Select Student"}</Text>
                  <Ionicons name="chevron-down" size={20} color="#555" />
                </Pressable>
              </>
            ) : (
              <>
                {/* READ-ONLY SUMMARY */}
                <View style={styles.readRow}>
                  <Text style={styles.readLabel}>Section: </Text>
                  <Text style={styles.readValue}>{selectedClassName}</Text>
                </View>
                <View style={styles.readRow}>
                  <Text style={styles.readLabel}>Activity: </Text>
                  <Text style={styles.readValue}>{selectedActivityName}</Text>
                </View>
                <View style={styles.readRow}>
                  <Text style={styles.readLabel}>Name: </Text>
                  <Text style={styles.readValue}>{selectedStudentName}</Text>
                </View>
                
                <TouchableOpacity onPress={() => setConfirmed(false)} style={{marginTop: 5}}>
                    <Text style={{color: "#01B468", fontWeight: "600", fontSize: 13}}>Edit Details</Text>
                </TouchableOpacity>
              </>
            )}

            {/* CAMERA / IMAGE BOX */}
            <View style={[styles.cameraBox, confirmed && styles.cameraBoxFocused]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <Ionicons name="camera-outline" size={120} color="#ddd" />
              )}
            </View>

            {/* NEXT BUTTON (Step 1) */}
            {!confirmed && (
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#01B468" />
              </TouchableOpacity>
            )}

            {/* ACTION BUTTONS (Step 2) */}
            {confirmed && (
              <View style={{ marginTop: 20 }}>
                {/* Take Photo - Link to your camera screen if you have one */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push({
                      pathname: "/(tabs)/capture/photo-taking",
                      params: { classId: selectedClassId, activityId: selectedActivityId, studentId: selectedStudentId }
                  })}
                >
                  <Text style={styles.actionText}>Take a picture</Text>
                </TouchableOpacity>

                {/* Upload Photo */}
                <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage} disabled={processingAI}>
                  <Text style={styles.uploadText}>Upload Image</Text>
                </TouchableOpacity>
                
                {/* PROCESS BUTTON */}
                {imageUri && (
                    <TouchableOpacity
                      style={[styles.nextBtn, { marginTop: 12, backgroundColor: "#01B468", borderWidth: 0, opacity: processingAI ? 0.7 : 1 }]}
                      onPress={handleProcessScore}
                      disabled={processingAI}
                    >
                      {processingAI ? (
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <ActivityIndicator color="#fff" />
                            <Text style={[styles.nextText, { color: "#fff" }]}>Grading...</Text>
                        </View>
                      ) : (
                        <Text style={[styles.nextText, { color: "#fff" }]}>Process Score</Text>
                      )}
                    </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* POPUP PICKER MODAL */}
      <Modal visible={pickerType !== null} transparent animationType="fade" onRequestClose={() => setPickerType(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setPickerType(null)} />
          <View style={[styles.popup, { top: pickerY + 10 }]}>
            <ScrollView style={{ maxHeight: 200 }}>
                {getPickerOptions().length === 0 ? (
                    <Text style={{padding: 15, color: "#999", textAlign: "center"}}>No items found.</Text>
                ) : (
                    getPickerOptions().map((opt) => (
                    <TouchableOpacity key={opt.id} onPress={() => handlePickerSelect(opt.id, opt.label)} style={styles.popupItem}>
                        <Text style={styles.popupItemText}>{opt.label}</Text>
                    </TouchableOpacity>
                    ))
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 18, paddingTop: 45, paddingBottom: 25, flexDirection: "row", alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", flex: 1 },
  content: { padding: 18, paddingBottom: 80 },
  label: { marginTop: 15, marginBottom: 6, fontWeight: "700", color: "#0c6b45" },
  dropdownBtn: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8, flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff" },
  readRow: { flexDirection: "row", marginTop: 8 },
  readLabel: { fontWeight: "700", color: "#000", width: 70 },
  readValue: { fontWeight: "500", color: "#333", flex: 1 },
  cameraBox: { marginTop: 25, width: "100%", height: 240, backgroundColor: "#f9f9f9", borderRadius: 12, justifyContent: "center", alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: "#eee" },
  cameraBoxFocused: { borderWidth: 2, borderColor: "#01B468", backgroundColor: "#fff" },
  previewImage: { width: "100%", height: "100%", resizeMode: "contain" },
  nextBtn: { marginTop: 25, flexDirection: "row", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: "#01B468", paddingVertical: 14, borderRadius: 10 },
  nextText: { color: "#000", fontWeight: "700", fontSize: 16 },
  actionBtn: { borderWidth: 1, borderColor: "#01B468", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginBottom: 12, backgroundColor: "#fff" },
  actionText: { color: "#01B468", fontWeight: "700" },
  uploadBtn: { backgroundColor: "#E8F7F0", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  uploadText: { color: "#006b45", fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.1)" },
  popup: { position: "absolute", left: 24, right: 24, backgroundColor: "#fff", borderRadius: 10, paddingVertical: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6 },
  popupItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  popupItemText: { fontSize: 14, color: "#333" },
});