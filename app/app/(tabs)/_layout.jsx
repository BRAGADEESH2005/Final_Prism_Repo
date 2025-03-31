import { Tabs } from "expo-router";
import React from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const Header = () => (
  <View style={styles.header}>
    <Text style={styles.headerText}>AudioFinder</Text>
  </View>
);

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <Header />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="upload"
          options={{
            title: "Upload",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="cloud.upload.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 40 : 40,
    paddingBottom: 20,
    alignItems: "center",
    backgroundColor: "#333",
    width: "100%",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center", // Ensure text is centered
    marginHorizontal: 20, // Add some margin to avoid overflow
    flexShrink: 1, // Allow text to shrink if it exceeds available space
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
    backgroundColor: "#333",
    width: "100%",
  },
  footerText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center", // Ensure footer text is centered
    marginHorizontal: 20, // Add some margin to avoid overflow
    flexShrink: 1, // Allow text to shrink if it exceeds available space
  },
});
