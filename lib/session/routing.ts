import { SESSION_STATUS_ROUTE, type SessionStatus } from "@/lib/types";

export function routeForStatus(sessionId: string, status: SessionStatus): string {
  return `/session/${sessionId}/${SESSION_STATUS_ROUTE[status]}`;
}
