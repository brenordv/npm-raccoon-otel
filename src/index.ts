// Core
export { initOtel } from './core/init';
export type { OtelOptions, OtelHandle, OtelExtension, InstrumentationConfig } from './core/options';

// Components
export { OtelProvider } from './components/OtelProvider';
export type { OtelProviderProps } from './components/OtelProvider';
export { TracedErrorBoundary } from './components/TracedErrorBoundary';
export type { TracedErrorBoundaryProps } from './components/TracedErrorBoundary';

// Hooks
export { useTracer } from './hooks/useTracer';

// Extensions
export { withReactRouter } from './instrumentations/router';
