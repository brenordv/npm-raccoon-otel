import type { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import type { LoggerProvider } from '@opentelemetry/sdk-logs';
import type { MeterProvider } from '@opentelemetry/sdk-metrics';

export interface ShutdownTargets {
  tracerProvider: WebTracerProvider;
  loggerProvider: LoggerProvider;
  meterProvider: MeterProvider;
}

let shutdownTargets: ShutdownTargets | null = null;
let visibilityHandler: (() => void) | null = null;
let beforeUnloadHandler: (() => void) | null = null;

export function registerShutdownTargets(targets: ShutdownTargets): void {
  shutdownTargets = targets;

  visibilityHandler = () => {
    if (document.visibilityState === 'hidden') {
      flushAll();
    }
  };

  beforeUnloadHandler = () => {
    flushAll();
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', visibilityHandler);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', beforeUnloadHandler);
  }
}

function flushAll(): void {
  if (!shutdownTargets) return;

  try {
    shutdownTargets.tracerProvider.forceFlush();
    shutdownTargets.loggerProvider.forceFlush();
    shutdownTargets.meterProvider.forceFlush();
  } catch {
    // Flush is best-effort during page unload
  }
}

export async function shutdown(): Promise<void> {
  if (!shutdownTargets) return;

  if (typeof document !== 'undefined' && visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
  }
  if (typeof window !== 'undefined' && beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
  }

  try {
    await Promise.all([
      shutdownTargets.tracerProvider.forceFlush(),
      shutdownTargets.loggerProvider.forceFlush(),
      shutdownTargets.meterProvider.forceFlush(),
    ]);

    await Promise.all([
      shutdownTargets.tracerProvider.shutdown(),
      shutdownTargets.loggerProvider.shutdown(),
      shutdownTargets.meterProvider.shutdown(),
    ]);
  } finally {
    shutdownTargets = null;
    visibilityHandler = null;
    beforeUnloadHandler = null;
  }
}
