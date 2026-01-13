import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// normalize expo-router params (string | string[] | undefined -> string)
const P = (v: string | string[] | undefined, fb = "") =>
  Array.isArray(v) ? v[0] : v ?? fb;

export default function UploadedImageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const headerColor = P(params.color, "#C17CEB");
  const student = P(params.student, "");
  const section = P(params.section, "");
  const title = P(params.title, "View Test Paper");

  // images are passed as a JSON stringified array of URIs
  const imagesParam = P(params.images, "[]");

  const images: string[] = useMemo(() => {
    try {
      const parsed = JSON.parse(imagesParam);
      if (Array.isArray(parsed)) return parsed as string[];
      return [];
    } catch {
      return [];
    }
  }, [imagesParam]);

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={[styles.header, { backgroundColor: headerColor }, {paddingTop: insets.top + 20}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* meta (optional) */}
        {(section || student) && (
          <View style={{ marginBottom: 12 }}>
            {!!section && <Text style={styles.metaText}>Section: {section}</Text>}
            {!!student && <Text style={styles.metaText}>Name: {student}</Text>}
          </View>
        )}

        <Text style={styles.pagesTitle}>Pages</Text>

        {images.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="images-outline" size={26} color="#9AA0A6" />
            <Text style={styles.emptyText}>No uploaded pages yet.</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {images.map((uri, idx) => (
              <View key={`${uri}-${idx}`} style={styles.card}>
                <Image
                  source={{ uri }}
                  style={styles.pageImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    gap: 10,
  },
  backBtn: { padding: 10, marginLeft: -10},
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  content: { padding: 16, paddingBottom: 28 },

  metaText: { color: "#444", marginBottom: 4 },

  pagesTitle: {
    color: "#2E7D32",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: R,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden",

    // soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pageImage: {
    width: "100%",
    // look like a photo thumbnail; keep aspect ~4:3
    aspectRatio: 4 / 3,
  },

  emptyBox: {
    borderWidth: 1,
    borderColor: "#EFEFEF",
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: "center",
    gap: 6,
  },
  emptyText: { color: "#777", fontWeight: "600" },
});
