import { Agent } from "@/types/demo";

export const seedAgents: Agent[] = [
  {
    id: "customer-support-bot",
    name: "Customer Support Bot",
    version: "v2.4",
    status: "green",
    monitoringStatus: "monitoring",
    trustScore: 92,
  },
  {
    id: "hr-policy-assistant",
    name: "HR Policy Assistant",
    version: "v1.8",
    status: "yellow",
    monitoringStatus: "monitoring",
    trustScore: 78,
  },
  {
    id: "internal-dev-copilot",
    name: "Internal Dev Copilot",
    version: "v3.1",
    status: "red",
    monitoringStatus: "monitoring",
    trustScore: 61,
  },
];
