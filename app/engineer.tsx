import React from "react";
import { View } from "react-native";
import EngineerDashboard from "./components/engineer/EngineerDashboard";

export default function EngineerScreen() {
  return (
    <View className="flex-1">
      <EngineerDashboard />
    </View>
  );
}
