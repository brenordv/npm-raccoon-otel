import { useMemo } from 'react';
import { trace, type Tracer } from '@opentelemetry/api';

const DEFAULT_TRACER_NAME = '@raccoon.ninja/otel-react/custom';

/**
 * Hook to get an OpenTelemetry Tracer for creating custom spans.
 *
 * @param name - Optional tracer name. Defaults to '@raccoon.ninja/otel-react/custom'.
 * @param version - Optional tracer version.
 * @returns An OTel Tracer instance.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const tracer = useTracer();
 *
 *   const handleClick = () => {
 *     const span = tracer.startSpan('button-click');
 *     // ... do work ...
 *     span.end();
 *   };
 * }
 * ```
 */
export function useTracer(name?: string, version?: string): Tracer {
  return useMemo(
    () => trace.getTracer(name ?? DEFAULT_TRACER_NAME, version),
    [name, version],
  );
}
