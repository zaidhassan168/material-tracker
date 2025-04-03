// imports
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, MapPin, ChevronDown } from "lucide-react-native";
import { MATERIAL_OPTIONS, Material } from "../../utils/materials";
import { submitShortageReport, sendAndStoreNotifications } from "../../utils/database";
import { useAuth, useUser } from "@clerk/clerk-expo";

const ShortageReportForm = () => {
  const { projectId, projectName, projectLocation } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
    projectLocation?: string;
  }>();
  const { user } = useUser();
  const [material, setMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    if (!projectId) {
      Alert.alert("Missing Project", "Please go back and select a project.");
    }
    setReportDate(new Date().toLocaleDateString()); // format: mm/dd/yyyy
  }, [projectId]);

  const handleSubmit = async () => {
    if (!projectId || !material || !quantity) {
      Alert.alert("Validation", "Please select a material and enter quantity.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reportId = await submitShortageReport({
        projectId,
        materialType: material.name,
        quantity,
        notes,
        location,
        reporterName: user?.fullName || "Unknown",
        reporterId: user?.id || "unknown",
      });

      await sendAndStoreNotifications({
        materialType: material.name,
        reportId,
        projectId,
      });

      Alert.alert("Success", "Report submitted.");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetLocation = () => {
    setLocation("GPS: 40.7128° N, 74.0060° W");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 bg-[hsl(60,4.8%,95.9%)]">
        {/* Header */}
        <View className="bg-[#f8d12d] p-4 pt-12 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft color="#3a2100" size={24} />
          </TouchableOpacity>
          <Text className="text-[#3a2100] text-xl font-bold">
            Material Shortage
          </Text>
        </View>

        <ScrollView className="p-4 space-y-4" keyboardShouldPersistTaps="handled">
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-bold mb-2">Project</Text>
            <Text className="text-gray-600 font-semibold mb-1">{projectName}</Text>
            {projectLocation && (
              <Text className="text-gray-500 mb-2 text-sm">{projectLocation}</Text>
            )}
            <Text className="text-xs text-gray-400 mb-4">Reported Date: {reportDate}</Text>

            {/* Material Picker */}
            <Text className="text-lg font-bold mb-2">
              Material <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-lg p-3 flex-row justify-between items-center mb-2"
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text className="text-gray-700">
                {material ? material.name : "Select material"}
              </Text>
              <ChevronDown color="#6b7280" size={20} />
            </TouchableOpacity>

            {showDropdown && (
              <View className="border border-gray-300 rounded-lg bg-white shadow-sm max-h-60">
                <ScrollView>
                  {MATERIAL_OPTIONS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => {
                          setMaterial(item);
                          setShowDropdown(false);
                        }}
                        className="flex-row items-center p-3 border-b border-gray-100"
                      >
                        <Icon color={item.color} size={20} className="mr-2" />
                        <Text className="text-gray-700">{item.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Quantity */}
            <Text className="text-lg font-bold mt-4 mb-2">
              Quantity <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3"
              placeholder="e.g. 20"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />

            {/* Notes */}
            <Text className="text-lg font-bold mt-4 mb-2">Notes (optional)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 h-24 text-sm"
              placeholder="Details..."
              multiline
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />

            {/* Location */}
            <Text className="text-lg font-bold mt-4 mb-2">Location</Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-lg p-3 flex-row items-center"
              onPress={handleGetLocation}
            >
              <MapPin size={20} color="#6b7280" className="mr-2" />
              <Text className="text-gray-700">
                {location || "Tap to capture location"}
              </Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity
              className={`mt-6 bg-[#f8d12d] rounded-lg p-4 ${isSubmitting ? "opacity-50" : ""
                }`}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#3a2100" />
              ) : (
                <Text className="text-center font-bold text-[#3a2100]">
                  Submit Report
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ShortageReportForm;
