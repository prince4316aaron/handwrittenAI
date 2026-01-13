import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from 'expo-document-picker';

// 🔹 IMPORTS
import { auth } from "../../../firebase/firebaseConfig";
import { createClass } from "../../../services/class.service";
import { extractStudentNames, ExtractedStudent } from "../../../services/ai.service"; // Import the Interface

const YEARS = ["A.Y. 2025 - 2026", "A.Y. 2026 - 2027", "A.Y. 2027 - 2028"];
const SWATCHES = [
  "#BB73E0", "#EE89B0", "#AFC1FF", "#07C86F",
  "#F4F7C3", "#E9C7F0", "#CFF2FF", "#DFF0C7",
  "#FDE3E8", "#C39FE7", "#D9A9D5", "#F6D8B2",
  "#D7F2D9", "#BBE8FF", "#F7E5FF", "#FFD4E0",
];

export default function AddClass() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [year, setYear] = useState(YEARS[0]);
  const [theme, setTheme] = useState<string>(SWATCHES[0]);
  
  const [themeModal, setThemeModal] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  
  // 🔹 Loading States
  const [loading, setLoading] = useState(false);
  const [uploadingMasterlist, setUploadingMasterlist] = useState(false);
  
  // 🔹 CHANGED: Now holds Objects { name, id }, not just strings
  const [studentList, setStudentList] = useState<ExtractedStudent[]>([]);


// 🔹 Function to Handle Masterlist Upload
// 🔹 Function to Handle Masterlist Upload
  const handleUploadMasterlist = async () => {
    try {
      console.log("📂 Opening Document Picker...");
      const result = await DocumentPicker.getDocumentAsync({ 
        type: ['application/pdf', 'image/*']
      });
  
      if (result.canceled) {
        console.log("❌ Picker Canceled");
        return;
      }
      
      setUploadingMasterlist(true);
      const fileAsset = result.assets[0];
      console.log("🚀 Uploading file to AI:", fileAsset.name);
  
      // 1. Call AI Service
      const students = await extractStudentNames(fileAsset);
      console.log("📩 RAW AI RESPONSE:", JSON.stringify(students, null, 2)); 
      
      if (!students || students.length === 0) {
        Alert.alert("Error", "Invalid master list no student ID");
        setUploadingMasterlist(false);
        return;
      }

      // 2. STRICT VALIDATION
      // Rule: Valid ID must be > 3 chars AND contain at least one number (0-9)
      const validStudents = students.filter(s => {
          if (!s.id) return false;
          
          const idStr = String(s.id).trim();
          const hasNumber = /\d/.test(idStr); // Checks if it contains a digit 0-9
          
          // Filter out garbage like "null", "pending", "Student ID", "No ID"
          const isGarbage = ["null", "pending", "n/a", "no id", "student id", "id"].includes(idStr.toLowerCase());

          return idStr.length > 3 && hasNumber && !isGarbage;
      });

      console.log(`✅ Validated: ${validStudents.length} / ${students.length} students have real IDs.`);

      if (validStudents.length === 0) {
          // ❌ FAILURE: AI found names, but no valid IDs
          console.log("❌ REJECTED: No valid IDs found.");
          Alert.alert("Error", "Invalid master list no student ID");
          setStudentList([]); 
      } else {
          // ✅ SUCCESS
          setStudentList(students); // We save the full list, but we validated it exists
          Alert.alert("Success", `✅ AI Found ${validStudents.length} students with valid IDs.`);
      }
  
    } catch (error: any) {
      console.error("❌ UPLOAD ERROR:", error);
      Alert.alert("Error", "Failed to process masterlist. Ensure AI server is running.");
    } finally {
      setUploadingMasterlist(false);
    }
  };

  async function onCreate() {
    if (!name || !section) {
      Alert.alert("Missing Info", "Please fill in class name and section.");
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
        Alert.alert("Error", "You must be logged in.");
        return;
    }

    try {
      setLoading(true);
      
      // 🔹 Create Class with Student List (Objects)
      const newClassId = await createClass(uid, {
        className: name,
        section: section,
        semester: year,
        themeColor: theme,
        studentList: studentList, // <--- Passes the objects with IDs
      });

      router.replace({
        pathname: "/(tabs)/classes/classinformation",
        params: {
            classId: newClassId,
            name: name,
            section: section,
            color: theme,
            academicYear: year,
        },
    });
      
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <LinearGradient colors={["#00b679", "#009e60"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, {paddingTop: insets.top + 20}]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Class</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Class Details</Text>

        <TextInput style={styles.input} placeholder="Class Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Section" value={section} onChangeText={setSection} />

        <Pressable style={styles.selectInput} onPress={() => setYearOpen(prev => !prev)}>
          <Text style={{ color: year ? "#222" : "#999" }}>{year}</Text>
          <Ionicons name="chevron-down" size={18} color="#666" />
        </Pressable>

        {yearOpen &&
          YEARS.map(y => (
            <Pressable key={y} style={styles.yearOption} onPress={() => { setYear(y); setYearOpen(false); }}>
              <Text>{y}</Text>
            </Pressable>
          ))}

        {/* 🔹 MASTERLIST UPLOAD SECTION */}
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Student Masterlist (Optional)</Text>
        
        <TouchableOpacity 
          style={styles.uploadBtn} 
          onPress={handleUploadMasterlist}
          disabled={uploadingMasterlist}
        >
           {uploadingMasterlist ? (
             <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.uploadText}>Scanning...</Text>
             </View>
           ) : (
             <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Ionicons name="document-text-outline" size={20} color="#fff" />
                <Text style={styles.uploadText}>
                  {studentList.length > 0 
                    ? `✅ ${studentList.length} Students Loaded` 
                    : "Upload PDF / Image List"}
                </Text>
             </View>
           )}
        </TouchableOpacity>
        
        {studentList.length > 0 && (
           <Text style={{color: 'gray', fontSize: 12, marginTop: 5, marginLeft: 5}}>
             Names & IDs extracted successfully. They will be saved when you click Create.
           </Text>
        )}


        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Choose class theme:</Text>

        <View style={styles.swatchRow}>
          {SWATCHES.slice(0, 5).map(s => (
            <TouchableOpacity key={s} style={[styles.swatch, { backgroundColor: s, borderWidth: theme === s ? 3 : 0 }]} onPress={() => setTheme(s)} />
          ))}
          <TouchableOpacity style={styles.selectThemeBtn} onPress={() => setThemeModal(true)}>
            <Ionicons name="color-palette-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.createBtn, loading && { opacity: 0.7 }]} 
          onPress={onCreate}
          disabled={loading}
        >
          <Text style={styles.createText}>{loading ? "Creating..." : "Create Class"}</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* THEME MODAL */}
       <Modal visible={themeModal} animationType="slide">
         <View style={{flex: 1}}>
          <LinearGradient colors={["#0EA47A", "#17C08A"]} style={{padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity onPress={() => setThemeModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15}}>Select Theme</Text>
          </LinearGradient>
          <ScrollView contentContainerStyle={styles.themeGrid}>
              {SWATCHES.map(s => (
                <TouchableOpacity 
                 key={s} 
                 style={[styles.themeSwatch, {backgroundColor: s, borderWidth: theme === s ? 4 : 0, borderColor: '#333'}]}
                 onPress={() => { setTheme(s); setThemeModal(false); }}
                />
              ))}
          </ScrollView>
         </View>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 44, paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { color: "#fff", fontWeight: "700", fontSize: 18 },

  content: { padding: 18, paddingBottom: 40 },
  sectionTitle: { fontWeight: "700", color: "#0C6B45", marginBottom: 10 },

  input: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  selectInput: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  yearOption: { padding: 12, borderBottomWidth: 1, borderColor: "#f0f0f0" },

  // Upload Button Styles
  uploadBtn: {
    backgroundColor: '#6c757d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  uploadText: { color: '#fff', fontWeight: '600' },

  swatchRow: { flexDirection: "row", gap: 10, marginTop: 12, alignItems: "center" },
  swatch: { width: 44, height: 44, borderRadius: 22, marginRight: 10, borderColor: '#333' },
  selectThemeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ddd" },

  createBtn: { marginTop: 28, backgroundColor: "#09A85C", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  createText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  themeGrid: { padding: 20, flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  themeSwatch: { width: "22%", aspectRatio: 1, borderRadius: 999, marginBottom: 12 },
});