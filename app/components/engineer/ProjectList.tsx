import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { Search, Filter, MapPin, Clock, AlertTriangle } from "lucide-react-native";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";

interface Project {
  id: string;
  name: string;
  location: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  shortageCount: number;
  imageUrl: string;
}

interface ProjectListProps {
  onSelectProject?: (project: Project) => void;
}

const ProjectList = ({
  onSelectProject = () => {},
}: ProjectListProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    const projectsCollection = collection(db, "projects");
    const q = query(projectsCollection, orderBy("dueDate", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedProjects: Project[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            location: data.location,
            dueDate:
              typeof data.dueDate === "string"
                ? data.dueDate
                : new Date(data.dueDate.seconds * 1000).toISOString(),
            priority: data.priority,
            shortageCount: data.shortageCount,
            imageUrl: data.imageUrl,
          };
        });
        setProjects(fetchedProjects);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-yellow-500";
      case "Low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const renderProjectItem = ({ item }: { item: Project }) => (
    <TouchableOpacity
      className="bg-white rounded-lg shadow-md mb-4 overflow-hidden"
      onPress={() => onSelectProject(item)}
    >
      <Image
        source={{ uri: item.imageUrl }}
        className="w-full h-40 object-cover"
        style={{ width: "100%", height: 160 }}
      />
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xl font-bold text-gray-800">{item.name}</Text>
          <View className={`${getPriorityColor(item.priority)} px-2 py-1 rounded-full`}>
            <Text className="text-white text-xs font-medium">{item.priority}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <MapPin size={16} color="#6b7280" />
          <Text className="text-gray-600 ml-2">{item.location}</Text>
        </View>

        <View className="flex-row items-center mb-2">
          <Clock size={16} color="#6b7280" />
          <Text className="text-gray-600 ml-2">
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        </View>

        {item.shortageCount > 0 && (
          <View className="flex-row items-center mt-2 bg-red-100 p-2 rounded-md">
            <AlertTriangle size={16} color="#ef4444" />
            <Text className="text-red-600 ml-2 font-medium">
              {item.shortageCount} material shortage
              {item.shortageCount !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <View className="flex-row items-center bg-white rounded-lg px-3 mb-4 shadow-sm">
        <Search size={20} color="#9ca3af" />
        <TextInput
          className="flex-1 py-3 px-2 text-gray-700"
          placeholder="Search projects..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity>
          <Filter size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="text-gray-500 mt-2">Loading projects...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 text-lg">
            Error loading projects: {error.message}
          </Text>
        </View>
      ) : filteredProjects.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-lg">No projects found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          renderItem={renderProjectItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

export default ProjectList;
