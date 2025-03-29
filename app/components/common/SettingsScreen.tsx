import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch } from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Download,
  Upload,
  Moon,
  HelpCircle,
  LogOut,
  Smartphone,
  User,
  Shield,
} from "lucide-react-native";

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [highPriorityAlerts, setHighPriorityAlerts] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [dataUsage, setDataUsage] = useState("wifi"); // "wifi" or "all"

  const handleLogout = () => {
    // In a real app, this would clear auth tokens and navigate to login
    router.replace("/");
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    control: React.ReactNode,
  ) => (
    <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
      <View className="flex-row items-center flex-1">
        <View className="mr-3">{icon}</View>
        <View className="flex-1">
          <Text className="font-medium text-base">{title}</Text>
          <Text className="text-gray-500 text-sm">{description}</Text>
        </View>
      </View>
      {control}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <View className="bg-blue-600 p-4 pt-12 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Settings</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="bg-white rounded-lg mx-4 mt-4 shadow-sm overflow-hidden">
          <View className="p-4 border-b border-gray-200">
            <Text className="font-bold text-lg">Account</Text>
          </View>

          {renderSettingItem(
            <User size={20} color="#4B5563" />,
            "Profile Information",
            "Update your name, email, and role",
            <ArrowLeft
              size={18}
              color="#9CA3AF"
              style={{ transform: [{ rotate: "180deg" }] }}
            />,
          )}

          {renderSettingItem(
            <Shield size={20} color="#4B5563" />,
            "Security",
            "Change password and security settings",
            <ArrowLeft
              size={18}
              color="#9CA3AF"
              style={{ transform: [{ rotate: "180deg" }] }}
            />,
          )}
        </View>

        <View className="bg-white rounded-lg mx-4 mt-4 shadow-sm overflow-hidden">
          <View className="p-4 border-b border-gray-200">
            <Text className="font-bold text-lg">Notifications</Text>
          </View>

          {renderSettingItem(
            <Bell size={20} color="#4B5563" />,
            "Push Notifications",
            "Enable or disable all notifications",
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={notificationsEnabled ? "#2563EB" : "#9CA3AF"}
            />,
          )}

          {notificationsEnabled && (
            <>
              {renderSettingItem(
                <View className="w-5" />,
                "High Priority Alerts",
                "Get immediate alerts for urgent shortages",
                <Switch
                  value={highPriorityAlerts}
                  onValueChange={setHighPriorityAlerts}
                  trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                  thumbColor={highPriorityAlerts ? "#2563EB" : "#9CA3AF"}
                />,
              )}

              {renderSettingItem(
                <View className="w-5" />,
                "Status Updates",
                "Get notified when report statuses change",
                <Switch
                  value={statusUpdates}
                  onValueChange={setStatusUpdates}
                  trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                  thumbColor={statusUpdates ? "#2563EB" : "#9CA3AF"}
                />,
              )}
            </>
          )}
        </View>

        <View className="bg-white rounded-lg mx-4 mt-4 shadow-sm overflow-hidden">
          <View className="p-4 border-b border-gray-200">
            <Text className="font-bold text-lg">App Settings</Text>
          </View>

          {renderSettingItem(
            <Moon size={20} color="#4B5563" />,
            "Dark Mode",
            "Switch between light and dark themes",
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={darkMode ? "#2563EB" : "#9CA3AF"}
            />,
          )}

          {renderSettingItem(
            <Smartphone size={20} color="#4B5563" />,
            "Offline Mode",
            "Enable to work without internet connection",
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={offlineMode ? "#2563EB" : "#9CA3AF"}
            />,
          )}

          {renderSettingItem(
            <Download size={20} color="#4B5563" />,
            "Data Usage",
            "Control when to sync data",
            <View className="flex-row">
              <TouchableOpacity
                className={`px-2 py-1 rounded-l-md ${dataUsage === "wifi" ? "bg-blue-600" : "bg-gray-200"}`}
                onPress={() => setDataUsage("wifi")}
              >
                <Text
                  className={
                    dataUsage === "wifi" ? "text-white" : "text-gray-700"
                  }
                >
                  Wi-Fi Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-2 py-1 rounded-r-md ${dataUsage === "all" ? "bg-blue-600" : "bg-gray-200"}`}
                onPress={() => setDataUsage("all")}
              >
                <Text
                  className={
                    dataUsage === "all" ? "text-white" : "text-gray-700"
                  }
                >
                  All Networks
                </Text>
              </TouchableOpacity>
            </View>,
          )}
        </View>

        <View className="bg-white rounded-lg mx-4 mt-4 mb-4 shadow-sm overflow-hidden">
          <View className="p-4 border-b border-gray-200">
            <Text className="font-bold text-lg">Support</Text>
          </View>

          {renderSettingItem(
            <HelpCircle size={20} color="#4B5563" />,
            "Help & Support",
            "Get help with using the app",
            <ArrowLeft
              size={18}
              color="#9CA3AF"
              style={{ transform: [{ rotate: "180deg" }] }}
            />,
          )}

          {renderSettingItem(
            <Upload size={20} color="#4B5563" />,
            "Sync Data",
            "Force sync all local data with server",
            <TouchableOpacity className="bg-gray-200 px-3 py-1 rounded-md">
              <Text className="text-gray-700">Sync Now</Text>
            </TouchableOpacity>,
          )}
        </View>

        <TouchableOpacity
          className="bg-red-100 mx-4 my-4 p-4 rounded-lg flex-row items-center justify-center"
          onPress={handleLogout}
        >
          <LogOut size={20} color="#DC2626" />
          <Text className="text-red-600 font-medium ml-2">Log Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-500 mb-8">Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
