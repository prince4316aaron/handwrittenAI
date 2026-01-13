// app/(tabs)/capture/image-captured.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ImageCaptured() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // 1. Capture Context IDs (Crucial for the final step)
  const { classId, activityId, studentId } = params;

  // 2. Parse uris array safely
  const images: string[] = useMemo(() => {
    const raw = params.uris;
    const jsonStr = Array.isArray(raw) ? raw[0] : raw;
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.uris]);

  const initialIndex = useMemo(() => {
    const raw = params.index;
    const indexStr = Array.isArray(raw) ? raw[0] : raw;
    const idx = indexStr ? parseInt(indexStr, 10) : 0;
    if (Number.isNaN(idx)) return 0;
    return Math.min(Math.max(idx, 0), Math.max(images.length - 1, 0));
  }, [params.index, images.length]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const hasImages = images.length > 0;
  const currentUri = hasImages ? images[currentIndex] : "";

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };
  const goNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex((i) => i + 1);
  };

  const pageText = hasImages 
    ? `Page ${currentIndex + 1} of ${images.length}` 
    : "No Images";

  // --- ACTIONS ---

  // A. Retake: Remove current image -> Go back to Camera
  const handleRetake = () => {
    const newImages = images.filter((_, i) => i !== currentIndex);
    router.push({
      pathname: "/capture/photo-taking",
      params: { 
        uris: JSON.stringify(newImages),
        classId, activityId, studentId 
      },
    });
  };

  // B. Take Another: Keep images -> Go back to Camera
  const handleAddMore = () => {
    router.push({
      pathname: "/capture/photo-taking",
      params: { 
        uris: JSON.stringify(images),
        classId, activityId, studentId 
      },
    });
  };

  // C. Proceed: Pass everything to Processing
  const handleProceed = () => {
    if (images.length === 0) {
        Alert.alert("No Images", "Please take at least one photo.");
        return;
    }
    router.push({
      pathname: "/capture/processing", // Make sure you create this file next!
      params: { 
        uris: JSON.stringify(images),
        classId, activityId, studentId 
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#00b679", "#009e60"]}  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, {paddingTop: insets.top + 20}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Image Captured</Text>
        <View style={{ width: 22 }} />
      </LinearGradient>

      {/* Page label */}
      <View style={styles.topRow}>
        <Text style={styles.pageLabel}>{pageText}</Text>
      </View>

      {/* Image viewer */}
      <View style={styles.imageRow}>
        {/* Left arrow */}
        <TouchableOpacity
          disabled={currentIndex === 0 || !hasImages}
          onPress={goPrev}
          style={[
            styles.arrowBtn,
            (currentIndex === 0 || !hasImages) && { opacity: 0.3 },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color="#555" />
        </TouchableOpacity>

        <View style={styles.imageFrame}>
          {currentUri ? (
            <Image source={{ uri: currentUri }} style={styles.capturedImage} />
          ) : (
            <View style={{ alignItems: "center", gap: 10 }}>
                <Ionicons name="image-outline" size={70} color="#888" />
                <Text style={{ color: "#999" }}>No image selected</Text>
            </View>
          )}
        </View>

        {/* Right arrow */}
        <TouchableOpacity
          disabled={currentIndex === images.length - 1 || images.length <= 1}
          onPress={goNext}
          style={[
            styles.arrowBtn,
            (currentIndex === images.length - 1 || images.length <= 1) && {
              opacity: 0.3,
            },
          ]}
        >
          <Ionicons name="chevron-forward" size={22} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={handleRetake}
        >
          <Text style={styles.outlineText}>Retake Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={handleAddMore}
        >
          <Text style={styles.outlineText}>Take another Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleProceed}
        >
          <Text style={styles.primaryText}>Upload and Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 45,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", flex: 1 },

  topRow: {
    paddingHorizontal: 20,
    paddingTop: 18,
    alignItems: "center"
  },
  pageLabel: { fontWeight: "600", color: "#222" },

  imageRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  arrowBtn: {
    padding: 10,
  },
  imageFrame: {
    width: "70%",
    height: 350, // Made slightly taller for better visibility
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginHorizontal: 8,
  },
  capturedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  buttons: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: "#00b679",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  outlineText: {
    color: "#000",
    fontWeight: "700",
  },
  primaryBtn: {
    backgroundColor: "#CCFFE1",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10
  },
  primaryText: {
    color: "#000",
    fontWeight: "700",
  },
});