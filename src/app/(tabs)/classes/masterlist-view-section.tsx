import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- EXPORT IMPORTS ---
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';

// Firebase imports
import { auth } from "../../../firebase/firebaseConfig";
import {
  addStudent,
  deleteStudent,
  listenToStudents,
  updateStudent
} from "../../../services/class.service";

// normalize expo-router params
const P = (v: string | string[] | undefined, fb = "") =>
  Array.isArray(v) ? v[0] : v ?? fb;

type Row = {
  id: string;
  name: string;
  studentId: string;
};

type SortKey = "NAME_ASC" | "NAME_DESC" | "ID_ASC" | "ID_DESC";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Name A-Z", value: "NAME_ASC" },
  { label: "Name Z-A", value: "NAME_DESC" },
  { label: "Student ID Ascending", value: "ID_ASC" },
  { label: "Student ID Descending", value: "ID_DESC" },
];

export default function MasterlistScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // 1. Get Params
  const classId = P(params.classId);
  const className = P(params.name, "BSCS-4B");
  const section = P(params.section, "GEM14-M");
  const headerColor = P(params.color, "#BB73E0");

  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("NAME_ASC");
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [sortPickerY, setSortPickerY] = useState(0);

  // Export UI
  const [exportOpen, setExportOpen] = useState(false);
  const [exportDone, setExportDone] = useState<null | ".CSV" | ".PDF" | ".XLSX">(null);
  const [isExporting, setIsExporting] = useState(false); // To show loading state during file generation

  // 🔹 ADD/EDIT STATE
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [studentName, setStudentName] = useState("");
  const [studentUniId, setStudentUniId] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 2. FETCH DATA
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !classId) return;

    const unsubscribe = listenToStudents(uid, classId, (data) => {
      setRows(data);
    });

    return () => unsubscribe();
  }, [classId]);

  // 🔹 FILTER + SORT
  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = rows.filter((r) => {
      if (!q) return true;
      return (
        (r.name || "").toLowerCase().includes(q) ||
        (r.studentId || "").toLowerCase().includes(q)
      );
    });

    list = [...list];

    switch (sortKey) {
      case "NAME_ASC":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "NAME_DESC":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "ID_ASC":
        list.sort((a, b) => a.studentId.localeCompare(b.studentId));
        break;
      case "ID_DESC":
        list.sort((a, b) => b.studentId.localeCompare(a.studentId));
        break;
    }

    return list;
  }, [rows, query, sortKey]);

  // 🔹 EXPORT LOGIC
  const handleExport = async (format: ".CSV" | ".PDF" | ".XLSX") => {
    try {
      if (visibleRows.length === 0) {
        Alert.alert("No Data", "There are no students to export.");
        return;
      }

      setIsExporting(true);
      const fileName = `${className}_${section}_Masterlist`;
      
      if (format === ".CSV") {
  const header = "Name,Student ID\n";
  const csvRows = visibleRows
    .map(r => `"${r.name}","${r.studentId}"`)
    .join("\n");
  const csvContent = header + csvRows;

  if (Platform.OS === "web") {
    // 🌐 WEB: Blob download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  } else {
    // 📱 MOBILE: FileSystem
    const uri = FileSystem.cacheDirectory + `${fileName}.csv`;
    await FileSystem.writeAsStringAsync(uri, csvContent);
    await Sharing.shareAsync(uri);
  }

  setExportDone(".CSV");
} else if (format === ".PDF") {

  const html = `
<html>
  <head>
    <style>
      @page {
        size: A4;
        margin: 25mm 20mm 25mm 20mm;
      }

      body {
        font-family: "Times New Roman", serif;
        font-size: 12pt;
      }

      h1 {
        text-align: center;
        font-size: 16pt;
        margin-bottom: 4mm;
      }

      h2 {
        text-align: center;
        font-size: 12pt;
        margin-bottom: 10mm;
        font-weight: normal;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        page-break-inside: auto;
      }

      thead {
        display: table-header-group;
      }

      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      th, td {
        border: 1px solid #000;
        padding: 6px;
      }

      footer {
        position: fixed;
        bottom: 10mm;
        width: 100%;
        text-align: center;
        font-size: 10pt;
      }
    </style>
  </head>

  <body>
    <!-- ✅ PRINT AREA START -->
    <div id="print-area">

      <h1>${className}</h1>
      <h2>${section}</h2>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Student ID</th>
          </tr>
        </thead>

        <tbody>
          ${visibleRows.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${r.name}</td>
              <td>${r.studentId}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

    </div>
    <!-- ✅ PRINT AREA END -->

    <footer>
      Page <span class="pageNumber"></span>
    </footer>
  </body>
</html>
`;


  await new Promise(r => setTimeout(r, 300));

  const pdf = await Print.printToFileAsync({
    html,
    width: 1122,
    height: 793,
  });

  if (Platform.OS === "web") {
    // ✅ WEB SAFE
    const link = document.createElement("a");
    link.href = pdf.uri;
    link.download = "class-masterlist.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // ✅ MOBILE SAFE
    await Sharing.shareAsync(pdf.uri);
  }

  setExportDone(".PDF");
}

 else if (format === ".XLSX") {
  const data = visibleRows.map(r => ({
    Name: r.name,
    "Student ID": r.studentId,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Masterlist");

  if (Platform.OS === "web") {
    // 🌐 WEB
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    // 📱 MOBILE
    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const uri = FileSystem.cacheDirectory + `${fileName}.xlsx`;
    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await Sharing.shareAsync(uri);
  }

  setExportDone(".XLSX");
}

    } catch (error: any) {
      console.error("Export Error:", error);
      Alert.alert("Export Failed", "Could not generate the file. Please try again.");
    } finally {
      setIsExporting(false);
      setExportOpen(false);
    }
  };

  // 🔹 ACTIONS
  const handleOpenAdd = () => {
    setIsEditing(false);
    setStudentName("");
    setStudentUniId("");
    setModalVisible(true);
  };

  const handleOpenEdit = (student: Row) => {
    setIsEditing(true);
    setEditingId(student.id);
    setStudentName(student.name);
    setStudentUniId(student.studentId);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!studentName || !studentUniId) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid || !classId) return;

    try {
      setLoading(true);
      if (isEditing && editingId) {
        await updateStudent(uid, classId, editingId, {
          name: studentName,
          studentId: studentUniId
        });
      } else {
        await addStudent(uid, classId, {
          name: studentName,
          studentId: studentUniId
        });
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

    const handleDelete = (id: string) => {
  if (Platform.OS === 'web') {
    // 🌐 WEB: Use browser native confirm
    const confirmDelete = window.confirm("Are you sure you want to delete this student?");
    if (confirmDelete) {
      performDelete(id);
    }
  } else {
    // 📱 MOBILE: Use React Native Alert
    Alert.alert(
      "Delete Student",
      "Are you sure you want to remove this student?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => performDelete(id) 
        }
      ]
    );
  }
};

// 🔹 Extracted the delete logic to be reusable
const performDelete = async (id: string) => {
  const uid = auth.currentUser?.uid;
  if (uid && classId) {
    try {
      await deleteStudent(uid, classId, id);
    } catch (error: any) {
      console.error(error);
      // On web we often use window.alert for simple errors
      if (Platform.OS === 'web') alert("Failed to delete: " + error.message);
      else Alert.alert("Error", error.message);
    }
  }
};

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: headerColor, paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.className}>{className}</Text>
          <Text style={styles.sectionName}>{section}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Class Masterlist</Text>

        {/* Search + Sort + Export row */}
        <View style={styles.topRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#666" />
            <TextInput
              placeholder="Search..."
              placeholderTextColor="#999"
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={(e) => {
              setSortPickerY(e.nativeEvent.pageY);
              setSortPickerOpen(true);
            }}
          >
            <Ionicons name="funnel-outline" size={20} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setExportOpen(true)}>
             <Ionicons name="download-outline" size={20} color="#333" />
          </TouchableOpacity>

          {/* 🔹 ADD BUTTON */}
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: "#01B468", borderColor: "#01B468" }]} onPress={handleOpenAdd}>
             <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* SORT PICKER POPUP */}
        <Modal
          visible={sortPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setSortPickerOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => setSortPickerOpen(false)}
            />
            <View style={[styles.popup, { top: sortPickerY + 30 }]}>
              {SORT_OPTIONS.map(({ label, value }) => {
                const selected = value === sortKey;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => {
                      setSortKey(value);
                      setSortPickerOpen(false);
                    }}
                    style={[styles.popupItem, selected && styles.popupItemSelected]}
                  >
                    <Text style={[styles.popupItemText, selected && styles.popupItemTextSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>

        {/* TABLE */}
        <View style={styles.table}>
          <View style={[styles.row, styles.headRow]}>
            <Text style={[styles.cellName, styles.headText]}>Name</Text>
            <Text style={[styles.cellId, styles.headText]}>Student ID</Text>
            <Text style={[styles.cellManage, styles.headText]}>Manage</Text>
          </View>

          {visibleRows.length === 0 && (
             <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#999' }}>No students found.</Text>
             </View>
          )}

          {visibleRows.map((r, idx) => (
            <View
              key={r.id}
              style={[
                styles.row,
                idx === visibleRows.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={styles.cellName} numberOfLines={1}>
                {r.name}
              </Text>
              <Text style={styles.cellId}>{r.studentId}</Text>

              <View style={[styles.cellManage, styles.iconsRow]}>
                <TouchableOpacity onPress={() => handleOpenEdit(r)}>
                  <Ionicons name="create-outline" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(r.id)}>
                  <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 🔹 ADD/EDIT STUDENT MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{isEditing ? "Edit Student" : "Add Student"}</Text>
                
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Dela Cruz, Juan" 
                    value={studentName} 
                    onChangeText={setStudentName} 
                />

                <Text style={styles.inputLabel}>Student ID</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. TUPM-22-1234" 
                    value={studentUniId} 
                    onChangeText={setStudentUniId} 
                />

                <View style={styles.modalActionsRow}>
                    <TouchableOpacity style={[styles.modalBtnInline, styles.modalCancel]} onPress={() => setModalVisible(false)}>
                        <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.modalBtnInline, styles.modalSave, loading && { opacity: 0.7 }]} 
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.modalSaveText}>{loading ? "Saving..." : "Save"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* Export choose modal */}
      <Modal
        visible={exportOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setExportOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Export</Text>
              <TouchableOpacity onPress={() => setExportOpen(false)}>
                <Ionicons name="close" size={20} color="#01B468" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalBodyCenter}>
              {isExporting ? "Generating file..." : "Choose a file format to download\nthe data!"}
            </Text>

            {/* If exporting, show spinner or disable buttons */}
            {!isExporting && [".CSV", ".PDF", ".XLSX"].map((fmt) => (
              <TouchableOpacity
                key={fmt}
                style={styles.optionBtn}
                onPress={() => handleExport(fmt as any)}
              >
                <Text style={styles.optionText}>{fmt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Export success modal */}
      <Modal
        visible={exportDone !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setExportDone(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ alignItems: "center", marginVertical: 10 }}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={34} color="#fff" />
              </View>
              <Text style={styles.modalBodyCenter}>
                You successfully exported {exportDone ?? ""}!
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.modalBtnInline, styles.modalSave]}
              onPress={() => setExportDone(null)}
            >
              <Text style={styles.modalSaveText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const R = 10;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // --- HEADER STYLES ---
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 10,
  },
  headerTextContainer: {
    flexDirection: "column",
  },
  className: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
  },
  sectionName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  // --- CONTENT STYLES ---
  content: { padding: 20 },

  pageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#01B468",
    marginBottom: 16,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e3e3e3",
    backgroundColor: "#fff",
    borderRadius: R,
    paddingHorizontal: 10,
    height: 42,
  },
  searchInput: { flex: 1, paddingVertical: 4, color: "#111" },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: R,
    borderWidth: 1,
    borderColor: "#e3e3e3",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  // sort popup
  modalBackdrop: { flex: 1 },
  popup: {
    position: "absolute",
    right: 60, // adjusted position
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#eee",
  },
  popupItem: { paddingVertical: 8, paddingHorizontal: 8 },
  popupItemSelected: { backgroundColor: "#E6F7EF" },
  popupItemText: { fontSize: 14, color: "#333" },
  popupItemTextSelected: { fontWeight: "700", color: "#00b679" },

  // table
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 12, // slightly taller
  },
  headRow: { backgroundColor: "#F7F7F7", paddingVertical: 10 },
  headText: { fontWeight: "700", color: "#333" },

  cellName: { flex: 1.6, color: "#111", marginRight: 5 },
  cellId: { flex: 1, color: "#555" },
  cellManage: { width: 70 },
  iconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 15,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#01B468", marginBottom: 15 },
  
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9f9f9",
  },

  modalActionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
      marginTop: 20
  },
  modalBodyCenter: { textAlign: "center", color: "#333", marginTop: 10 },
  
  optionBtn: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  optionText: { textAlign: "center", fontWeight: "700", color: "#333" },
  
  modalBtnInline: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancel: { backgroundColor: "#eee" },
  modalCancelText: { color: "#333", fontWeight: "800" },
  modalSave: { backgroundColor: "#18A15A" },
  modalSaveText: { color: "#fff", fontWeight: "800" },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#18A15A",
    alignItems: "center",
    justifyContent: "center",
  },
});