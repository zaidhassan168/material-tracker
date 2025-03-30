import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase"; // Assuming your firebase config is exported as 'db'
import {
  Camera,
  MapPin,
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  X,
} from "lucide-react-native";

interface Project {
  id: string;
  name: string;
}

const ShortageReportForm = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [materialType, setMaterialType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock material options - Consider fetching these from Firestore too if dynamic
  const materialOptions = [
    "Concrete",
    "Steel Rebar",
    "Lumber",
    "Bricks",
    "Drywall",
    "Insulation",
    "Roofing Materials",
    "Electrical Supplies",
    "Plumbing Supplies",
    "Paint",
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsCol = collection(db, "projects");
        const projectSnapshot = await getDocs(projectsCol);
        const projectList = projectSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as { name: string }), // Assuming project docs have a 'name' field
        }));
        setProjects(projectList);
        if (projectList.length > 0) {
          setSelectedProjectId(projectList[0].id); // Default to first project
        }
      } catch (error) {
        console.error("Error fetching projects: ", error);
        Alert.alert("Error", "Could not fetch projects.");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const handleAddPhoto = () => {
    // TODO: Implement actual photo capture/selection
    // In a real app, this would open the camera or photo library
    // For demo purposes, we'll add a placeholder image URL
    setPhotos([
      ...photos,
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80",
    ]);
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleGetLocation = () => {
    // In a real app, this would use the device's GPS
    // For demo purposes, we'll set a mock location
    setLocation(
      "123 Main St, Downtown (GPS Coordinates: 40.7128° N, 74.0060° W)",
    );
  };

  const handleSubmit = async () => {
    if (!selectedProjectId || !materialType || !quantity || !priority) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        projectId: selectedProjectId,
        materialType,
        quantity,
        priority,
        notes,
        photos, // TODO: Upload photos to Firebase Storage and store URLs instead
        location,
        status: "pending", // Initial status
        reportedAt: Timestamp.now(),
        // Add reporter info if available (e.g., from auth state)
        // reporterId: auth.currentUser.uid,
      };

      const reportsCol = collection(db, "shortageReports");
      await addDoc(reportsCol, reportData);

      Alert.alert("Success", "Report submitted successfully!");
      router.back();
    } catch (error) {
      console.error("Error submitting report: ", error);
      Alert.alert("Error", "Could not submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 bg-gray-100">
        <View className="bg-blue-600 p-4 pt-12 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">
            Report Material Shortage
          </Text>
        </View>

        <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="font-bold text-lg mb-2">
              Project <Text className="text-red-500">*</Text>
            </Text>
            {loadingProjects ? (
              <ActivityIndicator size="small" color="#3B82F6" className="my-4" />
            ) : projects.length === 0 ? (
              <Text className="text-gray-500 p-3 border border-gray-300 rounded-lg mb-4">
                No projects available. Contact manager.
              </Text>
            ) : (
              <View className="border border-gray-300 rounded-lg mb-4">
                <Picker
                  selectedValue={selectedProjectId}
                  onValueChange={(itemValue) => setSelectedProjectId(itemValue)}
                  style={{ height: 50, width: '100%' }} // Adjust styling as needed
                >
                  {projects.map((proj) => (
                    <Picker.Item key={proj.id} label={proj.name} value={proj.id} />
                  ))}
                </Picker>
              </View>
            )}

            <Text className="font-bold text-lg mb-2">
              Material Type <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-lg p-3 mb-1 flex-row justify-between items-center"
              onPress={() => setShowMaterialDropdown(!showMaterialDropdown)}
            >
              <Text>{materialType || "Select material type"}</Text>
              <ChevronDown size={20} color="#4B5563" />
            </TouchableOpacity>

            {showMaterialDropdown && (
              <View className="border border-gray-300 rounded-lg mb-4 bg-white shadow-md">
                <ScrollView style={{ maxHeight: 200 }}>
                  {materialOptions.map((material, index) => (
                    <TouchableOpacity
                      key={index}
                      className="p-3 border-b border-gray-200"
                      onPress={() => {
                        setMaterialType(material);
                        setShowMaterialDropdown(false);
                      }}
                    >
                      <Text>{material}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text className="font-bold text-lg mb-2">
              Quantity Needed <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row mb-4">
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg p-3 mr-2"
                placeholder="Amount"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
              <View className="border border-gray-300 rounded-lg p-3 w-24 justify-center">
                <Text>Units</Text>
              </View>
            </View>

            <Text className="font-bold text-lg mb-2">
              Priority Level <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row mb-4">
              <TouchableOpacity
                className={`flex-1 p-3 rounded-lg mr-2 ${priority === "low" ? "bg-green-100 border border-green-500" : "bg-gray-100"}`}
                onPress={() => setPriority("low")}
              >
                <Text
                  className={`text-center ${priority === "low" ? "text-green-700" : "text-gray-700"}`}
                >
                  Low
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 p-3 rounded-lg mx-1 ${priority === "medium" ? "bg-orange-100 border border-orange-500" : "bg-gray-100"}`}
                onPress={() => setPriority("medium")}
              >
                <Text
                  className={`text-center ${priority === "medium" ? "text-orange-700" : "text-gray-700"}`}
                >
                  Medium
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 p-3 rounded-lg ml-2 ${priority === "high" ? "bg-red-100 border border-red-500" : "bg-gray-100"}`}
                onPress={() => setPriority("high")}
              >
                <Text
                  className={`text-center ${priority === "high" ? "text-red-700" : "text-gray-700"}`}
                >
                  High
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="font-bold text-lg mb-2">Additional Notes</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4 h-24"
              placeholder="Enter any additional details here..."
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />

            <Text className="font-bold text-lg mb-2">Photos</Text>
            <View className="flex-row flex-wrap mb-4">
              {photos.map((photo, index) => (
                <View key={index} className="w-24 h-24 mr-2 mb-2 relative">
                  <Image
                    source={{ uri: photo }}
                    className="w-full h-full rounded-lg"
                  />
                  <TouchableOpacity
                    className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1"
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <X size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
                onPress={handleAddPhoto}
              >
                <Camera size={24} color="#4B5563" />
                <Text className="text-xs text-gray-500 mt-1">Add Photo</Text>
              </TouchableOpacity>
            </View>

            <Text className="font-bold text-lg mb-2">Location</Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-lg p-3 mb-4 flex-row items-center"
              onPress={handleGetLocation}
            >
              <MapPin size={20} color="#4B5563" className="mr-2" />
              <Text>{location || "Capture current location"}</Text>
            </TouchableOpacity>

            {priority === "high" && (
              <View className="bg-red-100 p-3 rounded-lg mb-4 flex-row items-center">
                <AlertTriangle size={20} color="#DC2626" />
                <Text className="text-red-700 ml-2">
                  High priority reports will notify managers immediately
                </Text>
              </View>
            )}

            <TouchableOpacity
              className={`bg-blue-600 p-4 rounded-lg ${isSubmitting ? "opacity-50" : ""}`}
              onPress={handleSubmit}
              disabled={isSubmitting || loadingProjects || projects.length === 0}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-bold">
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
