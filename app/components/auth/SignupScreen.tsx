import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
// Replace Firebase with Clerk imports
import { useSignUp } from '@clerk/clerk-expo';
// Remove unused Firebase imports
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { doc, setDoc } from 'firebase/firestore';
// import { auth, db } from '../../config/firebase';
// import { registerForPushNotificationsAsync } from '../../config/notifications';
import { router } from 'expo-router';

const SignupScreen = () => {
    const { isLoaded, signUp, setActive } = useSignUp();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('engineer'); // Default role
    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    // Start the sign up process
    const handleSignup = async () => {
        if (!isLoaded) {
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!email || !password || !role) {
            setError("Please fill all fields.");
            return;
        }

        setError('');
        setLoading(true);

        try {
            await signUp.create({
                emailAddress: email,
                password,
                unsafeMetadata: { role }, // Store role in unsafeMetadata during signup
            });

            // Send email verification code
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

            // Change UI state to verification stage
            setPendingVerification(true);
        } catch (err: any) {
            console.error("Clerk Signup Error:", JSON.stringify(err, null, 2));
            const firstError = err.errors?.[0];
            setError(firstError?.longMessage || firstError?.message || "An unknown error occurred during sign up.");
        } finally {
            setLoading(false);
        }
    };

    // Verify email address code
    const onPressVerify = async () => {
        if (!isLoaded) {
            return;
        }

        setError('');
        setLoading(true);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                Alert.alert("Success", "Account created and verified successfully!");
                router.replace('/'); // Redirect to home/dashboard (handled by _layout)
            } else {
                // Handle other statuses if needed
                console.error("Clerk Verification Status:", completeSignUp.status);
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
        <View className="flex-1 justify-center items-center p-6 bg-gray-100">
            <Text className="text-2xl font-bold mb-6 text-gray-800">
                {pendingVerification ? "Verify Your Email" : "Create Account"}
            </Text>

            {error ? (
                <Text className="text-red-500 mb-4 text-center">{error}</Text>
            ) : null}

            {!pendingVerification && (
                <>
                    {/* Email Input */}
                    <TextInput
                        className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4 bg-white text-base"
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    {/* Password Input */}
                    <TextInput
                        className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4 bg-white text-base"
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    {/* Confirm Password Input */}
                    <TextInput
                        className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4 bg-white text-base"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />
                    {/* Role Picker */}
                    <View className="w-full h-12 border border-gray-300 rounded-lg mb-6 bg-white justify-center">
                        <Picker
                            selectedValue={role}
                            onValueChange={(itemValue: string) => setRole(itemValue)}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <Picker.Item label="Engineer" value="engineer" style={{ fontSize: 16 }} />
                            <Picker.Item label="Manager" value="manager" style={{ fontSize: 16 }} />
                        </Picker>
                    </View>

                    {/* Sign Up Button */}
                    <TouchableOpacity
                        className={`w-full p-4 rounded-lg ${loading || !isLoaded ? "bg-blue-400" : "bg-blue-600"}`}
                        onPress={handleSignup}
                        disabled={loading || !isLoaded}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text className="text-white text-center font-bold text-lg">Sign Up</Text>
                        )}
                    </TouchableOpacity>
                </>
            )}

            {pendingVerification && (
                <>
                    <TextInput
                        className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4 bg-white text-base"
                        value={code}
                        placeholder="Enter Verification Code"
                        onChangeText={setCode}
                        keyboardType="number-pad"
                    />
                    <TouchableOpacity
                        className={`w-full p-4 rounded-lg ${loading || !isLoaded ? "bg-green-400" : "bg-green-600"}`}
                        onPress={onPressVerify}
                        disabled={loading || !isLoaded}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text className="text-white text-center font-bold text-lg">Verify Email</Text>
                        )}
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity className="mt-6" onPress={() => router.back()}>
                <Text className="text-blue-600 text-base">
                    {pendingVerification ? "Back to Sign Up" : "Already have an account? Login"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default SignupScreen;
