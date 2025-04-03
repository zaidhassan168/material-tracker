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
import { PlusCircle, Settings, Bell } from "lucide-react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import OfflineBanner from "../common/OfflineBanner";
import { getCachedProjects, storeProjects } from "../../utils/cache"; // adjust path

interface Project {
  id: string;
  name: string;
  location: string;
}

const EngineerDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      if (!forceRefresh) {
        const cached = await getCachedProjects();
        if (cached) {
          setProjects(cached);
          setLoading(false);
          return;
        }
      }

      // Fetch from Firestore
      const projectsCol = collection(db, "projects");
      const projectSnapshot = await getDocs(projectsCol);
      const projectsList = projectSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];

      setProjects(projectsList);
      storeProjects(projectsList); // Cache result
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
    fetchProjects(true); // Force refresh on swipe
  }, [fetchProjects]);

  const navigateToReportForm = (projectId: string) => {
    router.push({ pathname: "/report-form", params: { projectId } });
  };

  const navigateToSettings = () => {
    router.push("/settings");
  };

  const navigateToNotifications = () => {
    router.push("/notifications");
  };

  return (
    <View className="flex-1 bg-[hsl(60,4.8%,95.9%)]">
      {!isOnline && <OfflineBanner />}

      <View className="bg-[hsl(47.9,95.8%,53.1%)] p-4 pt-12">
        <View className="flex-row justify-between items-center">
          <Text className="text-[hsl(26,83.3%,14.1%)] text-2xl font-bold">
            Projects
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={navigateToNotifications}
              className="mr-4"
            >
              <Bell color="hsl(26,83.3%,14.1%)" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={navigateToSettings}>
              <Settings color="hsl(26,83.3%,14.1%)" size={24} />
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
        {loading && <ActivityIndicator size="large" color="hsl(26,83.3%,14.1%)" />}
        {error && <Text className="text-red-500 text-center mb-4">{error}</Text>}

        {!loading && !error && projects.length === 0 && (
          <Text className="text-[hsl(25,5.3%,44.7%)] text-center">No projects found.</Text>
        )}

        {!loading && !error && projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            className="border border-gray-300 bg-white rounded-xl p-4 mb-3 flex-row justify-between items-center"
            onPress={() => navigateToReportForm(project.id)}
          >
            <View>
              <Text className="font-bold text-lg text-[hsl(26,83.3%,14.1%)]">{project.name}</Text>
              <Text className="text-[hsl(25,5.3%,44.7%)]">{project.location}</Text>
            </View>
            <PlusCircle color="hsl(47.9,95.8%,53.1%)" size={24} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default EngineerDashboard;
