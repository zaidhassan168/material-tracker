import { db } from "../config/firebase";
import { Timestamp, addDoc, collection, getDocs } from "firebase/firestore";

interface ReportData {
    projectId: string;
    materialType: string;
    quantity: string;
    notes: string;
    location: string | null;
    reporterName: string;
    reporterId: string;
  }

  export const submitShortageReport = async (report: ReportData) => {
    const reportRef = await addDoc(collection(db, "shortageReports"), {
      ...report,
      status: "pending",
      reportedAt: Timestamp.now(),
    });
    return reportRef.id;
  };

export const sendAndStoreNotifications = async ({
  materialType,
  priority = "normal",
  reportId,
  projectId,
}: {
  materialType: string;
  priority?: string;
  reportId: string;
  projectId: string;
}) => {
  const usersSnapshot = await getDocs(collection(db, "users"));
  const managerTokens: string[] = [];

  usersSnapshot.forEach((doc) => {
    const user = doc.data();
    if (user.role === "manager" && user.expoPushToken) {
      managerTokens.push(user.expoPushToken);
    }
  });

  const messages = managerTokens.map((token) => ({
    to: token,
    sound: "default",
    title: "New Shortage Report",
    body: `Material: ${materialType}`,
    data: { reportId, projectId },
  }));

  // Send notifications
  await Promise.all(
    messages.map((msg) =>
      fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(msg),
      })
    )
  );

  // Save notifications to Firestore
  await Promise.all(
    messages.map((msg) =>
      addDoc(collection(db, "notifications"), {
        ...msg,
        reportId,
        projectId,
        createdAt: Timestamp.now(),
        seen: false,
      })
    )
  );
};
