import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import type { OtelOptions } from './options';

const SDK_NAME = '@raccoon.ninja/otel-react';

export function buildResource(options: OtelOptions) {
  const attributes: Record<string, string> = {
    [ATTR_SERVICE_NAME]: options.serviceName,
    'telemetry.sdk.name': SDK_NAME,
    'telemetry.sdk.version': __SDK_VERSION__,
    'telemetry.sdk.language': 'webjs',
  };

  if (options.serviceVersion) {
    attributes[ATTR_SERVICE_VERSION] = options.serviceVersion;
  }

  if (options.environment) {
    attributes[SEMRESATTRS_DEPLOYMENT_ENVIRONMENT] = options.environment;
  }

  if (typeof navigator !== 'undefined') {
    if (navigator.language) {
      attributes['browser.language'] = navigator.language;
    }
    if (navigator.userAgent) {
      attributes['browser.user_agent'] = navigator.userAgent;
    }
    if (navigator.platform) {
      attributes['browser.platform'] = navigator.platform;
    }
  }

  if (options.resourceAttributes) {
    Object.assign(attributes, options.resourceAttributes);
  }

  return resourceFromAttributes(attributes);
}
