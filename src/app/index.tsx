// app/(auth)/splash.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#0EA47A", "#017EBA"]} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.logoWrap}>
        <Image
          source={require("../assets/images/logo-aiscorer.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>AI Scorer</Text>
        <Text style={styles.tagline}>Fast. Accurate. Automated.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.button, styles.login]}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={[styles.buttonText, styles.loginText]}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.button, styles.signup]}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text style={[styles.buttonText, styles.signupText]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
  logoWrap: { alignItems: "center", marginBottom: 40 },
  logo: { width: 150, height: 150, marginBottom: 0 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff" },
  tagline: { marginTop: 6, color: "rgba(255,255,255,0.9)" },

  buttonContainer: { width: "100%", gap: 14, maxWidth: 420 },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  // Primary (white) button
  login: { backgroundColor: "#fff" },
  loginText: { color: "#0EA47A" },

  // Outline button
  signup: { borderWidth: 2, borderColor: "#fff" },
  signupText: { color: "#fff" },

  buttonText: { fontWeight: "700", fontSize: 16 },
});
