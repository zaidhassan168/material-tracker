import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Lock, User } from "lucide-react-native";

const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState<"engineer" | "manager" | null>(null);

  const handleLogin = () => {
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    if (!role) {
      setError("Please select a role");
      return;
    }

    // Mock authentication - in a real app, this would call an API
    if (username === "demo" && password === "password") {
      // Navigate based on role
      if (role === "engineer") {
        router.replace("/engineer");
      } else {
        router.replace("/manager");
      }
    } else {
      setError("Invalid credentials");
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
            <User size={20} color="#4B5563" />
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
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

        <Text className="text-gray-700 mb-2">Select your role:</Text>
        <View className="flex-row mb-6">
          <TouchableOpacity
            className={`flex-1 p-3 rounded-lg mr-2 ${role === "engineer" ? "bg-blue-600" : "bg-gray-200"}`}
            onPress={() => setRole("engineer")}
          >
            <Text
              className={`text-center font-medium ${role === "engineer" ? "text-white" : "text-gray-700"}`}
            >
              Engineer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 p-3 rounded-lg ml-2 ${role === "manager" ? "bg-blue-600" : "bg-gray-200"}`}
            onPress={() => setRole("manager")}
          >
            <Text
              className={`text-center font-medium ${role === "manager" ? "text-white" : "text-gray-700"}`}
            >
              Manager
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-lg"
          onPress={handleLogin}
        >
          <Text className="text-white text-center font-bold text-lg">
            Login
          </Text>
        </TouchableOpacity>

        <Text className="text-center mt-6 text-gray-500">
          Demo credentials: username "demo", password "password"
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
