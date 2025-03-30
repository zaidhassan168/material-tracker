import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Assuming picker is installed or will be
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase'; // Assuming db is exported from firebase config
import { registerForPushNotificationsAsync } from '../../config/notifications';
import { router } from 'expo-router'; // Import router


const SignupScreen = () => { // Remove navigation prop
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('engineer'); // Default role
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (!email || !password || !role) {
        Alert.alert("Error", "Please fill all fields.");
        return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Register for push notifications and store token
      const expoPushToken = await registerForPushNotificationsAsync();

      // Store user role and token in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: role,
        uid: user.uid,
        expoPushToken: expoPushToken || null
      });

      Alert.alert("Success", "Account created successfully!");
      // Navigate back to the login screen using router
      router.back(); // Or router.replace('/') if preferred

    } catch (error: any) {
      console.error("Signup Error:", error);
      Alert.alert("Signup Failed", error.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-4 bg-gray-100">
      <Text className="text-2xl font-bold mb-6 text-gray-800">Create Account</Text>
      <TextInput
        className="w-full h-12 border border-gray-300 rounded-md px-4 mb-4 bg-white"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        className="w-full h-12 border border-gray-300 rounded-md px-4 mb-4 bg-white"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        className="w-full h-12 border border-gray-300 rounded-md px-4 mb-4 bg-white"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <View className="w-full h-12 border border-gray-300 rounded-md mb-6 bg-white justify-center">
        <Picker
          selectedValue={role}
          onValueChange={(itemValue: string) => setRole(itemValue)}
          style={{ height: '100%', width: '100%' }} // Necessary for Picker styling
        >
          <Picker.Item label="Engineer" value="engineer" />
          <Picker.Item label="Manager" value="manager" />
        </Picker>
      </View>

      <View className="w-full rounded-md overflow-hidden">
         <Button
           title={loading ? "Creating Account..." : "Sign Up"}
           onPress={handleSignup}
           disabled={loading}
           color="#007AFF" // Example color, adjust as needed
         />
      </View>

      <Button
        title="Already have an account? Login"
        onPress={() => router.back()} // Go back using router
        color="transparent" // Make it look like a link
      />
    </View>
  );
};

export default SignupScreen;
