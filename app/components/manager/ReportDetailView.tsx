import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { MATERIAL_OPTIONS } from "../../utils/materials";
import { getPriorityStyles, getStatusStyles } from "../../utils/colors";
import { updateReportPriority, updateReportStatus } from "../../utils/manager";
import { ShortageReport, ReportPriority, ReportStatus } from "../../utils/types";

const ReportDetailView = () => {
  const { reportData } = useLocalSearchParams();
  const [report, setReport] = useState<ShortageReport | null>(null);

  useEffect(() => {
    if (reportData) {
      setReport(JSON.parse(decodeURIComponent(reportData as string)));
    }
  }, [reportData]);

  const handleStatusChange = async (status: ReportStatus) => {
    if (!report || report.status === status) return;
    await updateReportStatus(report.id, status);
    setReport({ ...report, status });
  };

  const handlePriorityChange = async (priority: ReportPriority) => {
    if (!report || report.priority === priority) return;
    await updateReportPriority(report.id, priority);
    setReport({ ...report, priority });
  };

  if (!report) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f5f5f1]">
        <Text className="text-[#736b62]">Loading report...</Text>
      </View>
    );
  }

  const material = MATERIAL_OPTIONS.find((m) => m.name === report.materialType);

  return (
    <View className="flex-1 bg-[#f5f5f1]">
      {/* Header */}
      <View className="bg-[#f8d12d] px-5 pb-4 pt-14 flex-row items-center shadow-md">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeft color="#3a2100" size={24} />
        </TouchableOpacity>
        <Text className="text-[#3a2100] text-xl font-semibold">Report Details</Text>
      </View>

      <ScrollView className="px-4 py-6" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Material Information */}
        <View className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <View className="flex-row items-center space-x-2">
            {material?.icon && <material.icon size={24} color={material.color} />}
            <Text className="text-xl font-semibold text-[#3a2100]">
              {report.materialType}
            </Text>
          </View>
          <View className="mt-3 space-y-1">
            <Text className="text-[#736b62]">Project: {report.projectName}</Text>
            <Text className="text-[#736b62]">Quantity: {report.quantity} {report.unit}</Text>
            <Text className="text-[#736b62]">Location: {report.location}</Text>
            <Text className="text-[#736b62] text-xs mt-1">
              Reported: {report.reportedAt?.toDate ? report.reportedAt.toDate().toLocaleString() : String(report.reportedAt)}
            </Text>
          </View>
        </View>

        {/* Status Section */}
        <View className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <Text className="text-[#3a2100] font-semibold mb-3">Update Status</Text>
          <View className="flex-row justify-between space-x-2">
            {(["New", "In Progress", "Ordered", "Resolved"] as ReportStatus[]).map(status => {
              const style = getStatusStyles(status);
              const selected = report.status === status;
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => handleStatusChange(status)}
                  className={`flex-1 items-center py-2 rounded-lg border ${selected ? "border-[#3a2100] border-2" : "border-transparent"} ${style.bg}`}>
                  <Text className={`text-sm ${style.text} ${selected ? "font-bold" : ""}`}>{status}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Priority Section */}
        <View className="bg-white rounded-2xl p-6 shadow-md">
          <Text className="text-[#3a2100] font-semibold mb-3">Update Priority</Text>
          <View className="flex-row justify-between space-x-2">
            {(["Low", "Medium", "High"] as ReportPriority[]).map(priority => {
              const style = getPriorityStyles(priority);
              const selected = report.priority === priority;
              return (
                <TouchableOpacity
                  key={priority}
                  onPress={() => handlePriorityChange(priority)}
                  className={`flex-1 items-center py-2 rounded-lg border ${selected ? "border-[#3a2100] border-2" : "border-transparent"} ${style.bg}`}>
                  <Text className={`text-sm ${style.text} ${selected ? "font-bold" : ""}`}>{priority}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ReportDetailView;
