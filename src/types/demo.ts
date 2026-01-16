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
  status: "green" | "yellow" | "red";
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

export type AuditEvent = {
  id: string;
  agentId: string;
  caseId?: string;
  type: "CASE_APPROVED" | "CASE_REJECTED" | "CASE_ESCALATED" | "APPROVED_REUSED";
  actorUserId: string;
  timestamp: string;
  notes?: string;
};
