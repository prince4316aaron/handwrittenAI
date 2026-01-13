import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert, // <--- Add Alert
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth } from "../../../firebase/firebaseConfig";
import { updateClass } from "../../../services/class.service"; // <--- Import Service

const YEARS = ["A.Y. 2025 - 2026", "A.Y. 2026 - 2027", "A.Y. 2027 - 2028"];
const SWATCHES = [
  "#BB73E0", "#EE89B0", "#AFC1FF", "#07C86F",
  "#F4F7C3", "#E9C7F0", "#CFF2FF", "#DFF0C7",
  "#FDE3E8", "#C39FE7", "#D9A9D5", "#F6D8B2",
  "#D7F2D9", "#BBE8FF", "#F7E5FF", "#FFD4E0",
];

export default function EditClass() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const getParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value || "";

  // 1. Get Params
  const classId = getParam(params.classId); // <--- We need the ID to update
  const [name, setName] = useState(getParam(params.name));
  const [section, setSection] = useState(getParam(params.section));
  const [year, setYear] = useState(getParam(params.academicYear) || YEARS[0]);
  const [theme, setTheme] = useState(getParam(params.color) || SWATCHES[0]);
  
  const [themeModal, setThemeModal] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSave() {
    if (!name || !section) {
      Alert.alert("Missing Info", "Please fill in class name and section.");
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid || !classId) {
        Alert.alert("Error", "User or Class not found.");
        return;
    }

    try {
        setLoading(true);

        // 2. Update Firebase
        await updateClass(uid, classId, {
            className: name,
            section: section,
            semester: year,
            themeColor: theme
        });

        // 3. Go back (ClassInfo will auto-refresh via useFocusEffect)
        router.back();

    } catch (error: any) {
        Alert.alert("Error", "Failed to update class.");
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
        <Text style={styles.headerTitle}>Edit Class</Text>
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
            onPress={onSave}
            disabled={loading}
        >
          <Text style={styles.createText}>{loading ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Theme Modal (Unchanged) */}
      <Modal visible={themeModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <LinearGradient colors={["#0EA47A", "#17C08A"]} style={styles.header}>
            <TouchableOpacity onPress={() => setThemeModal(false)}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Theme</Text>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.themeGrid}>
            {SWATCHES.map(s => (
              <TouchableOpacity key={s} style={[styles.themeSwatch, { backgroundColor: s, borderWidth: theme === s ? 3 : 0 }]} onPress={() => setTheme(s)} />
            ))}
          </ScrollView>

          <View style={{ padding: 20 }}>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setThemeModal(false)}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// reuse styles from add.tsx
const styles = StyleSheet.create({
  header: { paddingTop: 44, paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { color: "#fff", fontWeight: "700", fontSize: 18 },
  content: { padding: 18, paddingBottom: 40 },
  sectionTitle: { fontWeight: "700", color: "#0C6B45", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#e6e6e6", borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: "#fff" },
  selectInput: { borderWidth: 1, borderColor: "#e6e6e6", borderRadius: 8, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  yearOption: { padding: 12, borderBottomWidth: 1, borderColor: "#f0f0f0" },
  swatchRow: { flexDirection: "row", gap: 10, marginTop: 12, alignItems: "center" },
  swatch: { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
  selectThemeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ddd" },
  createBtn: { marginTop: 28, backgroundColor: "#09A85C", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  createText: { color: "#fff", fontWeight: "800" },
  themeGrid: { padding: 20, flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  themeSwatch: { width: "22%", aspectRatio: 1, borderRadius: 999, marginBottom: 12 },
  saveBtn: { backgroundColor: "#09A85C", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "700" },
});
