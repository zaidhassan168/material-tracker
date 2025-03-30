import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet, // Import StyleSheet
} from "react-native";
import { router } from "expo-router";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  collection as firestoreCollection, // Alias collection to avoid naming conflict
} from "firebase/firestore";
import { db } from "../../config/firebase"; // Assuming your firebase config is exported as 'db'
import {
  Settings,
  Bell,
  Filter,
  ChevronRight,
  BarChart2,
  PlusCircle,
  X,
  AlertCircle, // For error display
} from "lucide-react-native";
import OfflineBanner from "../common/OfflineBanner";
import { registerForPushNotificationsAsync } from "../../config/notifications";

// Define interfaces for Firestore data
interface Project {
  id: string;
  name: string;
  createdAt: Timestamp;
  // Add other fields as needed
}

interface ShortageReport {
  id: string;
  projectName: string; // Keep this for display, but ideally link via projectId
  projectId?: string; // Add projectId for linking
  materialType: string;
  quantity: number;
  unit: string;
  priority: "High" | "Medium" | "Low";
  status: "New" | "In Progress" | "Ordered" | "Resolved"; // Match ShortageReportsList
  reportedBy: string;
  reportedAt: Timestamp;
  location: string;
  hasPhotos: boolean;
}

// Define status types consistent with ShortageReport interface
type ReportStatus = "New" | "In Progress" | "Ordered" | "Resolved";
type FilterStatus = "all" | ReportStatus; // Allow 'all' for filtering

const ManagerDashboard = () => {
  const [isOnline, setIsOnline] = useState(true); // TODO: Implement online status check
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all"); // Use FilterStatus
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]); // State for projects
  const [reports, setReports] = useState<ShortageReport[]>([]); // State for reports
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [errorProjects, setErrorProjects] = useState<Error | null>(null);
  const [errorReports, setErrorReports] = useState<Error | null>(null);
  const [pushToken, setPushToken] = useState<string | undefined>(undefined);
  
  const handleTestPushToken = async () => {
    const token = await registerForPushNotificationsAsync();
    setPushToken(token);
  };

  // --- Data Fetching ---

  const fetchData = useCallback(() => {
    setLoadingProjects(true);
    setLoadingReports(true);
    setErrorProjects(null);
    setErrorReports(null);

    // Fetch Projects
    const projectsCollection = firestoreCollection(db, "projects");
    const projectsQuery = query(projectsCollection, orderBy("createdAt", "desc"));
    const unsubscribeProjects = onSnapshot(
      projectsQuery,
      (querySnapshot) => {
        const fetchedProjects: Project[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProjects.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(fetchedProjects);
        setLoadingProjects(false);
      },
      (err) => {
        console.error("Error fetching projects: ", err);
        setErrorProjects(err);
        setLoadingProjects(false);
      }
    );

    // Fetch Reports
    const reportsCollection = firestoreCollection(db, "shortageReports");
    const reportsQuery = query(reportsCollection, orderBy("reportedAt", "desc"));
    const unsubscribeReports = onSnapshot(
      reportsQuery,
      (querySnapshot) => {
        const fetchedReports: ShortageReport[] = [];
        querySnapshot.forEach((doc) => {
          // Basic validation/defaults
          const data = doc.data();
          fetchedReports.push({
            id: doc.id,
            projectName: data.projectName ?? "Unknown Project",
            materialType: data.materialType ?? "Unknown Material",
            quantity: data.quantity ?? 0,
            unit: data.unit ?? "",
            priority: data.priority ?? "Low",
            status: data.status ?? "New",
            reportedBy: data.reportedBy ?? "Unknown User",
            reportedAt: data.reportedAt ?? Timestamp.now(), // Provide default Timestamp
            location: data.location ?? "Unknown Location",
            hasPhotos: data.hasPhotos ?? false,
            projectId: data.projectId, // Include projectId if available
          } as ShortageReport);
        });
        setReports(fetchedReports);
        setLoadingReports(false);
      },
      (err) => {
        console.error("Error fetching shortage reports: ", err);
        setErrorReports(err);
        setLoadingReports(false);
      }
    );

    return () => {
      unsubscribeProjects();
      unsubscribeReports();
    };
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const unsubscribe = fetchData();
    return unsubscribe; // Cleanup subscriptions on unmount
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(); // Re-fetch data
    // Add a small delay to show the refresh indicator
    setTimeout(() => setRefreshing(false), 500);
  }, [fetchData]);

  // --- Navigation ---

  const navigateToReportDetail = (reportId: string) => { // ID is always string from Firestore
    router.push({ pathname: "/report-detail", params: { id: reportId } });
  };

  const navigateToSettings = () => {
    router.push("/settings");
  };

  const navigateToNotifications = () => {
    router.push("/notifications");
  };

  // --- Filtering ---

  const filteredReports = reports.filter((report) => {
    if (activeFilter === "all") return true;
    // Ensure comparison uses the correct status types
    return report.status === activeFilter;
  });

  // --- Project Creation ---

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert("Validation Error", "Project name cannot be empty.");
      return;
    }
    setIsSubmittingProject(true);
    try {
      const projectsCol = firestoreCollection(db, "projects"); // Use aliased import
      await addDoc(projectsCol, {
        name: newProjectName.trim(),
        createdAt: Timestamp.now(),
        // TODO: Add createdBy if manager auth is available
      });
      Alert.alert("Success", `Project "${newProjectName.trim()}" created.`);
      setNewProjectName("");
      setIsProjectModalVisible(false);
      // Data will refresh automatically due to onSnapshot
    } catch (error) {
      console.error("Error creating project: ", error);
      Alert.alert("Error", "Could not create project. Please try again.");
    } finally {
      setIsSubmittingProject(false);
    }
  };

  // --- UI Helpers ---

  const getPriorityColor = (priority: ShortageReport['priority']) => { // Use type from interface
    switch (priority) {
      case "High": return "bg-red-500";
      case "Medium": return "bg-orange-500"; // Changed from yellow for consistency
      case "Low": return "bg-blue-500"; // Changed from green for consistency
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: ReportStatus) => { // Use ReportStatus type
    switch (status) {
      case "New": return "text-red-600";
      case "In Progress": return "text-yellow-600";
      case "Ordered": return "text-blue-600";
      case "Resolved": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  // --- Calculated Overview Data ---
  const activeProjectsCount = projects.length; // Simple count for now
  const pendingReportsCount = reports.filter(r => r.status !== 'Resolved').length;
  // Resolved this week requires date logic, keeping simple count for now
  const resolvedReportsCount = reports.filter(r => r.status === 'Resolved').length;

  // --- Loading/Error States ---
  const isLoading = loadingProjects || loadingReports;
  const hasError = errorProjects || errorReports;

  const renderLoading = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text className="text-gray-500 mt-2">Loading dashboard data...</Text>
    </View>
  );

  const renderError = () => (
     <View style={styles.centerContent} className="bg-red-100 p-4 rounded-lg mx-4">
       <AlertCircle size={24} color="#DC2626" />
       <Text className="text-red-700 font-semibold mt-2">Error Loading Data</Text>
       <Text className="text-red-600 text-center mt-1">
         {errorProjects?.message || errorReports?.message || "Could not fetch data. Please try refreshing."}
       </Text>
       <TouchableOpacity onPress={onRefresh} className="mt-3 bg-red-500 px-4 py-2 rounded">
            <Text className="text-white font-bold">Retry</Text>
       </TouchableOpacity>
     </View>
   );

  // --- Main Render ---
  return (
    <View className="flex-1 bg-gray-100">
      {!isOnline && <OfflineBanner />}

      {/* Header */}
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

      <View className="bg-blue-100 p-2 mx-4 my-2 rounded">
        <TouchableOpacity onPress={handleTestPushToken} className="bg-blue-600 p-2 rounded">
          <Text className="text-white text-center">Test Push Token</Text>
        </TouchableOpacity>
        {pushToken && <Text className="mt-2 text-center text-xs text-gray-800">Push Token: {pushToken}</Text>}
      </View>
      {/* Add Project Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isProjectModalVisible}
        onRequestClose={() => setIsProjectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View className="bg-white rounded-lg p-6 w-11/12">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Create New Project</Text>
              <TouchableOpacity onPress={() => setIsProjectModalVisible(false)}>
                <X size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4"
              placeholder="Enter project name"
              value={newProjectName}
              onChangeText={setNewProjectName}
            />
            <TouchableOpacity
              className={`bg-blue-600 p-4 rounded-lg ${isSubmittingProject ? "opacity-50" : ""}`}
              onPress={handleCreateProject}
              disabled={isSubmittingProject}
            >
              {isSubmittingProject ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-bold">
                  Create Project
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Content Area */}
      {isLoading && !refreshing ? (
         renderLoading()
       ) : hasError ? (
         renderError()
       ) : (
        <ScrollView
          className="flex-1 p-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} tintColor={"#2563EB"}/>
          }
          contentContainerStyle={{ flexGrow: 1 }} // Ensure ScrollView fills space if content is short
        >
          {/* Overview Section */}
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
            {/* <TouchableOpacity className="flex-row items-center justify-center">
              <BarChart2 size={16} color="#4B5563" />
              <Text className="text-gray-600 ml-1">View detailed analytics</Text>
            </TouchableOpacity> */}
          </View>

          {/* Project Management Section */}
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold">Projects ({projects.length})</Text>
              <TouchableOpacity
                className="flex-row items-center bg-blue-100 p-2 rounded-lg"
                onPress={() => setIsProjectModalVisible(true)}
              >
                <PlusCircle size={18} color="#2563EB" />
                <Text className="text-blue-600 font-semibold ml-1">Add Project</Text>
              </TouchableOpacity>
            </View>
            {loadingProjects ? (
                 <ActivityIndicator color="#2563EB" />
               ) : projects.length === 0 ? (
                 <Text className="text-gray-500 text-sm text-center py-2">No projects created yet.</Text>
               ) : (
                 projects.map(project => (
                   <View key={project.id} className="border-b border-gray-200 py-2 flex-row justify-between items-center">
                     <Text className="text-base">{project.name}</Text>
                     {/* Add navigation to project details later if needed */}
                     <ChevronRight size={18} color="#9CA3AF" />
                   </View>
                 ))
               )}
          </View>

          {/* Reports Section */}
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold">Material Shortage Reports</Text>
              {/* Filter button can be added back later */}
            </View>

            {/* Filter Tabs */}
            <View className="flex-row mb-4">
              {(["all", "New", "In Progress", "Ordered", "Resolved"] as FilterStatus[]).map(status => (
                 <TouchableOpacity
                   key={status}
                   className={`flex-1 p-2 rounded-lg mx-0.5 ${activeFilter === status ? "bg-blue-600" : "bg-gray-200"}`}
                   onPress={() => setActiveFilter(status)}
                 >
                   <Text
                     className={`text-center text-sm font-medium ${activeFilter === status ? "text-white" : "text-gray-700"}`}
                   >
                     {status === 'all' ? 'All' : status}
                   </Text>
                 </TouchableOpacity>
              ))}
            </View>

            {/* Report List */}
            {loadingReports ? (
               <ActivityIndicator color="#2563EB" style={{ marginVertical: 20 }}/>
             ) : filteredReports.length === 0 ? (
              <Text className="text-gray-500 text-center py-4">
                {reports.length === 0 ? "No reports submitted yet." : "No reports match the current filter."}
              </Text>
            ) : (
              filteredReports.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4 mb-3"
                  onPress={() => navigateToReportDetail(report.id)}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center mb-1">
                        <View
                          className={`w-3 h-3 rounded-full mr-2 ${getPriorityColor(report.priority)}`}
                        />
                        <Text className="font-bold text-base flex-shrink mr-1" numberOfLines={1}>
                          {report.materialType} {/* Use correct field */}
                        </Text>
                      </View>
                      <Text className="text-gray-600 mb-1 text-sm">{report.projectName}</Text>
                      <Text className="text-gray-600 mb-1 text-sm">
                        Qty: {report.quantity} {report.unit}
                      </Text>
                      <View className="flex-row justify-between items-center mt-2">
                        <Text className="text-gray-500 text-xs">
                          {report.reportedAt instanceof Timestamp ? report.reportedAt.toDate().toLocaleDateString() : 'Unknown Date'} {/* Use correct field and format */}
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
       )}
    </View>
  );
};

// Add basic styles
const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default ManagerDashboard;
