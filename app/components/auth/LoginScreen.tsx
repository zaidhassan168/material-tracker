import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert, // Added for notification permission feedback
} from "react-native";
import { router } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import { auth, db } from "../../config/firebase"; // Import Firebase auth and db
import { signInWithEmailAndPassword } from "firebase/auth";
import * as Notifications from "expo-notifications"; // Import Expo Notifications
import Constants from "expo-constants"; // To check if it's a physical device
import { doc, updateDoc } from "firebase/firestore"; // Import Firestore functions

// Configure notification handler (optional but recommended)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Function to register for push notifications
async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Failed to get push token for push notification!');
      return null;
    }
    // Learn more about projectId: https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // EAS project ID is required for Expo Push Notifications.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
        Alert.alert('Configuration Error', 'Missing EAS project ID in app config. Cannot get push token.');
        return null;
    }
    try {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("Expo Push Token:", token);
    } catch (e) {
        console.error("Error getting Expo push token:", e);
        Alert.alert('Error', 'Could not get push token.');
        return null;
    }
  } else {
    Alert.alert('Must use physical device for Push Notifications');
    return null;
  }

  return token;
}


const LoginScreen = () => {
  const [email, setEmail] = useState(""); // Changed username to email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state

  // Redirect if already logged in (optional, better handled in _layout)
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     if (user) {
  //       // User is signed in, decide where to redirect based on role or default
  //       // This logic might be better placed in a higher-level component like _layout.tsx
  //       // For now, let's assume a default redirect or role check happens elsewhere
  //       // router.replace('/engineer'); // Example redirect
  //     }
  //   });
  //   return unsubscribe; // Cleanup subscription on unmount
  // }, []);


  const handleLogin = async () => { // Made async
    if (!email || !password) { // Changed username to email
      setError("Please enter both email and password");
      return;
    }

    setError(""); // Clear previous errors
    setLoading(true); // Start loading

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Login successful:", user.uid);

      // --- Register for Push Notifications and Save Token ---
      try {
        const token = await registerForPushNotificationsAsync();
        if (token && user) {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            pushToken: token, // Field name to store the token
            updatedAt: new Date(), // Optional: track last update
          });
          console.log("Push token saved successfully for user:", user.uid);
        } else if (user) {
            console.log("Could not get push token, skipping Firestore update for user:", user.uid);
        }
      } catch (tokenError) {
        console.error("Error registering/saving push token:", tokenError);
        // Decide if login should still proceed or show an error
        // Alert.alert("Notification Setup Failed", "Could not set up push notifications, but login was successful.");
      }
      // --- End Push Notification Logic ---

      // Navigation is handled by the listener in _layout.tsx
    } catch (err: any) {
      console.error("Login Error:", err);
      // Provide more specific error messages based on Firebase error codes
      let errorMessage = "Login failed. Please check your credentials.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many login attempts. Please try again later.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false); // Stop loading
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-100"
    >
      <View className="flex-1 justify-center p-6 bg-white">
        <View className="items-center mb-8">
          <Text className="text-2xl font-bold text-blue-800">
            Construction Material Manager
          </Text>
          <Text className="text-gray-500 mt-2">
            Login to access your dashboard
          </Text>
        </View>

        {error ? (
          <Text className="text-red-500 mb-4 text-center">{error}</Text>
        ) : null}

        <View className="mb-4">
          <View className="flex-row items-center border border-gray-300 rounded-lg p-3 mb-4">
            <Mail size={20} color="#4B5563" /> {/* Changed icon */}
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder="Email" // Changed placeholder
              value={email} // Changed state variable
              onChangeText={setEmail} // Changed state setter
              keyboardType="email-address" // Added keyboard type
              autoCapitalize="none"
            />
          </View>

          <View className="flex-row items-center border border-gray-300 rounded-lg p-3">
            <Lock size={20} color="#4B5563" />
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* Role selection removed - Role should be determined after login, possibly from Firestore */}

        <TouchableOpacity
          className={`p-4 rounded-lg ${loading ? "bg-blue-400" : "bg-blue-600"}`} // Adjusted style for loading
          onPress={handleLogin}
          disabled={loading} // Disable button while loading
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Login
            </Text>
          )}
        </TouchableOpacity>

        {/* Removed demo credentials text */}

        <TouchableOpacity
          className="mt-6" // Add some margin top
          onPress={() => {
            console.log("Sign Up button pressed, attempting navigation to /signup"); // Add console log
            router.push('/signup');
          }}
        >
          <Text className="text-blue-600 text-center text-base">
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
