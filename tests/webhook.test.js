/**
 * T2.3 — Webhook / Event Handler Unit Tests
 *
 * The orchestrator is triggered by GitHub Issues webhooks (issues: opened, edited).
 * These tests verify that the event payload parsing logic correctly extracts the
 * issue number, title, body, and action — and throws on malformed payloads.
 *
 * This replaces the Jira webhook tests from the original spec.
 * We use GitHub Issues because:
 *   - Native integration with GitHub Actions (no external webhook endpoint)
 *   - Free on all plan tiers (no Jira subscription needed)
 *   - Event schema is stable and well-documented
 *
 * Run with:  npm test
 */

import { describe, it, expect } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Payload parser — mirrors the orchestrator's github.event.issue extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {{ number: number, title: string, body: string|null, labels: Array<{name:string}> }} Issue
 * @typedef {{ action: string, issue: Issue }} IssuePayload
 */

/**
 * Parses a raw GitHub Issues webhook payload into a normalised ticket object.
 * Throws if required fields are missing.
 *
 * @param {unknown} payload
 * @returns {{ ticketId: string, title: string, body: string, action: string, labelNames: string[] }}
 */
function parseIssueWebhook(payload) {
  if (typeof payload !== "object" || payload === null) {
    throw new TypeError("Payload must be a non-null object");
  }
  const { action, issue } = /** @type {any} */ (payload);
  if (!issue) throw new Error("Missing `issue` in payload");
  if (typeof issue.number !== "number") throw new Error("`issue.number` must be a number");
  if (!issue.title || typeof issue.title !== "string") throw new Error("`issue.title` is required");

  return {
    ticketId:   String(issue.number),
    title:      issue.title.trim(),
    body:       (issue.body ?? "").trim(),
    action:     action ?? "opened",
    labelNames: Array.isArray(issue.labels) ? issue.labels.map((l) => l.name) : [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// T2.3 Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("T2.3 – GitHub Issues webhook parser", () => {
  // ── Happy-path payloads ──────────────────────────────────────────────────

  it("parses a well-formed 'opened' event", () => {
    const payload = {
      action: "opened",
      issue: {
        number: 42,
        title: 'Change hero headline on homepage to: "Sustainable packaging for a circular economy"',
        body: "Please update the h1 text on the homepage.",
        labels: [],
      },
    };
    const result = parseIssueWebhook(payload);
    expect(result.ticketId).toBe("42");
    expect(result.title).toContain("hero headline");
    expect(result.body).toContain("h1 text");
    expect(result.action).toBe("opened");
    expect(result.labelNames).toEqual([]);
  });

  it("parses an 'edited' event (retry trigger)", () => {
    const payload = {
      action: "edited",
      issue: {
        number: 43,
        title: "Add Investor Relations link to footer on homepage",
        body: "Add a link to /investors in the footer.\n\n<!-- retry-1 -->",
        labels: [{ name: "triaged" }, { name: "retry-1" }],
      },
    };
    const result = parseIssueWebhook(payload);
    expect(result.action).toBe("edited");
    expect(result.labelNames).toContain("retry-1");
    expect(result.body).toContain("retry-1");
  });

  it("handles null body gracefully (becomes empty string)", () => {
    const payload = {
      action: "opened",
      issue: { number: 44, title: "Update footer on products page", body: null, labels: [] },
    };
    const result = parseIssueWebhook(payload);
    expect(result.body).toBe("");
  });

  it("trims whitespace from title and body", () => {
    const payload = {
      action: "opened",
      issue: {
        number: 45,
        title: "  Add section to about page  ",
        body: "  Sustainability section  ",
        labels: [],
      },
    };
    const result = parseIssueWebhook(payload);
    expect(result.title).toBe("Add section to about page");
    expect(result.body).toBe("Sustainability section");
  });

  // ── Error cases ──────────────────────────────────────────────────────────

  it("throws TypeError on null payload", () => {
    expect(() => parseIssueWebhook(null)).toThrow(TypeError);
  });

  it("throws on missing `issue` key", () => {
    expect(() => parseIssueWebhook({ action: "opened" })).toThrow("Missing `issue`");
  });

  it("throws when issue.number is not a number", () => {
    expect(() =>
      parseIssueWebhook({ action: "opened", issue: { number: "42", title: "Test", body: "", labels: [] } })
    ).toThrow("`issue.number` must be a number");
  });

  it("throws when issue.title is missing", () => {
    expect(() =>
      parseIssueWebhook({ action: "opened", issue: { number: 1, body: "", labels: [] } })
    ).toThrow("`issue.title` is required");
  });

  // ── Ticket-ID format ────────────────────────────────────────────────────

  it("ticketId is always a string", () => {
    const payload = { action: "opened", issue: { number: 99, title: "Test", body: null, labels: [] } };
    const { ticketId } = parseIssueWebhook(payload);
    expect(typeof ticketId).toBe("string");
    expect(ticketId).toBe("99");
  });

  it("auto/ticket-{N} branch name can be derived from ticketId", () => {
    const { ticketId } = parseIssueWebhook({
      action: "opened",
      issue: { number: 17, title: "Add sustainability section to about", body: "", labels: [] },
    });
    const branchName = `auto/ticket-${ticketId}`;
    expect(branchName).toBe("auto/ticket-17");
  });
});
