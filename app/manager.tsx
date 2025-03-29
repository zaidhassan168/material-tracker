import React from "react";
import { View } from "react-native";
import ManagerDashboard from "./components/manager/ManagerDashboard";

export default function ManagerScreen() {
  return (
    <View className="flex-1">
      <ManagerDashboard />
    </View>
  );
}
