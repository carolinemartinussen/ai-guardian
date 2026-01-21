"use client";

import { useParams } from "next/navigation";
import { useDemo } from "@/contexts/DemoContext";
import { useMonitorStream } from "@/hooks/useMonitorStream";
import { AgentHeader } from "@/components/AgentHeader";
import { useRef, useEffect, useState } from "react";

export default function AgentPage() {
  const params = useParams<{ agentId: string }>();
  const { 
    currentUser, 
    addAuditEvent,
    approvedPatterns,
    recordPatternReuse,
    upsertApprovedPattern,
    upsertMonitoredResponse,
  } = useDemo();
  
  const agentId = params?.agentId;

  // Use refs to store callbacks to prevent re-renders and ensure stable references
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

  // Real-time monitoring stream - use refs to prevent render-time updates
  const {
    currentTrustScore,
    needsReviewCount,
    highRiskCount,
  } = useMonitorStream(
    agentId, 
    currentUser.name, 
    addAuditEventRef.current,
    approvedPatternsRef.current,
    recordPatternReuseRef.current,
    upsertApprovedPatternRef.current,
    upsertMonitoredResponseRef.current
  );

  const itemsRequiringReview = needsReviewCount + highRiskCount;
  const [riskPeriod, setRiskPeriod] = useState<"24h" | "7d" | "30d">("24h");
  
  // Mock risk level data for different periods
  const riskData = {
    "24h": {
      level: highRiskCount > 0 ? "High" : needsReviewCount > 0 ? "Medium" : "Low",
      change: highRiskCount > 0 ? "+5.2%" : needsReviewCount > 0 ? "+2.1%" : "-1.3%",
    },
    "7d": {
      level: "Medium",
      change: "+3.4%",
    },
    "30d": {
      level: "Low",
      change: "-2.1%",
    },
  };
  
  const currentRiskData = riskData[riskPeriod];
  const trustScoreTrend = "+2.4%";

  return (
    <main className="min-h-screen bg-white">
      <AgentHeader
        itemsRequiringReview={itemsRequiringReview}
        slaRemaining="4h"
      />

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Key Metrics */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Trust Score Card */}
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-zinc-700">
                    Trust Score
                  </span>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-semibold text-zinc-900">
                  {currentTrustScore || 0}
                </span>
              </div>
              <p className="text-sm text-zinc-500 mb-4">
                Average confidence of recent safe responses
              </p>
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94"
                  />
                </svg>
                <span className="text-sm text-red-600 font-medium">
                  {trustScoreTrend}
                </span>
              </div>
            </div>

            {/* Risk Level Card */}
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-zinc-700">
                    Risk Level
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(["24h", "7d", "30d"] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setRiskPeriod(period)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        riskPeriod === period
                          ? "font-medium text-zinc-700 bg-zinc-100"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-semibold text-zinc-900">
                  {currentRiskData.level}
                </span>
              </div>
              <p className="text-sm text-zinc-500 mb-4">
                Current assessment ({riskPeriod})
              </p>
              <div className="flex items-center gap-1">
                <svg
                  className={`w-4 h-4 ${
                    currentRiskData.change.startsWith("+")
                      ? "text-red-600"
                      : currentRiskData.change.startsWith("-")
                      ? "text-emerald-600"
                      : "text-zinc-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94"
                  />
                </svg>
                <span
                  className={`text-sm font-medium ${
                    currentRiskData.change.startsWith("+")
                      ? "text-red-600"
                      : currentRiskData.change.startsWith("-")
                      ? "text-emerald-600"
                      : "text-zinc-500"
                  }`}
                >
                  {currentRiskData.change}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
