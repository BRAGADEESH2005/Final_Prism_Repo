import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { API_BASE_URL } from "../config/api";

const FeedbackModal = ({
  visible,
  onClose,
  result,
  audioFileName,
  userEmail,
}) => {
  const [feedbackClassification, setFeedbackClassification] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Reset state when modal visibility changes
  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setFeedbackClassification("");
      setFeedbackText("");
      setIsSubmitting(false);
      setSubmitError(null);
    }
  }, [visible]);

  // Function to safely close the modal
  const safeClose = () => {
    if (!isSubmitting) {
      setFeedbackClassification("");
      setFeedbackText("");
      setSubmitError(null);
      onClose();
    }
  };

  // Map feedback text to classification values
  const getFeedbackValue = (feedback) => {
    if (feedback === "human") return "bonafide";
    if (feedback === "ai") return "spoof";
    if (feedback === "nonspeech") return "Non speech";
    return null;
  };

  // Handle saving feedback to server
  const saveFeedback = async (isCorrect, feedback = "") => {
    // Don't allow multiple submissions
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Get auth token
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      // Create feedback payload
      const feedbackData = {
        fileName: audioFileName,
        originalClassification: result.prediction,
        userFeedback: isCorrect ? "correct" : "incorrect",
        correctClassification: isCorrect ? null : getFeedbackValue(feedback),
      };

      console.log("Sending feedback to server:", feedbackData);

      // Send feedback to server with timeout
      const response = await axios.post(
        `${API_BASE_URL}/feedback`,
        feedbackData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("Feedback submission response:", response.data);

      // Reset states
      setFeedbackClassification("");
      setFeedbackText("");
      setIsSubmitting(false);

      // Thank the user and close modal
      Alert.alert(
        "Feedback Submitted",
        "Thank you for helping us improve our classification model!",
        [{ text: "OK", onPress: safeClose }]
      );
    } catch (error) {
      console.error("Failed to save feedback:", error);
      setIsSubmitting(false);

      // Format error message
      let errorMessage = "Failed to save your feedback. Please try again.";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Set error message
      setSubmitError(errorMessage);

      // Show error alert
      Alert.alert(
        "Error",
        errorMessage,
        [
          { 
            text: "Try Again",
            onPress: () => setSubmitError(null)
          },
          { 
            text: "Cancel",
            onPress: safeClose,
            style: "cancel"
          }
        ]
      );
    }
  };

  // Render appropriate icon based on prediction
  const renderResultIcon = () => {
    if (result.prediction === "bonafide") {
      return <MaterialIcons name="check-circle" size={24} color="#10B981" />;
    } else if (result.prediction === "spoof") {
      return <MaterialIcons name="warning" size={24} color="#EF4444" />;
    } else {
      return <MaterialIcons name="volume-off" size={24} color="#F59E0B" />;
    }
  };

  // Get human-friendly result text
  const getResultText = () => {
    if (result.prediction === "bonafide") {
      return "Human Voice";
    } else if (result.prediction === "spoof") {
      return "AI-Generated Voice";
    } else {
      return "Non-Speech Audio";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={safeClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.feedbackModal}>
          <Text style={styles.feedbackTitle}>
            Was the classification correct?
          </Text>

          <View style={styles.feedbackResultSummary}>
            <Text style={styles.feedbackResultText}>{getResultText()}</Text>
            {renderResultIcon()}
          </View>

          {submitError && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}

          <View style={styles.feedbackButtons}>
            <TouchableOpacity
              style={[
                styles.feedbackButton,
                styles.feedbackCorrectButton,
                isSubmitting && styles.feedbackButtonDisabled,
              ]}
              onPress={() => saveFeedback(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <MaterialIcons name="thumb-up" size={20} color="white" />
              )}
              <Text style={styles.feedbackButtonText}>
                {isSubmitting ? "Submitting..." : "Yes, Correct"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.feedbackButton,
                styles.feedbackIncorrectButton,
                isSubmitting && styles.feedbackButtonDisabled,
              ]}
              onPress={() => setFeedbackClassification("incorrect")}
              disabled={isSubmitting}
            >
              <MaterialIcons name="thumb-down" size={20} color="white" />
              <Text style={styles.feedbackButtonText}>No, Incorrect</Text>
            </TouchableOpacity>
          </View>

          {feedbackClassification === "incorrect" && (
            <View style={styles.feedbackInputContainer}>
              <Text style={styles.feedbackLabel}>What should it be?</Text>

              <View style={styles.feedbackOptionButtons}>
                <TouchableOpacity
                  style={[
                    styles.feedbackOptionButton,
                    feedbackText === "human" &&
                      styles.feedbackOptionButtonSelected,
                  ]}
                  onPress={() => setFeedbackText("human")}
                  disabled={isSubmitting}
                >
                  <Text style={styles.feedbackOptionText}>Human Voice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.feedbackOptionButton,
                    feedbackText === "ai" &&
                      styles.feedbackOptionButtonSelected,
                  ]}
                  onPress={() => setFeedbackText("ai")}
                  disabled={isSubmitting}
                >
                  <Text style={styles.feedbackOptionText}>AI Voice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.feedbackOptionButton,
                    feedbackText === "nonspeech" &&
                      styles.feedbackOptionButtonSelected,
                  ]}
                  onPress={() => setFeedbackText("nonspeech")}
                  disabled={isSubmitting}
                >
                  <Text style={styles.feedbackOptionText}>Non-Speech</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.feedbackActionButtons}>
                <TouchableOpacity
                  style={[
                    styles.feedbackSubmitButton,
                    (!feedbackText || isSubmitting) &&
                      styles.feedbackSubmitButtonDisabled,
                  ]}
                  onPress={() => saveFeedback(false, feedbackText)}
                  disabled={!feedbackText || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.feedbackSubmitText}>
                      Submit Feedback
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.feedbackCancelButton}
                  onPress={() => {
                    setFeedbackClassification("");
                    setFeedbackText("");
                  }}
                  disabled={isSubmitting}
                >
                  <Text style={styles.feedbackCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.feedbackCloseButton}
            onPress={safeClose}
            disabled={isSubmitting}
          >
            <Text style={styles.feedbackCloseText}>
              {isSubmitting ? "Please wait..." : "Skip"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackModal: {
    backgroundColor: "#222",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  feedbackResultSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: "80%",
  },
  feedbackResultText: {
    color: "#fff",
    fontSize: 16,
    marginRight: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  feedbackButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
  },
  feedbackCorrectButton: {
    backgroundColor: "#10B981",
  },
  feedbackIncorrectButton: {
    backgroundColor: "#EF4444",
  },
  feedbackButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  feedbackInputContainer: {
    width: "100%",
    marginTop: 8,
  },
  feedbackLabel: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 12,
  },
  feedbackOptionButtons: {
    flexDirection: "column",
    width: "100%",
    marginBottom: 16,
  },
  feedbackOptionButton: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    marginBottom: 8,
  },
  feedbackOptionButtonSelected: {
    backgroundColor: "rgba(66, 153, 225, 0.5)",
    borderColor: "#4299E1",
    borderWidth: 1,
  },
  feedbackOptionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  feedbackActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  feedbackSubmitButton: {
    backgroundColor: "#4461F2",
    padding: 12,
    borderRadius: 8,
    flex: 3,
    marginRight: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackSubmitButtonDisabled: {
    backgroundColor: "rgba(68, 97, 242, 0.5)",
  },
  feedbackCancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 8,
    flex: 2,
  },
  feedbackSubmitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  feedbackCancelText: {
    color: "#aaa",
    textAlign: "center",
  },
  feedbackCloseButton: {
    marginTop: 16,
    padding: 8,
  },
  feedbackCloseText: {
    color: "#aaa",
    fontSize: 14,
  },
  feedbackButtonDisabled: {
    opacity: 0.5,
  },
});

export default FeedbackModal;