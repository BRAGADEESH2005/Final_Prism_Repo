import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  Platform,
  SafeAreaView,
} from "react-native";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import FeedbackModal from "../FeedbackModal";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Progress from "react-native-progress";

// Classification API endpoint
const CLASSIFICATION_API_URL = "https://violet-guests-agree.loca.lt/predict";

const Upload = () => {
  const router = useRouter();
  const { isAuthenticated, initialized, user } = useAuth();

  // States for audio handling
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // States for UI
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef(null);

  // Add this useEffect to show the feedback modal after a result is shown
  useEffect(() => {
    if (result && !showFeedbackModal) {
      // Show feedback modal with a delay to let user see results first
      const timer = setTimeout(() => {
        setShowFeedbackModal(true);
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [result]);

  // Check authentication and redirect if needed
  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, initialized]);

  // Clean up resources on unmount
  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [recording, sound]);
  // At the top of your component, add this effect
  useEffect(() => {
    // Set up audio mode
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error("Failed to set audio mode:", error);
      }
    };

    setupAudio();
  }, []);

  // Replace the current timer implementation with a useEffect-based approach
  useEffect(() => {
    let interval = null;

    if (recording) {
      // Reset duration when recording starts
      setRecordingDuration(0);

      // Create an interval that runs every second
      interval = setInterval(() => {
        setRecordingDuration((prev) => {
          const newValue = prev + 1;
          return newValue;
        });
      }, 1000);

      console.log("Recording timer started");
    } else if (!recording && recordingDuration !== 0) {
      // Clear the interval when recording stops
      console.log("Recording timer stopped");
    }

    // Clean up function
    return () => {
      if (interval) {
        clearInterval(interval);
        console.log("Timer interval cleared");
      }
    };
  }, [recording]); // Only re-run this effect when recording state changes

  // Modify your startRecording function to simplify timer handling
  // Modify the startRecording function to use M4A format
  const startRecording = async () => {
    try {
      // Clear previous data
      setAudioUri(null);
      setAudioFile(null);
      setResult(null);
      setRecordingDuration(0);

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please allow microphone access to record audio."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Use the default high-quality preset which produces M4A files
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      console.log("Recording started with M4A format");
    } catch (error) {
      console.error("Failed to start recording", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  // Update the stopRecording function to use M4A format
  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);

      setAudioUri(uri);
      setAudioFile({
        name: `recording_${new Date().toISOString().replace(/:/g, "-")}.m4a`,
        uri: uri,
        type: "audio/m4a", // Updated MIME type for M4A
        size: fileInfo.size,
      });

      // This will trigger the useEffect to clean up the timer
      setRecording(null);
      console.log("Recording stopped, M4A audio file saved at:", uri);
    } catch (error) {
      console.error("Failed to stop recording", error);
      Alert.alert("Error", "Failed to stop recording. Please try again.");
    }
  };

  // Handle file upload
  const pickFile = async () => {
    try {
      // Clear previous data
      setAudioUri(null);
      setAudioFile(null);
      setResult(null);
      console.log("Picking file...");

      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
      });
      console.log("File picker result:", result, result.canceled);

      // Define allowed audio formats
      const ALLOWED_AUDIO_FORMATS = ["wav", "mp3", "ogg", "flac"];

      // Update the file picker code with format checking and extension handling
      if (result.canceled === false) {
        const asset = result.assets[0];
        console.log("File selected:", asset.uri);

        // Check for file extension and add one if missing
        let fileName = asset.name;
        let fileType = asset.mimeType;

        // If the file doesn't have a proper name or extension
        if (!fileName || !fileName.includes(".")) {
          // Try to determine extension from MIME type
          let extension = "wav"; // Default to WAV

          if (fileType) {
            if (fileType.includes("wav") || fileType.includes("x-wav")) {
              extension = "wav";
            } else if (fileType.includes("mp3") || fileType.includes("mpeg")) {
              extension = "mp3";
            } else if (fileType.includes("ogg")) {
              extension = "ogg";
            } else if (
              fileType.includes("flac") ||
              fileType.includes("x-flac")
            ) {
              extension = "flac";
            }
          }

          // Create a filename with extension if it's missing
          fileName = fileName
            ? `${fileName}.${extension}`
            : `audio_${new Date()
                .toISOString()
                .replace(/:/g, "-")}.${extension}`;
          fileType = fileType || `audio/${extension}`;
        }

        // Verify file format is supported
        const fileExt = fileName.split(".").pop().toLowerCase();
        if (!ALLOWED_AUDIO_FORMATS.includes(fileExt)) {
          Alert.alert(
            "Unsupported Format",
            `The selected file format (.${fileExt}) is not supported. Please use WAV, MP3, OGG, or FLAC files.`,
            [{ text: "OK" }]
          );
          return;
        }

        // Set the audio file with proper name and type
        setAudioUri(asset.uri);
        setAudioFile({
          name: fileName,
          uri: asset.uri,
          type: fileType || `audio/${fileExt}`,
          size: asset.size,
        });

        console.log("File selected and processed:", fileName, fileType);
      }
    } catch (error) {
      console.error("Failed to pick file", error);
      Alert.alert("Error", "Failed to select file. Please try again.");
    }
  };
  // Enhanced version of handlePlayPause with better error handling
  const handlePlayPause = async () => {
    try {
      if (!audioUri) {
        Alert.alert("Error", "No audio file available to play");
        return;
      }

      if (isPlaying) {
        // Pause
        if (sound) {
          console.log("Pausing audio");
          await sound.pauseAsync();
          setIsPlaying(false);
        }
      } else {
        // Set audio mode for playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        // If sound is already loaded, play it
        if (sound) {
          console.log("Resuming existing sound");
          await sound.playAsync();
        } else {
          console.log("Creating new sound from URI:", audioUri);
          // Create and play sound
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true },
            (status) => {
              console.log("Playback status update:", status.isPlaying);
              if (status.didJustFinish) {
                console.log("Playback finished");
                setIsPlaying(false);
              }
            }
          );
          setSound(newSound);
          console.log("Sound created and playing");
        }
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      Alert.alert(
        "Playback Error",
        `Failed to ${isPlaying ? "pause" : "play"} audio: ${error.message}`
      );
    }
  };

  // Monitor playback status
  // Monitor playback status
  const onPlaybackStatusUpdate = (status) => {
    if (status && status.didJustFinish) {
      setIsPlaying(false);
    }
  };

  // Handle audio classification
  const classifyAudio = async () => {
    if (!audioFile) {
      Alert.alert("Error", "Please record or upload an audio file first.");
      return;
    }

    try {
      setAnalyzing(true);

      // Create form data for API request
      const formData = new FormData();
      console.log(audioFile.uri, audioFile.name, audioFile.type);
      formData.append("audio_file", {
        uri: audioFile.uri,
        name: audioFile.name,
        type: audioFile.type,
      });

      // Get token for authentication
      const token = await AsyncStorage.getItem("authToken");
      console.log("url:", CLASSIFICATION_API_URL, formData);

      // Make API request
      // Make API request with proper timeout and headers
      const response = await axios.post(CLASSIFICATION_API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        timeout: 800000, // Increase timeout to 60 seconds
        maxContentLength: 100000000, // Increase max content length for large files
        maxBodyLength: 100000000,
      });
      console.log("Classification result:", response.data);

      // Process and set result
      if (response.data && !response.data.error) {
        setResult({
          prediction: response.data.prediction,
          confidence: response.data.confidence,
          timestamp: new Date().toISOString(),
        });

        // Save result to history (optional)
        saveResultToHistory(response.data, audioFile.name);
      } else {
        throw new Error(response.data?.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Classification failed:", error);
      Alert.alert(
        "Classification Failed",
        error.response?.data?.error ||
          error.message ||
          "Failed to classify audio. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Save result to history for future reference
  const saveResultToHistory = async (resultData, filename) => {
    try {
      const historyString = await AsyncStorage.getItem("classificationHistory");
      let history = historyString ? JSON.parse(historyString) : [];

      // Add new result to history
      history.unshift({
        id: Date.now().toString(),
        filename: filename,
        result: resultData.prediction,
        confidence: resultData.confidence,
        timestamp: new Date().toISOString(),
        userEmail: user?.email,
      });

      // Limit history to last 20 items
      if (history.length > 20) {
        history = history.slice(0, 20);
      }

      // Save updated history
      await AsyncStorage.setItem(
        "classificationHistory",
        JSON.stringify(history)
      );

      console.log("Result saved to history");
    } catch (error) {
      console.error("Failed to save result to history:", error);
    }
  };

  // Format time for recording duration
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Handle reset
  // Enhanced reset function
  const handleReset = () => {
    // Clean up audio resources
    if (sound) {
      console.log("Unloading sound");
      sound.unloadAsync();
      setSound(null);
    }
    setAudioUri(null);
    setAudioFile(null);
    setResult(null);
    setIsPlaying(false);
  };

  // Show loading state while checking authentication
  if (!initialized) {
    return (
      <LinearGradient
        colors={["#111", "black"]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  // If auth check is done but user is not authenticated, this will trigger the redirect
  if (!isAuthenticated) {
    return (
      <LinearGradient
        colors={["#111", "black"]}
        style={styles.loadingContainer}
      >
        <Text style={styles.loadingText}>Redirecting to login...</Text>
        <ActivityIndicator size="small" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#111", "black"]} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>Voice Classification</Text>
          <Text style={styles.subheader}>
            Upload or record audio to detect if it's human or AI generated
          </Text>

          {/* Card container */}
          <View style={styles.card}>
            {/* Recording UI */}
            {recording ? (
              <View style={styles.recordingContainer}>
                <Text style={styles.recordingText}>Recording...</Text>
                <View style={styles.durationContainer}>
                  <MaterialIcons name="mic" size={24} color="#f44336" />
                  <Text style={styles.durationText}>
                    {formatTime(recordingDuration)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.stopButton]}
                  onPress={stopRecording}
                >
                  <MaterialIcons name="stop" size={24} color="white" />
                  <Text style={styles.buttonText}>Stop Recording</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Audio file info */}
                {audioFile ? (
                  <View style={styles.audioFileContainer}>
                    <View style={styles.audioFileHeader}>
                      <MaterialIcons
                        name="audio-file"
                        size={28}
                        color="#4CAF50"
                      />
                      <View style={styles.audioFileInfo}>
                        <Text
                          style={styles.audioFileName}
                          numberOfLines={1}
                          ellipsizeMode="middle"
                        >
                          {audioFile.name}
                        </Text>
                        <Text style={styles.audioFileSize}>
                          {formatFileSize(audioFile.size)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.audioActionButton}
                        onPress={handleReset}
                      >
                        <MaterialIcons
                          name="delete"
                          size={22}
                          color="#ff4d4d"
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.audioControls}>
                      <TouchableOpacity
                        style={[
                          styles.audioControlButton,
                          isPlaying && styles.audioControlButtonActive,
                        ]}
                        onPress={handlePlayPause}
                      >
                        <MaterialIcons
                          name={isPlaying ? "pause" : "play-arrow"}
                          size={24}
                          color="white"
                        />
                        <Text style={styles.audioControlText}>
                          {isPlaying ? "Pause" : "Play"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.audioControlButton,
                          styles.classifyButton,
                        ]}
                        onPress={classifyAudio}
                        disabled={analyzing}
                      >
                        <MaterialIcons
                          name="psychology"
                          size={24}
                          color="white"
                        />
                        <Text style={styles.audioControlText}>
                          {analyzing ? "Analyzing..." : "Classify"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    {/* Audio capture options */}
                    <View style={styles.captureOptionsContainer}>
                      <TouchableOpacity
                        style={styles.captureOption}
                        onPress={startRecording}
                      >
                        <View style={styles.captureIconContainer}>
                          <MaterialIcons name="mic" size={36} color="#4CAF50" />
                        </View>
                        <Text style={styles.captureOptionTitle}>
                          Record Audio
                        </Text>
                        <Text style={styles.captureOptionDesc}>
                          Capture voice directly using your microphone
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.optionDivider}></View>

                      <TouchableOpacity
                        style={styles.captureOption}
                        onPress={pickFile}
                      >
                        <View style={styles.captureIconContainer}>
                          <MaterialIcons
                            name="file-upload"
                            size={36}
                            color="#2196F3"
                          />
                        </View>
                        <Text style={styles.captureOptionTitle}>
                          Upload File
                        </Text>
                        <Text style={styles.captureOptionDesc}>
                          Select an audio file from your device
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}
          </View>

          {/* Result Card */}
          {result && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultHeaderText}>Analysis Result</Text>
              </View>

              <View style={styles.resultBody}>
                <View style={styles.resultIconContainer}>
                  {result.prediction === "bonafide" && (
                    <MaterialIcons
                      name="check-circle"
                      size={60}
                      color="#10B981"
                    />
                  )}
                  {result.prediction === "spoof" && (
                    <MaterialIcons name="warning" size={60} color="#EF4444" />
                  )}
                  {result.prediction === "Non speech" && (
                    <MaterialIcons
                      name="volume-off"
                      size={60}
                      color="#F59E0B"
                    />
                  )}
                </View>

                <Text style={styles.resultTitle}>
                  {result.prediction === "bonafide"
                    ? "Human Voice"
                    : result.prediction === "spoof"
                    ? "AI-Generated Voice"
                    : "Non-Speech Audio"}
                </Text>

                <Text style={styles.resultDescription}>
                  {result.prediction === "bonafide"
                    ? "This audio appears to be genuine human speech."
                    : result.prediction === "spoof"
                    ? "This audio appears to be artificially generated or manipulated."
                    : "This audio does not contain recognizable human speech."}
                </Text>

                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceTitle}>Confidence Scores</Text>

                  <View style={styles.confidenceItem}>
                    <View style={styles.confidenceLabel}>
                      <Text style={styles.confidenceName}>Human</Text>
                      <Text style={styles.confidenceValue}>
                        {Math.round(result.confidence.bonafide * 100)}%
                      </Text>
                    </View>
                    <Progress.Bar
                      progress={result.confidence.bonafide}
                      width={null}
                      height={10}
                      color="#10B981"
                      unfilledColor="#e2e8f0"
                      borderWidth={0}
                      style={styles.progressBar}
                    />
                  </View>

                  <View style={styles.confidenceItem}>
                    <View style={styles.confidenceLabel}>
                      <Text style={styles.confidenceName}>AI</Text>
                      <Text style={styles.confidenceValue}>
                        {Math.round(result.confidence.spoof * 100)}%
                      </Text>
                    </View>
                    <Progress.Bar
                      progress={result.confidence.spoof}
                      width={null}
                      height={10}
                      color="#EF4444"
                      unfilledColor="#e2e8f0"
                      borderWidth={0}
                      style={styles.progressBar}
                    />
                  </View>

                  <View style={styles.confidenceItem}>
                    <View style={styles.confidenceLabel}>
                      <Text style={styles.confidenceName}>Non-Speech</Text>
                      <Text style={styles.confidenceValue}>
                        {Math.round(result.confidence["Non speech"] * 100)}%
                      </Text>
                    </View>
                    <Progress.Bar
                      progress={result.confidence["Non speech"]}
                      width={null}
                      height={10}
                      color="#F59E0B"
                      unfilledColor="#e2e8f0"
                      borderWidth={0}
                      style={styles.progressBar}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.newAnalysisButton}
                  onPress={handleReset}
                >
                  <Text style={styles.newAnalysisButtonText}>New Analysis</Text>
                </TouchableOpacity>
              </View>
              <FeedbackModal
                visible={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
                result={result}
                audioFileName={audioFile?.name}
                userEmail={user?.email}
              />
            </View>
          )}
        </ScrollView>

        {/* Loading overlay */}
        {analyzing && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#4461F2" />
              <Text style={styles.loadingBoxText}>Analyzing audio...</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Upload;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginBottom: 20,
    fontSize: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
    marginBottom: 8,
    textAlign: "center",
  },
  subheader: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 24,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#222",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  captureOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  captureOption: {
    flex: 1,
    alignItems: "center",
    padding: 16,
  },
  optionDivider: {
    width: 1,
    backgroundColor: "#444",
    marginHorizontal: 10,
  },
  captureIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  captureOptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  captureOptionDesc: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },
  recordingContainer: {
    alignItems: "center",
    padding: 16,
  },
  recordingText: {
    color: "#f44336",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  durationText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  stopButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  audioFileContainer: {
    padding: 8,
  },
  audioFileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  audioFileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  audioFileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  audioFileSize: {
    fontSize: 14,
    color: "#aaa",
  },
  audioActionButton: {
    padding: 8,
  },
  audioControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  audioControlButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  audioControlButtonActive: {
    backgroundColor: "#555",
  },
  classifyButton: {
    backgroundColor: "#2196F3",
  },
  audioControlText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  resultCard: {
    backgroundColor: "#222",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  resultHeader: {
    backgroundColor: "#4461F2",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  resultHeaderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  resultBody: {
    padding: 24,
    alignItems: "center",
  },
  resultIconContainer: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  resultDescription: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 24,
    textAlign: "center",
  },
  confidenceContainer: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  confidenceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  confidenceItem: {
    marginBottom: 16,
  },
  confidenceLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  confidenceName: {
    fontSize: 14,
    color: "#fff",
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  progressBar: {
    borderRadius: 6,
  },
  newAnalysisButton: {
    backgroundColor: "#4461F2",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "80%",
  },
  newAnalysisButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: "#222",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "80%",
    maxWidth: 280,
  },
  loadingBoxText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },
});
