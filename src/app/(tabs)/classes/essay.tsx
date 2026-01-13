// app/(tabs)/classes/essay.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const P = (v: string | string[] | undefined, fb = "") =>
  Array.isArray(v) ? v[0] : v ?? fb;

type Instruction = {
  id: string;
  title: string;
  lessonRef: string;
  rubrics: string;
};

const DEFAULT_INSTRUCTION: Instruction = {
  id: "1",
  title: "Quiz 1 Essay Instructions",
  lessonRef: "lesson1_noli_me_tangere.pdf",
  rubrics: "Quiz1_Rubrics.pdf",
};

export default function EssayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const className = P(params.name, "BSCS-4B");
  const section = P(params.section, "GEM14-M");
  const headerColor = P(params.color, "#C17CEB");

  // from delete (essay-view.tsx)
  const deletedId = P(params.deletedId, "");

  // from add new (essay-edit.tsx)
  const newId = P(params.newId, "");
  const newTitle = P(params.newTitle, "");
  const newLessonRef = P(params.newLessonRef, "");
  const newRubrics = P(params.newRubrics, "");

  const instructions = useMemo<Instruction[]>(() => {
    let list: Instruction[] = [DEFAULT_INSTRUCTION];

    // append newly added instruction if provided
    if (newId) {
      list.push({
        id: newId,
        title: newTitle || "Custom Essay Instruction",
        lessonRef: newLessonRef || "lesson_reference.pdf",
        rubrics: newRubrics || "rubrics.pdf",
      });
    }

    // apply deletion if any
    if (deletedId) {
      list = list.filter((i) => i.id !== deletedId);
    }

    return list;
  }, [deletedId, newId, newTitle, newLessonRef, newRubrics]);

  return (
    <View style={styles.page}>
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
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Essay Instructions</Text>
        </View>

        {/* Instruction cards */}
        {instructions.length === 0 ? (
          <Text style={styles.emptyText}>
            No essay instructions yet. Add one below.
          </Text>
        ) : (
          instructions.map((inst) => (
            <TouchableOpacity
              key={inst.id}
              activeOpacity={0.9}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/classes/essay-view",
                  params: {
                    id: inst.id,
                    name: className,
                    section,
                    color: headerColor,
                    title: inst.title,
                    lessonRef: inst.lessonRef,
                    rubrics: inst.rubrics,
                  },
                })
              }
            >
              <View style={styles.cardLeft}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color="#01B468"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {inst.title}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    Lesson: {inst.lessonRef}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
            </TouchableOpacity>
          ))
        )}

        {/* Spacer so button feels lower */}
        <View style={{ height: 40 }} />

        {/* Add New Instruction (KEEP) */}
        <View style={styles.addWrap}>
          <TouchableOpacity
            style={styles.addCircle}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/classes/essay-edit",
                params: {
                  name: className,
                  section,
                  color: headerColor,
                },
              })
            }
          >
            <Ionicons name="add" size={22} color="#0B8E62" />
          </TouchableOpacity>
          <Text style={styles.addLabel}>
            Add New{"\n"}Instruction
          </Text>
        </View>
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

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    color: "#01B468",
    fontSize: 18,
    fontWeight: "800",
  },

  emptyText: {
    color: "#777",
    fontStyle: "italic",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: R,
    paddingVertical: 14,
    paddingHorizontal: 16,
     marginVertical: 7,
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
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  cardSub: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  addWrap: {
    alignItems: "center",
    marginTop: 24,
  },
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
});
