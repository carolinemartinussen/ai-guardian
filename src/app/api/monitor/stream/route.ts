import { NextRequest } from "next/server";
import { MonitoredResponse } from "@/types/monitoring";

// Force dynamic rendering for SSE
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Deterministic sample events that cycle through
const SAMPLE_RESPONSES: Omit<MonitoredResponse, "id" | "timestamp">[] = [
  {
    agentId: "customer-support-bot",
    userQuery: "What is your refund policy?",
    aiResponse: "Our refund policy allows returns within 30 days of purchase. Please contact support with your order number.",
    trustScore: 92,
    status: "safe",
    findings: [
      {
        category: "Policy",
        severity: "safe",
        explanation: "Standard policy information",
        confidence: 95,
        citationsCount: 2,
      },
    ],
  },
  {
    agentId: "customer-support-bot",
    userQuery: "Can you help me reset my password?",
    aiResponse: "Sure! I can help you reset your password. Please provide your email address: user@example.com and I'll send you a reset link.",
    trustScore: 45,
    status: "high_risk",
    findings: [
      {
        category: "PII Disclosure",
        severity: "high_risk",
        explanation: "AI generated example email address that could be mistaken for real user data",
        confidence: 88,
        citationsCount: 0,
      },
    ],
  },
  {
    agentId: "hr-policy-assistant",
    userQuery: "What is the salary range for senior engineers?",
    aiResponse: "Senior engineers typically earn between $120,000 and $180,000 annually, depending on experience and location.",
    trustScore: 35,
    status: "high_risk",
    findings: [
      {
        category: "Compensation",
        severity: "high_risk",
        explanation: "Salary information disclosure without proper authorization",
        confidence: 92,
        citationsCount: 0,
      },
    ],
  },
  {
    agentId: "hr-policy-assistant",
    userQuery: "How many vacation days do I have?",
    aiResponse: "You have 25 vacation days per year. You can check your current balance in the HR portal.",
    trustScore: 78,
    status: "needs_review",
    findings: [
      {
        category: "HR Policy",
        severity: "needs_review",
        explanation: "Personal data access - verify user authorization",
        confidence: 75,
        citationsCount: 1,
      },
    ],
  },
  {
    agentId: "internal-dev-copilot",
    userQuery: "How do I connect to the production database?",
    aiResponse: "To connect to production, use the connection string: postgresql://prod-db.internal:5432/app. Credentials are in the secrets manager.",
    trustScore: 25,
    status: "high_risk",
    findings: [
      {
        category: "Security",
        severity: "high_risk",
        explanation: "Database connection details exposed",
        confidence: 95,
        citationsCount: 0,
      },
    ],
  },
  {
    agentId: "customer-support-bot",
    userQuery: "What are your business hours?",
    aiResponse: "Our customer support is available Monday through Friday, 9 AM to 5 PM EST.",
    trustScore: 88,
    status: "safe",
    findings: [
      {
        category: "General",
        severity: "safe",
        explanation: "Public business information",
        confidence: 98,
        citationsCount: 1,
      },
    ],
  },
  {
    agentId: "hr-policy-assistant",
    userQuery: "What is the company's code of conduct?",
    aiResponse: "Our code of conduct emphasizes respect, integrity, and professionalism. Full details are available in the employee handbook.",
    trustScore: 85,
    status: "safe",
    findings: [
      {
        category: "Policy",
        severity: "safe",
        explanation: "General policy reference",
        confidence: 90,
        citationsCount: 1,
      },
    ],
  },
  {
    agentId: "internal-dev-copilot",
    userQuery: "What is the API rate limit?",
    aiResponse: "The API rate limit is 1000 requests per minute per API key. Rate limit headers are included in all responses.",
    trustScore: 82,
    status: "safe",
    findings: [
      {
        category: "Technical",
        severity: "safe",
        explanation: "Public API documentation",
        confidence: 92,
        citationsCount: 2,
      },
    ],
  },
];

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get("agentId");

  if (!agentId) {
    return new Response("agentId parameter required", { status: 400 });
  }

  // Filter responses for the requested agent
  const agentResponses = SAMPLE_RESPONSES.filter((r) => r.agentId === agentId);

  if (agentResponses.length === 0) {
    return new Response("No sample data for this agent", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let index = 0;

      const sendEvent = () => {
        const sample = agentResponses[index % agentResponses.length];
        const response: MonitoredResponse = {
          ...sample,
          id: `resp-${Date.now()}-${index}`,
          timestamp: new Date().toISOString(),
        };

        const data = JSON.stringify(response);
        controller.enqueue(
          encoder.encode(`data: ${data}\n\n`)
        );

        index++;
      };

      // Send first event immediately
      sendEvent();

      // Then send events every 2-4 seconds
      const interval = setInterval(() => {
        sendEvent();
      }, 2000 + Math.random() * 2000); // 2-4 seconds

      // Clean up on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for nginx
    },
  });
}
