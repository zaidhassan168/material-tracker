import React from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { LogOut } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MissingRoleScreen() {
    const { signOut } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut();
            // Redirection to '/' should happen automatically via _layout.tsx
            console.log("Clerk sign out successful from missing role screen");
        } catch (error) {
            console.error("Error signing out with Clerk: ", error);
            Alert.alert("Logout Error", "Could not log out. Please try again.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Role Not Assigned</Text>
                <Text style={styles.message}>
                    You have successfully logged in, but no role has been assigned to your account yet.
                </Text>
                <Text style={styles.message}>
                    Please contact your manager to get assigned a role (e.g., 'manager' or 'engineer').
                </Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color="#DC2626" />
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // gray-100
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 24,
        marginHorizontal: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937', // gray-800
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#4B5563', // gray-600
        textAlign: 'center',
        marginBottom: 12,
    },
    logoutButton: {
        marginTop: 24,
        backgroundColor: '#FEE2E2', // red-100
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutButtonText: {
        color: '#DC2626', // red-600
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
});
