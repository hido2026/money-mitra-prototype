// analytics.js — silent event logger to Google Sheet via webhook
// Fire-and-forget. App works fully if webhook is missing or fails.
// Set SHEET_WEBHOOK to your Google Apps Script deployment URL.

export const SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbz3Rx-F6RGHc-A4ZTAtchzjr3_D6aI3ALOJRGj7-jT3LmsosVh_eDi0TjR7lGGCrcyo/exec";

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
