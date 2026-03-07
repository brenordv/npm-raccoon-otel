# @raccoon.ninja/otel-react

Drop-in OpenTelemetry instrumentation for React, React Native, and Next.js.

One component. Zero code changes. Traces, logs, and Web Vitals metrics exported via OTLP to any compatible collector.

## Features

- **One-line setup** via `<OtelProvider>` or `initOtel()`
- **Auto-instrumentation** for `fetch`, `XMLHttpRequest`, document load, and user interactions
- **Web Vitals** (LCP, CLS, INP, TTFB, FCP) exported as OTel metrics
- **Error boundary** that records unhandled errors as spans and logs
- **Custom spans** via the `useTracer()` hook
- **OTLP HTTP/JSON** export to any OpenTelemetry-compatible backend
- **React Native** and **Next.js** support via subpath imports
- **Vendor-neutral** -- works with Grafana, Jaeger, Datadog, Honeycomb, or any OTLP collector
- **Tree-shakeable** with `sideEffects: false`, ESM + CJS dual format

## Install

```bash
npm install @raccoon.ninja/otel-react
```

React is a peer dependency -- you need React 17, 18, or 19 installed in your project.

## Quick Start

Wrap your app with `<OtelProvider>`:

```tsx
import { OtelProvider } from '@raccoon.ninja/otel-react';

function App() {
  return (
    <OtelProvider serviceName="my-app">
      <RestOfTheApp />
    </OtelProvider>
  );
}
```

That's it. Your app now exports:

- Traces for every `fetch()` and `XMLHttpRequest` call
- Document load timing spans (DNS, TCP, TLS, DOM processing)
- User interaction spans (clicks)
- Web Vitals metrics (LCP, CLS, INP, TTFB, FCP)

All telemetry is sent to `http://localhost:4318` by default (the standard OTLP HTTP port).

## Configuration

### OtelProvider Props

| Prop                           | Type                     | Default                 | Description                                                     |
| ------------------------------ | ------------------------ | ----------------------- | --------------------------------------------------------------- |
| `serviceName`                  | `string`                 | **(required)**          | Sets the `service.name` resource attribute                      |
| `endpoint`                     | `string`                 | `http://localhost:4318` | OTLP HTTP collector endpoint                                    |
| `serviceVersion`               | `string`                 | --                      | Sets `service.version` resource attribute                       |
| `environment`                  | `string`                 | --                      | Sets `deployment.environment` resource attribute                |
| `headers`                      | `Record<string, string>` | --                      | Custom headers for OTLP requests (e.g., auth tokens)            |
| `exportTimeout`                | `number`                 | `30000`                 | Export timeout in milliseconds                                  |
| `ignoreUrls`                   | `(string \| RegExp)[]`   | --                      | URLs to exclude from fetch/XHR instrumentation                  |
| `propagateTraceHeaderCorsUrls` | `(string \| RegExp)[]`   | `[]`                    | Cross-origin URLs that should receive W3C Trace Context headers |
| `instrumentations`             | `InstrumentationConfig`  | all enabled             | Enable/disable specific auto-instrumentations                   |
| `resourceAttributes`           | `Record<string, string>` | --                      | Additional OTel resource attributes                             |
| `extensions`                   | `OtelExtension[]`        | --                      | Opt-in extensions (e.g., `withReactRouter()`)                   |
| `configureTracing`             | `(provider) => void`     | --                      | Escape hatch to configure the TracerProvider                    |
| `configureExporter`            | `(exporter) => void`     | --                      | Escape hatch to configure the OTLP exporter                     |

### Pointing to a Collector

```tsx
<OtelProvider
  serviceName="my-app"
  endpoint="https://otel-collector.example.com:4318"
  headers={{ 'x-api-key': 'your-token' }}
>
  <App />
</OtelProvider>
```

### Disabling Specific Instrumentations

```tsx
<OtelProvider
  serviceName="my-app"
  instrumentations={{
    fetch: true, // default: true
    xhr: false, // disable XHR instrumentation
    documentLoad: true, // default: true
    userInteraction: false, // disable click tracking
    webVitals: true, // default: true
  }}
>
  <App />
</OtelProvider>
```

### Excluding URLs from Instrumentation

Useful for health checks, analytics endpoints, or any URL that shouldn't generate spans:

```tsx
<OtelProvider
  serviceName="my-app"
  ignoreUrls={[/\/health$/, /\/analytics/, 'https://cdn.example.com']}
>
  <App />
</OtelProvider>
```

## Imperative API

For non-component contexts (testing, scripts, early initialization), use `initOtel()` directly:

```typescript
import { initOtel } from '@raccoon.ninja/otel-react';

const otel = initOtel({
  serviceName: 'my-app',
  endpoint: 'https://otel-collector.example.com:4318',
});

// Later, during cleanup:
await otel.shutdown();
```

`<OtelProvider>` calls `initOtel()` internally and handles shutdown on unmount.

## Error Boundary

`TracedErrorBoundary` catches unhandled errors in its subtree and records them as both OTel spans and log records:

```tsx
import { OtelProvider, TracedErrorBoundary } from '@raccoon.ninja/otel-react';

function App() {
  return (
    <OtelProvider serviceName="my-app">
      <TracedErrorBoundary fallback={<div>Something went wrong</div>}>
        <MainContent />
      </TracedErrorBoundary>
    </OtelProvider>
  );
}
```

The fallback can also be a render function that receives the error and a reset callback:

```tsx
<TracedErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
  onError={(error, errorInfo) => {
    // Optional: additional error reporting
    console.error('Caught by boundary:', error);
  }}
>
  <RiskyComponent />
</TracedErrorBoundary>
```

Each caught error generates:

- A span with `error.type`, `error.message`, `error.stack`, and `error.component_stack` attributes
- A log record at `ERROR` severity with the same details

## Custom Spans

Use the `useTracer()` hook to create custom spans for business-critical operations:

```tsx
import { useTracer } from '@raccoon.ninja/otel-react';

function CheckoutForm() {
  const tracer = useTracer();

  const handleSubmit = async (data: FormData) => {
    const span = tracer.startSpan('checkout.submit');
    span.setAttribute('cart.item_count', data.items.length);

    try {
      await submitOrder(data);
      span.setStatus({ code: 1 }); // SpanStatusCode.OK
    } catch (error) {
      span.setStatus({ code: 2, message: String(error) }); // SpanStatusCode.ERROR
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

You can provide a custom tracer name and version:

```tsx
const tracer = useTracer('my-feature', '1.0.0');
```

## Extensions

### React Router

Opt-in route change tracing for React Router v6/v7:

```tsx
import { OtelProvider, withReactRouter } from '@raccoon.ninja/otel-react';

function App() {
  return (
    <OtelProvider serviceName="my-app" extensions={[withReactRouter()]}>
      <RouterProvider router={router} />
    </OtelProvider>
  );
}
```

## What Gets Collected

### Traces (Automatic)

| Signal            | Source                                            | What It Captures                     |
| ----------------- | ------------------------------------------------- | ------------------------------------ |
| `fetch()` calls   | `@opentelemetry/instrumentation-fetch`            | URL, method, status, duration        |
| `XMLHttpRequest`  | `@opentelemetry/instrumentation-xml-http-request` | URL, method, status, duration        |
| Document load     | `@opentelemetry/instrumentation-document-load`    | DNS, TCP, TLS, DOM processing        |
| User interactions | `@opentelemetry/instrumentation-user-interaction` | Click events on DOM elements         |
| Error boundary    | `TracedErrorBoundary`                             | Uncaught errors with component stack |

### Metrics (Automatic)

| Metric            | Type      | Description                    |
| ----------------- | --------- | ------------------------------ |
| `web_vitals.lcp`  | Histogram | Largest Contentful Paint (ms)  |
| `web_vitals.cls`  | Histogram | Cumulative Layout Shift        |
| `web_vitals.inp`  | Histogram | Interaction to Next Paint (ms) |
| `web_vitals.ttfb` | Histogram | Time to First Byte (ms)        |
| `web_vitals.fcp`  | Histogram | First Contentful Paint (ms)    |

Each metric includes `web_vitals.rating` (`good`, `needs-improvement`, `poor`) and `page.url` attributes.

### Resource Attributes (Automatic)

| Attribute                | Source                      |
| ------------------------ | --------------------------- |
| `service.name`           | Config (required)           |
| `service.version`        | Config (optional)           |
| `deployment.environment` | Config (optional)           |
| `telemetry.sdk.name`     | `@raccoon.ninja/otel-react` |
| `telemetry.sdk.version`  | Package version             |
| `browser.language`       | `navigator.language`        |
| `browser.user_agent`     | `navigator.userAgent`       |
| `browser.platform`       | `navigator.platform`        |

Custom attributes can be added via the `resourceAttributes` prop.

## React Native

Import from `@raccoon.ninja/otel-react/native`:

```typescript
import { initOtel } from '@raccoon.ninja/otel-react/native';

const otel = await initOtel({
  serviceName: 'my-rn-app',
  endpoint: 'https://otel-collector.example.com:4318',
});
```

Key differences from the browser entry:

- Uses `BasicTracerProvider` instead of `WebTracerProvider` (no DOM APIs)
- Only `fetch` instrumentation is enabled (no document load, user interaction, or Web Vitals)
- XHR is disabled by default to avoid duplicate spans (React Native's `fetch` polyfills over XHR)
- Uses `AppState` change listener for flush instead of `visibilitychange`

### React Navigation

Track navigation state changes as spans:

```typescript
import { initOtel, withReactNavigation, createNavigationTracker } from '@raccoon.ninja/otel-react/native';

const otel = await initOtel({
  serviceName: 'my-rn-app',
  extensions: [withReactNavigation()],
});

const onStateChange = createNavigationTracker();

function App() {
  return (
    <NavigationContainer onStateChange={onStateChange}>
      {/* screens */}
    </NavigationContainer>
  );
}
```

## Next.js

Next.js requires a two-part setup (server + client).

### Server-Side (`instrumentation.ts`)

```typescript
import { initOtelServer } from '@raccoon.ninja/otel-react/nextjs';

export async function register() {
  await initOtelServer({
    serviceName: 'my-nextjs-app',
    endpoint: 'https://otel-collector.example.com:4318',
  });
}
```

### Client-Side (Root Layout)

```tsx
// app/providers.tsx
'use client';

import { OtelProvider } from '@raccoon.ninja/otel-react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <OtelProvider serviceName="my-nextjs-app">{children}</OtelProvider>;
}

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## CORS Configuration

If your app and collector are on different origins, configure CORS on the collector. Example for the OpenTelemetry Collector:

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
        cors:
          allowed_origins:
            - 'https://your-app.com'
            - 'http://localhost:3000'
          allowed_headers:
            - 'Content-Type'
            - 'X-Requested-With'
          max_age: 7200
```

## Graceful Shutdown

The package automatically flushes pending telemetry:

- On `visibilitychange` (when the tab becomes hidden)
- On `beforeunload` (when the page is about to close)
- On `<OtelProvider>` unmount
- When `otel.shutdown()` is called (imperative API)

This ensures telemetry is not lost during page navigation or tab close.

## API Reference

### Exports from `@raccoon.ninja/otel-react`

| Export                     | Type      | Description                                      |
| -------------------------- | --------- | ------------------------------------------------ |
| `OtelProvider`             | Component | React provider that initializes OTel on mount    |
| `TracedErrorBoundary`      | Component | Error boundary that records errors as spans/logs |
| `initOtel`                 | Function  | Imperative initialization, returns `OtelHandle`  |
| `useTracer`                | Hook      | Get an OTel `Tracer` for custom spans            |
| `withReactRouter`          | Function  | Extension for React Router route tracing         |
| `OtelOptions`              | Type      | Configuration interface                          |
| `OtelHandle`               | Type      | Handle with `shutdown()` method                  |
| `OtelExtension`            | Type      | Extension function signature                     |
| `InstrumentationConfig`    | Type      | Instrumentation toggle config                    |
| `OtelProviderProps`        | Type      | Props for `<OtelProvider>`                       |
| `TracedErrorBoundaryProps` | Type      | Props for `<TracedErrorBoundary>`                |

### Exports from `@raccoon.ninja/otel-react/native`

| Export                    | Type     | Description                        |
| ------------------------- | -------- | ---------------------------------- |
| `initOtel`                | Function | RN-specific initialization (async) |
| `withReactNavigation`     | Function | Extension for React Navigation     |
| `createNavigationTracker` | Function | Creates `onStateChange` handler    |

### Exports from `@raccoon.ninja/otel-react/nextjs`

| Export           | Type     | Description                                         |
| ---------------- | -------- | --------------------------------------------------- |
| `initOtelServer` | Function | Server-side initialization for `instrumentation.ts` |

## Requirements

- **Node.js** >= 18
- **React** 17, 18, or 19
- An OTLP-compatible collector (e.g., [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/), [Grafana Alloy](https://grafana.com/docs/alloy/), or any vendor's OTLP endpoint)

## License

MIT
