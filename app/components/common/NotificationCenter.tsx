import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  Trash2,
} from "lucide-react-native";
import {
  fetchUserNotifications,
  markNotificationAsRead,
} from "../../utils/notifications";

// Define a Notification interface based on the data structure
interface Notification {
  id: string;
  title: string;
  message: string;
  seen?: boolean;
  createdAt: { seconds: number } | Date;
  type: "shortage" | "status" | "assignment" | string;
  priority: "High" | "Medium" | "Low" | string;
  reportId?: string;
}

const NotificationCenter: React.FC = () => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = async () => {

    const data = await fetchUserNotifications();
    console.log("Fetched notifications:", data);
    // Assuming the fetched data conforms to Notification interface structure
    setNotifications(data as Notification[]);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const handlePress = async (notification: Notification) => {
    if (!notification.seen) {
      await markNotificationAsRead(notification.id);
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notification.id ? { ...n, seen: true } : n
        )
      );
    }

    if (notification.reportId) {
      const path: string = `/manager/reports/${notification.reportId}`;
      router.push(path as any);
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // optionally delete from Firestore
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.seen);
    await Promise.all(unread.map((n) => markNotificationAsRead(n.id)));
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, seen: true }))
    );

  };

  const clearAll = () => setNotifications([]);

  const getNotificationIcon = (
    type: Notification["type"],
    priority: Notification["priority"]
  ) => {
    switch (type) {
      case "shortage":
        return (
          <AlertTriangle
            size={20}
            color={priority === "High" ? "#DC2626" : "#EA580C"}
          />
        );
      case "status":
        return <CheckCircle size={20} color="#16A34A" />;
      case "assignment":
        return <Clock size={20} color="#2563EB" />;
      default:
        return <Bell size={20} color="#4B5563" />;
    }
  };

  const getNotificationStyle = (read: boolean | undefined, priority: Notification["priority"]) => {
    let bgColor = read ? "bg-white" : "bg-blue-50";
    if (!read && priority === "High") bgColor = "bg-red-50";
    return bgColor;
  };

  const formatDate = (createdAt: { seconds: number } | Date): string => {
    if ((createdAt as { seconds: number }).seconds) {
      return new Date((createdAt as { seconds: number }).seconds * 1000).toLocaleString();
    } else if (createdAt instanceof Date) {
      return createdAt.toLocaleString();
    } else {
      return "Unknown date";
    }
  };

  const unreadCount = notifications.filter((n) => !n.seen).length;

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-blue-600 p-4 pt-12 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Notifications</Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity onPress={markAllAsRead} className="mr-4">
            <CheckCircle color="white" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAll}>
            <Trash2 color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {unreadCount > 0 && (
        <View className="bg-blue-100 p-3">
          <Text className="text-blue-800 text-center">
            You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View className="flex-1 justify-center items-center p-8">
            <Bell size={48} color="#D1D5DB" />
            <Text className="text-gray-400 text-lg mt-4 text-center">
              No notifications
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Pull down to refresh
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              className={`p-4 border-b border-gray-200 ${getNotificationStyle(notification.seen, notification.priority)}`}
              onPress={() => handlePress(notification)}
            >
              <View className="flex-row">
                <View className="mr-3 mt-1">
                  {getNotificationIcon(notification.type, notification.priority)}
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between">
                    <Text className={`font-bold ${!notification.seen ? "text-black" : "text-gray-700"}`}>
                      {notification.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deleteNotification(notification.id)}
                    >
                      <Trash2 size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <Text className={`mt-1 ${!notification.seen ? "text-gray-800" : "text-gray-600"}`}>
                    {notification.message}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-2">
                    {formatDate(notification.createdAt)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity className="p-3 bg-gray-100 rounded-lg">
          <Text className="text-center text-gray-700">
            Notification Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NotificationCenter;
