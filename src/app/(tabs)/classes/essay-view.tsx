// app/(tabs)/classes/essay-view.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const P = (v: string | string[] | undefined, fb = "") =>
  Array.isArray(v) ? v[0] : v ?? fb;

export default function EssayView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const id = P(params.id, ""); // 👈 ID of this instruction (must be passed from essay.tsx)
  const className = P(params.name, "BSCS-4B");
  const section = P(params.section, "GEM14-M");
  const headerColor = P(params.color, "#C17CEB");
  const title = P(params.title, "Quiz 1 Essay Instructions");

  const lessonRefParam = P(params.lessonRef, "");
  const rubricsParam = P(params.rubrics, "");

  const [lessonRef] = useState(
    lessonRefParam || "lesson1_noli_me_tangere.pdf"
  );
  const [rubrics] = useState(rubricsParam || "Quiz1_Rubrics.pdf");

  const [confirmVisible, setConfirmVisible] = useState(false);

  function handleOpenFile(fileName: string) {
    // UI-only for now
    console.log("Open file:", fileName);
  }

  function handleConfirmDelete() {
    setConfirmVisible(false);

    // 🔴 IMPORTANT:
    // Go back to essay.tsx and tell it which ID to remove
    router.push({
      pathname: "/(tabs)/classes/essay", // adjust if your path is different
      params: {
        deletedId: id,
        name: className,
        section,
        color: headerColor,
      },
    });
  }

  return (
    <View style={styles.page}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: headerColor }, {paddingTop: insets.top + 20}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {/* SCROLL CONTENT */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Essay Grading Instructions</Text>
        <View style={styles.box}>
          <Text style={{ color: "#333" }}>
            e.g., Use keywords such as "propagandist", "Ambeth Ocampo", and
            "sketch". Refer to Lesson 3 of Noli Me Tangere. Partial credit
            allowed for logical coherence. Bonus points for historical
            connections to La Liga Filipina.
          </Text>
        </View>

        {/* Lesson Reference */}
        <Text style={styles.label}>Lesson Reference</Text>
        <TouchableOpacity
          style={styles.inputLike}
          activeOpacity={0.8}
          onPress={() => handleOpenFile(lessonRef)}
        >
          <Ionicons name="document-attach-outline" size={16} color="#777" />
          <TextInput editable={false} value={lessonRef} style={styles.roInput} />
        </TouchableOpacity>

        {/* Rubrics Criteria */}
        <Text style={[styles.label, { marginTop: 12 }]}>Rubrics Criteria</Text>
        <TouchableOpacity
          style={styles.inputLike}
          activeOpacity={0.8}
          onPress={() => handleOpenFile(rubrics)}
        >
          <Ionicons name="document-attach-outline" size={16} color="#777" />
          <TextInput editable={false} value={rubrics} style={styles.roInput} />
        </TouchableOpacity>
      </ScrollView>

      {/* FIXED BOTTOM DELETE BUTTON */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setConfirmVisible(true)}
        >
          <Text style={styles.deleteText}>Delete Instruction</Text>
        </TouchableOpacity>
      </View>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Instruction?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to delete this instruction?
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalDelete]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const R = 12;
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { padding: 10, marginLeft: -10 },
  headerTitle: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  content: { padding: 16, paddingBottom: 100 },

  label: { fontWeight: "800", color: "#444", marginBottom: 6 },
  box: {
    borderRadius: R,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },

  inputLike: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
  },
  roInput: { flex: 1, color: "#111" },

  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },

  deleteBtn: {
    backgroundColor: "#D32F2F",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteText: { color: "#fff", fontWeight: "800" },

  // modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalBody: { color: "#111", marginBottom: 18 },
  modalActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancel: { backgroundColor: "#eee",  borderWidth: 1,  borderColor: "#111",paddingVertical: 12, borderRadius: 12, elevation: 3, },
  modalCancelText: { color: "#333", fontWeight: "700" },
  modalDelete: { backgroundColor: "#D32F2F" },
  modalDeleteText: { color: "#fff", fontWeight: "700" },
});
