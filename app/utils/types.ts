import { Timestamp } from "firebase/firestore";

interface ShortageReport {
    id: string;
    projectId: string;
    projectName: string;
    materialType: string;
    quantity: number;
    unit: string;
    priority: "High" | "Medium" | "Low";
    status: "New" | "In Progress" | "Ordered" | "Resolved";
    reportedBy: string;
    reportedAt: Timestamp;
    location: string;
  }

  type FilterStatus = "all" | "New" | "In Progress" | "Ordered" | "Resolved";
  type ReportPriority = "Low" | "Medium" | "High";
    type ReportStatus = "New" | "In Progress" | "Ordered" | "Resolved";

  export type { ShortageReport, FilterStatus, ReportPriority, ReportStatus };