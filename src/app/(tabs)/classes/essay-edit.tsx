// app/(tabs)/classes/essay-edit.tsx
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

export default function EssayEdit() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const className = P(params.name, "BSCS-4B");
  const section = P(params.section, "GEM14-M");
  const headerColor = P(params.color, "#C17CEB");

  const SAMPLE_TEXT =
    "e.g., Use keywords such as 'propagandist', 'Ambeth Ocampo', and 'sketch'. Refer to Lesson 3 of Noli Me Tangere. Partial credit allowed for logical coherence. Bonus points for historical connections to La Liga Filipina.";

  const [instructions, setInstructions] = useState(SAMPLE_TEXT);

  // file attachments
  const [lessonRefFile, setLessonRefFile] = useState<string | null>(null);
  const [rubricsFile, setRubricsFile] = useState<string | null>(null);

  async function pickLessonFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "*/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setLessonRefFile(asset.name ?? "Selected file");
    } catch (e) {
      console.log("pickLessonFile error", e);
      Alert.alert("Error", "Unable to select file. Please try again.");
    }
  }

  async function pickRubricsFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "*/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setRubricsFile(asset.name ?? "Selected file");
    } catch (e) {
      console.log("pickRubricsFile error", e);
      Alert.alert("Error", "Unable to select file. Please try again.");
    }
  }

  function onSave() {
    if (!instructions.trim()) {
      Alert.alert("Missing Instructions", "Please enter essay instructions.");
      return;
    }

    // 1) create new id
    const id = Date.now().toString();

    // 2) derive a short title from the first line of the instructions
    const firstLine = instructions.trim().split("\n")[0];
    const shortTitle =
      (firstLine && firstLine.slice(0, 40)) || "Custom Essay Instruction";

    // 3) send back to essay.tsx via router.replace
    router.replace({
      pathname: "/(tabs)/classes/essay",
      params: {
        name: className,
        section,
        color: headerColor,
        newId: id,
        newTitle: shortTitle,
        newLessonRef: lessonRefFile || "lesson_reference.pdf",
        newRubrics: rubricsFile || "rubrics.pdf",
      },
    });
  }

  return (
    <View style={styles.page}>
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
        <Text style={styles.title}>Essay Grading Instructions</Text>

        {/* Instructions box */}
        <View style={styles.box}>
          <TextInput
            multiline
            value={instructions}
            onChangeText={setInstructions}
            style={styles.textarea}
          />
        </View>

        {/* Lesson Reference */}
        <Text style={styles.label}>Lesson Reference</Text>
        <TouchableOpacity style={styles.inputLike} onPress={pickLessonFile}>
          <Ionicons name="document-attach-outline" size={18} color="#777" />
          <Text
            style={[
              styles.attachmentText,
              !lessonRefFile && { color: "#999" },
            ]}
            numberOfLines={1}
          >
            {lessonRefFile || "Attach Lesson Reference"}
          </Text>
        </TouchableOpacity>

        {/* Rubrics Criteria */}
        <Text style={[styles.label, { marginTop: 12 }]}>Rubrics Criteria</Text>
        <TouchableOpacity style={styles.inputLike} onPress={pickRubricsFile}>
          <Ionicons name="document-attach-outline" size={18} color="#777" />
          <Text
            style={[
              styles.attachmentText,
              !rubricsFile && { color: "#999" },
            ]}
            numberOfLines={1}
          >
            {rubricsFile || "Attach Rubrics"}
          </Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerSmall: { color: "#fff", fontSize: 14, opacity: 0.85 },
  headerBig: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  content: { padding: 16, paddingBottom: 40 },

  title: { fontWeight: "800", color: "#01B468", marginBottom: 8 },

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
  textarea: { minHeight: 120, textAlignVertical: "top", color: "#111" },

  label: { fontWeight: "800", color: "#444", marginBottom: 6 },

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
  attachmentText: {
    flex: 1,
    color: "#111",
    fontSize: 13,
  },

  saveBtn: {
    marginTop: 18,
    backgroundColor: "#01B468",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "800" },
});
