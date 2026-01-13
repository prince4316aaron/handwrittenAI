import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// FIREBASE IMPORTS
import { auth } from "../../../firebase/firebaseConfig";
import { updateActivity } from "../../../services/class.service";

const P = (v: string | string[] | undefined, fb = "") =>
  Array.isArray(v) ? v[0] : v ?? fb;

export default function ActivityDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // 1. Get Params
  const classId = P(params.classId); 
  const activityId = P(params.activityId); // Crucial for database updates
  
  const className = P(params.name, "BSCS-4B");
  const section = P(params.section, "GEM14-M");
  const headerColor = P(params.color, "#C17CEB");
  const initialTitle = P(params.title, P(params.activityTitle, "Quiz no 1"));

  const [title, setTitle] = useState(initialTitle);
  const [editOpen, setEditOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);

  function openEdit() {
    setTempTitle(title);
    setEditOpen(true);
  }

  // 2. Handle Save to Firebase
  async function saveTitle() {
    const t = tempTitle.trim();
    if (!t) return;

    const uid = auth.currentUser?.uid;
    if (!uid || !classId || !activityId) {
      // Fallback if ID is missing (e.g. preview mode)
      setTitle(t);
      setEditOpen(false);
      return;
    }

    try {
      setSaving(true);
      await updateActivity(uid, classId, activityId, t);
      setTitle(t);
      setEditOpen(false);
    } catch (error: any) {
      Alert.alert("Error", "Failed to update activity title.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerColor, paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSmall}>{className}</Text>
          <Text style={styles.headerBig}>{section}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Title + Edit */}
        <View style={styles.titleRow}>
          <Text style={styles.activityTitle}>{title}</Text>
          <TouchableOpacity onPress={openEdit} style={styles.editIconBtn}>
            <Ionicons name="create-outline" size={20} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        {/* Feature Cards */}
        <View style={{ gap: 12 }}>

          {/* Q&A */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/classes/qa",
                params: { 
                    classId, // Pass IDs forward
                    activityId,
                    name: className, 
                    section, 
                    color: headerColor, 
                    title 
                },
              })
            }
          >
            <View style={styles.left}>
              <View style={styles.iconBadge}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color="#2E7D32" />
              </View>
              <Text style={styles.cardText}>Question and Answer</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
          </TouchableOpacity>

          {/* Essay Rubrics */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/classes/essay",
                params: { 
                    classId,
                    activityId,
                    name: className, 
                    section, 
                    color: headerColor, 
                    title 
                },
              })
            }
          >
            <View style={styles.left}>
              <View style={styles.iconBadge}>
                <Ionicons name="document-text-outline" size={18} color="#2E7D32" />
              </View>
              <Text style={styles.cardText}>Essay Grading</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
          </TouchableOpacity>

          {/* Students Score */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/classes/quiz-score",
                params: { 
                    classId,
                    activityId,
                    name: className, 
                    section, 
                    color: headerColor, 
                    title 
                },
              })
            }
          >
            <View style={styles.left}>
              <View style={styles.iconBadge}>
                <Ionicons name="people-outline" size={18} color="#2E7D32" />
              </View>
              <Text style={styles.cardText}>Students score</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: "#01B468" }]}>Edit Class Activity</Text>
              <TouchableOpacity onPress={() => setEditOpen(false)}>
                <Ionicons name="close" size={20} color="#2E7D32" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Activity Name</Text>
            <TextInput
              value={tempTitle}
              onChangeText={setTempTitle}
              placeholder="Quiz no 1"
              style={styles.modalInput}
              autoFocus
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setEditOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalSave, saving && { opacity: 0.7 }]} 
                onPress={saveTitle}
                disabled={saving}
              >
                <Text style={styles.modalSaveText}>{saving ? "Saving..." : "Save"}</Text>
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
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center" },
  backBtn: { padding: 10, marginLeft: -10, },
  headerSmall: { color: "#fff", fontSize: 14, opacity: 0.85 },
  headerBig: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  content: { padding: 16, paddingBottom: 36 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  activityTitle: { color: "#01B468", fontSize: 18, fontWeight: "800" },
  editIconBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },

  card: {
    backgroundColor: "#fff", borderRadius: R, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: "#EBEBEB", flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBadge: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: "#F1FFF6",
    borderWidth: 1, borderColor: "#D7F5E2", alignItems: "center", justifyContent: "center",
  },
  cardText: { fontSize: 15, fontWeight: "600", color: "#222" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 18, shadowColor: "#000", shadowOpacity: 0.12, elevation: 5 },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: "800" },

  inputLabel: { fontSize: 14, fontWeight: "700", color: "#000", marginTop: 8, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: "#e6e6e6", borderRadius: 8, padding: 10 },

  modalActionsRow: { marginTop: 14, flexDirection: "row", justifyContent: "space-between", gap: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  modalCancel: { backgroundColor: "#eee" , borderWidth: 1, borderColor: "#000" },
  modalCancelText: { color: "#333", fontWeight: "700" },
  modalSave: { backgroundColor: "#01B468" },
  modalSaveText: { color: "#fff", fontWeight: "700" },
});