import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🔹 IMPORTS FROM SERVICES
import { auth } from "../../../firebase/firebaseConfig";
import { getStudentScores, saveStudentScore } from "../../../services/class.service";

const P = (v: string | string[] | undefined, fb = "") =>
  Array.isArray(v) ? v[0] : v ?? fb;

type Student = {
  id: string;
  name: string;
  score?: number; // undefined means missing
  feedback?: string;
};

type SortOption =
  | "none"
  | "name-asc"
  | "name-desc"
  | "score-asc"
  | "score-desc";

export default function QuizScore() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // 🔹 GET PARAMS
  const classId = P(params.classId);
  const activityId = P(params.activityId);
  const className = P(params.name, "Class Name");
  const section = P(params.section, "Section");
  const headerColor = P(params.color, "#C17CEB");
  const activityTitle = P(params.title, "Activity");

  // 🔹 REAL DATA STATE
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // export UI
  const [exportOpen, setExportOpen] = useState(false);
  const [exportDone, setExportDone] =
    useState<null | ".CSV" | ".PDF" | ".XLSX">(null);

  // edit score modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [tempName, setTempName] = useState("");
  const [tempScore, setTempScore] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);

  // sort modal
  const [sortOpen, setSortOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("none");

  // missing students modal
  const [missingOpen, setMissingOpen] = useState(false);

  // 🔹 1. FETCH DATA ON LOAD
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !classId || !activityId) return;

    try {
      setLoading(true);
      const data = await getStudentScores(uid, classId, activityId);
      
      // Map DB data to UI format
      const mapped: Student[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        score: item.score === null ? undefined : item.score, // Convert null to undefined for UI logic
        feedback: item.feedback
      }));

      setStudents(mapped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // list of students with no score
  const missingStudents = useMemo(
    () => students.filter((s) => s.score === undefined),
    [students]
  );

  // SEARCH + SORT
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = students;

    // search by NAME only
    if (q) {
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }

    const sorted = [...list];

    switch (sortOption) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "score-asc":
        sorted.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
        break;
      case "score-desc":
        sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        break;
      case "none":
      default:
        break;
    }

    return sorted;
  }, [students, query, sortOption]);

  // summary
  const highest = students.length > 0 ? Math.max(...students.map((s) => s.score ?? 0)) : 0;
  const total = students.length;
  const completed = students.filter((s) => s.score !== undefined).length;
  const missing = total - completed;
  
  // 🔹 OPEN CAMERA WITH IDs
  function openCameraFor(student: Student) {
    router.push({
      pathname: "/(tabs)/capture",
      params: {
        classId,
        activityId,
        studentId: student.id,
        section: section, // UI purposes
        activityName: activityTitle, // UI purposes
        studentName: student.name, // UI purposes
      },
    });
  }

  function openEdit(student: Student) {
    setEditTarget(student);
    setTempName(student.name);
    setTempScore(
      typeof student.score === "number" ? String(student.score) : ""
    );
    setEditOpen(true);
  }

  // 🔹 SAVE MANUAL EDIT TO FIREBASE
  async function saveEdit() {
    if (!editTarget) return;
    
    const parsed = parseInt(tempScore, 10);
    const nextScore = isNaN(parsed) ? 0 : parsed; // Default to 0 if empty
    
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
        setSavingEdit(true);
        // Save to DB
        await saveStudentScore(uid, classId, editTarget.id, activityId, {
            score: nextScore,
            feedback: "Manually edited by professor",
            gradedAt: new Date().toISOString()
        });

        // Update Local State
        setStudents((prev) =>
        prev.map((s) =>
            s.id === editTarget.id ? { ...s, score: nextScore } : s
        )
        );
        
        setEditOpen(false);
        setEditTarget(null);

    } catch (error) {
        Alert.alert("Error", "Failed to update score.");
    } finally {
        setSavingEdit(false);
    }
  }

  const sortLabel = (() => {
    switch (sortOption) {
      case "name-asc": return "Name A–Z";
      case "name-desc": return "Name Z–A";
      case "score-asc": return "Score Low–High";
      case "score-desc": return "Score High–Low";
      default: return "Sort";
    }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header (purple) */}
      <View style={[styles.header, { backgroundColor: headerColor }, {paddingTop: insets.top + 20}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <Text style={styles.headerSmall}>{className}</Text>
          <Text style={styles.headerBig}>{section}</Text>
        </View>
        <TouchableOpacity onPress={fetchData}>
             <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={headerColor} style={{marginTop: 50}} />
      ) : (
      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary row */}
        <View style={styles.topRow}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.activityTitle}>{activityTitle}</Text>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard top={`${highest}/100`} bottom="Highest Score" />
          <SummaryCard top={`${completed}/${total}`} bottom="Completed" />
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard top={`${missing}`} bottom="Missing" />
          <SummaryCard top={`${total}`} bottom="Total Students" />
        </View>

        {/* Missing list trigger */}
        <TouchableOpacity
          style={[
            styles.missingBtn,
            missingStudents.length === 0 && { opacity: 0.6 },
          ]}
          activeOpacity={0.9}
          disabled={missingStudents.length === 0}
          onPress={() => setMissingOpen(true)}
        >
          <Text style={styles.missingText}>View Students with Missing Scores</Text>
        </TouchableOpacity>

        {/* Search + Sort + Export */}
        <View style={styles.actionsRow}>
          {/* search */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#666" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search name…"
              placeholderTextColor="#999"
              style={styles.searchInput}
            />
          </View>

          {/* sort button */}
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setSortOpen(true)}
          >
            <Ionicons name="swap-vertical" size={16} color="#01B468" />
            <Text style={styles.sortText}>{sortLabel}</Text>
          </TouchableOpacity>

          {/* export */}
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => setExportOpen(true)}
          >
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* TABLE */}
        <View style={styles.table}>
          {/* head */}
          <View style={[styles.row, styles.rowHeader]}>
            <Text style={[styles.headerCell, { flex: 1.6 }]}>Name</Text>
            <Text style={[styles.headerCell, styles.cellScore]}>Score</Text>
            <Text style={[styles.headerCell, styles.cellManage]}>Manage</Text>
          </View>

          {filtered.length === 0 && (
             <Text style={{padding: 20, textAlign: 'center', color: '#999'}}>No students found.</Text>
          )}

          {filtered.map((s, idx) => (
            <View
              key={s.id}
              style={[
                styles.row,
                idx === filtered.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              {/* NAME */}
              <View style={styles.cellNameWrap}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {s.name}
                </Text>
              </View>

              {/* SCORE */}
              <View style={styles.cellScore}>
                {typeof s.score === "number" ? (
                  <Text style={[
                      styles.scoreText, 
                      s.score < 75 && {color: "#D32F2F"}, // Red if failed
                      s.score >= 75 && {color: "#18A15A"} // Green if pass
                    ]}>
                      {s.score}
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => openCameraFor(s)}
                    style={styles.cameraChip}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="camera" size={18} color="#6C63FF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* MANAGE */}
              <View style={styles.cellManage}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => openEdit(s)}
                >
                  <Ionicons name="create-outline" size={18} color="#000" />
                </TouchableOpacity>
                {/* Optional: Add a button to view the graded image proof 
                  You would need to save the imageURL in Firebase first
                */}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      )}

      {/* Missing students modal */}
      <Modal
        visible={missingOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMissingOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Students with Missing Scores</Text>
              <TouchableOpacity onPress={() => setMissingOpen(false)}>
                <Ionicons name="close" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {missingStudents.length === 0 ? (
              <Text style={styles.modalHelp}>
                Everyone already has a score.
              </Text>
            ) : (
              <View style={{ marginTop: 8 }}>
                {missingStudents.map((s) => (
                  <View key={s.id} style={styles.missingRow}>
                    <Text style={styles.missingName}>{s.name}</Text>
                    <TouchableOpacity
                      style={styles.missingCameraBtn}
                      onPress={() => {
                        setMissingOpen(false);
                        openCameraFor(s);
                      }}
                    >
                      <Ionicons name="camera" size={18} color="#6C63FF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalAction, styles.cancelBtn]}
              onPress={() => setMissingOpen(false)}
            >
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sort modal */}
      <Modal
        visible={sortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sort Students</Text>

            {(
              [
                ["none", "None"],
                ["name-asc", "Name A–Z"],
                ["name-desc", "Name Z–A"],
                ["score-asc", "Score Low–High"],
                ["score-desc", "Score High–Low"],
              ] as [SortOption, string][]
            ).map(([opt, label]) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionBtn,
                  opt === sortOption && { backgroundColor: "#E2F5EB" },
                ]}
                onPress={() => {
                  setSortOption(opt);
                  setSortOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    opt === sortOption && { color: "#01B468" },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalAction, styles.cancelBtn]}
              onPress={() => setSortOpen(false)}
            >
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export</Text>
              <TouchableOpacity onPress={() => setExportOpen(false)}>
                <Ionicons name="close" size={20} color="#01B468" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHelp}>
              Choose a file format to download {"\n"} the data!
            </Text>

            {[".CSV", ".PDF", ".XLSX"].map((fmt) => (
              <TouchableOpacity
                key={fmt}
                style={styles.optionBtn}
                onPress={() => {
                  setExportOpen(false);
                  setTimeout(
                    () => setExportDone(fmt as ".CSV" | ".PDF" | ".XLSX"),
                    180
                  );
                }}
              >
                <Text style={styles.optionText}>{fmt}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalAction, styles.cancelBtn]}
              onPress={() => setExportOpen(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
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
            <View style={styles.modalHeaderSpace}>
              <Text style={styles.modalTitle}>Export</Text>
              <View />
            </View>

            <View style={{ alignItems: "center", marginVertical: 10 }}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={34} color="#fff" />
              </View>
              <Text style={styles.modalHelp}>
                You successfully exported {exportDone ?? ""}!
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalAction, styles.saveBtn]}
              onPress={() => setExportDone(null)}
            >
              <Text style={styles.saveText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Score modal */}
      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalCard, { width: "88%", alignSelf: "center" }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: "#01B468" }]}>
                Edit Score
              </Text>
              <TouchableOpacity onPress={() => setEditOpen(false)}>
                <Ionicons name="close" size={20} color="#01B468" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              value={tempName}
              onChangeText={setTempName}
              editable={false}
              style={[styles.input, styles.inputReadonly]}
            />

            <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Score</Text>
            <TextInput
              value={tempScore}
              onChangeText={setTempScore}
              keyboardType="number-pad"
              placeholder="30"
              style={styles.input}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalBtnBlock, styles.cancelBtn]}
                onPress={() => setEditOpen(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnBlock, styles.saveBtn, savingEdit && {opacity: 0.7}]}
                onPress={saveEdit}
                disabled={savingEdit}
              >
                <Text style={styles.saveText}>{savingEdit ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryCard({ top, bottom }: { top: string; bottom: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTop}>{top}</Text>
      <Text style={styles.summaryBottom}>{bottom}</Text>
    </View>
  );
}

const R = 10;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { padding: 10, marginLeft: -10 },
  headerSmall: { color: "#fff", fontSize: 14, opacity: 0.85 },
  headerBig: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  content: { padding: 16, paddingBottom: 36 },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: { color: "#333", fontWeight: "700" },
  activityTitle: { color: "#01B468", fontWeight: "900" },

  summaryRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTop: { fontSize: 20, fontWeight: "800", color: "#167C50" },
  summaryBottom: { marginTop: 4, color: "#111", fontWeight: "600", fontSize: 12 },

  missingBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#F5C1C1",
    backgroundColor: "#FFF0F0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  missingText: { color: "#D32F2F", fontWeight: "700" },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
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
    paddingHorizontal: 12,
    height: 40,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, paddingVertical: 6, color: "#111" },

  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: R,
    borderWidth: 1,
    borderColor: "#01B468",
    backgroundColor: "#EAF9F2",
  },
  sortText: { fontSize: 12, color: "#01B468", fontWeight: "600" },

  exportBtn: {
    backgroundColor: "#62CE8F",
    paddingHorizontal: 14,
    height: 40,
    borderRadius: R,
    alignItems: "center",
    justifyContent: "center",
  },
  exportText: { color: "#fff", fontWeight: "600" },

  table: {
    marginTop: 12,
    borderWidth: 1.2,
    borderColor: "#CFCFCF",
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
    borderColor: "#E3E3E3",
    minHeight: 52,
  },
  rowHeader: { backgroundColor: "#F7F7F7" },
  headerCell: {
    fontWeight: "700",
    color: "#333",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  cellNameWrap: { flex: 1.6, paddingHorizontal: 12, paddingVertical: 12 },
  nameText: { color: "#111", fontSize: 15 },

  cellScore: { width: 80, alignItems: "center", justifyContent: "center" },
  scoreText: { fontSize: 16, fontWeight: "800" },

  cameraChip: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "#EFEFFA",
  },

  cellManage: {
    width: 110,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  iconBtn: { padding: 6 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeaderSpace: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#EC4646" },
  modalHelp: { textAlign: "center", color: "#333", marginVertical: 10 },

  missingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  missingName: { flex: 1, color: "#111" },
  missingCameraBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "#EFEFFA",
  },

  optionBtn: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 8,
  },
  optionText: { textAlign: "center", fontWeight: "700", color: "#333" },
  modalAction: {
    marginTop: 14,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtn: { backgroundColor: "#eee" },
  cancelText: { color: "#333", fontWeight: "800" },
  saveBtn: { backgroundColor: "#18A15A" },
  saveText: { color: "#fff", fontWeight: "800" },

  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#18A15A",
    alignItems: "center",
    justifyContent: "center",
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginTop: 6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  inputReadonly: {
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  modalButtonsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  modalBtnBlock: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
});