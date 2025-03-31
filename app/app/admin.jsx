import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
  } from "react-native";
  import React, { useEffect, useState, useCallback } from "react";
  import { useRouter } from "expo-router";
  import { LinearGradient } from "expo-linear-gradient";
  import { useAuth } from "../context/AuthContext";
  import { MaterialIcons } from "@expo/vector-icons";
  import axios from "axios";
  import { API_BASE_URL } from "../config/api";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  
  const AdminDashboard = () => {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [feedbackData, setFeedbackData] = useState([]);
    const [statistics, setStatistics] = useState({
      total: 0,
      correct: 0,
      incorrect: 0,
      byType: {
        bonafide: 0,
        spoof: 0,
        "Non speech": 0,
      },
      byUser: {},
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedItem, setExpandedItem] = useState(null);
  
    useEffect(() => {
      // Check if user is admin, otherwise redirect
      if (!isAuthenticated) {
        router.replace("/auth/login");
        return;
      }
  
      if (user?.email !== "22z214@psgtech.ac.in") {
        Alert.alert(
          "Access Denied",
          "You don't have permission to access this page."
        );
        router.replace("/");
        return;
      }
  
      fetchAllFeedback();
    }, [isAuthenticated, user]);
  
    const fetchAllFeedback = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("authToken");
  
        if (!token) {
          throw new Error("Authentication token not found");
        }
  
        const response = await axios.get(`${API_BASE_URL}/feedback/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        console.log("All feedback data:", response.data);
        
        // Set feedback data
        const feedbackItems = response.data.data || [];
        setFeedbackData(feedbackItems);
        
        // Calculate statistics
        calculateStatistics(feedbackItems);
      } catch (error) {
        console.error("Failed to fetch feedback data:", error);
        Alert.alert(
          "Error",
          "Failed to load feedback data. Please try again later."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
  
    const calculateStatistics = (feedbackItems) => {
      if (!feedbackItems || feedbackItems.length === 0) {
        setStatistics({
          total: 0,
          correct: 0,
          incorrect: 0,
          byType: {
            bonafide: 0,
            spoof: 0,
            "Non speech": 0,
          },
          byUser: {},
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
        byUser: {},
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
  
        // Count by user
        const userEmail = item.email;
        if (!stats.byUser[userEmail]) {
          stats.byUser[userEmail] = 1;
        } else {
          stats.byUser[userEmail]++;
        }
      });
  
      setStatistics(stats);
    };
  
    const onRefresh = useCallback(() => {
      setRefreshing(true);
      fetchAllFeedback();
    }, []);
  
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
  
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
  
    const renderFeedbackItem = ({ item }) => (
      <TouchableOpacity
        style={styles.feedbackItem}
        onPress={() => setExpandedItem(expandedItem === item._id ? null : item._id)}
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
  
        <View style={styles.feedbackUserContainer}>
          <MaterialIcons name="person" size={16} color="#777" />
          <Text style={styles.feedbackUser}>{item.email}</Text>
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
  
          {expandedItem === item._id && item.userFeedback === "incorrect" && item.correctClassification && (
            <View style={styles.expandedContent}>
              <View style={styles.dividerLine} />
              <View style={styles.correctionContainer}>
                <Text style={styles.correctionLabel}>User Correction:</Text>
                <Text style={styles.correctionValue}>
                  {getClassificationName(item.correctClassification)}
                </Text>
              </View>
            </View>
          )}
        </View>
  
        <MaterialIcons
          name={expandedItem === item._id ? "expand-less" : "expand-more"}
          size={20}
          color="#aaa"
          style={styles.expandIcon}
        />
      </TouchableOpacity>
    );
  
    const renderStatsCard = () => (
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Global Feedback Statistics</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.total}</Text>
            <Text style={styles.statLabel}>Total Feedback</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Object.keys(statistics.byUser).length}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
        </View>
        
        <View style={styles.accuracyContainer}>
          <Text style={styles.subTitle}>Classification Accuracy</Text>
          
          <View style={styles.accuracyItem}>
            <View style={styles.accuracyBar}>
              <View
                style={[
                  styles.accuracyFill,
                  styles.correctFill,
                  {
                    width: `${
                      statistics.total > 0
                        ? (statistics.correct / statistics.total) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
            <View style={styles.accuracyLabelContainer}>
              <MaterialIcons name="check-circle" size={16} color="#10B981" />
              <Text style={styles.accuracyLabel}>
                Correct: {statistics.correct} ({statistics.total > 0 
                  ? Math.round((statistics.correct / statistics.total) * 100) 
                  : 0}%)
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
                      statistics.total > 0
                        ? (statistics.incorrect / statistics.total) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
            <View style={styles.accuracyLabelContainer}>
              <MaterialIcons name="cancel" size={16} color="#EF4444" />
              <Text style={styles.accuracyLabel}>
                Incorrect: {statistics.incorrect} ({statistics.total > 0 
                  ? Math.round((statistics.incorrect / statistics.total) * 100) 
                  : 0}%)
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.classificationContainer}>
          <Text style={styles.subTitle}>Classification Distribution</Text>
          
          <View style={styles.distributionRow}>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionIcon, styles.humanIcon]}>
                <MaterialIcons name="person" size={20} color="#fff" />
              </View>
              <Text style={styles.distributionValue}>{statistics.byType.bonafide}</Text>
              <Text style={styles.distributionLabel}>Human</Text>
            </View>
            
            <View style={styles.distributionItem}>
              <View style={[styles.distributionIcon, styles.aiIcon]}>
                <MaterialIcons name="android" size={20} color="#fff" />
              </View>
              <Text style={styles.distributionValue}>{statistics.byType.spoof}</Text>
              <Text style={styles.distributionLabel}>AI</Text>
            </View>
            
            <View style={styles.distributionItem}>
              <View style={[styles.distributionIcon, styles.nonspeechIcon]}>
                <MaterialIcons name="volume-off" size={20} color="#fff" />
              </View>
              <Text style={styles.distributionValue}>{statistics.byType["Non speech"]}</Text>
              <Text style={styles.distributionLabel}>Non-Speech</Text>
            </View>
          </View>
        </View>
      </View>
    );
  
    if (loading && !refreshing) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <LinearGradient colors={["#111", "black"]} style={styles.container}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading admin dashboard...</Text>
          </LinearGradient>
        </SafeAreaView>
      );
    }
  
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#111", "black"]} style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchAllFeedback}>
              <MaterialIcons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
  
          <FlatList
            data={feedbackData}
            renderItem={renderFeedbackItem}
            keyExtractor={(item) => item._id || item.id || String(Math.random())}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#ffffff"
                title="Pull to refresh"
                titleColor="#ffffff"
              />
            }
            ListHeaderComponent={renderStatsCard}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="feedback" size={48} color="#444" />
                <Text style={styles.emptyText}>No feedback data found</Text>
              </View>
            }
          />
        </LinearGradient>
      </SafeAreaView>
    );
  };
  
  export default AdminDashboard;
  
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#333",
      marginTop: 20,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#fff",
    },
    backButton: {
      padding: 8,
    },
    refreshButton: {
      padding: 8,
    },
    listContent: {
      padding: 16,
      paddingBottom: 100,
    },
    loadingText: {
      color: "#fff",
      marginTop: 16,
      fontSize: 16,
    },
    statsCard: {
      backgroundColor: "#222",
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 20,
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#fff",
    },
    statLabel: {
      fontSize: 14,
      color: "#aaa",
      marginTop: 4,
    },
    accuracyContainer: {
      marginBottom: 20,
    },
    subTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#ddd",
      marginBottom: 12,
    },
    accuracyItem: {
      marginBottom: 10,
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
    accuracyLabelContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    accuracyLabel: {
      color: "#aaa",
      fontSize: 14,
      marginLeft: 8,
    },
    distributionRow: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    distributionItem: {
      alignItems: "center",
    },
    distributionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    humanIcon: {
      backgroundColor: "#4299E1",
    },
    aiIcon: {
      backgroundColor: "#F59E0B",
    },
    nonspeechIcon: {
      backgroundColor: "#A78BFA",
    },
    distributionValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#fff",
    },
    distributionLabel: {
      fontSize: 12,
      color: "#aaa",
      marginTop: 2,
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
      marginBottom: 8,
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
    feedbackUserContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    feedbackUser: {
      color: "#aaa",
      fontSize: 13,
      marginLeft: 6,
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
      paddingVertical: 40,
    },
    emptyText: {
      color: "#ccc",
      fontSize: 16,
      fontWeight: "bold",
      marginTop: 12,
    },
  });