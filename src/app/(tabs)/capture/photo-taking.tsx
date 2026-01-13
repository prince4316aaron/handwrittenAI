// app/(tabs)/capture/photo-taking.tsx
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PhotoTaking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);

  // 1. Robust Helper to parse URIs safely
  const getExistingUris = (): string[] => {
    try {
      if (!params.uris) return [];
      
      const raw = params.uris;
      // If it's already an array (rare but possible in some routers), return it
      if (Array.isArray(raw)) return raw as string[];
      
      // If it's a string, try parsing it
      if (typeof raw === 'string') {
        return JSON.parse(raw);
      }
      return [];
    } catch (e) {
      console.warn("Failed to parse existing URIs", e);
      return [];
    }
  };

  // Ask for camera permission when screen loads
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // 2. Updated Navigation Logic
  const goToImageCaptured = (newUri: string) => {
    const existing = getExistingUris();
    const updated = [...existing, newUri];

    router.push({
      pathname: "/capture/image-captured",
      params: { 
        // Important: Re-stringify the array so it passes correctly
        uris: JSON.stringify(updated), 
        index: updated.length - 1,
        // Pass forward IDs if they exist (so we don't lose context)
        classId: params.classId,
        activityId: params.activityId,
        studentId: params.studentId
      },
    });
  };

  // Take a photo using the camera
  const handleTakePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true, // Faster capture
      });
      goToImageCaptured(photo.uri);
    } catch (err) {
      console.log("Error taking photo:", err);
    }
  };

  // Pick an image from the gallery
  const handlePickFromGallery = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Permission to access gallery is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      goToImageCaptured(result.assets[0].uri);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00b679" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#000", marginBottom: 10 }}>
          We need camera access to continue.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#00b679", "#009e60"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, {paddingTop: insets.top + 20}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Taking</Text>
        <View style={{ width: 22 }} />
      </LinearGradient>

      {/* Real Camera Preview */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setIsReady(true)}
      />

      <Text style={styles.hintText}>
        Center the paper and make sure the photo is clear!
      </Text>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <View style={{ width: 40 }} />

        {/* Shutter button */}
        <TouchableOpacity
          style={[styles.shutterOuter, !isReady && { opacity: 0.4 }]}
          disabled={!isReady}
          onPress={handleTakePicture}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        {/* Gallery button */}
        <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
          <Ionicons name="images-outline" size={26} color="#00b679" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 18,
    paddingTop: 45,
    paddingBottom: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", flex: 1 },

  camera: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },

  hintText: {
    textAlign: "center",
    marginBottom: 10,
    color: "#666",
    fontSize: 12,
  },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingBottom: 30,
  },

  shutterOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: "#00b679",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#00b679",
  },

  galleryBtn: { width: 40, alignItems: "center" },

  permissionBtn: {
    backgroundColor: "#00b679",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  permissionText: { color: "#fff", fontSize: 16 },
});