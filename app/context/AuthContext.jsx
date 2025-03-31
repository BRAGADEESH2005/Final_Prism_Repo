import React, { createContext, useState, useContext, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Create the context
const AuthContext = createContext({});

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Effect to check for authentication on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Load stored authentication data
  const loadStoredAuth = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      console.log("Stored token:", token); // Debugging line

      if (token) {
        // Fetch user profile with the token
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.user) {
          setUser(response.data.user);
        } else {
          // If no valid user data, clear tokens
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("refreshToken");
        }
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      // If error (likely invalid token), clear tokens
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("refreshToken");
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      console.log("Registering user:", username, email, password, API_BASE_URL); // Debugging line
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username,
        email,
        password,
      });
      console.log("Registration response:", response.data); // Debugging line

      const { token, refreshToken, user } = response.data;

      // Store tokens
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("refreshToken", refreshToken);

      // Set user in state
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error); // Debugging line
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { token, refreshToken, user } = response.data;

      // Store tokens
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("refreshToken", refreshToken);

      // Set user in state
      setUser(user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      if (token) {
        // Call logout endpoint to invalidate token on server
        await axios
          .post(
            `${API_BASE_URL}/auth/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          .catch((err) => console.log("Logout API error:", err));
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear tokens and user state regardless of API success
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("refreshToken");
      setUser(null);
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Provide value object with state and functions
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        initialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
