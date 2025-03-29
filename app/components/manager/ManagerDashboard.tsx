import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import {
  Settings,
  Bell,
  Filter,
  ChevronRight,
  BarChart2,
} from "lucide-react-native";
import OfflineBanner from "../common/OfflineBanner";

const ManagerDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pending" | "resolved"
  >("all");

  // Mock data for reports
  const [reports, setReports] = useState([
    {
      id: 1,
      project: "Downtown Highrise",
      material: "Concrete Mix",
      quantity: "500 kg",
      priority: "high",
      status: "pending",
      date: "2 hours ago",
      engineer: "John Doe",
    },
    {
      id: 2,
      project: "Harbor Bridge",
      material: "Steel Rebar",
      quantity: "200 units",
      priority: "medium",
      status: "pending",
      date: "1 day ago",
      engineer: "Jane Smith",
    },
    {
      id: 3,
      project: "Westside Mall",
      material: "Electrical Wiring",
      quantity: "1000 ft",
      priority: "low",
      status: "resolved",
      date: "3 days ago",
      engineer: "Mike Johnson",
    },
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate fetching data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const navigateToReportDetail = (reportId: number) => {
    // In a real app, you would pass the report ID to the detail view
    router.push(`/report-detail?id=${reportId}`);
  };

  const navigateToSettings = () => {
    router.push("/settings");
  };

  const navigateToNotifications = () => {
    router.push("/notifications");
  };

  const filteredReports = reports.filter((report) => {
    if (activeFilter === "all") return true;
    return report.status === activeFilter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-orange-600";
      case "resolved":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      {!isOnline && <OfflineBanner />}

      <View className="bg-blue-700 p-4 pt-12">
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-2xl font-bold">
            Manager Dashboard
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
          <Text className="text-lg font-bold mb-2">Overview</Text>
          <View className="flex-row justify-between mb-4">
            <View className="bg-blue-100 rounded-lg p-3 flex-1 mr-2">
              <Text className="text-blue-800 font-bold text-lg">5</Text>
              <Text className="text-blue-800">Active Projects</Text>
            </View>
            <View className="bg-orange-100 rounded-lg p-3 flex-1 mx-1">
              <Text className="text-orange-800 font-bold text-lg">2</Text>
              <Text className="text-orange-800">Pending Reports</Text>
            </View>
            <View className="bg-green-100 rounded-lg p-3 flex-1 ml-2">
              <Text className="text-green-800 font-bold text-lg">8</Text>
              <Text className="text-green-800">Resolved This Week</Text>
            </View>
          </View>
          <TouchableOpacity className="flex-row items-center justify-center">
            <BarChart2 size={16} color="#4B5563" />
            <Text className="text-gray-600 ml-1">View detailed analytics</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">Material Shortage Reports</Text>
            <TouchableOpacity>
              <Filter size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <View className="flex-row mb-4">
            <TouchableOpacity
              className={`flex-1 p-2 rounded-lg mr-1 ${activeFilter === "all" ? "bg-blue-600" : "bg-gray-200"}`}
              onPress={() => setActiveFilter("all")}
            >
              <Text
                className={`text-center ${activeFilter === "all" ? "text-white" : "text-gray-700"}`}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 p-2 rounded-lg mx-1 ${activeFilter === "pending" ? "bg-blue-600" : "bg-gray-200"}`}
              onPress={() => setActiveFilter("pending")}
            >
              <Text
                className={`text-center ${activeFilter === "pending" ? "text-white" : "text-gray-700"}`}
              >
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 p-2 rounded-lg ml-1 ${activeFilter === "resolved" ? "bg-blue-600" : "bg-gray-200"}`}
              onPress={() => setActiveFilter("resolved")}
            >
              <Text
                className={`text-center ${activeFilter === "resolved" ? "text-white" : "text-gray-700"}`}
              >
                Resolved
              </Text>
            </TouchableOpacity>
          </View>

          {filteredReports.length === 0 ? (
            <Text className="text-gray-500 text-center py-4">
              No reports found
            </Text>
          ) : (
            filteredReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 mb-3"
                onPress={() => navigateToReportDetail(report.id)}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <View
                        className={`w-3 h-3 rounded-full mr-2 ${getPriorityColor(report.priority)}`}
                      />
                      <Text className="font-bold text-lg">
                        {report.material}
                      </Text>
                    </View>
                    <Text className="text-gray-600 mb-1">{report.project}</Text>
                    <Text className="text-gray-600 mb-1">
                      Quantity: {report.quantity}
                    </Text>
                    <View className="flex-row justify-between mt-2">
                      <Text className="text-gray-500 text-sm">
                        {report.date}
                      </Text>
                      <Text className={getStatusColor(report.status)}>
                        {report.status.charAt(0).toUpperCase() +
                          report.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#4B5563" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ManagerDashboard;
