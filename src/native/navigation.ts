import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { OtelExtension } from '../core/options';

const TRACER_NAME = '@raccoon.ninja/otel-react/react-navigation';

/**
 * Extension for React Navigation route-change tracing.
 *
 * This extension pre-registers the tracer scope. Actual navigation
 * tracking requires hooking into React Navigation's onStateChange
 * in the consuming app.
 *
 * @example
 * ```tsx
 * import { withReactNavigation, createNavigationTracker } from '@raccoon.ninja/otel-react/native';
 *
 * const otel = await initOtelNative({
 *   serviceName: 'my-rn-app',
 *   extensions: [withReactNavigation()],
 * });
 * ```
 */
export function withReactNavigation(): OtelExtension {
  return () => {
    trace.getTracer(TRACER_NAME, __SDK_VERSION__);
  };
}

/**
 * Creates a navigation state change handler that records route changes as spans.
 *
 * @returns A function suitable for React Navigation's onStateChange prop.
 */
export function createNavigationTracker() {
  const tracer = trace.getTracer(TRACER_NAME, __SDK_VERSION__);
  let previousRouteName: string | undefined;

  return (state: { routes: Array<{ name: string }>; index: number } | undefined) => {
    if (!state) return;

    const currentRoute = state.routes[state.index];
    if (!currentRoute) return;

    const currentRouteName = currentRoute.name;

    if (previousRouteName && previousRouteName !== currentRouteName) {
      const span = tracer.startSpan('navigation.route_change');
      span.setAttribute('navigation.from', previousRouteName);
      span.setAttribute('navigation.to', currentRouteName);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    }

    previousRouteName = currentRouteName;
  };
}
