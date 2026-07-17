type MonitoringLevel = "info" | "warn" | "error";

export function trackEvent(event: string, payload?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.info(`[monitoring:event] ${event}`, payload ?? {});
  }
}

export function reportError(
  scope: string,
  error: unknown,
  level: MonitoringLevel = "error",
  context?: Record<string, unknown>
) {
  const base = {
    scope,
    level,
    message: error instanceof Error ? error.message : String(error),
    ...(context ?? {}),
  };

  if (level === "warn") {
    console.warn("[monitoring:error]", base, error);
    return;
  }

  console.error("[monitoring:error]", base, error);
}
