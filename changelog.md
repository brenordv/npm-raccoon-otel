# 1.2.0-rc.1

## Changed

- The OTLP collector endpoint is now automatically added to `ignoreUrls` for both `FetchInstrumentation` and `XMLHttpRequestInstrumentation`.

## Why was that a problem?

When a React app sends telemetry to the OTLP collector via HTTP (the default transport), those export requests are
themselves `fetch` or `XMLHttpRequest` calls. Without an explicit ignore rule, the SDK's auto-instrumentations can
intercept these outgoing export requests and create additional spans for them. This produces noisy, self-referential
traces in the backend (traces about sending traces) and can surface as phantom nodes (e.g., a "user" node) in
service-graph views.

## How this solves the problem

During `registerAutoInstrumentations`, the resolved OTLP endpoint is escaped into a `RegExp` and appended to the
user-supplied `ignoreUrls` array before it is passed to both the Fetch and XHR instrumentations. This means:

1. Any `fetch()` or `XMLHttpRequest` call whose URL matches the collector endpoint is silently skipped by the
   instrumentation, so no span is created, and no trace-context headers are injected.
2. User-supplied `ignoreUrls` entries are preserved and appear first in the list; the auto-appended endpoint regex is always last.
3. The behavior is transparent: no new configuration options are required and existing setups continue to work without changes.

## Caveats

- **Custom exporter transports:** If you replaced the default OTLP HTTP exporter with a custom transport that does not
  use `fetch`/`XMLHttpRequest` (e.g., `navigator.sendBeacon`, WebSocket), this change has no effect because the auto-ignore
  targets the endpoint URL, not the transport mechanism.
- **Multiple collector endpoints:** If your app exports traces and metrics/logs to _different_ endpoints (e.g., by
  configuring separate exporters manually via `configureExporter`), only the primary `endpoint` option is auto-ignored.
  Add any additional collector URLs to `ignoreUrls` manually.
- **Regex matching scope:** The auto-generated regex is an escaped literal match of the full endpoint string
  (e.g., `http://collector\.example\.com:4318`). It will match any URL that _contains_ that string, including sub-paths
  like `/v1/traces`. If your collector endpoint shares a common prefix with an API you _do_ want instrumented, verify
  there is no unintended overlap.

# 1.1.0

- Added `propagateTraceHeaderCorsUrls` option to `OtelOptions` and `OtelProvider`, enabling W3C Trace Context header injection (`traceparent`/`tracestate`) on cross-origin fetch and XHR requests.
- `LoggerProvider` now uses constructor-based `processors` config (compatible with `@opentelemetry/sdk-logs` v0.213+).

# 1.0.0

Initial version
