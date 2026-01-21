export type DemoUser = {
  id: string;
  name: string;
  role: string;
};

export const DEMO_USERS: DemoUser[] = [
  { id: "anna", name: "Anna", role: "Compliance Manager" },
  { id: "erik", name: "Erik", role: "HR Ops" },
  { id: "mina", name: "Mina", role: "AI Governance Lead" },
];

export type Agent = {
  id: string;
  name: string;
  version: string;
  status: "green" | "yellow" | "red";
  monitoringStatus: "monitoring" | "paused" | "error";
  trustScore: number;
};

export type FlaggedCase = {
  id: string;
  agentId: string;
  patternKey: string;
  severity: "safe" | "needs_review" | "high_risk";
  category: string;
  question: string;
  draftAnswer: string;
  confidence: number;
  citationsCount: number;
  status: "open" | "approved" | "rejected" | "escalated";
  createdAt: string;
};

export type ApprovedResponse = {
  id: string;
  agentId: string;
  patternKey: string;
  approvedText: string;
  approvedByUserId: string;
  approvedAt: string;
  usageCount: number;
  lastUsedAt: string | null;
};

export type ApprovedPattern = {
  patternKey: string;
  agentId: string;
  approvedText: string;
  approvedBy: string;
  approvedAt: string;
  reuseCount: number;
  lastUsedAt?: string;
  usage: Array<{
    responseId: string;
    timestamp: string;
    userQuery?: string;
    aiResponse?: string;
    severity?: "safe" | "needs_review" | "high_risk";
    category?: string;
  }>;
};

export type AuditEvent = {
  id: string;
  agentId: string;
  timestamp: string;
  actor: { name: string };
  action: "CASE_APPROVED" | "CASE_REJECTED" | "CASE_ESCALATED" | "MONITOR_FLAGGED" | "MONITOR_SAFE" | "MONITORED_APPROVED" | "APPROVED_RESPONSE_REUSED";
  severity?: "safe" | "needs_review" | "high_risk";
  category?: string;
  responseId?: string;
  caseId?: string;
  details: string;
};
