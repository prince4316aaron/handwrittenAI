// app/(tabs)/classes/qa-view.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const P = (v: string | string[] | undefined, fb = "") =>
  Array.isArray(v) ? v[0] : v ?? fb;

export default function QAView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const className = P(params.name, "BSCS-4B");
  const section = P(params.section, "GEM14-M");
  const headerColor = P(params.color, "#C17CEB");
  const title = P(params.title, "Quiz No. 1");
  const fileName = P(params.fileName, "Quiz No.1.pdf");

  // 👈 unique id of this Q&A (passed from qa.tsx)
  const qaId = P(params.id, "");

  // local static preview image stored at assets/images/...
  const preview = require("../../../assets/images/account-created.png");

  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerColor }, {paddingTop: insets.top + 20}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSmall}>{className}</Text>
          <Text style={styles.headerBig}>{section}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.previewCard}>
          <Image
            source={preview}
            style={styles.previewImg}
            resizeMode="cover"
          />
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setConfirmDel(true)}
        >
          <Text style={styles.deleteText}>Delete Question and Answer</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirm delete */}
      <Modal
        visible={confirmDel}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Q&A?</Text>
            <Text style={{ color: "#111", marginTop: 6 }}>
              Are you sure you want to delete "{fileName}"?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancel]}
                onPress={() => setConfirmDel(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.delete]}
                onPress={() => {
                  setConfirmDel(false);
                  // 👇 go back to the list and tell it which item to delete
                  router.replace({
                    pathname: "/(tabs)/classes/qa", // your qa.tsx route
                    params: {
                      name: className,
                      section,
                      color: headerColor,
                      deletedId: qaId,
                    },
                  });
                }}
              >
                <Text style={styles.deleteConfirmText}>Delete</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { padding: 10, marginLeft: -10 },
  headerSmall: { color: "#fff", fontSize: 14, opacity: 0.85 },
  headerBig: { color: "#fff", fontSize: 18, fontWeight: "bold" },

 // const styles = StyleSheet.create({
 //  container: { flex: 1, backgroundColor: "#fff" },
 //  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center" },
 //  backBtn: { padding: 10, marginLeft: -10, },
 //  headerSmall: { color: "#fff", fontSize: 14, opacity: 0.85 },
 //  headerBig: { color: "#fff", fontSize: 18, fontWeight: "bold" },


  content: { padding: 16, paddingBottom: 40 },

  title: { color: "#111", fontSize: 16, fontWeight: "800", marginBottom: 12 },

  previewCard: {
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 22,
  },
  previewImg: { width: "100%", height: 320, borderRadius: 8 },

  deleteBtn: {
    backgroundColor: "#D62020",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteText: { color: "#fff", fontWeight: "700" },

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
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  cancel: {
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#111",
  },
  cancelText: { color: "#333", fontWeight: "700" },
  delete: { backgroundColor: "#D32F2F" },
  deleteConfirmText: { color: "#fff", fontWeight: "700" },
});
