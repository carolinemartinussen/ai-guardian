export type GuardrailFinding = {
  category: string;
  severity: "safe" | "needs_review" | "high_risk";
  explanation: string;
  confidence: number;
  citationsCount: number;
};

export type MonitoredResponse = {
  id: string;
  agentId: string;
  timestamp: string;
  userQuery: string;
  aiResponse: string;
  trustScore: number;
  status: "safe" | "needs_review" | "high_risk";
  findings: GuardrailFinding[];
};

export type MonitoringAuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  responseId: string;
  details?: string;
};
