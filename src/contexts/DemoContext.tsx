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
} from "@/types/demo";
import { seedAgents } from "@/demo/seedAgents";
import { seedCases } from "@/demo/seedCases";

type DemoContextType = {
  currentUser: DemoUser;
  switchUser: (userId: string) => void;
  agents: Agent[];
  cases: FlaggedCase[];
  approvedResponses: ApprovedResponse[];
  auditEvents: AuditEvent[];
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
  AUDIT_EVENTS: "demo-audit-events",
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

export function DemoProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[0]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [cases, setCases] = useState<FlaggedCase[]>([]);
  const [approvedResponses, setApprovedResponses] = useState<
    ApprovedResponse[]
  >([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

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

    // Load or initialize audit events
    const loadedAuditEvents = loadFromStorage<AuditEvent[]>(
      STORAGE_KEYS.AUDIT_EVENTS,
      []
    );
    setAuditEvents(loadedAuditEvents);
  }, []);

  const switchUser = (userId: string) => {
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEYS.USER, userId);
    }
  };

  const addAuditEvent = (
    type: AuditEvent["type"],
    agentId: string,
    caseId?: string,
    notes?: string
  ) => {
    const event: AuditEvent = {
      id: generateId(),
      agentId,
      caseId,
      type,
      actorUserId: currentUser.id,
      timestamp: new Date().toISOString(),
      notes,
    };
    const updated = [...auditEvents, event];
    setAuditEvents(updated);
    saveToStorage(STORAGE_KEYS.AUDIT_EVENTS, updated);
  };

  const approveCase = (caseId: string, approvedText: string) => {
    const flaggedCase = cases.find((c) => c.id === caseId);
    if (!flaggedCase || flaggedCase.status !== "open") return;

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
              approvedByUserId: currentUser.id,
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
        approvedByUserId: currentUser.id,
        approvedAt: new Date().toISOString(),
        usageCount: 0,
        lastUsedAt: null,
      };
      updatedApproved = [...approvedResponses, approvedResponse];
    }

    setApprovedResponses(updatedApproved);
    saveToStorage(STORAGE_KEYS.APPROVED_RESPONSES, updatedApproved);

    // Add audit event
    addAuditEvent("CASE_APPROVED", flaggedCase.agentId, caseId);
  };

  const rejectCase = (caseId: string, notes?: string) => {
    const flaggedCase = cases.find((c) => c.id === caseId);
    if (!flaggedCase || flaggedCase.status !== "open") return;

    const updatedCases = cases.map((c) =>
      c.id === caseId ? { ...c, status: "rejected" as const } : c
    );
    setCases(updatedCases);
    saveToStorage(STORAGE_KEYS.CASES, updatedCases);

    addAuditEvent("CASE_REJECTED", flaggedCase.agentId, caseId, notes);
  };

  const escalateCase = (caseId: string, notes?: string) => {
    const flaggedCase = cases.find((c) => c.id === caseId);
    if (!flaggedCase || flaggedCase.status !== "open") return;

    const updatedCases = cases.map((c) =>
      c.id === caseId ? { ...c, status: "escalated" as const } : c
    );
    setCases(updatedCases);
    saveToStorage(STORAGE_KEYS.CASES, updatedCases);

    addAuditEvent("CASE_ESCALATED", flaggedCase.agentId, caseId, notes);
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

      // Add audit event
      addAuditEvent("APPROVED_REUSED", agentId);
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
        auditEvents,
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
