import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import type { InstrumentationConfig, OtelOptions } from '@/core/options';
import { resolveInstrumentations, resolveEndpoint } from '@/core/options';

export function registerAutoInstrumentations(options: OtelOptions): void {
  const config: Required<InstrumentationConfig> = resolveInstrumentations(options);

  // Automatically exclude the OTLP collector endpoint from instrumentation
  // to prevent the SDK from tracing its own export requests.
  const endpoint = resolveEndpoint(options);
  const escapedEndpoint = endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ignoreUrls: Array<string | RegExp> = [
    ...(options.ignoreUrls ?? []),
    new RegExp(escapedEndpoint),
  ];

  const instrumentations = [];

  const propagateTraceHeaderCorsUrls = options.propagateTraceHeaderCorsUrls ?? [];

  if (config.fetch) {
    instrumentations.push(
      new FetchInstrumentation({
        ignoreUrls,
        propagateTraceHeaderCorsUrls,
      }),
    );
  }

  if (config.xhr) {
    instrumentations.push(
      new XMLHttpRequestInstrumentation({
        ignoreUrls,
        propagateTraceHeaderCorsUrls,
      }),
    );
  }

  if (config.documentLoad) {
    instrumentations.push(new DocumentLoadInstrumentation());
  }

  if (config.userInteraction) {
    instrumentations.push(new UserInteractionInstrumentation());
  }

  if (instrumentations.length > 0) {
    registerInstrumentations({ instrumentations });
  }
}
