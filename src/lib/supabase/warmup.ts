import { logger } from "@/lib/utils/logger";

export interface SupabaseWarmupConfig {
  enabled?: boolean;
  intervalMs?: number;
  timeoutMs?: number;
  onlyWhenVisible?: boolean;
  respectOnlineStatus?: boolean;
  runOnStart?: boolean;
  pingUrl?: string;
}

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 menit
const DEFAULT_TIMEOUT_MS = 5000;

function toBooleanEnv(value: unknown): boolean | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
}

function isBrowserRuntime(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function canRunNow(config: Required<SupabaseWarmupConfig>): boolean {
  if (config.respectOnlineStatus && !navigator.onLine) return false;
  if (config.onlyWhenVisible && document.visibilityState !== "visible")
    return false;
  return true;
}

export function startSupabaseWarmup(
  config: SupabaseWarmupConfig = {},
): () => void {
  if (!isBrowserRuntime()) {
    return () => {};
  }

  const envEnabled = toBooleanEnv(import.meta.env.VITE_ENABLE_SUPABASE_WARMUP);
  const defaultEnabled = envEnabled ?? !import.meta.env.DEV;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const defaultPingUrl = supabaseUrl ? `${supabaseUrl}/rest/v1/` : "";

  const finalConfig: Required<SupabaseWarmupConfig> = {
    enabled: config.enabled ?? defaultEnabled,
    intervalMs: config.intervalMs ?? DEFAULT_INTERVAL_MS,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    onlyWhenVisible: config.onlyWhenVisible ?? true,
    respectOnlineStatus: config.respectOnlineStatus ?? true,
    runOnStart: config.runOnStart ?? true,
    pingUrl: config.pingUrl ?? defaultPingUrl,
  };

  if (!finalConfig.enabled) {
    logger.info("⏸️ Supabase warm-up disabled");
    return () => {};
  }

  if (!finalConfig.pingUrl) {
    logger.warn("⚠️ Supabase warm-up skipped: ping URL not configured");
    return () => {};
  }

  let isRunning = false;

  const runWarmup = async (reason: string) => {
    if (isRunning) return;
    if (!canRunNow(finalConfig)) return;

    isRunning = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      finalConfig.timeoutMs,
    );

    try {
      await fetch(finalConfig.pingUrl, {
        method: "GET",
        cache: "no-cache",
        mode: "cors",
        signal: controller.signal,
      });

      logger.info("🔥 Supabase warm-up success", { reason });
    } catch (error) {
      logger.warn("⚠️ Supabase warm-up failed", { reason, error });
    } finally {
      clearTimeout(timeoutId);
      isRunning = false;
    }
  };

  const intervalId = setInterval(() => {
    void runWarmup("interval");
  }, finalConfig.intervalMs);

  const handleOnline = () => {
    void runWarmup("online-event");
  };

  const handleVisible = () => {
    if (document.visibilityState === "visible") {
      void runWarmup("visibility-visible");
    }
  };

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisible);

  if (finalConfig.runOnStart) {
    void runWarmup("startup");
  }

  logger.info("✅ Supabase warm-up started", {
    intervalMs: finalConfig.intervalMs,
    onlyWhenVisible: finalConfig.onlyWhenVisible,
  });

  return () => {
    clearInterval(intervalId);
    window.removeEventListener("online", handleOnline);
    document.removeEventListener("visibilitychange", handleVisible);
    logger.info("🛑 Supabase warm-up stopped");
  };
}
