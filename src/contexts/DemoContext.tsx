"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  DemoUser,
  DEMO_USERS,
  Agent,
  FlaggedCase,
  ApprovedResponse,
  AuditEvent,
  ApprovedPattern,
} from "@/types/demo";
import { MonitoredResponse } from "@/types/monitoring";
import { seedAgents } from "@/demo/seedAgents";
import { seedCases } from "@/demo/seedCases";

type DemoContextType = {
  currentUser: DemoUser;
  switchUser: (userId: string) => void;
  agents: Agent[];
  cases: FlaggedCase[];
  approvedResponses: ApprovedResponse[];
  approvedPatterns: ApprovedPattern[];
  auditEvents: AuditEvent[];
  monitoredResponsesByAgent: Record<string, MonitoredResponse[]>;
  addAuditEvent: (event: Omit<AuditEvent, "id" | "timestamp">) => void;
  upsertApprovedPattern: (pattern: Omit<ApprovedPattern, "reuseCount" | "usage"> & { reuseCount?: number; usage?: ApprovedPattern["usage"] }) => void;
  recordPatternReuse: (agentId: string, patternKey: string, responseId: string, timestamp: string, monitoredResponse?: MonitoredResponse) => void;
  upsertMonitoredResponse: (agentId: string, response: MonitoredResponse) => void;
  getMonitoredResponse: (agentId: string, responseId: string) => MonitoredResponse | undefined;
  approveCase: (caseId: string, approvedText: string) => void;
  rejectCase: (caseId: string, notes?: string) => void;
  escalateCase: (caseId: string, notes?: string) => void;
  simulateNewRequest: (agentId: string, patternKey: string) => void;
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: "demo-current-user-id",
  AGENTS: "demo-agents",
  CASES: "demo-cases",
  APPROVED_RESPONSES: "demo-approved-responses",
  APPROVED_PATTERNS: "demo-approved-patterns",
  AUDIT_EVENTS: "demo-audit-events",
  MONITORED_RESPONSES: "demo-monitored-responses",
};

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generatePatternKey(text: string): string {
  // Simple hash-based pattern key for deterministic matching
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `pattern:${Math.abs(hash).toString(36)}`;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[0]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [cases, setCases] = useState<FlaggedCase[]>([]);
  const [approvedResponses, setApprovedResponses] = useState<
    ApprovedResponse[]
  >([]);
  const [approvedPatterns, setApprovedPatterns] = useState<ApprovedPattern[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [monitoredResponsesByAgent, setMonitoredResponsesByAgent] = useState<Record<string, MonitoredResponse[]>>({});

  // Initialize from localStorage or seed data
  useEffect(() => {
    // Load user
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER);
    if (storedUserId) {
      const user = DEMO_USERS.find((u) => u.id === storedUserId);
      if (user) {
        setCurrentUser(user);
      }
    }

    // Load or initialize agents
    const loadedAgents = loadFromStorage<Agent[]>(
      STORAGE_KEYS.AGENTS,
      seedAgents
    );
    setAgents(loadedAgents);
    if (!localStorage.getItem(STORAGE_KEYS.AGENTS)) {
      saveToStorage(STORAGE_KEYS.AGENTS, seedAgents);
    }

    // Load or initialize cases
    const loadedCases = loadFromStorage<FlaggedCase[]>(
      STORAGE_KEYS.CASES,
      seedCases
    );
    setCases(loadedCases);
    if (!localStorage.getItem(STORAGE_KEYS.CASES)) {
      saveToStorage(STORAGE_KEYS.CASES, seedCases);
    }

    // Load or initialize approved responses
    const loadedApprovedResponses = loadFromStorage<ApprovedResponse[]>(
      STORAGE_KEYS.APPROVED_RESPONSES,
      []
    );
    setApprovedResponses(loadedApprovedResponses);

    // Load or initialize approved patterns
    const loadedApprovedPatterns = loadFromStorage<ApprovedPattern[]>(
      STORAGE_KEYS.APPROVED_PATTERNS,
      []
    );
    setApprovedPatterns(loadedApprovedPatterns);

    // Load or initialize audit events
    const loadedAuditEvents = loadFromStorage<AuditEvent[]>(
      STORAGE_KEYS.AUDIT_EVENTS,
      []
    );
    setAuditEvents(loadedAuditEvents);

    // Load or initialize monitored responses
    const loadedMonitoredResponses = loadFromStorage<Record<string, MonitoredResponse[]>>(
      STORAGE_KEYS.MONITORED_RESPONSES,
      {}
    );
    setMonitoredResponsesByAgent(loadedMonitoredResponses);
  }, []);

  const switchUser = (userId: string) => {
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEYS.USER, userId);
    }
  };

  const addAuditEvent = (eventData: Omit<AuditEvent, "id" | "timestamp">) => {
    const event: AuditEvent = {
      ...eventData,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    const updated = [...auditEvents, event];
    setAuditEvents(updated);
    saveToStorage(STORAGE_KEYS.AUDIT_EVENTS, updated);
  };

  const upsertApprovedPattern = (
    patternData: Omit<ApprovedPattern, "reuseCount" | "usage"> & {
      reuseCount?: number;
      usage?: ApprovedPattern["usage"];
    }
  ) => {
    const existingPattern = approvedPatterns.find(
      (p) => p.patternKey === patternData.patternKey && p.agentId === patternData.agentId
    );

    let updatedPatterns: ApprovedPattern[];
    if (existingPattern) {
      // Update existing pattern
      updatedPatterns = approvedPatterns.map((p) =>
        p.patternKey === patternData.patternKey && p.agentId === patternData.agentId
          ? {
              ...p,
              approvedText: patternData.approvedText,
              approvedBy: patternData.approvedBy,
              approvedAt: patternData.approvedAt,
              reuseCount: patternData.reuseCount ?? p.reuseCount,
              usage: patternData.usage ?? p.usage,
            }
          : p
      );
    } else {
      // Create new pattern
      const newPattern: ApprovedPattern = {
        patternKey: patternData.patternKey,
        agentId: patternData.agentId,
        approvedText: patternData.approvedText,
        approvedBy: patternData.approvedBy,
        approvedAt: patternData.approvedAt,
        reuseCount: patternData.reuseCount ?? 0,
        usage: patternData.usage ?? [],
      };
      updatedPatterns = [...approvedPatterns, newPattern];
    }

    setApprovedPatterns(updatedPatterns);
    saveToStorage(STORAGE_KEYS.APPROVED_PATTERNS, updatedPatterns);
  };

  const recordPatternReuse = (
    agentId: string,
    patternKey: string,
    responseId: string,
    timestamp: string,
    monitoredResponse?: MonitoredResponse
  ) => {
    const pattern = approvedPatterns.find(
      (p) => p.patternKey === patternKey && p.agentId === agentId
    );

    if (!pattern) return;

    // Build usage entry with snapshot data if available
    const usageEntry: ApprovedPattern["usage"][0] = {
      responseId,
      timestamp,
      ...(monitoredResponse && {
        userQuery: monitoredResponse.userQuery,
        aiResponse: monitoredResponse.aiResponse,
        severity: monitoredResponse.status,
        category: monitoredResponse.findings[0]?.category,
      }),
    };

    const updatedPatterns = approvedPatterns.map((p) =>
      p.patternKey === patternKey && p.agentId === agentId
        ? {
            ...p,
            reuseCount: p.reuseCount + 1,
            lastUsedAt: timestamp,
            usage: [...p.usage, usageEntry].slice(-50), // Keep last 50
          }
        : p
    );

    setApprovedPatterns(updatedPatterns);
    saveToStorage(STORAGE_KEYS.APPROVED_PATTERNS, updatedPatterns);

    // Add audit event
    addAuditEvent({
      agentId,
      actor: { name: "System" },
      action: "APPROVED_RESPONSE_REUSED",
      responseId,
      details: `Approved pattern "${patternKey}" reused. Total reuses: ${pattern.reuseCount + 1}`,
    });
  };

  const upsertMonitoredResponse = (agentId: string, response: MonitoredResponse) => {
    setMonitoredResponsesByAgent((prev) => {
      const agentResponses = prev[agentId] || [];
      // Check if response already exists (dedupe by id)
      const existingIndex = agentResponses.findIndex((r) => r.id === response.id);
      
      let updatedResponses: MonitoredResponse[];
      if (existingIndex >= 0) {
        // Update existing response
        updatedResponses = [...agentResponses];
        updatedResponses[existingIndex] = response;
      } else {
        // Add new response
        updatedResponses = [...agentResponses, response].slice(-100); // Keep last 100 per agent
      }

      const updated = {
        ...prev,
        [agentId]: updatedResponses,
      };
      
      saveToStorage(STORAGE_KEYS.MONITORED_RESPONSES, updated);
      return updated;
    });
  };

  const getMonitoredResponse = (agentId: string, responseId: string): MonitoredResponse | undefined => {
    const agentResponses = monitoredResponsesByAgent[agentId] || [];
    return agentResponses.find((r) => r.id === responseId);
  };

  const approveCase = (caseId: string, approvedText: string) => {
    const flaggedCase = cases.find((c) => c.id === caseId);
    if (!flaggedCase || flaggedCase.status !== "open") return;

    // Rotate users deterministically (cycle through DEMO_USERS)
    const approvalCount = approvedResponses.length + cases.filter((c) => c.status === "approved").length;
    const rotatingUser = DEMO_USERS[approvalCount % DEMO_USERS.length];

    // Update case status
    const updatedCases = cases.map((c) =>
      c.id === caseId ? { ...c, status: "approved" as const } : c
    );
    setCases(updatedCases);
    saveToStorage(STORAGE_KEYS.CASES, updatedCases);

    // Check if approved response already exists for this agentId + patternKey
    const existingApproved = approvedResponses.find(
      (r) => r.agentId === flaggedCase.agentId && r.patternKey === flaggedCase.patternKey
    );

    let updatedApproved: ApprovedResponse[];
    if (existingApproved) {
      // Update existing approved response
      updatedApproved = approvedResponses.map((r) =>
        r.id === existingApproved.id
          ? {
              ...r,
              approvedText,
              approvedByUserId: rotatingUser.id,
              approvedAt: new Date().toISOString(),
              // Keep usageCount as-is, don't set lastUsedAt
            }
          : r
      );
    } else {
      // Create new approved response
      const approvedResponse: ApprovedResponse = {
        id: generateId(),
        agentId: flaggedCase.agentId,
        patternKey: flaggedCase.patternKey,
        approvedText,
        approvedByUserId: rotatingUser.id,
        approvedAt: new Date().toISOString(),
        usageCount: 0,
        lastUsedAt: null,
      };
      updatedApproved = [...approvedResponses, approvedResponse];
    }

    setApprovedResponses(updatedApproved);
    saveToStorage(STORAGE_KEYS.APPROVED_RESPONSES, updatedApproved);

    // Create or update approved pattern
    const patternKey = generatePatternKey(approvedText);
    upsertApprovedPattern({
      patternKey,
      agentId: flaggedCase.agentId,
      approvedText,
      approvedBy: rotatingUser.name,
      approvedAt: new Date().toISOString(),
      reuseCount: 0,
      usage: [],
    });

    // Add audit event
    addAuditEvent({
      agentId: flaggedCase.agentId,
      actor: { name: rotatingUser.name },
      action: "CASE_APPROVED",
      severity: flaggedCase.severity,
      category: flaggedCase.category,
      caseId,
      details: `Approved response for case ${caseId}. Category: ${flaggedCase.category}`,
    });
  };

  const rejectCase = (caseId: string, notes?: string) => {
    const flaggedCase = cases.find((c) => c.id === caseId);
    if (!flaggedCase || flaggedCase.status !== "open") return;

    const updatedCases = cases.map((c) =>
      c.id === caseId ? { ...c, status: "rejected" as const } : c
    );
    setCases(updatedCases);
    saveToStorage(STORAGE_KEYS.CASES, updatedCases);

    addAuditEvent({
      agentId: flaggedCase.agentId,
      actor: { name: currentUser.name },
      action: "CASE_REJECTED",
      severity: flaggedCase.severity,
      category: flaggedCase.category,
      caseId,
      details: notes || `Rejected response for case ${caseId}. Category: ${flaggedCase.category}`,
    });
  };

  const escalateCase = (caseId: string, notes?: string) => {
    const flaggedCase = cases.find((c) => c.id === caseId);
    if (!flaggedCase || flaggedCase.status !== "open") return;

    const updatedCases = cases.map((c) =>
      c.id === caseId ? { ...c, status: "escalated" as const } : c
    );
    setCases(updatedCases);
    saveToStorage(STORAGE_KEYS.CASES, updatedCases);

    addAuditEvent({
      agentId: flaggedCase.agentId,
      actor: { name: currentUser.name },
      action: "CASE_ESCALATED",
      severity: flaggedCase.severity,
      category: flaggedCase.category,
      caseId,
      details: notes || `Escalated case ${caseId} due to ${flaggedCase.severity} severity. Category: ${flaggedCase.category}`,
    });
  };

  const simulateNewRequest = (agentId: string, patternKey: string) => {
    // Check if approved response exists for this patternKey
    const existingApproved = approvedResponses.find(
      (r) => r.agentId === agentId && r.patternKey === patternKey
    );

    if (existingApproved) {
      // Reuse approved response
      const updatedApproved = approvedResponses.map((r) =>
        r.id === existingApproved.id
          ? {
              ...r,
              usageCount: r.usageCount + 1,
              lastUsedAt: new Date().toISOString(),
            }
          : r
      );
      setApprovedResponses(updatedApproved);
      saveToStorage(STORAGE_KEYS.APPROVED_RESPONSES, updatedApproved);
    } else {
      // Create new flagged case
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;

      const newCase: FlaggedCase = {
        id: generateId(),
        agentId,
        patternKey,
        severity: "needs_review",
        category: "General",
        question: `Sample question for pattern: ${patternKey}`,
        draftAnswer: `Draft answer for pattern: ${patternKey}`,
        confidence: 80,
        citationsCount: 1,
        status: "open",
        createdAt: new Date().toISOString(),
      };

      const updatedCases = [...cases, newCase];
      setCases(updatedCases);
      saveToStorage(STORAGE_KEYS.CASES, updatedCases);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        currentUser,
        switchUser,
        agents,
        cases,
        approvedResponses,
        approvedPatterns,
        auditEvents,
        monitoredResponsesByAgent,
        addAuditEvent,
        upsertApprovedPattern,
        recordPatternReuse,
        upsertMonitoredResponse,
        getMonitoredResponse,
        approveCase,
        rejectCase,
        escalateCase,
        simulateNewRequest,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
