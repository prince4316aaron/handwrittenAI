// app/(tabs)/classes/activities.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import {
  addActivity,
  deleteActivity,
  listenToActivities
} from "../../../services/class.service";

// normalize expo-router params
const P = (v: string | string[] | undefined, fb = "") =>
  Array.isArray(v) ? v[0] : v ?? fb;

type Activity = { id: string; title: string };

export default function ActivitiesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const classId = P(params.classId); // We need the ID for DB operations
  const className = P(params.name, "BSCS-4B");
  const section = P(params.section, "GEM14-M");
  const headerColor = P(params.color, "#BB73E0");

  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Add activity modal
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Delete confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const anySelected = selected.size > 0;
  const displayItems = useMemo(() => items, [items]);

  // 🔹 1. LISTEN TO DATA
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !classId) return;

    const unsubscribe = listenToActivities(uid, classId, (data) => {
      setItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

  function toggleEdit() {
    if (editMode) setSelected(new Set());
    setEditMode((v) => !v);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // 🔹 2. HANDLE ADD
  async function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;

    const uid = auth.currentUser?.uid;
    if (!uid || !classId) return;

    try {
      setIsAdding(true);
      await addActivity(uid, classId, title);
      setNewTitle("");
      setAddOpen(false);
    } catch (error: any) {
      Alert.alert("Error", "Failed to add activity.");
    } finally {
      setIsAdding(false);
    }
  }

  function confirmDelete() {
    if (!anySelected) return;
    setConfirmOpen(true);
  }

  // 🔹 3. HANDLE DELETE
  async function doDelete() {
    const uid = auth.currentUser?.uid;
    if (!uid || !classId) return;

    try {
      setIsDeleting(true);
      // Delete all selected items concurrently
      const deletePromises = Array.from(selected).map((id) => 
        deleteActivity(uid, classId, id)
      );
      
      await Promise.all(deletePromises);
      
      setSelected(new Set());
      setConfirmOpen(false);
      setEditMode(false);
    } catch (error: any) {
      Alert.alert("Error", "Failed to delete activities.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header (solid class color) */}
      <View style={[styles.header, { backgroundColor: headerColor, paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ justifyContent: "center" }}>
          <Text style={styles.headerSmall}>{className}</Text>
          <Text style={styles.headerBig}>{section}</Text>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Class Activities</Text>

          <TouchableOpacity
            onPress={toggleEdit}
            style={[styles.pill, editMode && styles.pillDone]}
            activeOpacity={0.85}
          >
            <Text style={[styles.pillText, editMode && { color: "#fff" }]}>
              {editMode ? "Done" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading ? (
           <View style={{ marginTop: 50 }}>
             <ActivityIndicator size="large" color={headerColor} />
           </View>
        ) : (
          /* Activity cards */
          <View style={{ gap: 14 }}>
            {displayItems.length === 0 && (
                <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
                    No activities yet. Tap + to add one.
                </Text>
            )}

            {displayItems.map((a) => (
              <TouchableOpacity
                key={a.id}
                activeOpacity={0.9}
                onPress={() => {
                  if (editMode) {
                    toggleSelect(a.id);
                  } else {
                    router.push({
                      pathname: "/(tabs)/classes/activity-details",
                      params: {
                        classId: classId,
                        activityId: a.id,
                        name: className,
                        section,
                        color: headerColor,
                        activityTitle: a.title,
                      },
                    });
                  }
                }}
                style={styles.activityCard}
              >
                <View style={styles.left}>
                  {editMode ? (
                    selected.has(a.id) ? (
                      <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                    ) : (
                      <Ionicons name="ellipse-outline" size={20} color="#2E7D32" />
                    )
                  ) : (
                    <Ionicons name="checkbox-outline" size={20} color="#2E7D32" />
                  )}
                  <Text style={styles.activityText} numberOfLines={1}>
                    {a.title}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Add activity (only when not editing) */}
        {!editMode && !loading && (
          <View style={styles.addWrap}>
            <TouchableOpacity
              style={styles.addCircle}
              onPress={() => setAddOpen(true)}
            >
              <Ionicons name="add" size={22} color="#0B8E62" />
            </TouchableOpacity>
            <Text style={styles.addLabel}>
              Add Class{"\n"}Activities
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FIXED BOTTOM DELETE BAR (only when editing) */}
      {editMode && (
        <View style={styles.deleteBarWrapper}>
          <TouchableOpacity
            disabled={!anySelected || isDeleting}
            onPress={confirmDelete}
            style={[styles.deleteBar, (!anySelected || isDeleting) && { opacity: 0.5 }]}
          >
            <Text style={styles.deleteText}>
              {isDeleting ? "Deleting..." : `Delete ${selected.size} activit${selected.size > 1 ? "ies" : "y"}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Activity Modal */}
      <Modal
        visible={addOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: "#01B468" }]}>
                Add class Activity
              </Text>
              <TouchableOpacity onPress={() => setAddOpen(false)}>
                <Ionicons name="close" size={20} color="#2E7D32" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Activity Name</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Quiz #1"
              style={styles.modalInput}
              autoFocus
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setAddOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSave, isAdding && { opacity: 0.7 }]}
                onPress={handleAdd}
                disabled={isAdding}
              >
                <Text style={styles.modalSaveText}>{isAdding ? "Adding..." : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Activity?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to delete the selected activit
              {selected.size > 1 ? "ies" : "y"}?
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setConfirmOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalDelete]}
                onPress={doDelete}
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

  content: { padding: 20 },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: -6,
  },
  title: { color: "#01B468", fontSize: 18, fontWeight: "800" },

  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#01B468",
  },
  pillDone: { backgroundColor: "#01B468", borderWidth: 0 },
  pillText: { fontWeight: "500", color: "#333" },

  activityCard: {
    backgroundColor: "#fff",
    borderRadius: R,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  activityText: { fontSize: 15, fontWeight: "600", color: "#222", flexShrink: 1 },

  addWrap: { alignItems: "center", marginTop: 24 },
  addCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F7F0",
    borderWidth: 1,
    borderColor: "#BDE6D2",
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    marginTop: 8,
    color: "#111",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },

  deleteBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e5e5e5",
  },
  deleteBar: {
    backgroundColor: "#D62020",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteText: { color: "#fff", fontWeight: "800" },

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
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  modalBody: { color: "#111", marginTop: 8, marginBottom: 8 },

  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
    marginTop: 6,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },

  modalActionsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancel: { backgroundColor: "#eee",  borderWidth: 1,  borderColor: "#111", paddingVertical: 12, borderRadius: 12, elevation: 3, },
  modalCancelText: { color: "#333", fontWeight: "700" },
  modalDelete: { backgroundColor: "#D62020" },
  modalDeleteText: { color: "#fff", fontWeight: "700" },
  modalSave: { backgroundColor: "#01B468" },
  modalSaveText: { color: "#fff", fontWeight: "700" },
});