import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth } from "../../firebase/firebaseConfig";
import { listenToClasses } from "../../services/class.service";
import { getProfessorProfile } from "../../services/professor.service";

// Default placeholder if no photo exists
const DEFAULT_AVATAR = "https://i.imgur.com/4YQZ6uM.png";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [professor, setProfessor] = useState<any>(null);
  const [classes, setClasses] = useState<any>({});

  // 1. Fetch Professor Profile & Photo
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Force reload to get the latest photoURL if it just changed
          await currentUser.reload();
          
          const profData = await getProfessorProfile(currentUser.uid);
          
          setProfessor({
            ...profData, // Name, etc from DB
            // Use Auth photo first, then fallback to default
            photoURL: currentUser.photoURL || DEFAULT_AVATAR 
          });
        }
      };
      loadProfile();
    }, [])
  );

  // 2. REAL-TIME LISTENER FOR CLASSES
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = listenToClasses(uid, (data) => {
      setClasses(data); 
    });

    return () => unsubscribe();
  }, []);

  const classList = Object.entries(classes);
  const totalClasses = classList.length;

  const totalStudents = classList.reduce(
    (sum: number, [, c]: any) =>
      sum + (c.students ? Object.keys(c.students).length : 0),
    0
  );

  if (!professor) return null;

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={["#00b679", "#009e60"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          {/* UPDATED IMAGE SOURCE */}
          <Image
            source={{ uri: professor.photoURL }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.welcomeText}>
              Welcome, {professor.name}!
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* STATS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Here’s your recent activity
        </Text>

        <View style={styles.statsRow}>
          <StatCard value={String(totalClasses)} label="Total Classes" />
          <StatCard value={String(totalStudents)} label="Total Students" />
        </View>
      </View>

      {/* CLASS LIST */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Class List</Text>

        <View style={styles.classGrid}>
          {classList.map(([classId, cls]: any, index) => {
            const cardColor = cls.themeColor || COLORS[index % COLORS.length];

            return (
              <ClassCard
                key={classId}
                name={cls.className}
                section={cls.section}
                color={cardColor}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/classes/classinformation",
                    params: {
                      classId, 
                      name: cls.className,
                      section: cls.section,
                      color: cardColor, 
                      academicYear: cls.semester,
                    },
                  })
                }
              />
            );
          })}

          <AddClassCard />
        </View>
      </View>
    </ScrollView>
  );
}

// ... (Rest of your StatCard, ClassCard, AddClassCard components and styles remain exactly the same) ...

/* ===========================
   STAT CARD COMPONENT
=========================== */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ===========================
   CLASS CARD COMPONENT
=========================== */
function ClassCard({
  name,
  section,
  color,
  onPress,
}: {
  name: string;
  section: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.classCard, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.className}>{name}</Text>
      <Text style={styles.classSection}>{section}</Text>
    </TouchableOpacity>
  );
}

/* ===========================
   ADD CLASS COMPONENT
=========================== */
function AddClassCard() {
  const router = useRouter();

  return (
    <TouchableOpacity style={[styles.classCard, styles.addClass]} onPress={() => router.push("/classes/addclass")}>
      <Ionicons name="add-circle-outline" size={25} color="#009e60" />
      <Text style={{ color: "#009e60", fontWeight: "600" }}>Add Class</Text>
    </TouchableOpacity>
  );
}

/* ===========================
   STYLES
=========================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },

  header: {
    padding: 20,
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff', // Added bg color to look nice while loading
  },

  welcomeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  section: {
    padding: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 5,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#009e60",
  },

  statLabel: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
  },

  classGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  classCard: {
    width: "47%",
    borderRadius: 12,
    padding: 15,
    marginVertical: 6,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  className: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "700",
  },

  classSection: {
    color: "#fff",
    fontSize: 15,
    marginTop: 2,
  },

  addClass: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#009e60",
    justifyContent: "center",
    alignItems: "center",
  },
});

const COLORS = [
  "#BB73E0",
  "#EE89B0",
  "#AEBAF8",
  "#F4A261",
  "#2A9D8F",
];