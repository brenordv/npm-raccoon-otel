import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerShutdownTargets, shutdown } from '../../src/core/shutdown';

function createMockTargets() {
  return {
    tracerProvider: {
      forceFlush: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
    },
    loggerProvider: {
      forceFlush: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
    },
    meterProvider: {
      forceFlush: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe('shutdown', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
  });

  afterEach(async () => {
    await shutdown(); // Clean up any registered targets
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('registers visibilitychange listener', () => {
    const targets = createMockTargets();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerShutdownTargets(targets as any);
    expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('flushes all providers on shutdown', async () => {
    const targets = createMockTargets();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerShutdownTargets(targets as any);

    await shutdown();

    expect(targets.tracerProvider.forceFlush).toHaveBeenCalled();
    expect(targets.loggerProvider.forceFlush).toHaveBeenCalled();
    expect(targets.meterProvider.forceFlush).toHaveBeenCalled();
  });

  it('shuts down all providers', async () => {
    const targets = createMockTargets();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerShutdownTargets(targets as any);

    await shutdown();

    expect(targets.tracerProvider.shutdown).toHaveBeenCalled();
    expect(targets.loggerProvider.shutdown).toHaveBeenCalled();
    expect(targets.meterProvider.shutdown).toHaveBeenCalled();
  });

  it('removes event listeners on shutdown', async () => {
    const targets = createMockTargets();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerShutdownTargets(targets as any);

    await shutdown();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('is safe to call shutdown when no targets registered', async () => {
    // Should not throw
    await shutdown();
  });
});
