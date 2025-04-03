import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    ActivityIndicator,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image
} from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { router } from 'expo-router';

const SignupScreen = () => {
    const { isLoaded, signUp, setActive } = useSignUp();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleSignup = async () => {
        if (!isLoaded) return;
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!email || !password) {
            setError("Please fill all fields.");
            return;
        }

        setError('');
        setLoading(true);

        try {
            await signUp.create({
                emailAddress: email,
                password,
            });

            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
        } catch (err: any) {
            console.error("Clerk Signup Error:", JSON.stringify(err, null, 2));
            const firstError = err.errors?.[0];
            setError(firstError?.longMessage || firstError?.message || "An unknown error occurred during sign up.");
        } finally {
            setLoading(false);
        }
    };

    const onPressVerify = async () => {
        if (!isLoaded) return;

        setError('');
        setLoading(true);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({ code });

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                router.replace('/');
            } else {
                setError("Verification failed. Please check the code and try again.");
            }
        } catch (err: any) {
            console.error("Clerk Verification Error:", JSON.stringify(err, null, 2));
            const firstError = err.errors?.[0];
            setError(firstError?.longMessage || firstError?.message || "An unknown error occurred during verification.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-[hsl(60,4.8%,95.9%)]"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View className="flex-1 justify-center items-center px-6 py-10">
                    <Image source={require("../../../assets/images/without.png")} style={{ width: 100, height: 100, marginBottom: 16 }} />
                    <Text className="text-2xl font-bold text-[hsl(26,83.3%,14.1%)] mb-2">Construction Material Manager</Text>
                    <Text className="text-lg text-[hsl(25,5.3%,44.7%)] mb-6">
                        {pendingVerification ? "Verify Your Email" : "Create Account"}
                    </Text>

                    {error ? <Text className="text-red-500 mb-4 text-center">{error}</Text> : null}

                    {!pendingVerification && (
                        <>
                            <View className="w-full flex-row items-center border border-gray-300 rounded-xl px-4 mb-4 bg-white">
                                <Mail size={20} color="#4B5563" />
                                <TextInput
                                    className="flex-1 ml-2 h-12 text-base"
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View className="w-full flex-row items-center border border-gray-300 rounded-xl px-4 mb-4 bg-white">
                                <Lock size={20} color="#4B5563" />
                                <TextInput
                                    className="flex-1 ml-2 h-12 text-base"
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                            <View className="w-full flex-row items-center border border-gray-300 rounded-xl px-4 mb-6 bg-white">
                                <Lock size={20} color="#4B5563" />
                                <TextInput
                                    className="flex-1 ml-2 h-12 text-base"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>
                            <TouchableOpacity
                                className={`w-full p-4 rounded-xl ${loading || !isLoaded ? "bg-[hsl(47.9,95.8%,73%)]" : "bg-[hsl(47.9,95.8%,53.1%)]"}`}
                                onPress={handleSignup}
                                disabled={loading || !isLoaded}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text className="text-[hsl(26,83.3%,14.1%)] text-center font-semibold text-lg">
                                        Sign Up
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {pendingVerification && (
                        <>
                            <TextInput
                                className="w-full h-12 border border-gray-300 rounded-xl px-4 mb-4 bg-white text-base"
                                value={code}
                                placeholder="Enter Verification Code"
                                onChangeText={setCode}
                                keyboardType="number-pad"
                            />
                            <TouchableOpacity
                                className={`w-full p-4 rounded-xl ${loading || !isLoaded ? "bg-[hsl(47.9,95.8%,73%)]" : "bg-[hsl(47.9,95.8%,53.1%)]"}`}
                                onPress={onPressVerify}
                                disabled={loading || !isLoaded}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text className="text-[hsl(26,83.3%,14.1%)] text-center font-semibold text-lg">
                                        Verify Email
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity className="mt-6" onPress={() => router.back()}>
                        <Text className="text-[hsl(47.9,95.8%,53.1%)] text-base font-medium">
                            {pendingVerification ? "Back to Sign Up" : "Already have an account? Login"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default SignupScreen;
