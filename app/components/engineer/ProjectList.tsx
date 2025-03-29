import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  AlertTriangle,
} from "lucide-react-native";
import { TextInput } from "react-native-gesture-handler";

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
  projects?: Project[];
  onSelectProject?: (project: Project) => void;
}

const ProjectList = ({
  projects = [
    {
      id: "1",
      name: "Downtown Highrise",
      location: "123 Main St, Metropolis",
      dueDate: "2023-12-15",
      priority: "High" as const,
      shortageCount: 5,
      imageUrl:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80",
    },
    {
      id: "2",
      name: "Riverside Apartments",
      location: "456 River Rd, Metropolis",
      dueDate: "2024-02-28",
      priority: "Medium" as const,
      shortageCount: 2,
      imageUrl:
        "https://images.unsplash.com/photo-1590725121839-892b458a74fe?w=400&q=80",
    },
    {
      id: "3",
      name: "City Park Renovation",
      location: "789 Park Ave, Metropolis",
      dueDate: "2023-11-30",
      priority: "Low" as const,
      shortageCount: 0,
      imageUrl:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
    },
  ],
  onSelectProject = () => {},
}: ProjectListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProjects, setFilteredProjects] = useState(projects);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(text.toLowerCase()) ||
          project.location.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredProjects(filtered);
    }
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
          <View
            className={`${getPriorityColor(item.priority)} px-2 py-1 rounded-full`}
          >
            <Text className="text-white text-xs font-medium">
              {item.priority}
            </Text>
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

      {filteredProjects.length === 0 ? (
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
