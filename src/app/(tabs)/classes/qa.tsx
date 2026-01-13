import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const P = (v: string | string[] | undefined, fb = "") =>
  Array.isArray(v) ? v[0] : v ?? fb;

export default function QAList() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const className = P(params.name, "BSCS-4B");
  const section = P(params.section, "GEM14-M");
  const headerColor = P(params.color, "#C17CEB");
  const title = P(params.title, "Quiz No. 1");

  // file that was deleted from qa-view.tsx (if any)
  const deletedFile = P(params.deletedFile, "");

  // base list (could be fetched from backend later)
  const BASE_FILES = ["Quiz No.1.pdf"];

  // keep full list in state (base + uploads)
  const [qaFiles, setQaFiles] = useState<string[]>(BASE_FILES);

  // whenever deletedFile param changes, filter it out of the list
  useEffect(() => {
    if (!deletedFile) return;
    setQaFiles((prev) => prev.filter((f) => f !== deletedFile));
  }, [deletedFile]);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      const name = asset.name ?? "Selected file";

      setQaFiles((prev) => [...prev, name]);
    } catch (e) {
      console.log("Document pick error", e);
      Alert.alert("Error", "Unable to pick file. Please try again.");
    }
  };

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
        {/* Section title */}
        <Text style={styles.bigLabel}>Question and answer</Text>

        {/* Upload card */}
        <TouchableOpacity
          style={styles.uploadCard}
          activeOpacity={0.9}
          onPress={handleUpload}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#111" />
          <Text style={styles.uploadText}>
            Upload Question and{"\n"}Answer
          </Text>
        </TouchableOpacity>

        {/* Uploaded list */}
        <Text style={[styles.bigLabel, { marginTop: 22 }]}>Uploaded Q&A</Text>

        {qaFiles.length === 0 ? (
          <Text style={{ color: "#888", fontSize: 13 }}>
            No files uploaded yet.
          </Text>
        ) : (
          qaFiles.map((fileName) => (
            <TouchableOpacity
              key={fileName}
              style={[styles.item, { marginBottom: 8 }]}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/classes/qa-view",
                  params: {
                    name: className,
                    section,
                    color: headerColor,
                    title,
                    fileName,
                  },
                })
              }
            >
              <Text style={styles.itemText}>{fileName}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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

  content: { padding: 16, paddingBottom: 40 },

  bigLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 10,
  },

  uploadCard: {
    backgroundColor: "#fff",
    borderRadius: R,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadText: { fontWeight: "500", color: "#111", lineHeight: 18 },

  item: {
    backgroundColor: "#fff",
    borderRadius: R,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  itemText: { color: "#111", fontWeight: "500" },
});
