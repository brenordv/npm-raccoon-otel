import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock initOtel before importing the component
const mockShutdown = vi.fn().mockResolvedValue(undefined);
const mockInitOtel = vi.fn().mockReturnValue({ shutdown: mockShutdown });

vi.mock('../../src/core/init', () => ({
  initOtel: (...args: unknown[]) => mockInitOtel(...args),
}));

import { OtelProvider } from '../../src/components/OtelProvider';

describe('OtelProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <OtelProvider serviceName="test-app">
        <div data-testid="child">Hello</div>
      </OtelProvider>,
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('calls initOtel on mount with correct options', () => {
    render(
      <OtelProvider serviceName="test-app" endpoint="http://collector:4318" serviceVersion="1.0.0">
        <div>App</div>
      </OtelProvider>,
    );

    expect(mockInitOtel).toHaveBeenCalledTimes(1);
    expect(mockInitOtel).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceName: 'test-app',
        endpoint: 'http://collector:4318',
        serviceVersion: '1.0.0',
      }),
    );
  });

  it('calls shutdown on unmount', () => {
    const { unmount } = render(
      <OtelProvider serviceName="test-app">
        <div>App</div>
      </OtelProvider>,
    );

    unmount();

    expect(mockShutdown).toHaveBeenCalledTimes(1);
  });

  it('forwards propagateTraceHeaderCorsUrls to initOtel', () => {
    const corsUrls = [/https:\/\/api\.example\.com/, 'https://other.example.com'];

    render(
      <OtelProvider serviceName="test-app" propagateTraceHeaderCorsUrls={corsUrls}>
        <div>App</div>
      </OtelProvider>,
    );

    expect(mockInitOtel).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceName: 'test-app',
        propagateTraceHeaderCorsUrls: corsUrls,
      }),
    );
  });

  it('does not re-initialize on re-render', () => {
    const { rerender } = render(
      <OtelProvider serviceName="test-app">
        <div>App</div>
      </OtelProvider>,
    );

    rerender(
      <OtelProvider serviceName="test-app">
        <div>App Updated</div>
      </OtelProvider>,
    );

    expect(mockInitOtel).toHaveBeenCalledTimes(1);
  });
});
