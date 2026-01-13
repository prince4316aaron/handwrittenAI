import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ResetSuccess() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="checkmark-circle" size={90} color="#0EA47A" />
        <Text style={styles.title}>Password Reset Successfully!</Text>

        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.link}>Tap to go Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30, marginTop: -70, },


  // keeps everything vertically centered together
  content: {
    alignItems: "center",
    gap: 20, // modern way to add consistent spacing without breaking centering
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center", // prevents shifting on narrow screens
  },

  link: {
    color: "#888",
    textAlign: "center",
  },
});
