"use client";

import { AgentHeader } from "@/components/AgentHeader";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useDemo } from "@/contexts/DemoContext";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { AuditEvent } from "@/types/demo";

function escapeCsvValue(value: string | null | undefined): string {
  if (!value) return "";
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

// Extract patternKey from event details or check if event has patternKey field
function extractPatternKey(event: AuditEvent): string | null {
  // Check if event has patternKey field (for type safety, even though AuditEvent doesn't have it)
  if ("patternKey" in event && typeof (event as any).patternKey === "string") {
    return (event as any).patternKey;
  }
  
  // Extract patternKey from details string
  // Pattern: Approved pattern "pattern:abc123" reused...
  const details = event.details || "";
  const patternMatch = details.match(/pattern:[a-z0-9]+/i);
  if (patternMatch) {
    return patternMatch[0];
  }
  
  return null;
}

function exportAuditLogToCsv(events: AuditEvent[], agentId: string, filename?: string) {
  if (!events || events.length === 0) return;

  // CSV headers
  const headers = [
    "timestamp",
    "actorName",
    "action",
    "severity",
    "category",
    "details",
    "caseId",
    "responseId",
  ];

  // Build CSV rows
  const rows = events.map((event) => {
    const actorName = event.actor?.name || "System";
    return [
      escapeCsvValue(event.timestamp || ""),
      escapeCsvValue(actorName),
      escapeCsvValue(event.action || ""),
      escapeCsvValue(event.severity || ""),
      escapeCsvValue(event.category || ""),
      escapeCsvValue(event.details || ""),
      escapeCsvValue(event.caseId || ""),
      escapeCsvValue(event.responseId || ""),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create Blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  // Use provided filename or generate default
  const finalFilename = filename || `ai-guardian_audit_${agentId}_${new Date().toISOString().split("T")[0]}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", finalFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AuditPage() {
  const params = useParams<{ agentId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { auditEvents, cases, monitoredResponsesByAgent } = useDemo();
  
  const agentId = params?.agentId;
  const viewCaseId = searchParams.get("case");
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear selection when agentId changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [agentId]);

  // Get all events for current agent
  const agentAuditEvents = useMemo(() => {
    if (!agentId || !auditEvents) return [];
    return auditEvents
      .filter((e) => e.agentId === agentId)
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [agentId, auditEvents]);

  // Get unique actions for filter dropdown
  const uniqueActions = useMemo(() => {
    const actions = new Set<string>();
    agentAuditEvents.forEach((e) => {
      if (e.action) actions.add(e.action);
    });
    return Array.from(actions).sort();
  }, [agentAuditEvents]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    let filtered = [...agentAuditEvents];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((event) => {
        const actorName = (event.actor?.name || "System").toLowerCase();
        const action = (event.action || "").toLowerCase();
        const severity = (event.severity || "").toLowerCase();
        const category = (event.category || "").toLowerCase();
        const details = (event.details || "").toLowerCase();
        const caseId = (event.caseId || "").toLowerCase();
        const responseId = (event.responseId || "").toLowerCase();

        return (
          actorName.includes(query) ||
          action.includes(query) ||
          severity.includes(query) ||
          category.includes(query) ||
          details.includes(query) ||
          caseId.includes(query) ||
          responseId.includes(query)
        );
      });
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((event) => event.severity === severityFilter);
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((event) => event.action === actionFilter);
    }

    // Source filter
    if (sourceFilter !== "all") {
      if (sourceFilter === "monitor") {
        filtered = filtered.filter((event) => event.actor?.name === "System");
      } else if (sourceFilter === "human") {
        filtered = filtered.filter((event) => event.actor?.name !== "System");
      }
    }

    return filtered;
  }, [agentAuditEvents, searchQuery, severityFilter, actionFilter, sourceFilter]);

  // Clean up selectedIds when filters change (keep only IDs that exist in filteredEvents)
  useEffect(() => {
    const filteredIds = new Set(filteredEvents.map((e) => e.id));
    setSelectedIds((prev) => {
      const cleaned = new Set<string>();
      prev.forEach((id) => {
        if (filteredIds.has(id)) {
          cleaned.add(id);
        }
      });
      return cleaned;
    });
  }, [filteredEvents]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  const handleToggleSelect = (eventId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const isAllSelected = filteredEvents.length > 0 && selectedIds.size === filteredEvents.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredEvents.length;

  // Export handlers
  const handleExportFiltered = () => {
    if (!agentId || filteredEvents.length === 0) return;
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const filename = `ai-guardian_audit_${agentId}_filtered_${dateStr}.csv`;
    exportAuditLogToCsv(filteredEvents, agentId, filename);
  };

  const handleExportSelected = () => {
    if (!agentId || selectedIds.size === 0) return;
    const selectedEvents = filteredEvents.filter((e) => selectedIds.has(e.id));
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const filename = `ai-guardian_audit_${agentId}_selected_${dateStr}.csv`;
    exportAuditLogToCsv(selectedEvents, agentId, filename);
  };

  const canExportFiltered = agentId && filteredEvents.length > 0;
  const canExportSelected = agentId && selectedIds.size > 0;

  // Drawer functionality - resolve case from query param
  const allItemsLookup = useMemo(() => {
    // Get ALL persisted monitored responses for this agent (including safe)
    const persistedResponses = agentId ? (monitoredResponsesByAgent[agentId] || []) : [];
    
    // Include ALL monitored responses (including safe)
    const allMonitored = persistedResponses.map((r) => ({
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
  }, [cases, agentId, monitoredResponsesByAgent]);

  const selectedCase = viewCaseId ? allItemsLookup.find((r) => r.id === viewCaseId) : null;

  const closeDrawer = () => {
    if (!agentId) return;
    router.push(`/agents/${agentId}/audit`);
  };

  const getSeverityColor = (severity?: string) => {
    if (!severity) return "";
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-white">
      <AgentHeader />

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">
              Audit Log
            </h2>
            <p className="text-sm text-zinc-600">
              View all audit events and actions for this agent.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFiltered}
              disabled={!canExportFiltered}
              title={canExportFiltered ? "Export filtered events as CSV" : "No matching events to export"}
              className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              Export filtered (CSV)
            </button>
            <button
              onClick={handleExportSelected}
              disabled={!canExportSelected}
              title={canExportSelected ? `Export ${selectedIds.size} selected event${selectedIds.size !== 1 ? "s" : ""} as CSV` : "Select one or more events to export"}
              className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              Export selected (CSV)
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        {agentAuditEvents.length > 0 && (
          <div className="mb-4 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search Input */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search actor, action, category, details, caseId..."
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-600 whitespace-nowrap">Severity:</label>
                <div className="flex items-center gap-1 rounded-md border border-zinc-300 bg-white">
                  {["all", "safe", "needs_review", "high_risk"].map((severity) => (
                    <button
                      key={severity}
                      onClick={() => setSeverityFilter(severity)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        severityFilter === severity
                          ? "bg-zinc-900 text-white"
                          : "text-zinc-600 hover:bg-zinc-50"
                      } ${severity === "all" ? "rounded-l-md" : ""} ${
                        severity === "high_risk" ? "rounded-r-md" : ""
                      }`}
                    >
                      {severity === "all" ? "All" : severity.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-600 whitespace-nowrap">Action:</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  <option value="all">All</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {action.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-600 whitespace-nowrap">Source:</label>
                <div className="flex items-center gap-1 rounded-md border border-zinc-300 bg-white">
                  {["all", "monitor", "human"].map((source) => (
                    <button
                      key={source}
                      onClick={() => setSourceFilter(source)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                        sourceFilter === source
                          ? "bg-zinc-900 text-white"
                          : "text-zinc-600 hover:bg-zinc-50"
                      } ${source === "all" ? "rounded-l-md" : ""} ${
                        source === "human" ? "rounded-r-md" : ""
                      }`}
                    >
                      {source === "all" ? "All" : source}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="rounded-xl border bg-white p-8">
            <div className="text-center">
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
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-semibold text-zinc-900">
                {agentAuditEvents.length === 0
                  ? "No audit events"
                  : "No matching events"}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                {agentAuditEvents.length === 0
                  ? "Audit events will appear here as actions are taken on flagged responses."
                  : "Try adjusting your filters to see more results."}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={handleSelectAll}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredEvents.map((event) => {
                    const actorName = event.actor?.name || "System";
                    const isSelected = selectedIds.has(event.id);
                    
                    // Determine link based on priority: caseId > responseId > patternKey > none
                    // For APPROVED_RESPONSE_REUSED, skip responseId and use patternKey instead
                    let actionLink: { href: string; label: string } | null = null;
                    
                    if (event.caseId && agentId) {
                      actionLink = {
                        href: `/agents/${agentId}/audit?case=${event.caseId}`,
                        label: "View",
                      };
                    } else if (event.responseId && agentId && event.action !== "APPROVED_RESPONSE_REUSED") {
                      // Skip responseId for APPROVED_RESPONSE_REUSED - use patternKey instead
                      actionLink = {
                        href: `/agents/${agentId}/audit?case=${event.responseId}`,
                        label: "View",
                      };
                    } else {
                      // Check for patternKey (for APPROVED_RESPONSE_REUSED or events without caseId/responseId)
                      const patternKey = extractPatternKey(event);
                      if (patternKey && agentId) {
                        actionLink = {
                          href: `/agents/${agentId}/usage?pattern=${encodeURIComponent(patternKey)}`,
                          label: "View usage",
                        };
                      }
                    }
                    
                    return (
                      <tr key={event.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(event.id)}
                            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {formatTime(event.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                          {actorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {event.action.replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {event.severity ? (
                            <span
                              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getSeverityColor(event.severity)}`}
                            >
                              {event.severity.replace("_", " ")}
                            </span>
                          ) : (
                            <span className="text-sm text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {event.details}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {actionLink ? (
                            <Link
                              href={actionLink.href}
                              className="text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              {actionLink.label}
                            </Link>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Drawer */}
        {viewCaseId && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={closeDrawer}
            />
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto text-zinc-900">
              <div className="border-b p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-900">Case Details</h2>
                  <button
                    onClick={closeDrawer}
                    className="text-zinc-500 hover:text-zinc-700"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {selectedCase ? (
                <div className="p-6 space-y-6 text-zinc-900">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Severity
                    </label>
                    <div className="mt-1">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getSeverityColor(selectedCase.severity)}`}
                      >
                        {selectedCase.severity.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Category
                    </label>
                    <p className="mt-1 text-sm text-zinc-900">{selectedCase.category}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Confidence
                    </label>
                    <p className="mt-1 text-sm text-zinc-900">{selectedCase.confidence}%</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Question
                    </label>
                    <p className="mt-2 text-sm bg-zinc-50 rounded-md p-3 text-zinc-900">
                      {selectedCase.question}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Draft Answer
                    </label>
                    <p className="mt-2 text-sm bg-zinc-50 rounded-md p-3 text-zinc-900">
                      {selectedCase.draftAnswer}
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <Link
                      href={`/agents/${agentId}/flagged?case=${viewCaseId}`}
                      className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Open in Review Queue →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="text-center py-12">
                    <h3 className="mt-4 text-sm font-semibold text-zinc-900">
                      Case not found
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500">
                      This case may have been resolved or removed.
                    </p>
                    {agentId && (
                      <button
                        onClick={closeDrawer}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
