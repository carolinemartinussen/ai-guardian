"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useDemo } from "@/contexts/DemoContext";
import { useMonitorStream } from "@/hooks/useMonitorStream";
import { AgentHeader } from "@/components/AgentHeader";
import { useState, useMemo, useRef, useEffect } from "react";
import { MonitoredResponse } from "@/types/monitoring";
import Link from "next/link";

function generatePatternKey(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `pattern:${Math.abs(hash).toString(36)}`;
}

export default function FlaggedPage() {
  const params = useParams<{ agentId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { 
    cases, 
    approveCase, 
    rejectCase, 
    escalateCase, 
    currentUser, 
    addAuditEvent,
    approvedPatterns,
    recordPatternReuse,
    upsertApprovedPattern,
    monitoredResponsesByAgent,
    upsertMonitoredResponse,
  } = useDemo();
  
  const agentId = params?.agentId;
  const caseId = searchParams.get("case");

  // Use refs to store callbacks to prevent re-renders and ensure stable references
  // Initialize refs with current values to avoid undefined on first render
  const addAuditEventRef = useRef(addAuditEvent);
  const approvedPatternsRef = useRef(approvedPatterns);
  const recordPatternReuseRef = useRef(recordPatternReuse);
  const upsertApprovedPatternRef = useRef(upsertApprovedPattern);
  const upsertMonitoredResponseRef = useRef(upsertMonitoredResponse);

  // Update refs when values change (doesn't cause re-render)
  useEffect(() => {
    addAuditEventRef.current = addAuditEvent;
    approvedPatternsRef.current = approvedPatterns;
    recordPatternReuseRef.current = recordPatternReuse;
    upsertApprovedPatternRef.current = upsertApprovedPattern;
    upsertMonitoredResponseRef.current = upsertMonitoredResponse;
  }, [addAuditEvent, approvedPatterns, recordPatternReuse, upsertApprovedPattern, upsertMonitoredResponse]);

  // Real-time monitoring stream - use stable callback refs to prevent render-time updates
  const {
    responses,
    needsReviewCount,
    highRiskCount,
    currentTrustScore,
    approveResponse: approveMonitoredResponse,
  } = useMonitorStream(
    agentId, 
    currentUser.name, 
    addAuditEventRef.current,
    approvedPatternsRef.current,
    recordPatternReuseRef.current,
    upsertApprovedPatternRef.current,
    upsertMonitoredResponseRef.current
  );

  // Convert MonitoredResponse to display format (combine with existing cases)
  // This is the queue list - only shows open/flagged items
  const flaggedResponses = useMemo(() => {
    const monitored = responses
      .filter((r) => r.status !== "safe")
      .map((r) => ({
        id: r.id,
        agentId: r.agentId,
        patternKey: `monitored-${r.id}`,
        severity: r.status,
        category: r.findings[0]?.category || "General",
        question: r.userQuery,
        draftAnswer: r.aiResponse,
        confidence: r.findings[0]?.confidence || r.trustScore,
        citationsCount: r.findings[0]?.citationsCount || 0,
        status: "open" as const,
        createdAt: r.timestamp,
      }));
    
    // Combine with existing cases
    const existing = agentId
      ? cases.filter((c) => c.agentId === agentId && c.status === "open")
      : [];
    
    return [...monitored, ...existing];
  }, [responses, cases, agentId]);

  // Separate lookup collection for deep links - includes ALL items (not just open/flagged)
  // Use persisted responses from DemoContext, not just current session responses
  const allItemsLookup = useMemo(() => {
    // Get ALL persisted monitored responses for this agent (including safe)
    const persistedResponses = agentId ? (monitoredResponsesByAgent[agentId] || []) : [];
    
    // Combine persisted responses with current session responses (dedupe by id)
    const allResponsesMap = new Map<string, typeof persistedResponses[0]>();
    persistedResponses.forEach((r) => allResponsesMap.set(r.id, r));
    responses.forEach((r) => allResponsesMap.set(r.id, r));
    const allMonitoredResponses = Array.from(allResponsesMap.values());
    
    // Include ALL monitored responses (including safe)
    const allMonitored = allMonitoredResponses.map((r) => ({
      id: r.id,
      agentId: r.agentId,
      patternKey: `monitored-${r.id}`,
      severity: r.status,
      category: r.findings[0]?.category || "General",
      question: r.userQuery,
      draftAnswer: r.aiResponse,
      confidence: r.findings[0]?.confidence || r.trustScore,
      citationsCount: r.findings[0]?.citationsCount || 0,
      status: "open" as const, // For display purposes, treat monitored responses as "open"
      createdAt: r.timestamp,
    }));
    
    // Include ALL cases for the agent (not just open)
    const allCases = agentId
      ? cases
          .filter((c) => c.agentId === agentId)
          .map((c) => ({
            id: c.id,
            agentId: c.agentId,
            patternKey: c.patternKey,
            severity: c.severity,
            category: c.category,
            question: c.question,
            draftAnswer: c.draftAnswer,
            confidence: c.confidence,
            citationsCount: c.citationsCount,
            status: c.status,
            createdAt: c.createdAt,
          }))
      : [];
    
    return [...allMonitored, ...allCases];
  }, [responses, cases, agentId, monitoredResponsesByAgent]);

  // Use lookup collection to resolve selectedResponse for deep links
  const selectedResponse = caseId ? allItemsLookup.find((r) => r.id === caseId) : null;

  const itemsRequiringReview = needsReviewCount + highRiskCount;

  const [approvedText, setApprovedText] = useState("");

  const handleRowClick = (caseId: string) => {
    if (!agentId) return;
    router.push(`/agents/${agentId}/flagged?case=${caseId}`);
  };

  const closeDrawer = () => {
    if (!agentId) return;
    router.push(`/agents/${agentId}/flagged`);
    setApprovedText("");
  };

  const handleApprove = () => {
    if (!caseId || !approvedText.trim()) return;
    
    // Check if it's a monitored response or existing case
    const isMonitored = responses.some((r) => r.id === caseId);
    
    if (isMonitored) {
      approveMonitoredResponse(caseId, approvedText, currentUser.name);
    } else {
      approveCase(caseId, approvedText);
    }
    
    closeDrawer();
  };

  const handleReject = () => {
    if (!caseId) return;
    rejectCase(caseId);
    closeDrawer();
  };

  const handleEscalate = () => {
    if (!caseId) return;
    escalateCase(caseId);
    closeDrawer();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "safe":
        return "bg-emerald-100 text-emerald-800";
      case "needs_review":
        return "bg-amber-100 text-amber-800";
      case "high_risk":
        return "bg-red-100 text-red-800";
      default:
        return "bg-zinc-100 text-zinc-800";
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <AgentHeader
        itemsRequiringReview={itemsRequiringReview}
        slaRemaining="4h"
        reviewButtonLabel="Review Queue"
        reviewButtonDisabled={true}
      />

      {/* Existing flagged content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Review Queue</h2>
          <p className="text-sm text-zinc-600">
            {flaggedResponses.length} item{flaggedResponses.length !== 1 ? "s" : ""} requiring review
          </p>
        </div>

        <div className="rounded-xl border bg-white">
          {flaggedResponses.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No open cases
            </div>
          ) : (
            <div className="divide-y">
              {flaggedResponses.map((caseItem) => (
                <button
                  key={caseItem.id}
                  onClick={() => handleRowClick(caseItem.id)}
                  className="w-full px-6 py-4 text-left hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getSeverityColor(caseItem.severity)}`}
                      >
                        {caseItem.severity.replace("_", " ")}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{caseItem.category}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Confidence: {caseItem.confidence}% • Citations: {caseItem.citationsCount} • {formatDate(caseItem.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {caseId && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeDrawer}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto text-zinc-900">
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Case Details</h2>
                <button
                  onClick={closeDrawer}
                  className="text-zinc-500 hover:text-zinc-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {selectedResponse ? (
              <div className="p-6 space-y-6 text-zinc-900">
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Severity
                </label>
                <div className="mt-1">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getSeverityColor(selectedResponse.severity)}`}
                  >
                    {selectedResponse.severity.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Category
                </label>
                <p className="mt-1 text-sm text-zinc-900">{selectedResponse.category}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Confidence
                </label>
                <p className="mt-1 text-sm text-zinc-900">{selectedResponse.confidence}%</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Citations Count
                </label>
                <p className="mt-1 text-sm text-zinc-900">{selectedResponse.citationsCount}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Question
                </label>
                <p className="mt-2 text-sm bg-zinc-50 rounded-md p-3 text-zinc-900">
                  {selectedResponse.question}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Draft Answer
                </label>
                <p className="mt-2 text-sm bg-zinc-50 rounded-md p-3 text-zinc-900">
                  {selectedResponse.draftAnswer}
                </p>
              </div>

              {/* Reuse / Approved response pattern */}
              {(() => {
                // Try to find pattern for approved text if it exists, or check if case was already approved
                let patternKey: string | null = null;
                
                if (approvedText.trim()) {
                  patternKey = generatePatternKey(approvedText.trim());
                } else if ("patternKey" in selectedResponse && selectedResponse.patternKey) {
                  // Check if there's a pattern for the case's patternKey
                  patternKey = selectedResponse.patternKey;
                }
                
                const pattern = patternKey && agentId
                  ? approvedPatterns?.find(
                      (p) => p.patternKey === patternKey && p.agentId === agentId
                    )
                  : null;

                if (!pattern) return null;

                const formatDate = (dateString: string) => {
                  const date = new Date(dateString);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                };

                return (
                  <div className="border-t pt-6 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">
                        Reuse / Approved response pattern
                      </label>
                      <div className="bg-zinc-50 rounded-md p-4 space-y-2">
                        <p className="text-sm text-zinc-900">
                          This approved response has been reused{" "}
                          <span className="font-semibold">{pattern.reuseCount}</span> time{pattern.reuseCount !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-zinc-600">
                          Approved by {pattern.approvedBy || "Unknown"}, {formatDate(pattern.approvedAt)}
                        </p>
                        <p className="text-xs text-zinc-600">
                          Last used: {pattern.lastUsedAt ? formatDate(pattern.lastUsedAt) : "—"}
                        </p>
                        {pattern.reuseCount > 0 && agentId && (
                          <Link
                            href={`/agents/${agentId}/usage?pattern=${encodeURIComponent(pattern.patternKey)}`}
                            className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            View usage →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="border-t pt-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">
                    Approved Text (for Approve action)
                  </label>
                  <textarea
                    value={approvedText}
                    onChange={(e) => setApprovedText(e.target.value)}
                    placeholder="Enter approved text..."
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={!approvedText.trim()}
                    className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-zinc-300 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleEscalate}
                    className="flex-1 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                  >
                    Escalate
                  </button>
                </div>
              </div>
            </div>
            ) : (
              <div className="p-6">
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-4 text-sm font-semibold text-zinc-900">
                    Case not found
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500">
                    This case may have been resolved or removed.
                  </p>
                  {agentId && (
                    <Link
                      href={`/agents/${agentId}/flagged`}
                      className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      ← Back to queue
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
