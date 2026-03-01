import { Component, type ReactNode, type ErrorInfo } from 'react';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { logs } from '@opentelemetry/api-logs';

const TRACER_NAME = '@raccoon.ninja/otel-react/error-boundary';
const LOGGER_NAME = '@raccoon.ninja/otel-react/error-boundary';

/** Props for the TracedErrorBoundary component. */
export interface TracedErrorBoundaryProps {
  /** Fallback UI to render when an error is caught. */
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Optional callback when an error is caught. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Children to render. */
  children: ReactNode;
}

interface TracedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that records caught errors as OpenTelemetry spans and logs.
 *
 * @example
 * ```tsx
 * import { TracedErrorBoundary } from '@raccoon.ninja/otel-react';
 *
 * <TracedErrorBoundary fallback={<ErrorPage />}>
 *   <RiskyComponent />
 * </TracedErrorBoundary>
 * ```
 */
export class TracedErrorBoundary extends Component<
  TracedErrorBoundaryProps,
  TracedErrorBoundaryState
> {
  constructor(props: TracedErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): TracedErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const tracer = trace.getTracer(TRACER_NAME, '1.0.0');
    const span = tracer.startSpan('error-boundary.catch');

    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.setAttribute('error.type', error.name);
    span.setAttribute('error.message', error.message);

    if (error.stack) {
      span.setAttribute('error.stack', error.stack);
    }
    if (errorInfo.componentStack) {
      span.setAttribute('error.component_stack', errorInfo.componentStack);
    }

    span.recordException(error);
    span.end();

    // Also emit as a log record
    try {
      const logger = logs.getLogger(LOGGER_NAME, '1.0.0');
      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: 'ERROR',
        body: `Unhandled error: ${error.message}`,
        attributes: {
          'error.type': error.name,
          'error.message': error.message,
          ...(error.stack ? { 'error.stack': error.stack } : {}),
          ...(errorInfo.componentStack
            ? { 'error.component_stack': errorInfo.componentStack }
            : {}),
        },
      });
    } catch {
      // Logging is best-effort
    }

    this.props.onError?.(error, errorInfo);
  }

  private reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.reset);
      }
      return fallback;
    }

    return this.props.children;
  }
}
