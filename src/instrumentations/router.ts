import { trace } from '@opentelemetry/api';
import type { OtelExtension, ExtensionContext } from '../core/options';

const TRACER_NAME = '@raccoon.ninja/otel-react/router';

/**
 * Extension for React Router v6/v7 route-change tracing.
 *
 * Usage:
 * ```tsx
 * import { OtelProvider, withReactRouter } from '@raccoon.ninja/otel-react';
 *
 * <OtelProvider serviceName="my-app" extensions={[withReactRouter()]}>
 *   <App />
 * </OtelProvider>
 * ```
 *
 * Note: The actual hook-based integration should be used inside
 * a component that has access to React Router's context. This extension
 * registers the tracer scope for route-change spans.
 */
export function withReactRouter(): OtelExtension {
  return (_context: ExtensionContext) => {
    // Pre-register the tracer scope so route spans are properly attributed
    trace.getTracer(TRACER_NAME, __SDK_VERSION__);
  };
}

/** Tracer name for route-change spans, exported for use in hooks. */
export const ROUTER_TRACER_NAME = TRACER_NAME;
