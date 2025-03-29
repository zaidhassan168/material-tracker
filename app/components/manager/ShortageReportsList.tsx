import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  SortDesc,
  XCircle,
} from "lucide-react-native";

type Priority = "High" | "Medium" | "Low";
type Status = "New" | "In Progress" | "Ordered" | "Resolved";

interface ShortageReport {
  id: string;
  projectName: string;
  materialType: string;
  quantity: number;
  unit: string;
  priority: Priority;
  status: Status;
  reportedBy: string;
  reportedAt: string;
  location: string;
  hasPhotos: boolean;
}

interface ShortageReportsListProps {
  reports?: ShortageReport[];
  onSelectReport?: (report: ShortageReport) => void;
  isOffline?: boolean;
}

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case "High":
      return "bg-red-500";
    case "Medium":
      return "bg-yellow-500";
    case "Low":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusIcon = (status: Status) => {
  switch (status) {
    case "New":
      return <AlertCircle size={16} color="#ef4444" />;
    case "In Progress":
      return <Clock size={16} color="#eab308" />;
    case "Ordered":
      return <Clock size={16} color="#3b82f6" />;
    case "Resolved":
      return <CheckCircle2 size={16} color="#22c55e" />;
    default:
      return <XCircle size={16} color="#6b7280" />;
  }
};

const ShortageReportsList = ({
  reports = DEFAULT_REPORTS,
  onSelectReport = () => {},
  isOffline = false,
}: ShortageReportsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    status: Status | null;
    priority: Priority | null;
  }>({
    status: null,
    priority: null,
  });

  const filteredReports = reports.filter((report) => {
    // Search filter
    const matchesSearch =
      report.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.materialType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedBy.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = activeFilters.status
      ? report.status === activeFilters.status
      : true;

    // Priority filter
    const matchesPriority = activeFilters.priority
      ? report.priority === activeFilters.priority
      : true;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const toggleFilter = (
    type: "status" | "priority",
    value: Status | Priority,
  ) => {
    setActiveFilters((prev) => ({
      ...prev,
      [type]: prev[type] === value ? null : value,
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      status: null,
      priority: null,
    });
    setSearchQuery("");
  };

  const renderFilterSection = () => {
    if (!filterVisible) return null;

    return (
      <View className="bg-gray-100 p-4 rounded-md mb-4">
        <Text className="font-bold mb-2">Filter by Status</Text>
        <View className="flex-row flex-wrap mb-4">
          {["New", "In Progress", "Ordered", "Resolved"].map((status) => (
            <TouchableOpacity
              key={status}
              className={`mr-2 mb-2 px-3 py-1 rounded-full ${activeFilters.status === status ? "bg-blue-500" : "bg-gray-200"}`}
              onPress={() => toggleFilter("status", status as Status)}
            >
              <Text
                className={`${activeFilters.status === status ? "text-white" : "text-gray-800"}`}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="font-bold mb-2">Filter by Priority</Text>
        <View className="flex-row flex-wrap mb-4">
          {["High", "Medium", "Low"].map((priority) => (
            <TouchableOpacity
              key={priority}
              className={`mr-2 mb-2 px-3 py-1 rounded-full ${activeFilters.priority === priority ? "bg-blue-500" : "bg-gray-200"}`}
              onPress={() => toggleFilter("priority", priority as Priority)}
            >
              <Text
                className={`${activeFilters.priority === priority ? "text-white" : "text-gray-800"}`}
              >
                {priority}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className="bg-gray-200 py-2 rounded-md items-center"
          onPress={clearFilters}
        >
          <Text className="text-gray-800">Clear All Filters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ShortageReport }) => (
    <TouchableOpacity
      className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
      onPress={() => onSelectReport(item)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-bold text-lg text-gray-800">
            {item.projectName}
          </Text>
          <Text className="text-gray-600">{item.materialType}</Text>
        </View>
        <View
          className={`${getPriorityColor(item.priority)} px-2 py-1 rounded-full`}
        >
          <Text className="text-white text-xs font-medium">
            {item.priority}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-gray-700">
          {item.quantity} {item.unit}
        </Text>
        <View className="flex-row items-center">
          {getStatusIcon(item.status)}
          <Text className="ml-1 text-sm text-gray-700">{item.status}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-gray-500">
          Reported by {item.reportedBy}
        </Text>
        <Text className="text-xs text-gray-500">{item.reportedAt}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {isOffline && (
        <View className="bg-orange-500 px-4 py-2">
          <Text className="text-white text-center font-medium">
            You are offline. Changes will sync when connection is restored.
          </Text>
        </View>
      )}

      <View className="p-4">
        <View className="flex-row items-center mb-4 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
          <Search size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Search reports..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-800">
            Shortage Reports ({filteredReports.length})
          </Text>
          <TouchableOpacity
            className="flex-row items-center bg-gray-200 px-3 py-1 rounded-full"
            onPress={() => setFilterVisible(!filterVisible)}
          >
            <Filter size={16} color="#4b5563" />
            <Text className="ml-1 text-gray-700">Filter</Text>
          </TouchableOpacity>
        </View>

        {renderFilterSection()}

        {filteredReports.length > 0 ? (
          <FlatList
            data={filteredReports}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="items-center justify-center py-10">
            <Text className="text-gray-500 text-center">
              No shortage reports found
            </Text>
            <Text className="text-gray-400 text-center mt-1">
              Try adjusting your filters
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Default mock data
const DEFAULT_REPORTS: ShortageReport[] = [
  {
    id: "1",
    projectName: "Downtown Highrise",
    materialType: "Concrete Mix Type II",
    quantity: 500,
    unit: "bags",
    priority: "High",
    status: "New",
    reportedBy: "John Smith",
    reportedAt: "2023-06-15 09:30 AM",
    location: "40.7128° N, 74.0060° W",
    hasPhotos: true,
  },
  {
    id: "2",
    projectName: "Westside Bridge",
    materialType: "Steel Rebar 12mm",
    quantity: 200,
    unit: "rods",
    priority: "Medium",
    status: "In Progress",
    reportedBy: "Maria Garcia",
    reportedAt: "2023-06-14 02:15 PM",
    location: "40.7135° N, 74.0046° W",
    hasPhotos: true,
  },
  {
    id: "3",
    projectName: "Suburban Mall",
    materialType: 'Electrical Conduit 2"',
    quantity: 150,
    unit: "meters",
    priority: "Low",
    status: "Ordered",
    reportedBy: "Robert Johnson",
    reportedAt: "2023-06-13 11:45 AM",
    location: "40.7112° N, 74.0055° W",
    hasPhotos: false,
  },
  {
    id: "4",
    projectName: "Downtown Highrise",
    materialType: "Window Frames Type A",
    quantity: 35,
    unit: "pieces",
    priority: "High",
    status: "Resolved",
    reportedBy: "John Smith",
    reportedAt: "2023-06-12 10:20 AM",
    location: "40.7128° N, 74.0060° W",
    hasPhotos: true,
  },
  {
    id: "5",
    projectName: "Eastside School",
    materialType: "Drywall Sheets 4x8",
    quantity: 75,
    unit: "sheets",
    priority: "Medium",
    status: "New",
    reportedBy: "Sarah Williams",
    reportedAt: "2023-06-15 08:00 AM",
    location: "40.7140° N, 74.0030° W",
    hasPhotos: false,
  },
];

export default ShortageReportsList;
