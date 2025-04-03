import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Settings, Bell, ChevronRight, AlertCircle } from "lucide-react-native";
import OfflineBanner from "../common/OfflineBanner";
import { listenToProjects, listenToReports } from "../../utils/manager";
import { getRandomColorById } from "../../utils/colors";
import { Timestamp } from "firebase/firestore";
import { ShortageReport, FilterStatus } from "../../utils/types";
import { getPriorityColor, getStatusColor } from "../../utils/colors";
// Interfaces
interface Project {
  id: string;
  name: string;
  createdAt: Timestamp;
}


const ManagerDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<ShortageReport[]>([]);
  const [errorProjects, setErrorProjects] = useState<Error | null>(null);
  const [errorReports, setErrorReports] = useState<Error | null>(null);
  const isLoading = !projects.length || !reports.length;

  useEffect(() => {
    const unsubscribeProjects = listenToProjects(setProjects, setErrorProjects);
    const unsubscribeReports = listenToReports(setReports, setErrorReports);
    return () => {
      unsubscribeProjects();
      unsubscribeReports();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800); // Just to trigger refresh spinner
  }, []);

  const navigateToSettings = () => router.push("/settings");
  const navigateToNotifications = () => router.push("/notifications");
  const navigateToReportDetail = (report: ShortageReport) => {
    router.push({
      pathname: "/report-detail",
      params: { id: report.id, reportData: encodeURIComponent(JSON.stringify(report)) },
    });
  };

  const filteredReports = reports.filter((r) =>
    activeFilter === "all" ? true : r.status === activeFilter
  );


  const renderError = () => (
    <View style={styles.centerContent} className="bg-red-100 p-4 rounded-lg mx-4">
      <AlertCircle size={24} color="#DC2626" />
      <Text className="text-red-700 font-semibold mt-2">Error Loading Data</Text>
      <Text className="text-red-600 text-center mt-1">
        {errorProjects?.message || errorReports?.message || "Failed to load data."}
      </Text>
    </View>
  );

  const activeProjectsCount = projects.length;
  const pendingReportsCount = reports.filter(r => r.status !== 'Resolved').length;
  const resolvedReportsCount = reports.filter(r => r.status === 'Resolved').length;

  return (
    <View className="flex-1 bg-gray-100">
      {!isOnline && <OfflineBanner />}

      {/* Header */}

      <View className="bg-[#f8d12d] p-4 pt-12">
        <View className="flex-row justify-between items-center">
          <Text className="text-[#3a2100] text-2xl font-bold">Manager Dashboard</Text>
          <View className="flex-row">
            <TouchableOpacity onPress={navigateToNotifications} className="mr-4">
              <Bell color="#3a2100" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={navigateToSettings}>
              <Settings color="#3a2100" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>


      {/* Main ScrollView */}
      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Overview */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold mb-2">Overview</Text>
          <View className="flex-row justify-between mb-4">
            <View className="bg-blue-100 rounded-lg p-3 flex-1 mr-2 items-center">
              <Text className="text-blue-800 font-bold text-lg">{activeProjectsCount}</Text>
              <Text className="text-blue-800 text-center text-sm">Active Projects</Text>
            </View>
            <View className="bg-orange-100 rounded-lg p-3 flex-1 mx-1 items-center">
              <Text className="text-orange-800 font-bold text-lg">{pendingReportsCount}</Text>
              <Text className="text-orange-800 text-center text-sm">Pending Reports</Text>
            </View>
            <View className="bg-green-100 rounded-lg p-3 flex-1 ml-2 items-center">
              <Text className="text-green-800 font-bold text-lg">{resolvedReportsCount}</Text>
              <Text className="text-green-800 text-center text-sm">Resolved Reports</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold mb-2">Material Shortage Reports</Text>
          <View className="flex-row mb-4">
            {(["all", "New", "In Progress", "Ordered", "Resolved"] as FilterStatus[]).map(status => (
              <TouchableOpacity
                key={status}
                className={`flex-1 p-2 rounded-lg mx-0.5 ${activeFilter === status ? "bg-[#f8d12d]" : "bg-[#f5f5f1]"
                  }`}
                onPress={() => setActiveFilter(status)}
              >
                <Text
                  className={`text-center text-sm font-medium ${activeFilter === status ? "text-[#3a2100]" : "text-[#736b62]"
                    }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Report List */}
          {isLoading ? (
            <ActivityIndicator color="#2563EB" className="mt-4" />
          ) : errorProjects || errorReports ? (
            renderError()
          ) : filteredReports.length === 0 ? (
            <Text className="text-gray-500 text-center py-4">No reports found.</Text>
          ) : (
            filteredReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                className="rounded-lg p-4 mb-3"
                style={{
                  backgroundColor: getRandomColorById(report.projectId || report.projectName),
                  borderColor: "#e5e7eb",
                  borderWidth: 1,
                }}
                onPress={() => navigateToReportDetail(report)}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center mb-1">
                      <View className={`w-3 h-3 rounded-full mr-2 ${getPriorityColor(report.priority)}`} />
                      <Text className="font-bold text-base mr-1">{report.materialType}</Text>
                    </View>
                    <Text className="text-gray-600 mb-1 text-sm">{report.projectName}</Text>
                    <Text className="text-gray-600 mb-1 text-sm">Qty: {report.quantity} {report.unit}</Text>
                    <View className="flex-row justify-between items-center mt-2">
                      <Text className="text-gray-500 text-xs">
                        {report.reportedAt?.toDate().toLocaleDateString()}
                      </Text>
                      <Text className={`${getStatusColor(report.status)} font-medium text-sm`}>
                        {report.status}
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

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

export default ManagerDashboard;
