import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  FlatList,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";

const Profile = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    byType: {
      bonafide: 0,
      spoof: 0,
      "Non speech": 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState(null);

  // Function to fetch user feedback
  const fetchUserFeedback = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${API_BASE_URL}/feedback/my-feedback`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("User feedback:", response.data);

      // Set feedback data
      const feedbackItems = response.data.data || [];
      setFeedbackData(feedbackItems);

      // Calculate feedback statistics
      calculateFeedbackStats(feedbackItems);
    } catch (error) {
      console.error("Failed to fetch user feedback:", error);
      Alert.alert("Error", "Failed to load your feedback data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate statistics from feedback data
  const calculateFeedbackStats = (feedbackItems) => {
    if (!feedbackItems || feedbackItems.length === 0) {
      setFeedbackStats({
        total: 0,
        correct: 0,
        incorrect: 0,
        byType: {
          bonafide: 0,
          spoof: 0,
          "Non speech": 0,
        },
      });
      return;
    }

    const stats = {
      total: feedbackItems.length,
      correct: 0,
      incorrect: 0,
      byType: {
        bonafide: 0,
        spoof: 0,
        "Non speech": 0,
      },
    };

    // Process each feedback item
    feedbackItems.forEach((item) => {
      // Count by feedback type
      if (item.userFeedback === "correct") {
        stats.correct++;
      } else {
        stats.incorrect++;
      }

      // Count by classification type
      const classification = item.originalClassification;
      if (stats.byType.hasOwnProperty(classification)) {
        stats.byType[classification]++;
      }
    });

    setFeedbackStats(stats);
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserFeedback();
  }, []);

  // Check authentication and fetch initial data
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
    } else {
      fetchUserFeedback();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            await logout();
            router.replace("/");
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Get human readable classification name
  const getClassificationName = (classification) => {
    switch (classification) {
      case "bonafide":
        return "Human Voice";
      case "spoof":
        return "AI Voice";
      case "Non speech":
        return "Non-Speech Audio";
      default:
        return classification;
    }
  };

  // Render a feedback item
  const renderFeedbackItem = ({ item }) => (
    <TouchableOpacity
      style={styles.feedbackItem}
      onPress={() =>
        setExpandedFeedback(expandedFeedback === item._id ? null : item._id)
      }
    >
      <View style={styles.feedbackHeader}>
        <View style={styles.feedbackTypeContainer}>
          {item.userFeedback === "correct" ? (
            <MaterialIcons name="check-circle" size={16} color="#10B981" />
          ) : (
            <MaterialIcons name="cancel" size={16} color="#EF4444" />
          )}
          <Text
            style={[
              styles.feedbackType,
              item.userFeedback === "correct"
                ? styles.correctFeedback
                : styles.incorrectFeedback,
            ]}
          >
            {item.userFeedback === "correct" ? "Correct" : "Incorrect"}
          </Text>
        </View>
        <Text style={styles.feedbackDate}>{formatDate(item.timestamp)}</Text>
      </View>

      <View style={styles.feedbackContent}>
        <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
          {item.fileName}
        </Text>

        <View style={styles.classificationContainer}>
          <Text style={styles.classificationLabel}>Classification:</Text>
          <Text style={styles.classificationValue}>
            {getClassificationName(item.originalClassification)}
          </Text>
        </View>

        {expandedFeedback === item._id &&
          item.userFeedback === "incorrect" &&
          item.correctClassification && (
            <View style={styles.expandedContent}>
              <View style={styles.dividerLine} />
              <View style={styles.correctionContainer}>
                <Text style={styles.correctionLabel}>Your Correction:</Text>
                <Text style={styles.correctionValue}>
                  {getClassificationName(item.correctClassification)}
                </Text>
              </View>
            </View>
          )}
      </View>

      <MaterialIcons
        name={expandedFeedback === item._id ? "expand-less" : "expand-more"}
        size={20}
        color="#aaa"
        style={styles.expandIcon}
      />
    </TouchableOpacity>
  );

  // Empty state component for feedback list
  const EmptyFeedbackList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="feedback" size={48} color="#444" />
      <Text style={styles.emptyText}>No feedback history found</Text>
      <Text style={styles.emptySubtext}>
        Your feedback helps improve our voice classification model.
      </Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#111", "black"]} style={styles.container}>
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#111", "black"]} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
              title="Pull to refresh"
              titleColor="#ffffff"
            />
          }
        >
          <View style={styles.content}>
            {/* User Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileImageContainer}>
                <Text style={styles.profileInitial}>
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
              <Text style={styles.username}>{user?.username || "User"}</Text>
              <Text style={styles.email}>
                {user?.email || "email@example.com"}
              </Text>
            </View>

            {/* Feedback Stats Card */}
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsHeader}>
                <Text style={styles.cardTitle}>Feedback Analytics</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchUserFeedback}
                  disabled={loading}
                >
                  <MaterialIcons name="refresh" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.loader}
                />
              ) : (
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{feedbackStats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {feedbackStats.byType.bonafide}
                    </Text>
                    <Text style={styles.statLabel}>Human</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {feedbackStats.byType.spoof}
                    </Text>
                    <Text style={styles.statLabel}>AI</Text>
                  </View>
                  
                  <View style={styles.divider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {feedbackStats.byType["Non speech"]}
                    </Text>
                    <Text style={styles.statLabel}>Non-Speech</Text>
                  </View>
                </View>
              )}

              <View style={styles.feedbackAccuracyContainer}>
                <Text style={styles.chartTitle}>Classification Accuracy</Text>
                
                <View style={styles.accuracyItem}>
                  <View style={styles.accuracyBar}>
                    <View
                      style={[
                        styles.accuracyFill,
                        styles.correctFill,
                        {
                          width: `${
                            feedbackStats.total > 0
                              ? (feedbackStats.correct / feedbackStats.total) *
                                100
                              : 0
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.accuracyLabelContainer}>
                    <MaterialIcons
                      name="check-circle"
                      size={16}
                      color="#10B981"
                    />
                    <Text style={styles.accuracyLabel}>
                      Correct: {feedbackStats.correct}
                    </Text>
                  </View>
                </View>

                <View style={styles.accuracyItem}>
                  <View style={styles.accuracyBar}>
                    <View
                      style={[
                        styles.accuracyFill,
                        styles.incorrectFill,
                        {
                          width: `${
                            feedbackStats.total > 0
                              ? (feedbackStats.incorrect /
                                  feedbackStats.total) *
                                100
                              : 0
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.accuracyLabelContainer}>
                    <MaterialIcons name="cancel" size={16} color="#EF4444" />
                    <Text style={styles.accuracyLabel}>
                      Incorrect: {feedbackStats.incorrect}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.chartTitle, {marginTop: 20}]}>Classification Distribution</Text>
                
                <View style={styles.accuracyItem}>
                  <View style={styles.accuracyBar}>
                    <View
                      style={[
                        styles.accuracyFill,
                        styles.humanFill,
                        {
                          width: `${
                            feedbackStats.total > 0
                              ? (feedbackStats.byType.bonafide / feedbackStats.total) *
                                100
                              : 0
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.accuracyLabelContainer}>
                    <MaterialIcons name="person" size={16} color="#4299E1" />
                    <Text style={styles.accuracyLabel}>
                      Human Voice: {feedbackStats.byType.bonafide}
                    </Text>
                  </View>
                </View>

                <View style={styles.accuracyItem}>
                  <View style={styles.accuracyBar}>
                    <View
                      style={[
                        styles.accuracyFill,
                        styles.aiFill,
                        {
                          width: `${
                            feedbackStats.total > 0
                              ? (feedbackStats.byType.spoof / feedbackStats.total) *
                                100
                              : 0
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.accuracyLabelContainer}>
                    <MaterialIcons name="android" size={16} color="#F59E0B" />
                    <Text style={styles.accuracyLabel}>
                      AI Voice: {feedbackStats.byType.spoof}
                    </Text>
                  </View>
                </View>

                <View style={styles.accuracyItem}>
                  <View style={styles.accuracyBar}>
                    <View
                      style={[
                        styles.accuracyFill,
                        styles.nonSpeechFill,
                        {
                          width: `${
                            feedbackStats.total > 0
                              ? (feedbackStats.byType["Non speech"] / feedbackStats.total) *
                                100
                              : 0
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.accuracyLabelContainer}>
                    <MaterialIcons name="volume-off" size={16} color="#A78BFA" />
                    <Text style={styles.accuracyLabel}>
                      Non-Speech: {feedbackStats.byType["Non speech"]}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Feedback History Section */}
            <View style={styles.feedbackHistoryCard}>
              <View style={styles.feedbackHistoryHeader}>
                <Text style={styles.cardTitle}>Feedback History</Text>
              </View>

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.loader}
                />
              ) : feedbackData.length > 0 ? (
                <FlatList
                  data={feedbackData}
                  renderItem={renderFeedbackItem}
                  keyExtractor={(item) =>
                    item._id || item.id || String(Math.random())
                  }
                  scrollEnabled={false} // Disable scrolling since we're in a ScrollView
                  style={styles.feedbackList}
                />
              ) : (
                <EmptyFeedbackList />
              )}
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: "center",
  },
  profileCard: {
    width: "100%",
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: "#aaa",
  },
  analyticsCard: {
    width: "100%",
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  analyticsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#333",
  },
  loader: {
    marginVertical: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
  },
  divider: {
    width: 1,
    backgroundColor: "#444",
    marginHorizontal: 5,
  },
  feedbackAccuracyContainer: {
    marginTop: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  accuracyItem: {
    marginBottom: 12,
  },
  accuracyBar: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  accuracyFill: {
    height: "100%",
    borderRadius: 4,
  },
  correctFill: {
    backgroundColor: "#10B981",
  },
  incorrectFill: {
    backgroundColor: "#EF4444",
  },
  humanFill: {
    backgroundColor: "#4299E1", // Blue for human voice
  },
  aiFill: {
    backgroundColor: "#F59E0B", // Amber for AI voice
  },
  nonSpeechFill: {
    backgroundColor: "#A78BFA", // Purple for non-speech
  },
  accuracyLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  accuracyLabel: {
    color: "#aaa",
    fontSize: 14,
    marginLeft: 8,
  },
  feedbackHistoryCard: {
    width: "100%",
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  feedbackHistoryHeader: {
    marginBottom: 16,
  },
  feedbackList: {
    width: "100%",
  },
  feedbackItem: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  feedbackTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedbackType: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  correctFeedback: {
    color: "#10B981",
  },
  incorrectFeedback: {
    color: "#EF4444",
  },
  feedbackDate: {
    color: "#777",
    fontSize: 12,
  },
  feedbackContent: {
    flex: 1,
  },
  fileName: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
  },
  classificationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  classificationLabel: {
    color: "#aaa",
    fontSize: 14,
    marginRight: 6,
  },
  classificationValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  expandedContent: {
    marginTop: 12,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#444",
    marginVertical: 8,
  },
  correctionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  correctionLabel: {
    color: "#aaa",
    fontSize: 14,
    marginRight: 6,
  },
  correctionValue: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "500",
  },
  expandIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyText: {
    color: "#ccc",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
  },
  emptySubtext: {
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: "#333",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});