"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MonitoredResponse } from "@/types/monitoring";
import { AuditEvent, ApprovedPattern } from "@/types/demo";

type UseMonitorStreamReturn = {
  responses: MonitoredResponse[];
  needsReviewCount: number;
  highRiskCount: number;
  currentTrustScore: number;
  approveResponse: (responseId: string, approvedText: string, actor: string) => void;
  isConnected: boolean;
};

function generatePatternKey(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `pattern:${Math.abs(hash).toString(36)}`;
}

export function useMonitorStream(
  agentId: string | undefined,
  actorName: string = "Sarah Chen",
  onAuditEvent?: (event: Omit<AuditEvent, "id" | "timestamp">) => void,
  approvedPatterns?: ApprovedPattern[],
  recordPatternReuse?: (agentId: string, patternKey: string, responseId: string, timestamp: string, monitoredResponse?: MonitoredResponse) => void,
  upsertApprovedPattern?: (pattern: Omit<ApprovedPattern, "reuseCount" | "usage"> & { reuseCount?: number; usage?: ApprovedPattern["usage"] }) => void,
  upsertMonitoredResponse?: (agentId: string, response: MonitoredResponse) => void
): UseMonitorStreamReturn {
  const [responses, setResponses] = useState<MonitoredResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const processedResponseIdsRef = useRef<Set<string>>(new Set());
  const responseCountRef = useRef<number>(0);
  
  // Refs to store latest callback/state values without causing reconnects
  const onAuditEventRef = useRef(onAuditEvent);
  const approvedPatternsRef = useRef(approvedPatterns);
  const recordPatternReuseRef = useRef(recordPatternReuse);
  const upsertApprovedPatternRef = useRef(upsertApprovedPattern);
  const upsertMonitoredResponseRef = useRef(upsertMonitoredResponse);
  const agentIdRef = useRef(agentId);

  // Update refs when values change (doesn't trigger reconnect)
  useEffect(() => {
    onAuditEventRef.current = onAuditEvent;
    approvedPatternsRef.current = approvedPatterns;
    recordPatternReuseRef.current = recordPatternReuse;
    upsertApprovedPatternRef.current = upsertApprovedPattern;
    upsertMonitoredResponseRef.current = upsertMonitoredResponse;
    agentIdRef.current = agentId;
  }, [onAuditEvent, approvedPatterns, recordPatternReuse, upsertApprovedPattern, upsertMonitoredResponse, agentId]);

  // Derived counts
  const needsReviewCount = responses.filter(
    (r) => r.status === "needs_review"
  ).length;
  const highRiskCount = responses.filter(
    (r) => r.status === "high_risk"
  ).length;

  // Rolling trust score (average of last 10, or last value if fewer)
  const currentTrustScore = responses.length > 0
    ? Math.round(
        responses
          .slice(-10)
          .reduce((sum, r) => sum + r.trustScore, 0) /
          Math.min(responses.length, 10)
      )
    : 0;

  // Approve action
  const approveResponse = useCallback(
    (responseId: string, approvedText: string, actor: string) => {
      setResponses((prev) => {
        const response = prev.find((r) => r.id === responseId);
        if (!response) return prev;

        // Use refs to access latest values
        const upsertPattern = upsertApprovedPatternRef.current;
        const auditEvent = onAuditEventRef.current;

        // Create or update approved pattern
        if (upsertPattern && response.agentId) {
          const patternKey = generatePatternKey(approvedText);
          upsertPattern({
            patternKey,
            agentId: response.agentId,
            approvedText,
            approvedBy: actor,
            approvedAt: new Date().toISOString(),
            reuseCount: 0,
            usage: [],
          });
        }

        // Create audit event via callback
        if (auditEvent) {
          auditEvent({
            agentId: response.agentId,
            actor: { name: actor },
            action: "MONITORED_APPROVED",
            severity: response.status,
            category: response.findings[0]?.category,
            responseId,
            details: `Approved monitored response ${responseId}. Category: ${response.findings[0]?.category || "General"}`,
          });
        }

        // Update response status
        return prev.map((r) =>
          r.id === responseId ? { ...r, status: "safe" as const } : r
        );
      });
    },
    []
  );

  // Main effect: only recreate EventSource when agentId changes
  useEffect(() => {
    if (!agentId) {
      setIsConnected(false);
      // Clean up existing connection if agentId becomes undefined
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Guard: don't create new EventSource if one already exists for this agentId
    if (eventSourceRef.current) {
      return;
    }

    // Reset refs when agentId changes
    processedResponseIdsRef.current.clear();
    responseCountRef.current = 0;

    const eventSource = new EventSource(
      `/api/monitor/stream?agentId=${encodeURIComponent(agentId)}`
    );

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: MonitoredResponse = JSON.parse(event.data);
        setResponses((prev) => {
          // Keep only last 50 responses to prevent memory issues
          const updated = [...prev, data];
          return updated.slice(-50);
        });

        // Persist monitored response to DemoContext
        const upsertResponse = upsertMonitoredResponseRef.current;
        const currentAgentId = agentIdRef.current;
        if (upsertResponse && currentAgentId && data.agentId === currentAgentId) {
          upsertResponse(currentAgentId, data);
        }

        // Access latest values via refs
        const patterns = approvedPatternsRef.current;
        const recordReuse = recordPatternReuseRef.current;
        const auditEvent = onAuditEventRef.current;

        // Simulate pattern reuse (deterministic cycle through existing patterns)
        if (data.status === "safe" && patterns && recordReuse && currentAgentId) {
          const agentPatterns = patterns.filter((p) => p.agentId === currentAgentId);
          if (agentPatterns.length > 0) {
            // Cycle through patterns deterministically based on response count
            const patternIndex = responseCountRef.current % agentPatterns.length;
            const patternToReuse = agentPatterns[patternIndex];
            if (patternToReuse) {
              recordReuse(currentAgentId, patternToReuse.patternKey, data.id, data.timestamp, data);
            }
          }
        }
        responseCountRef.current += 1;

        // Create audit events for monitored responses (avoid duplicates)
        if (!processedResponseIdsRef.current.has(data.id)) {
          processedResponseIdsRef.current.add(data.id);
          
          if (auditEvent) {
            if (data.status === "safe") {
              // Emit MONITOR_SAFE events deterministically (every safe response)
              auditEvent({
                agentId: data.agentId,
                actor: { name: "System" },
                action: "MONITOR_SAFE",
                severity: "safe",
                category: data.findings[0]?.category,
                responseId: data.id,
                details: `Safe response monitored. Category: ${data.findings[0]?.category || "General"}`,
              });
            } else {
              // Emit MONITOR_FLAGGED for non-safe responses
              auditEvent({
                agentId: data.agentId,
                actor: { name: "System" },
                action: "MONITOR_FLAGGED",
                severity: data.status,
                category: data.findings[0]?.category,
                responseId: data.id,
                details: `Flagged response detected. Severity: ${data.status}, Category: ${data.findings[0]?.category || "General"}`,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = () => {
      // Don't close EventSource on error - let it auto-reconnect
      // Only update connection status
      setIsConnected(false);
    };

    return () => {
      // Cleanup: close EventSource when agentId changes or component unmounts
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [agentId]); // Only depend on agentId

  return {
    responses,
    needsReviewCount,
    highRiskCount,
    currentTrustScore,
    approveResponse,
    isConnected,
  };
}
