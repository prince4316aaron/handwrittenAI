// app/(tabs)/classes/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ref, remove } from "firebase/database"; // 1. Import DB functions
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../../firebase/firebaseConfig"; // 2. Import Auth & DB
import { listenToClasses } from "../../../services/class.service"; // 3. Import Listener

type ClassItem = {
  id: string;
  name: string;
  section: string;
  color: string;
  academicYear?: string; // Added optional field for passing to details
};

export default function ClassesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ClassItem[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // 4. REAL-TIME DATA FETCHING
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Listen to changes
    const unsubscribe = listenToClasses(uid, (data) => {
      if (data) {
        // Convert Object { id: { data } } -> Array [ { id, ...data } ]
        const classArray = Object.entries(data).map(([key, val]: any) => ({
          id: key,
          name: val.className,
          section: val.section,
          color: val.themeColor || "#009e60", // Default color if missing
          academicYear: val.semester
        }));
        setItems(classArray);
      } else {
        setItems([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const anySelected = selected.size > 0;
  const selectedNames = useMemo(
    () => items.filter(i => selected.has(i.id)).map(i => i.name).join(", "),
    [selected, items]
  );

  function toggleEdit() {
    if (editMode) setSelected(new Set());
    setEditMode(!editMode);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // 5. DELETE FROM FIREBASE
  async function handleDeleteConfirmed() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      // 1. Point to the correct path: 'professors/UID/classes/CLASS_ID'
      const deletePromises = Array.from(selected).map((classId) => 
        remove(ref(db, `professors/${uid}/classes/${classId}`)) 
      );
      
      await Promise.all(deletePromises);

      // 2. Update UI
      setItems(prevItems => prevItems.filter(item => !selected.has(item.id)));
      
      console.log("✅ Delete successful");
      setSelected(new Set());
      setConfirmVisible(false);
      setEditMode(false);
      
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete selected classes.");
    }
  }

  return (
    <View style={styles.page}>
      {/* Header */}
      <LinearGradient 
        colors={["#00b679", "#009e60"]} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }} 
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>Class List</Text>

        {items.length > 0 && ( // Only show Edit if there are items
          editMode ? (
            <TouchableOpacity onPress={toggleEdit} style={[styles.pill, styles.pillDone]}>
              <Text style={[styles.pillText, { color: "#fff" }]}>Done</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={toggleEdit} style={styles.pill}>
              <Text style={styles.pillText}>Edit</Text>
            </TouchableOpacity>
          )
        )}
      </LinearGradient>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Empty State */}
        {items.length === 0 && !editMode && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No classes found.</Text>
            <Text style={styles.emptySub}>Tap "Add Class" to get started!</Text>
          </View>
        )}

        {items.map(item => (
          <Pressable
            key={item.id}
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() =>
              editMode
                ? toggleSelect(item.id)
                : router.push({
                    pathname: "/(tabs)/classes/classinformation",
                    params: {
                      classId: item.id, // Important: Pass ID
                      name: item.name,
                      section: item.section,
                      color: item.color,
                      academicYear: item.academicYear
                    },
                  })
            }
          >
            {editMode && (
              <View style={styles.selectCircle}>
                {selected.has(item.id) && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.className}>{item.name}</Text>
              <Text style={styles.section}>{item.section}</Text>
            </View>

            {!editMode && (
              <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.6)" />
            )}
          </Pressable>
        ))}

        {/* Add Class Button (Hidden in Edit Mode) */}
        {!editMode && (
          <TouchableOpacity
            style={[styles.card, styles.addCard]}
            onPress={() => router.push("/(tabs)/classes/addclass")}
          >
            <Ionicons name="add-circle-outline" size={24} color="#0EA47A" />
            <Text style={styles.addText}>Add Class</Text>
          </TouchableOpacity>
        )}

        {/* Danger bar when selecting */}
        {editMode && (
          <TouchableOpacity
            disabled={!anySelected}
            style={[styles.deleteBar, !anySelected && { opacity: 0.5 }]}
            onPress={() => setConfirmVisible(true)}
          >
            <Text style={styles.deleteBarText}>
              Delete {selected.size} selected {selected.size === 1 ? 'class' : 'classes'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Confirm Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Class?</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to delete {selected.size === 1 ? selectedNames : "the selected classes"}?
              {"\n\n"}This action cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalDelete]}
                onPress={handleDeleteConfirmed}
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

const CARD_RADIUS = 14;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 18,
    paddingTop: 45,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", flex: 1 },

  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  pillDone: { backgroundColor: "rgba(255,255,255,0.25)", borderWidth: 0 },
  pillText: { fontWeight: "600", color: "#333" },

  content: { padding: 16, paddingBottom: 28 },

  emptyState: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  emptyText: { fontSize: 18, color: '#333', fontWeight: '600' },
  emptySub: { fontSize: 14, color: '#888', marginTop: 4 },

  card: {
    borderRadius: CARD_RADIUS,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  className: { color: "#fff", fontWeight: "700", fontSize: 18 },
  section: { color: "#fff", opacity: 0.95, fontWeight: "500", marginTop: 2 },

  selectCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },

  addCard: {
    backgroundColor: "#fff",
    borderWidth: 1.3,
    borderColor: "#0EA47A",
    justifyContent: "center",
  },
  addText: { marginLeft: 8, color: "#0EA47A", fontWeight: "700" },

  deleteBar: {
    marginTop: 8,
    backgroundColor: "#D32F2F",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteBarText: { color: "#fff", fontWeight: "700" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)", // Darker backdrop
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8, color: '#D32F2F' },
  modalSub: { color: "#666", marginBottom: 20, lineHeight: 20 },

  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalCancel: { backgroundColor: "#f5f5f5" },
  modalCancelText: { color: "#333", fontWeight: "700" },
  modalDelete: { backgroundColor: "#D32F2F" },
  modalDeleteText: { color: "#fff", fontWeight: "700" },
});