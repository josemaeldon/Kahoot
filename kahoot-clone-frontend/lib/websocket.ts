export function getWebSocketUrl() {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (configured) return configured;
  if (typeof window === "undefined") return "";

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}
