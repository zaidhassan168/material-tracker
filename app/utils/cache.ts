import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeProjects = async (projects: any[]) => {
  try {
    await AsyncStorage.setItem("cachedProjects", JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to cache projects:", error);
  }
};

export const getCachedProjects = async () => {
  try {
    const data = await AsyncStorage.getItem("cachedProjects");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to read cache:", error);
    return null;
  }
};

export const clearCachedProjects = async () => {
  try {
    await AsyncStorage.removeItem("cachedProjects");
  } catch (error) {
    console.error("Failed to clear cache:", error);
  }
};
