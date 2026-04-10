export function isReadOnlyDemoMode() {
  return process.env.NEXT_PUBLIC_READ_ONLY_DEMO === "true";
}

export function getReadOnlyDemoMessage() {
  return "This Netlify deployment is a read-only demo. Use your local app to save changes, import CSV, or edit factors.";
}
