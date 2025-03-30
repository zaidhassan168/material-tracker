import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { PlusCircle, Settings, Bell } from "lucide-react-native"; // Removed ClipboardList
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { db } from "../../config/firebase"; // Assuming firebase config is exported as db
import OfflineBanner from "../common/OfflineBanner";

interface Project {
  id: string;
  name: string;
  location: string;
  // Add other relevant project fields if needed
}

const EngineerDashboard = () => {
  const [isOnline, setIsOnline] = useState(true); // Assuming online status detection exists elsewhere
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projectsCol = collection(db, "projects"); // Use 'projects' collection
      const projectSnapshot = await getDocs(projectsCol);
      const projectsList = projectSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[]; // Type assertion might be needed based on your data structure
      setProjects(projectsList);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, [fetchProjects]);

  const navigateToReportForm = (projectId: string) => {
    // Pass project ID as a query parameter
    router.push({ pathname: "/report-form", params: { projectId } });
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

          {loading && <ActivityIndicator size="large" color="#2563EB" />}
          {error && <Text className="text-red-500 text-center">{error}</Text>}

          {!loading && !error && projects.length === 0 && (
            <Text className="text-gray-500 text-center">No projects found.</Text>
          )}

          {!loading && !error && projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              className="border border-gray-200 rounded-lg p-4 mb-3 flex-row justify-between items-center"
              onPress={() => navigateToReportForm(project.id)} // Pass project ID
            >
              <View>
                <Text className="font-bold text-lg">{project.name}</Text>
                <Text className="text-gray-600">{project.location}</Text>
              </View>
              {/* Removed pending reports count and icon */}
              <PlusCircle color="#2563EB" size={24} />
            </TouchableOpacity>
          ))}
        </View>
        {/* Removed Recent Reports section */}
      </ScrollView>
      {/* Removed Floating Action Button */}
    </View>
  );
};

export default EngineerDashboard;
