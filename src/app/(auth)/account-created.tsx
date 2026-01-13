import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AccountCreated() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Created</Text>
      <Text style={styles.subtitle}>Your account has successfully been created!</Text>

      <Image source={require("../../assets/images/account-created.png")} style={styles.image} />

      <Text style={styles.footer}>Account created. Please log in to continue.</Text>

      <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
        <Text style={styles.link}>Tap to go Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 30,
    backgroundColor: "#FFFFFF",     // ✅ forces white background
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 20 },
  image: { width: 200, height: 200, resizeMode: "contain" },
  footer: { marginTop: 25, fontSize: 14, color: "#444" },
  link: { marginTop: 15, color: "#017EBA", fontWeight: "600" }, // nicer link color
});
