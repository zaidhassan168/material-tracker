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
import { getCachedProjects, storeProjects } from "../../utils/cache";

interface Project {
  id: string;
  name: string;
  location: string;
}

// Light pastel background colors
const backgroundColors = [
  "#fdf6e3",
  "#fff9ec",
  "#f3f9f1",
  "#f9f1f6",
  "#f5f5f1",
  "#fef5e7",
];

const getRandomColor = (index: number) =>
  backgroundColors[index % backgroundColors.length];

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

      const projectsCol = collection(db, "projects");
      const projectSnapshot = await getDocs(projectsCol);
      const projectsList = projectSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];

      setProjects(projectsList);
      storeProjects(projectsList);
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
    fetchProjects(true);
  }, [fetchProjects]);
  const navigateToReportForm = (project: Project) => {
    router.push({
      pathname: "/report-form",
      params: {
        projectId: project.id,
        projectName: project.name,
        projectLocation: project.location,
      },
    });
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

      {/* Header */}
      <View className="bg-white p-4 pt-12 pb-4 shadow-md">
        <View className="flex-row justify-between items-center">
          <Text className="text-[hsl(26,83.3%,14.1%)] text-2xl font-bold">
            Projects
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={navigateToNotifications}
              className="mr-4 p-2 rounded-full"
            >
              <Bell color="#3a2100" size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={navigateToSettings}
              className="p-2 rounded-full"
            >
              <Settings color="#3a2100" size={22} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Project List */}
      <ScrollView
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["hsl(26,83.3%,14.1%)"]}
            tintColor={"hsl(26,83.3%,14.1%)"}
          />
        }
      >
        {loading && (
          <ActivityIndicator size="large" color="hsl(26,83.3%,14.1%)" />
        )}
        {error && (
          <Text className="text-red-500 text-center mb-4">{error}</Text>
        )}

        {!loading && !error && projects.length === 0 && (
          <Text className="text-[hsl(25,5.3%,44.7%)] text-center">
            No projects found.
          </Text>
        )}

        {!loading &&
          !error &&
          projects.map((project, index) => (
            <TouchableOpacity
              key={project.id}
              className="rounded-lg p-5 mb-4 shadow-sm flex-row justify-between items-center border border-gray-200"
              style={{ backgroundColor: getRandomColor(index) }}
              onPress={() => navigateToReportForm(project)}
              activeOpacity={0.7}
            >
              <View className="flex-1 mr-4">
                <Text className="font-bold text-lg text-[hsl(26,83.3%,14.1%)] mb-1">
                  {project.name}
                </Text>
                <Text className="text-[hsl(25,5.3%,44.7%)]">
                  <Text>📍 </Text>
                  <Text>{project.location}</Text>
                </Text>
              </View>
              <PlusCircle color="hsl(26,83.3%,14.1%)" size={24} />
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
};

export default EngineerDashboard;
