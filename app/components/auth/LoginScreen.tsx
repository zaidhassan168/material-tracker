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
import * as WebBrowser from "expo-web-browser";

// Ensure WebBrowser can dismiss the auth session
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

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

    // Clerk Email/Password Sign In
    const handleLogin = async () => {
        if (!isLoaded) {
            return;
        }
        if (!email || !password) {
            setError("Please enter both email and password");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const signInAttempt = await signIn.create({
                identifier: email,
                password,
            });

            if (signInAttempt.status === "complete") {
                await setActive({ session: signInAttempt.createdSessionId });
                console.log("Clerk Sign In Successful");
                // Navigation is handled by _layout.tsx based on auth state change
                // router.replace("/"); // Usually not needed
            } else {
                // Handle other statuses like MFA if needed
                console.error("Clerk Sign In Status:", signInAttempt.status);
                setError("Sign in failed. Please check your credentials or complete MFA if required.");
            }
        } catch (err: any) {
            console.error("Clerk Sign In Error:", JSON.stringify(err, null, 2));
            const firstError = err.errors?.[0];
            setError(firstError?.longMessage || firstError?.message || "An unknown error occurred during sign in.");
        } finally {
            setLoading(false);
        }
    };

    // Clerk Google OAuth Sign In
    const handleGoogleSignIn = async () => {
        try {
            // Ensure setActive is defined by checking isLoaded first
            if (!isLoaded) {
                console.warn("Clerk is not loaded yet for Google Sign In");
                return; // Or show a message to the user
            }
            const { createdSessionId, signIn: googleSignIn, signUp, setActive: googleSetActive } = await startOAuthFlow();

            if (createdSessionId) {
                if (!googleSetActive) {
                    console.error("setActive function is unexpectedly undefined after Google OAuth.");
                    setError("Failed to complete Google Sign In. Please try again.");
                    return;
                }
                await googleSetActive({ session: createdSessionId });
                console.log("Clerk Google Sign In Successful");
                // Navigation handled by _layout.tsx
            } else {
                // Handle other flows like sign up if necessary
                console.log("Google OAuth did not create a session directly.", { googleSignIn, signUp });
                // You might need to navigate user to complete profile depending on your Clerk settings
            }
        } catch (err) {
            console.error("Clerk Google OAuth error:", JSON.stringify(err, null, 2));
            Alert.alert("Authentication Error", "Failed to sign in with Google. Please try again.");
            setError("Failed to sign in with Google."); // Optionally set state error too
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
                            className={`p-4 rounded-lg ${loading || !isLoaded ? "bg-blue-400" : "bg-blue-600"}`}
                            onPress={handleLogin}
                            disabled={loading || !isLoaded}
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
                            className={`mt-6 bg-white border border-gray-300 p-4 rounded-lg flex-row justify-center items-center ${!isLoaded ? "opacity-50" : ""}`}
                            onPress={handleGoogleSignIn}
                            disabled={!isLoaded}
                        >
                            <Image
                                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" }}
                                style={{ width: 20, height: 20, marginRight: 8 }}
                            />
                            <Text className="text-gray-700 text-base font-medium">
                                Sign in with Google
                            </Text>
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-6">
                            <Text className="text-gray-600">Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.push("/signup")}>
                                <Text className="text-blue-600 font-bold">Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;
