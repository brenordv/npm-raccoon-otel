import { useEffect, useRef, type ReactNode } from 'react';
import { initOtel } from '../core/init';
import type { OtelOptions, OtelHandle, OtelExtension } from '../core/options';

/** Props for the OtelProvider component. */
export interface OtelProviderProps {
  /** Required. Sets the service.name resource attribute. */
  serviceName: string;
  /** OTLP HTTP endpoint. Default: 'http://localhost:4318' */
  endpoint?: string;
  /** Additional OTel resource attributes. */
  resourceAttributes?: Record<string, string>;
  /** Service version. */
  serviceVersion?: string;
  /** Deployment environment. */
  environment?: string;
  /** Enable/disable specific auto-instrumentations. */
  instrumentations?: OtelOptions['instrumentations'];
  /** Custom headers sent with OTLP export requests. */
  headers?: Record<string, string>;
  /** Export timeout in milliseconds. */
  exportTimeout?: number;
  /** URLs to exclude from fetch/XHR instrumentation. */
  ignoreUrls?: Array<string | RegExp>;
  /** Escape hatch: configure the TracerProvider. */
  configureTracing?: OtelOptions['configureTracing'];
  /** Escape hatch: configure the OTLP exporter. */
  configureExporter?: OtelOptions['configureExporter'];
  /** Extension functions for opt-in instrumentations. */
  extensions?: OtelExtension[];
  /** React children to render. */
  children: ReactNode;
}

/**
 * React Provider component that initializes OpenTelemetry on mount
 * and flushes/shuts down on unmount.
 *
 * @example
 * ```tsx
 * import { OtelProvider } from '@raccoon.ninja/otel-react';
 *
 * function App() {
 *   return (
 *     <OtelProvider serviceName="my-app">
 *       <RestOfTheApp />
 *     </OtelProvider>
 *   );
 * }
 * ```
 */
export function OtelProvider({
  children,
  serviceName,
  endpoint,
  resourceAttributes,
  serviceVersion,
  environment,
  instrumentations,
  headers,
  exportTimeout,
  ignoreUrls,
  configureTracing,
  configureExporter,
  extensions,
}: OtelProviderProps) {
  const handleRef = useRef<OtelHandle | null>(null);

  useEffect(() => {
    const handle = initOtel({
      serviceName,
      endpoint,
      resourceAttributes,
      serviceVersion,
      environment,
      instrumentations,
      headers,
      exportTimeout,
      ignoreUrls,
      configureTracing,
      configureExporter,
      extensions,
    });

    handleRef.current = handle;

    return () => {
      handleRef.current?.shutdown();
      handleRef.current = null;
    };
    // We intentionally only run this on mount/unmount.
    // Config changes require remounting the provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
