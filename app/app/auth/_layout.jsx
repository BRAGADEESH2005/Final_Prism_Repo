import { Stack, useRouter } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function AuthLayout() {
  const router = useRouter();

  const navigateToHome = () => {
    router.navigate("/");
  };

  return (
    <View style={styles.container}>
      {/* Header with clickable app name */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateToHome}>
          <Text style={styles.headerText}>AudioFinder</Text>
        </TouchableOpacity>
      </View>

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "fade",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: "center",
    backgroundColor: "#333",
    width: "100%",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
});
