import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Lock, Mail, Eye, EyeOff, Phone, MessageSquare } from "lucide-react-native";
import { auth, db, firebaseConfig, app } from "../../config/firebase";
import { PhoneAuthProvider, signInWithPhoneNumber } from "firebase/auth";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";

// Configure notification handler
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

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Permission Denied", "Failed to get push token for push notification!");
      return null;
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      Alert.alert("Configuration Error", "Missing EAS project ID in app config. Cannot get push token.");
      return null;
    }
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Expo Push Token:", token);
    } catch (e) {
      console.error("Error getting Expo push token:", e);
      Alert.alert("Error", "Could not get push token.");
      return null;
    }
  } else {
    Alert.alert("Must use physical device for Push Notifications");
    return null;
  }

  return token;
}

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reference for the reCAPTCHA verifier provided by expo-firebase-recaptcha
  const recaptchaVerifier = useRef<any>(null);

  // Fade-in animation setup
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Function to send OTP
  const handleSendOtp = async () => {
    if (!phoneNumber) {
      setError("Please enter your phone number (e.g., +1XXXXXXXXXX)");
      return;
    }
    // Basic validation for international phone number format
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      setError("Invalid phone number format. Use +CountryCodeNumber.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier.current
      );
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
      setError("OTP sent successfully!");
      console.log("OTP sent to", phoneNumber);
    } catch (err: any) {
      console.error("OTP Send Error:", err);
      let errorMessage = "Failed to send OTP. Please try again.";
      if (err.code === "auth/invalid-phone-number") {
        errorMessage = "Invalid phone number provided.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Function to verify OTP and login
  const handleVerifyOtp = async () => {
    if (!otpCode) {
      setError("Please enter the OTP code.");
      return;
    }
    if (!confirmationResult) {
      setError("Please request an OTP first.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const userCredential = await confirmationResult.confirm(otpCode);
      const user = userCredential.user;
      console.log("Phone Login successful:", user.uid);

      // --- Check Firestore for existing role ---
      const userDocRef = doc(db, "users", user.uid);
      let navigateTo = "/select-role"; // Default to select role
      let userDocExists = false;
      let userData: any = { // Prepare base user data
        updatedAt: new Date(),
        phoneNumber: user.phoneNumber,
      };

      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          userDocExists = true;
          const data = userDocSnap.data();
          userData = { ...userData, ...data }; // Merge existing data
          if (data.role) {
            console.log("User has role:", data.role, "Navigating to home.");
            navigateTo = "/(tabs)/home"; // Navigate to home if role exists
          } else {
            console.log("User exists but has no role. Navigating to select role.");
          }
        } else {
          console.log("User document does not exist. Navigating to select role.");
          userData.createdAt = new Date(); // Add createdAt if new user
        }
      } catch (docError) {
        console.error("Error fetching user document:", docError);
        setError("Error checking user details. Please try again.");
        setLoading(false);
        return; // Stop execution if we can't check the doc
      }

      // --- Navigate based on role check ---
      router.replace({
        pathname: navigateTo as any, // Cast to any to satisfy router type
        params: { userId: user.uid }, // Pass userId regardless
      });

      // --- Register for push notifications and update/create Firestore doc ---
      // This happens *after* navigation decision
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          userData.expoPushToken = token; // Add or update token
          console.log("Got push token:", token);
        } else {
          console.log("Could not get push token.");
          // Decide if you want to remove the token if it couldn't be fetched again
          // delete userData.expoPushToken;
        }

        // Update or set the document
        if (userDocExists) {
          await updateDoc(userDocRef, userData);
          console.log("User document updated successfully.");
        } else {
          await setDoc(userDocRef, userData);
          console.log("User document created successfully.");
        }

      } catch (tokenOrDbError) {
        // Log errors related to token registration or DB update, but don't block user
        console.error("Error registering push token or updating/creating Firestore doc:", tokenOrDbError);
        // Optionally inform the user non-critically
        // Alert.alert("Notification Issue", "Could not set up push notifications.");
      }

    } catch (err: any) {
      console.error("OTP Verify Error:", err);
      let errorMessage = "Failed to verify OTP. Please check the code and try again.";
      if (err.code === "auth/invalid-verification-code") {
        errorMessage = "Invalid OTP code.";
      } else if (err.code === "auth/code-expired") {
        errorMessage = "OTP code has expired. Please request a new one.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }} className="flex-1 justify-center p-6">
            <View className="items-center mb-8">
              {/* Logo */}
              <Image
                source={{ uri: "https://via.placeholder.com/100" }}
                style={{ width: 100, height: 100, marginBottom: 16 }}
              />
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

            {/* Use the official reCAPTCHA component */}
            <FirebaseRecaptchaVerifierModal
              ref={recaptchaVerifier}
              firebaseConfig={firebaseConfig}
              attemptInvisibleVerification={true}
            />

            {!isOtpSent ? (
              <>
                {/* Phone Number Input Section */}
                <View className="mb-4">
                  <View className="flex-row items-center border border-gray-300 rounded-lg p-3">
                    <Phone size={20} color="#4B5563" />
                    <TextInput
                      className="flex-1 ml-2 text-base"
                      placeholder="Phone Number (e.g., +14155552671)"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  className={`p-4 rounded-lg ${loading ? "bg-blue-400" : "bg-blue-600"}`}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="text-white text-center font-bold text-lg">
                      Send OTP
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* OTP Input Section */}
                <View className="mb-4">
                  <Text className="text-green-600 mb-2 text-center">
                    OTP sent to {phoneNumber}
                  </Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg p-3">
                    <MessageSquare size={20} color="#4B5563" />
                    <TextInput
                      className="flex-1 ml-2 text-base"
                      placeholder="Enter OTP Code"
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  className={`p-4 rounded-lg ${loading ? "bg-green-400" : "bg-green-600"}`}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="text-white text-center font-bold text-lg">
                      Verify OTP & Login
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="mt-4"
                  onPress={() => {
                    setIsOtpSent(false);
                    setError("");
                    setOtpCode("");
                    setConfirmationResult(null);
                  }}
                  disabled={loading}
                >
                  <Text className="text-blue-600 text-center text-base">
                    Change Phone Number?
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
