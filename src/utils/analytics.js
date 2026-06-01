// analytics.js — silent event logger to Google Sheet via webhook
// Fire-and-forget. App works fully if webhook is missing or fails.
// Set SHEET_WEBHOOK to your Google Apps Script deployment URL.

export const SHEET_WEBHOOK = "REPLACE_WITH_WEBHOOK_URL";

export function logEvent(eventName) {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    fetch(SHEET_WEBHOOK, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:      user.name  || "unknown",
        phone:     user.phone || "unknown",
        event:     eventName,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch { /* intentionally silent */ }
}
