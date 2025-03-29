import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  MapPin,
  Camera,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react-native";

const ReportDetailView = () => {
  const params = useLocalSearchParams();
  const reportId = params.id;

  // Mock report data - in a real app, this would be fetched based on the ID
  const [report, setReport] = useState({
    id: reportId || "1",
    project: "Downtown Highrise",
    material: "Concrete Mix",
    quantity: "500 kg",
    priority: "high",
    status: "pending",
    date: "June 15, 2023 - 10:30 AM",
    engineer: "John Doe",
    notes:
      "We're completely out of concrete mix and it's holding up the foundation work on the east wing. Need this ASAP to stay on schedule.",
    location: "123 Main St, Downtown (GPS Coordinates: 40.7128° N, 74.0060° W)",
    photos: [
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80",
      "https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?w=400&q=80",
    ],
  });

  const [comment, setComment] = useState("");

  const handleStatusChange = (newStatus: string) => {
    // In a real app, this would update the status via an API
    setReport({ ...report, status: newStatus });
    alert(`Status updated to ${newStatus}`);
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "high":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          icon: <AlertTriangle size={20} color="#DC2626" />,
        };
      case "medium":
        return {
          bgColor: "bg-orange-100",
          textColor: "text-orange-700",
          icon: <AlertTriangle size={20} color="#EA580C" />,
        };
      case "low":
        return {
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          icon: <AlertTriangle size={20} color="#16A34A" />,
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          icon: <AlertTriangle size={20} color="#4B5563" />,
        };
    }
  };

  const priorityStyle = getPriorityStyle(report.priority);

  return (
    <View className="flex-1 bg-gray-100">
      <View className="bg-blue-700 p-4 pt-12 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">
          Shortage Report Details
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-2xl font-bold">{report.material}</Text>
              <Text className="text-gray-600">{report.project}</Text>
            </View>
            <View
              className={`${priorityStyle.bgColor} px-3 py-1 rounded-full flex-row items-center`}
            >
              {priorityStyle.icon}
              <Text className={`${priorityStyle.textColor} ml-1 font-medium`}>
                {report.priority.charAt(0).toUpperCase() +
                  report.priority.slice(1)}{" "}
                Priority
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between mb-4">
            <View className="flex-1">
              <Text className="text-gray-500">Reported by</Text>
              <Text className="font-medium">{report.engineer}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-500">Date & Time</Text>
              <Text className="font-medium">{report.date}</Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-500">Quantity Needed</Text>
            <Text className="font-medium text-lg">{report.quantity}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-500">Notes</Text>
            <Text className="mt-1">{report.notes}</Text>
          </View>

          {report.location && (
            <View className="mb-4">
              <Text className="text-gray-500 mb-1">Location</Text>
              <View className="flex-row items-center bg-gray-100 p-3 rounded-lg">
                <MapPin size={20} color="#4B5563" />
                <Text className="ml-2">{report.location}</Text>
              </View>
            </View>
          )}

          {report.photos && report.photos.length > 0 && (
            <View className="mb-4">
              <Text className="text-gray-500 mb-2">Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {report.photos.map((photo, index) => (
                  <TouchableOpacity key={index} className="mr-2">
                    <Image
                      source={{ uri: photo }}
                      className="w-24 h-24 rounded-lg"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View className="border-t border-gray-200 pt-4 mt-4">
            <Text className="font-bold text-lg mb-3">Update Status</Text>
            <View className="flex-row mb-4">
              <TouchableOpacity
                className={`flex-1 p-3 rounded-lg mr-2 ${report.status === "pending" ? "bg-orange-100 border border-orange-500" : "bg-gray-100"}`}
                onPress={() => handleStatusChange("pending")}
              >
                <View className="flex-row items-center justify-center">
                  <AlertTriangle
                    size={18}
                    color={report.status === "pending" ? "#EA580C" : "#4B5563"}
                  />
                  <Text
                    className={`ml-1 ${report.status === "pending" ? "text-orange-700" : "text-gray-700"}`}
                  >
                    Pending
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 p-3 rounded-lg mx-1 ${report.status === "in progress" ? "bg-blue-100 border border-blue-500" : "bg-gray-100"}`}
                onPress={() => handleStatusChange("in progress")}
              >
                <View className="flex-row items-center justify-center">
                  <MessageSquare
                    size={18}
                    color={
                      report.status === "in progress" ? "#2563EB" : "#4B5563"
                    }
                  />
                  <Text
                    className={`ml-1 ${report.status === "in progress" ? "text-blue-700" : "text-gray-700"}`}
                  >
                    In Progress
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 p-3 rounded-lg ml-2 ${report.status === "resolved" ? "bg-green-100 border border-green-500" : "bg-gray-100"}`}
                onPress={() => handleStatusChange("resolved")}
              >
                <View className="flex-row items-center justify-center">
                  <CheckCircle
                    size={18}
                    color={report.status === "resolved" ? "#16A34A" : "#4B5563"}
                  />
                  <Text
                    className={`ml-1 ${report.status === "resolved" ? "text-green-700" : "text-gray-700"}`}
                  >
                    Resolved
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View className="border-t border-gray-200 pt-4 mt-2">
            <Text className="font-bold text-lg mb-3">Actions</Text>
            <View className="flex-row">
              <TouchableOpacity className="flex-1 bg-blue-600 p-3 rounded-lg mr-2">
                <Text className="text-white text-center">Order Materials</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-gray-200 p-3 rounded-lg ml-2">
                <Text className="text-gray-700 text-center">
                  Contact Engineer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ReportDetailView;
