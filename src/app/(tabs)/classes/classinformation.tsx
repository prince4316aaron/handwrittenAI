import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { get, ref } from "firebase/database";
import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../../firebase/firebaseConfig";

export default function ClassInformationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 1. Get initial params (Used for initial render and IDs)
  const params = useLocalSearchParams();
  const getParam = (v: any) => (Array.isArray(v) ? v[0] : v);

  const currentClassId = getParam(params.classId);
  
  // 2. Use State for ALL display data so it can update
  const [classData, setClassData] = useState({
    name: getParam(params.name) || "N/A",
    section: getParam(params.section) || "N/A",
    academicYear: getParam(params.academicYear) || "2025 - 2026",
    color: getParam(params.color) || "#01B468"
  });

  const [counts, setCounts] = useState({ students: 0, activities: 0 });

  // 3. Fetch Fresh Data (Details + Counts)
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid || !currentClassId) return;

        try {
          const classRef = ref(db, `professors/${uid}/classes/${currentClassId}`);
          const snapshot = await get(classRef);

          if (snapshot.exists()) {
            const data = snapshot.val();
            
            // Update UI with fresh data from DB
            setClassData({
                name: data.className || "N/A",
                section: data.section || "N/A",
                academicYear: data.semester || "2025 - 2026",
                color: data.themeColor || "#01B468"
            });

            const studentCount = data.students ? Object.keys(data.students).length : 0;
            const activityCount = data.exams ? Object.keys(data.exams).length : 0; 
            setCounts({ students: studentCount, activities: activityCount });
          }
        } catch (error) {
          console.error("Error fetching class details:", error);
        }
      };

      fetchData();
    }, [currentClassId])
  );

  return (
    <View style={styles.container}>
      {/* Colored Header */}
      <View style={[styles.header, { backgroundColor: classData.color }, {paddingTop: insets.top + 20}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoHeader}>
          <Text style={[styles.infoTitle, { color: classData.color }]}>Class Information</Text>
            
            {/* Edit Button */}
            <TouchableOpacity
            onPress={() =>
                router.push({
                pathname: "/(tabs)/classes/editclass",
                params: {
                    classId: currentClassId,
                    name: classData.name,
                    section: classData.section,
                    color: classData.color,
                    academicYear: classData.academicYear,
                },
                })
            }
            >
            <Ionicons name="create-outline" size={20} color={classData.color} />
            </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Class Name:</Text>
            <Text style={styles.value}>{classData.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Section:</Text>
            <Text style={styles.value}>{classData.section}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Academic Year:</Text>
            <Text style={styles.value}>{classData.academicYear}</Text>
          </View>
        </View>

        {/* Navigation Cards */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => 
            router.push({
              pathname: "/(tabs)/classes/masterlist",
              params: { 
                classId: currentClassId,
                name: classData.name, 
                section: classData.section, 
                color: classData.color 
              }
            })
          }
        >
          <View style={styles.cardLeft}>
            <Ionicons name="people-outline" size={20} color={classData.color} />
            <Text style={styles.cardText}>Masterlist</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => 
            router.push({
              pathname: "/(tabs)/classes/activities",
              params: { 
                classId: currentClassId,
                name: classData.name, 
                section: classData.section, 
                color: classData.color 
              }
            })
          }
        >
          <View style={styles.cardLeft}>
            <Ionicons name="clipboard-outline" size={20} color={classData.color} />
            <Text style={styles.cardText}>Class Activities</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: classData.color }]}>{counts.students}</Text>
            <Text style={styles.summaryLabel}>No. of Students</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: classData.color }]}>{counts.activities}</Text>
            <Text style={styles.summaryLabel}>No. of Activities</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  backBtn: {
    marginLeft: -10,
  },
  header: {
    padding: 25,
  },
  content: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
    alignItems: "flex-start",
  },
  label: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#222",
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
    paddingLeft: 20,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 10,
    color: "#333",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#555",
    marginTop: 5,
  },
});