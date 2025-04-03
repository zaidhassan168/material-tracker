import { ReportPriority } from "./types";
import { ReportStatus } from "./types";


const lightColors = [
    "#fef3c7", "#e0f2fe", "#ede9fe", "#f0fdf4", "#fce7f3", "#f3f4f6"
  ];
  
   const getRandomColorById = (id: string): string => {
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
      sum += id.charCodeAt(i);
    }
    return lightColors[sum % lightColors.length];
  };
  

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-500";
      case "Medium": return "bg-orange-500";
      case "Low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "text-red-600";
      case "In Progress": return "text-yellow-600";
      case "Ordered": return "text-blue-600";
      case "Resolved": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  

export const getPriorityStyles = (priority: ReportPriority) => {
  switch (priority) {
    case "High":
      return {
        bg: "bg-red-100", // Light red background
        text: "text-red-900", // Dark red text
      };
    case "Medium":
      return {
        bg: "bg-yellow-100", // Light yellow background
        text: "text-yellow-900", // Dark yellow text
      };
    case "Low":
      return {
        bg: "bg-green-100", // Light green background
        text: "text-green-900", // Dark green text
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-800",
      };
  }
};



export const getStatusStyles = (status: ReportStatus) => {
    switch (status) {
      case "New":
        return {
          bg: "bg-blue-100", // Light blue
          text: "text-blue-900", // Darker blue text
        };
      case "In Progress":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-900",
        };
      case "Ordered":
        return {
          bg: "bg-indigo-100",
          text: "text-indigo-900",
        };
      case "Resolved":
        return {
          bg: "bg-green-100",
          text: "text-green-900",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
        };
    }
  };
    export { getRandomColorById, getPriorityColor, getStatusColor };