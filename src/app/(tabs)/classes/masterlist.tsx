import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🔹 IMPORTS
import { auth } from "../../../firebase/firebaseConfig";
import { listenToStudents, saveMasterlist } from "../../../services/class.service";
import { extractStudentNames } from "../../../services/ai.service";

// Helper for params
const P = (v: any, fb = "") => (Array.isArray(v) ? v[0] : v || fb);

export default function MasterlistScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Get Class Metadata
  const classId = P(params.classId);
  const className = P(params.name, "Class");
  const section = P(params.section, "Section");
  const headerColor = P(params.color, "#00b679");

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // 1. Listen for Students (Realtime)
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !classId) return;

    // Connect to the database listener we created in class.service
    const unsubscribe = listenToStudents(uid, classId, (data) => {
      setStudents(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

// 2. Handle Upload Logic
const handleUpload = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !classId) return;

    try {
      setModalVisible(false);
      
      const result = await DocumentPicker.getDocumentAsync({ 
        type: ['application/pdf', 'image/*'] 
      });

      if (result.canceled) return;
      
      setUploading(true);
      const fileAsset = result.assets[0];

      // 1. EXTRACT DATA
      const students = await extractStudentNames(fileAsset);

      if (!students || students.length === 0) {
        Alert.alert("Failed", "AI could not read the file. Please ensure it is clear.");
        setUploading(false);
        return;
      }

      // 2. VALIDATION CHECK: Did we get IDs?
      const validStudents = students.filter(s => s.id && s.id.length > 2);
      
      if (validStudents.length === 0) {
        // ❌ REJECT: If no IDs were found, stop here.
        Alert.alert(
          "Invalid Masterlist", 
          "The AI could not detect any Student IDs in this file. Please upload a masterlist that contains both Names and Student IDs."
        );
        setUploading(false);
        return;
      }

      // 3. SAVE TO DB (Only if IDs exist)
      await saveMasterlist(uid, classId, students);
      
      Alert.alert("Success", `Added ${students.length} students with IDs!`);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong uploading the masterlist.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerColor, paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.className}>{className}</Text>
          <Text style={styles.sectionName}>{section}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Class Masterlist</Text>

        {/* Upload Button */}
        {uploading ? (
             <View style={styles.emptyStateContainer}>
                <ActivityIndicator size="large" color={headerColor} />
                <Text style={styles.uploadedLabel}>AI is extracting names...</Text>
             </View>
        ) : (
             <View>
                 <TouchableOpacity 
                   style={styles.uploadButton} 
                   onPress={() => setModalVisible(true)}
                 >
                   <Ionicons name="cloud-upload-outline" size={20} color="#000" style={{ marginRight: 6 }} />
                   <Text style={styles.uploadText}>Upload a masterlist</Text>
                 </TouchableOpacity>

                 {/* Show Empty State if no students yet */}
                 {students.length === 0 && !loading && (
                    <View style={styles.emptyStateContainer}>
                        <Ionicons name="document-outline" size={40} color="#ccc" />
                        <Text style={styles.noFileText}>No masterlist uploaded.</Text>
                    </View>
                 )}
             </View>
        )}

        {/* Student List */}
        {!uploading && students.length > 0 && (
          <>
            <Text style={[styles.uploadedLabel, {marginTop: 20}]}>
                Student List ({students.length})
            </Text>
            <FlatList 
                data={students}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item, index }) => (
                <View style={styles.fileCard}>
                    <Text style={{fontWeight: 'bold', color: '#999', marginRight: 10, width: 25}}>{index + 1}.</Text>
                    <Text style={styles.fileName}>{item.name}</Text>
                </View>
                )}
            />
          </>
        )}
      </View>

      {/* Upload Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={20} color="#2E7D32" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Upload Masterlist</Text>
            <Ionicons name="cloud-upload-outline" size={36} color="#000" style={{ marginVertical: 10 }} />
            <Text style={styles.modalText}>
                Upload a PDF or Image of the list.{"\n"}
                The AI will extract the names automatically.
            </Text>

            <TouchableOpacity style={styles.modalUploadBtn} onPress={handleUpload}>
              <Text style={styles.modalUploadText}>Select File</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 17,
    paddingHorizontal: 16,
  },
  backButton: { marginRight: 10 },
  headerTextContainer: { flexDirection: "column" },
  className: { color: "#fff", fontSize: 14, opacity: 0.8 },
  sectionName: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  
  content: { flex: 1, padding: 20 },
  sectionTitle: { color: "#01B468", fontSize: 18, fontWeight: "800", marginBottom: 16 },
  
  // Upload Styles
  uploadButton: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc",
    borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: "#fff", elevation: 2,
  },
  uploadText: { fontSize: 15, color: "#000" },
  
  // Empty State Styles
  emptyStateContainer: { marginTop: 40, alignItems: "center", justifyContent: "center", gap: 10 },
  noFileText: { color: "#999", fontSize: 14, fontStyle: "italic" },
  uploadedLabel: { fontSize: 15, color: "#000", fontWeight: "500", marginBottom: 8 },

  // List Item Styles
  fileCard: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ddd",
    borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: "#fff",
    elevation: 2, marginBottom: 8
  },
  fileName: { fontSize: 15, color: "#000", fontWeight: "600" },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "80%", backgroundColor: "#fff", borderRadius: 10, padding: 20, alignItems: "center", elevation: 5 },
  closeIcon: { position: "absolute", top: 10, right: 10 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#2E7D32" },
  modalText: { fontSize: 14, color: "#555", marginVertical: 8, textAlign: 'center' },
  modalUploadBtn: { backgroundColor: "#2E7D32", borderRadius: 6, paddingVertical: 10, paddingHorizontal: 30, marginTop: 8 },
  modalUploadText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});