import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { WifiOff, RefreshCw } from "lucide-react-native";

interface OfflineBannerProps {
  onRetry?: () => void;
}

const OfflineBanner = ({ onRetry }: OfflineBannerProps) => {
  return (
    <View className="bg-orange-500 px-4 py-2 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <WifiOff size={16} color="white" />
        <Text className="text-white ml-2 font-medium">You're offline</Text>
      </View>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} className="flex-row items-center">
          <RefreshCw size={14} color="white" />
          <Text className="text-white ml-1 text-sm">Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default OfflineBanner;
