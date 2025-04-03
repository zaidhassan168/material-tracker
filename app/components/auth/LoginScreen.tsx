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
import * as Linking from 'expo-linking';
// Removed useWarmUpBrowser import as it's not available

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    // Removed useWarmUpBrowser usage

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const handleLogin = async () => {
        if (!isLoaded) return;
        if (!email || !password) {
            setError("Please enter both email and password");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const signInAttempt = await signIn.create({ identifier: email, password });
            if (signInAttempt.status === "complete") {
                await setActive({ session: signInAttempt.createdSessionId });
                console.log("Clerk Sign In Successful");
            } else {
                setError("Sign in failed. Please check your credentials.");
            }
        } catch (err: any) {
            console.error("Clerk Sign In Error:", JSON.stringify(err, null, 2));
            const firstError = err.errors?.[0];
            setError(firstError?.longMessage || "An error occurred during sign in.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (!isLoaded) {
            console.log("Clerk not loaded yet, aborting Google Sign In.");
            return;
        }
        try {
            setLoading(true); // Indicate loading state
            setError(""); // Clear previous errors

            // const redirectUrl = Linking.createURL('/auth/callback'); // Generate the redirect URL dynamically - REMOVED
            console.log("Starting Google OAuth with default redirect handling");

            // Let Clerk handle the redirect automatically by not passing redirectUrl
            const { createdSessionId, setActive: googleSetActive, signUp, signIn: googleSignIn } = await startOAuthFlow();

            console.log("Google OAuth flow response:", { createdSessionId, hasSetActive: !!googleSetActive, signUp, signIn: googleSignIn }); // Keep signIn for logging

            if (createdSessionId && googleSetActive) {
                await googleSetActive({ session: createdSessionId });
                console.log("Clerk Google Sign In Successful - Session Activated");
                // Navigation should be handled by the RootLayout effect hook
            } else if (signUp?.verifications?.externalAccount) {
                // This indicates a new user sign-up might need verification or completion steps.
                // Clerk often handles the redirect back automatically to complete this.
                // This indicates a new user sign-up might need verification or completion steps.
                // Clerk often handles the redirect back automatically to complete this.
                // If it lands back here without a session, the redirect/linking might be the issue.
                console.log("Google OAuth completed sign-up flow, redirecting to complete profile.");
                // IMPORTANT: Redirect to the profile completion screen
                router.replace("/complete-profile");
                // We don't activate session here, it will happen after profile completion.
                return; // Stop further execution in this handler
            } else if (googleSignIn) {
                // Existing user signing in via OAuth or linking account
                // The structure might not have 'verifications' directly here for OAuth sign-in
                console.log("Google OAuth completed sign-in flow for existing user.");
            }
            else {
                // If no session and no sign-up info, something might be wrong with the redirect or configuration.
                console.warn("Google OAuth finished, but no session ID was created directly and no sign-up info returned. Check redirect/linking.");
                setError("OAuth flow completed, but failed to activate session.");
            }
        } catch (err: any) {
            console.error("Clerk Google OAuth error:", JSON.stringify(err, null, 2));
            // Check for specific error types if needed
            if (err.errors?.[0]?.code === 'oauth_callback_error') {
                Alert.alert("Authentication Error", "There was an issue processing the callback from Google. Please ensure your redirect URIs are configured correctly in Clerk and Google Cloud Console.");
                setError("OAuth callback error. Check configuration.");
            } else {
                Alert.alert("Authentication Error", "Failed to sign in with Google. Please try again.");
                setError("Failed to sign in with Google.");
            }
        } finally {
            setLoading(false); // Stop loading indicator
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[hsl(60,4.8%,95.9%)]">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <Animated.View style={{ opacity: fadeAnim }} className="flex-1 justify-center px-6 py-8">
                        <View className="items-center mb-10">
                            <Image
                                source={require("../../../assets/images/without.png")}
                                style={{ width: 100, height: 100 }}
                            />
                            <Text className="text-[hsl(26,83.3%,14.1%)] text-2xl font-bold mt-4">
                                Construction Material Manager
                            </Text>
                            <Text className="text-[hsl(25,5.3%,44.7%)] mt-1">Login to access your dashboard</Text>
                        </View>

                        {error ? <Text className="text-red-500 text-center mb-4">{error}</Text> : null}

                        <View className="space-y-4">
                            <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 bg-white mb-4">
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

                            <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 bg-white">
                                <Lock size={20} color="#4B5563" />
                                <TextInput
                                    className="flex-1 ml-2 text-base"
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={20} color="#4B5563" /> : <Eye size={20} color="#4B5563" />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            className={`mt-6 p-4 rounded-xl ${loading || !isLoaded ? "bg-[hsl(47.9,95.8%,73%)]" : "bg-[hsl(47.9,95.8%,53.1%)]"}`}
                            onPress={handleLogin}
                            disabled={loading || !isLoaded}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text className="text-[hsl(26,83.3%,14.1%)] text-center font-semibold text-lg">Login</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-4 bg-white border border-gray-300 p-4 rounded-xl flex-row items-center justify-center space-x-3"
                            onPress={handleGoogleSignIn}
                            disabled={!isLoaded}
                        >
                            <Image
                                source={{ uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" }}
                                style={{ width: 18, height: 18 }}
                            />
                            <Text className="text-[hsl(25,5.3%,44.7%)] font-medium">Sign in with Google</Text>
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-6">
                            <Text className="text-[hsl(25,5.3%,44.7%)]">Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.push("/signup")}>
                                <Text className="text-[hsl(47.9,95.8%,53.1%)] font-bold">Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;
