// app/(tabs)/analytics/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PieChart from "react-native-pie-chart";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS = ["BSCS-4B", "BSIT-4A", "BSECE-3A"];
const ACTIVITIES = ["Quiz 1", "Long Quiz 1", "Prelim"];

type PickerType = "section" | "activity" | null;

const TOP10 = [
  { name: "Buenaflor, Sean Kurt", score: 29 },
  { name: "Capuz, Prince Aaron", score: 28 },
  { name: "Domingo, Princess Jade", score: 27 },
  { name: "Elle, Clarise Mae", score: 27 },
  { name: "Perez, Maria Angela Mae", score: 26 },
  { name: "Togonon, Francesca", score: 26 },
  { name: "Student 7", score: 25 },
  { name: "Student 8", score: 25 },
  { name: "Student 9", score: 24 },
  { name: "Student 10", score: 24 },
];

// Example stats
const PASSED_COUNT = 25;
const FAILED_COUNT = 17;
const TOTAL_STUDENTS = PASSED_COUNT + FAILED_COUNT;

function DonutChart() {
  const widthAndHeight = 120;

  const percent =
    TOTAL_STUDENTS === 0
      ? 0
      : Math.round((PASSED_COUNT / TOTAL_STUDENTS) * 100);

  // v4 API: series is Slice[]
  const series =
    TOTAL_STUDENTS === 0
      ? [
          {
            value: 1,
            color: "#e0e0e0",
          },
        ]
      : [
          { value: PASSED_COUNT, color: "#22b573" },
          { value: FAILED_COUNT, color: "#e74c3c" },
        ];

  return (
    <View style={styles.donutWrapper}>
      <PieChart
        widthAndHeight={widthAndHeight}
        series={series}
        cover={{ radius: 0.65, color: "#ffffff" }} 
      />
      <View style={styles.donutCenter}>
        <Text style={styles.donutCenterNumber}>{percent}%</Text>
        <Text style={styles.donutCenterLabel}>Passed</Text>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const [section, setSection] = useState(SECTIONS[0]);
  const [activity, setActivity] = useState(ACTIVITIES[0]);
  const insets = useSafeAreaInsets();

  const [pickerType, setPickerType] = useState<PickerType>(null);
  const [pickerY, setPickerY] = useState(0);

  const isPickerOpen = pickerType !== null;

  const currentOptions =
    pickerType === "section"
      ? SECTIONS
      : pickerType === "activity"
      ? ACTIVITIES
      : [];

  const currentValue =
    pickerType === "section" ? section : pickerType === "activity" ? activity : "";

  const handleSelect = (value: string) => {
    if (pickerType === "section") setSection(value);
    if (pickerType === "activity") setActivity(value);
    setPickerType(null);
  };

  return (
    <View style={styles.page}>
      {/* Header */}
      <LinearGradient colors={["#00b679", "#009e60"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}  style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>Analytics</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Dropdown row */}
        <View style={styles.filterRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Pressable
              style={styles.dropdownBtn}
              onPress={(e) => {
                setPickerY(e.nativeEvent.pageY);
                setPickerType("section");
              }}
            >
              <Text>{section}</Text>
              <Ionicons name="chevron-down" size={18} color="#555" />
            </Pressable>
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Pressable
              style={styles.dropdownBtn}
              onPress={(e) => {
                setPickerY(e.nativeEvent.pageY);
                setPickerType("activity");
              }}
            >
              <Text>{activity}</Text>
              <Ionicons name="chevron-down" size={18} color="#555" />
            </Pressable>
          </View>
        </View>

        {/* Student Score Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Score Distribution</Text>

          <View style={styles.chartWrapper}>
            {/* Y axis labels */}
            <View style={styles.yAxis}>
              {[25, 20, 15, 10, 5, 0].map((v) => (
                <View key={v} style={styles.yTickRow}>
                  <Text style={styles.yLabel}>{v}</Text>
                </View>
              ))}
            </View>

            {/* Chart area with bars */}
            <View style={styles.chartArea}>
              {/* vertical axis line */}
              <View style={styles.yAxisLine} />
              {/* horizontal axis line */}
              <View style={styles.xAxisLine} />

              <View style={styles.barRow}>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height: 80 }]} />
                  <Text style={styles.xLabel}>0–10</Text>
                </View>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height: 30 }]} />
                  <Text style={styles.xLabel}>11–20</Text>
                </View>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height: 120 }]} />
                  <Text style={styles.xLabel}>21–30</Text>
                </View>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height: 20 }]} />
                  <Text style={styles.xLabel}>31–40</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Axis captions */}
          <View style={styles.axisCaptions}>
            <Text style={styles.yAxisCaption}>Number of Students</Text>
            <Text style={styles.xAxisCaption}>Score Ranges</Text>
          </View>
        </View>

        {/* Class Performance (donut) */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Class Performance</Text>

          <View style={styles.performanceRow}>
            <DonutChart />

            <View style={styles.legend}>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#22b573" }]}
                />
                <Text style={styles.legendText}>
                  <Text style={styles.legendLabel}>Passed</Text>
                  <Text style={styles.legendLight}>
                    {" "}
                    ({PASSED_COUNT} Students)
                  </Text>
                </Text>
              </View>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#e74c3c" }]}
                />
                <Text style={styles.legendText}>
                  <Text style={styles.legendLabel}>Failed</Text>
                  <Text style={styles.legendLight}>
                    {" "}
                    ({FAILED_COUNT} Students)
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top 10 Students */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={styles.topRow}>
            <Text style={styles.topTitle}>Top 10 Students</Text>
            <Text style={styles.topQuizLabel}>{activity}</Text>
          </View>

          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellName, styles.tableHeaderText]}>
              Name
            </Text>
            <Text style={[styles.tableCellScore, styles.tableHeaderText]}>
              Score
            </Text>
          </View>

          {TOP10.map((s, idx) => (
            <View
              key={s.name}
              style={[
                styles.tableRow,
                idx % 2 === 1 && { backgroundColor: "#fafafa" },
              ]}
            >
              <Text style={styles.tableCellName}>{s.name}</Text>
              <Text style={styles.tableCellScore}>{s.score}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.viewMoreBtn}>
            <Text style={styles.viewMoreText}>View full class results →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Popup for dropdowns */}
      <Modal
        visible={isPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerType(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setPickerType(null)}
          />
        <View style={[styles.popup, { top: pickerY + 8 }]}>
            {currentOptions.map((opt) => {
              const selected = opt === currentValue;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.popupItem,
                    selected && styles.popupItemSelected,
                  ]}
                  onPress={() => handleSelect(opt)}
                >
                  <Text
                    style={[
                      styles.popupItemText,
                      selected && styles.popupItemTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 45,
    paddingBottom: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", flex: 1 },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  filterRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  dropdownBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardTitle: {
    fontWeight: "700",
    marginBottom: 8,
    color: "#494949",
    fontSize: 15,
  },

  // Distribution chart
  chartWrapper: {
    flexDirection: "row",
    marginTop: 4,
  },
  yAxis: {
    width: 34,
    justifyContent: "space-between",
    paddingVertical: 10,
    marginRight: 4,
  },
  yTickRow: {
    height: 18,
    justifyContent: "center",
  },
  yLabel: {
    fontSize: 9,
    color: "#888",
  },
  chartArea: {
    flex: 1,
    height: 150,
    position: "relative",
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 6,
  },
  yAxisLine: {
    position: "absolute",
    left: 0,
    top: 4,
    bottom: 14,
    borderLeftWidth: 1,
    borderColor: "#cfcfcf",
  },
  xAxisLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 14,
    borderBottomWidth: 1,
    borderColor: "#cfcfcf",
  },
  barRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingBottom: 14,
  },
  barGroup: {
    alignItems: "center",
  },
  bar: {
    width: 22,
    borderRadius: 4,
    backgroundColor: "#00b679",
  },
  xLabel: {
    marginTop: 4,
    fontSize: 9,
    color: "#888",
  },
  axisCaptions: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  xAxisCaption: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 10,
    color: "#888",
  },
  yAxisCaption: {
    fontSize: 10,
    color: "#888",
  },

  // Class performance donut
  performanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  donutWrapper: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenterNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  donutCenterLabel: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },

  legend: {
    flex: 1,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#777",
  },
  legendLabel: {
    fontWeight: "600",
    color: "#555",
  },
  legendLight: {
    fontStyle: "italic",
    color: "#aaa",
  },

  // Top 10 table
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  topTitle: {
    fontWeight: "700",
  },
  topQuizLabel: {
    fontSize: 12,
    color: "#777",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e4",
    marginBottom: 2,
  },
  tableCellName: {
    flex: 1,
    fontSize: 12,
    color: "#333",
  },
  tableCellScore: {
    width: 50,
    textAlign: "right",
    fontSize: 12,
    color: "#333",
  },
  tableHeaderText: {
    fontWeight: "700",
    color: "#555",
  },
  viewMoreBtn: {
    marginTop: 6,
    alignItems: "flex-end",
  },
  viewMoreText: {
    fontSize: 11,
    color: "#00b679",
    textDecorationLine: "underline",
  },

  // popup styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  popup: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  popupItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  popupItemSelected: {
    backgroundColor: "#00b679",
  },
  popupItemText: {
    fontSize: 14,
    color: "#333",
  },
  popupItemTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
});
