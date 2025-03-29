import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { PlusCircle, Settings, Bell, ClipboardList } from "lucide-react-native";
import OfflineBanner from "../common/OfflineBanner";

const EngineerDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Downtown Highrise",
      location: "123 Main St",
      pendingReports: 2,
    },
    {
      id: 2,
      name: "Westside Mall",
      location: "456 Commerce Ave",
      pendingReports: 0,
    },
    {
      id: 3,
      name: "Harbor Bridge",
      location: "789 Waterfront Dr",
      pendingReports: 1,
    },
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate fetching data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const navigateToReportForm = (projectId: number) => {
    // In a real app, you would pass the project ID to the form
    router.push("/report-form");
  };

  const navigateToSettings = () => {
    router.push("/settings");
  };

  const navigateToNotifications = () => {
    router.push("/notifications");
  };

  return (
    <View className="flex-1 bg-gray-100">
      {!isOnline && <OfflineBanner />}

      <View className="bg-blue-600 p-4 pt-12">
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-2xl font-bold">
            Engineer Dashboard
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={navigateToNotifications}
              className="mr-4"
            >
              <Bell color="white" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={navigateToSettings}>
              <Settings color="white" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold mb-2">Your Projects</Text>
          <Text className="text-gray-600 mb-4">
            Select a project to report material shortages
          </Text>

          {projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              className="border border-gray-200 rounded-lg p-4 mb-3 flex-row justify-between items-center"
              onPress={() => navigateToReportForm(project.id)}
            >
              <View>
                <Text className="font-bold text-lg">{project.name}</Text>
                <Text className="text-gray-600">{project.location}</Text>
              </View>
              <View className="flex-row items-center">
                {project.pendingReports > 0 && (
                  <View className="bg-orange-500 rounded-full px-2 py-1 mr-2">
                    <Text className="text-white text-xs">
                      {project.pendingReports}
                    </Text>
                  </View>
                )}
                <PlusCircle color="#2563EB" size={24} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold mb-2">Recent Reports</Text>
          <View className="border-l-4 border-orange-500 pl-3 py-2 mb-3">
            <Text className="font-bold">Concrete Mix - Low Stock</Text>
            <Text className="text-gray-600">
              Downtown Highrise • 2 hours ago
            </Text>
            <Text className="text-orange-600 mt-1">Pending</Text>
          </View>
          <View className="border-l-4 border-green-500 pl-3 py-2 mb-3">
            <Text className="font-bold">Steel Rebar - Out of Stock</Text>
            <Text className="text-gray-600">Harbor Bridge • 1 day ago</Text>
            <Text className="text-green-600 mt-1">Resolved</Text>
          </View>
          <TouchableOpacity>
            <View className="flex-row items-center justify-center mt-2">
              <ClipboardList size={16} color="#4B5563" />
              <Text className="text-gray-600 ml-1">View all reports</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push("/report-form")}
      >
        <PlusCircle color="white" size={30} />
      </TouchableOpacity>
    </View>
  );
};

export default EngineerDashboard;
