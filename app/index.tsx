import React from "react";
import { View } from "react-native";
import LoginScreen from "./components/auth/LoginScreen";

export default function HomeScreen() {
  return (
    <View className="flex-1">
      <LoginScreen />
    </View>
  );
}
