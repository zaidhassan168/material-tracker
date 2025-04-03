import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignUp, useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { User } from "lucide-react-native"; // Import an icon for username

const CompleteProfileScreen = () => {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { signOut } = useAuth(); // Use signOut to allow user to cancel/go back
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Check if the signUp object is ready and in the correct state
    useEffect(() => {
        if (isLoaded && signUp?.status !== "missing_requirements") {
            // If we land here unexpectedly (e.g., user navigates back),
            // redirect to a safe place or sign out.
            console.warn("CompleteProfileScreen loaded but signUp status is not 'missing_requirements'. Redirecting.");
            router.replace("/"); // Or sign out: signOut();
        }
        // Check which fields are actually missing according to Clerk
        if (isLoaded && signUp?.missingFields) {
            console.log("Missing fields reported by Clerk:", signUp.missingFields);
            // You could potentially adapt the form based on this, but for now we assume username is the main one.
        }
    }, [isLoaded, signUp]);

    const handleCompleteProfile = async () => {
        if (!isLoaded || !signUp) {
            setError("Sign up process not ready. Please try again.");
            return;
        }
        if (!username) {
            setError("Please enter a username.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Update the sign up with the missing username
            const updatedSignUp = await signUp.update({
                username: username,
                // Include other missing fields here if necessary
            });

            console.log("SignUp update response status:", updatedSignUp.status);

            if (updatedSignUp.status === "complete") {
                // Sign up is complete, set the session active
                if (setActive && updatedSignUp.createdSessionId) {
                    await setActive({ session: updatedSignUp.createdSessionId });
                    console.log("Profile completed and session activated.");
                    // Navigation will be handled by RootLayout effect hook now that session is active
                } else {
                    throw new Error("Sign up complete but failed to set active session.");
                }
            } else {
                // Should not happen if update is successful, but handle defensively
                console.error("SignUp update did not result in 'complete' status:", updatedSignUp.status);
                setError("Failed to update profile. Status: " + updatedSignUp.status);
            }
        } catch (err: any) {
            console.error("Error completing profile:", JSON.stringify(err, null, 2));
            const firstError = err.errors?.[0];
            setError(firstError?.longMessage || "An error occurred while completing your profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Optionally sign the user out completely if they cancel profile completion
        signOut();
        router.replace("/"); // Go back to login
    };


    if (!isLoaded || !signUp) {
        // Show loading indicator while Clerk is loading
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-[hsl(60,4.8%,95.9%)]">
                <ActivityIndicator size="large" color="#4B5563" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[hsl(60,4.8%,95.9%)]">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
                    <View className="px-6 py-8">
                        <Text className="text-[hsl(26,83.3%,14.1%)] text-2xl font-bold text-center mb-2">
                            Complete Your Profile
                        </Text>
                        <Text className="text-[hsl(25,5.3%,44.7%)] text-center mb-8">
                            Please choose a username to finish setting up your account.
                        </Text>

                        {error ? <Text className="text-red-500 text-center mb-4">{error}</Text> : null}

                        <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 bg-white mb-6">
                            <User size={20} color="#4B5563" />
                            <TextInput
                                className="flex-1 ml-2 text-base"
                                placeholder="Username"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            className={`p-4 rounded-xl ${loading ? "bg-[hsl(47.9,95.8%,73%)]" : "bg-[hsl(47.9,95.8%,53.1%)]"}`}
                            onPress={handleCompleteProfile}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text className="text-[hsl(26,83.3%,14.1%)] text-center font-semibold text-lg">
                                    Complete Sign Up
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-4 bg-gray-200 p-4 rounded-xl"
                            onPress={handleCancel}
                            disabled={loading}
                        >
                            <Text className="text-gray-700 text-center font-medium">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CompleteProfileScreen;
