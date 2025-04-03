import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export const listenToProjects = (onUpdate: (projects: any[]) => void, onError: (err: any) => void) => {
  const projectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  return onSnapshot(
    projectsQuery,
    (snapshot) => {
      const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      onUpdate(projects);
    },
    onError
  );
};

export const listenToReports = (onUpdate: (reports: any[]) => void, onError: (err: any) => void) => {
  const reportsQuery = query(collection(db, "shortageReports"), orderBy("reportedAt", "desc"));
  return onSnapshot(
    reportsQuery,
    (snapshot) => {
      const reports = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          projectName: data.projectName || "Unknown Project",
          projectId: data.projectId || null,
          materialType: data.materialType || "Unknown Material",
          quantity: data.quantity || 0,
          unit: data.unit || "",
          priority: data.priority || "Low",
          status: data.status || "New",
          reportedBy: data.reportedBy || "Unknown",
          reportedAt: data.reportedAt || Timestamp.now(),
          location: data.location || "Unknown",
        };
      });
      onUpdate(reports);
    },
    onError
  );
};

export const updateReportStatus = async (reportId: string, status: string) => {
  const ref = doc(db, "shortageReports", reportId);
  await updateDoc(ref, { status });
};

export const updateReportPriority = async (reportId: string, priority: string) => {
  const ref = doc(db, "shortageReports", reportId);
  await updateDoc(ref, { priority });
};
