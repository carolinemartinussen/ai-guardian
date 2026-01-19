"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useDemo } from "@/contexts/DemoContext";
import { useState } from "react";

export default function FlaggedPage() {
  const params = useParams<{ agentId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { agents, cases, approveCase, rejectCase, escalateCase, simulateNewRequest } = useDemo();
  
  const agentId = params?.agentId;
  const caseId = searchParams.get("case");
  
  const agent = agentId ? agents.find((a) => a.id === agentId) : null;
  const openCases = agentId
    ? cases.filter((c) => c.agentId === agentId && c.status === "open")
    : [];
  const selectedCase = cases.find((c) => c.id === caseId);

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
    approveCase(caseId, approvedText);
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

  const handleSimulate = () => {
    if (!agentId) return;
    simulateNewRequest(agentId, "salary-data-request");
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "green":
        return "text-emerald-600";
      case "yellow":
        return "text-amber-600";
      case "red":
        return "text-red-600";
      default:
        return "text-zinc-600";
    }
  };

  if (!agent) {
    return (
      <main className="min-h-screen bg-zinc-50 p-6">
        <p className="text-sm text-zinc-600">Agent not found</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{agent.name}</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Status: <span className={getStatusColor(agent.status)}>{agent.status}</span> • Trust Score: {agent.trustScore}/100
              </p>
            </div>
            <button
              onClick={handleSimulate}
              className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Simulate new request
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Flagged Responses</h2>
          <p className="text-sm text-zinc-600">
            {openCases.length} open case{openCases.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-xl border bg-white">
          {openCases.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No open cases
            </div>
          ) : (
            <div className="divide-y">
              {openCases.map((caseItem) => (
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
      {caseId && selectedCase && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeDrawer}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto">
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

            <div className="p-6 space-y-6">
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
                <p className="mt-1 text-sm">{selectedCase.category}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Confidence
                </label>
                <p className="mt-1 text-sm">{selectedCase.confidence}%</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Citations Count
                </label>
                <p className="mt-1 text-sm">{selectedCase.citationsCount}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Question
                </label>
                <p className="mt-2 text-sm bg-zinc-50 rounded-md p-3">
                  {selectedCase.question}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Draft Answer
                </label>
                <p className="mt-2 text-sm bg-zinc-50 rounded-md p-3">
                  {selectedCase.draftAnswer}
                </p>
              </div>

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
          </div>
        </>
      )}
    </main>
  );
}
