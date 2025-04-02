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
import { Lock, Mail, Eye, EyeOff } from "lucide-react-native";
import { useOAuth, useSignIn } from "@clerk/clerk-expo";
import { auth, db } from "../../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { doc, updateDoc } from "firebase/firestore";

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
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Fade-in animation setup
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const handleLogin = async () => {
        if (!email || !password) {
            setError("Please enter both email and password");
            return;
        }

        setError("");
        setLoading(true);

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
                        expoPushToken: token,
                        updatedAt: new Date(),
                    });
                    console.log("Push token saved successfully for user:", user.uid);
                } else if (user) {
                    console.log("Could not get push token, skipping Firestore update for user:", user.uid);
                }
            } catch (tokenError) {
                console.error("Error registering/saving push token:", tokenError);
            }
            // --- End Push Notification Logic ---
        } catch (err: any) {
            console.error("Login Error:", err);
            let errorMessage = "Login failed. Please check your credentials.";
            if (
                err.code === 'auth/user-not-found' ||
                err.code === 'auth/wrong-password' ||
                err.code === 'auth/invalid-credential'
            ) {
                errorMessage = "Invalid email or password.";
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = "Please enter a valid email address.";
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = "Too many login attempts. Please try again later.";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const handleGoogleSignIn = async () => {
        try {
            const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();
            if (createdSessionId) {
                if (setActive) {
                    await setActive({ session: createdSessionId });
                } else {
                    console.error("setActive is undefined");
                }
            }
        } catch (err) {
            console.error("Google OAuth error", err);
            Alert.alert("Authentication Error", "Failed to sign in with Google.");
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

                        <View className="mb-4">
                            <View className="flex-row items-center border border-gray-300 rounded-lg p-3 mb-4">
                                <Mail size={20} color="#4B5563" />
                                <TextInput
                                    className="flex-1 ml-2 text-base"
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
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
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <EyeOff size={20} color="#4B5563" />
                                    ) : (
                                        <Eye size={20} color="#4B5563" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            className={`p-4 rounded-lg ${loading ? "bg-blue-400" : "bg-blue-600"}`}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text className="text-white text-center font-bold text-lg">
                                    Login
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-6 bg-white border border-gray-300 p-4 rounded-lg flex-row justify-center items-center"
                            onPress={handleGoogleSignIn}
                        >
                            <Image
                                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" }}
                                style={{ width: 20, height: 20, marginRight: 8 }}
                            />
                            <Text className="text-gray-700 text-base font-medium">
                                Sign in with Google
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-6"
                            onPress={() => {
                                console.log("Navigating to Sign Up");
                                router.push('/signup');
                            }}
                        >
                            <Text className="text-blue-600 text-center text-base">
                                Don't have an account? Sign Up
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;
