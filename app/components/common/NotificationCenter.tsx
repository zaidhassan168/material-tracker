import React, { useState } from "react";
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

const NotificationCenter = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "shortage",
      title: "High Priority Shortage",
      message: "Concrete Mix shortage reported at Downtown Highrise",
      time: "10 minutes ago",
      read: false,
      priority: "high",
    },
    {
      id: 2,
      type: "status",
      title: "Status Update",
      message: "Steel Rebar shortage has been marked as resolved",
      time: "2 hours ago",
      read: true,
      priority: "medium",
    },
    {
      id: 3,
      type: "assignment",
      title: "New Project Assignment",
      message: "You have been assigned to Westside Mall project",
      time: "Yesterday",
      read: true,
      priority: "low",
    },
    {
      id: 4,
      type: "system",
      title: "System Maintenance",
      message: "The system will be down for maintenance on Sunday from 2-4 AM",
      time: "2 days ago",
      read: true,
      priority: "low",
    },
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate fetching data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(
      notifications.filter((notification) => notification.id !== id),
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true })),
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case "shortage":
        return (
          <AlertTriangle
            size={20}
            color={priority === "high" ? "#DC2626" : "#EA580C"}
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

  const getNotificationStyle = (read: boolean, priority: string) => {
    let bgColor = read ? "bg-white" : "bg-blue-50";

    if (!read && priority === "high") {
      bgColor = "bg-red-50";
    }

    return bgColor;
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  return (
    <View className="flex-1 bg-gray-100">
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
            You have {unreadCount} unread notification
            {unreadCount !== 1 ? "s" : ""}
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
              className={`p-4 border-b border-gray-200 ${getNotificationStyle(notification.read, notification.priority)}`}
              onPress={() => markAsRead(notification.id)}
            >
              <View className="flex-row">
                <View className="mr-3 mt-1">
                  {getNotificationIcon(
                    notification.type,
                    notification.priority,
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between">
                    <Text
                      className={`font-bold ${!notification.read ? "text-black" : "text-gray-700"}`}
                    >
                      {notification.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deleteNotification(notification.id)}
                    >
                      <Trash2 size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <Text
                    className={`mt-1 ${!notification.read ? "text-gray-800" : "text-gray-600"}`}
                  >
                    {notification.message}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-2">
                    {notification.time}
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
