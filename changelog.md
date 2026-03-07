# 1.1.0

- Added `propagateTraceHeaderCorsUrls` option to `OtelOptions` and `OtelProvider`, enabling W3C Trace Context header injection (`traceparent`/`tracestate`) on cross-origin fetch and XHR requests.
- `LoggerProvider` now uses constructor-based `processors` config (compatible with `@opentelemetry/sdk-logs` v0.213+).

# 1.0.0

Initial version
