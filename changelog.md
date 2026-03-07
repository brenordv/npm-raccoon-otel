# 1.1.0

- Added `propagateTraceHeaderCorsUrls` option to `OtelOptions` and `OtelProvider`, enabling W3C Trace Context header injection (`traceparent`/`tracestate`) on cross-origin fetch and XHR requests.
- Explicitly registered `W3CTraceContextPropagator` on the `WebTracerProvider`.
- Added `@opentelemetry/core` as a direct dependency.

# 1.0.0

Initial version
