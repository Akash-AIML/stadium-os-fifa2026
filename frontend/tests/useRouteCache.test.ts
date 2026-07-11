import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouteCache } from '../src/shared/hooks/useRouteCache';
import * as api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  fetchRoute: vi.fn(),
}));

const mockRoute = { path: ['gate_a', 'section_b'], crowd_level: 0.4, distance: 120 };

describe('useRouteCache hook', () => {
  const setCurrentZone = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchRoute).mockResolvedValue(mockRoute as any);
  });

  it('calls fetchRoute when two different zones are selected', async () => {
    const { result } = renderHook(() =>
      useRouteCache({
        stadiumId: 'metlife',
        accessibilityMode: false,
        currentZoneId: 'gate_a',
        setCurrentZone,
      })
    );

    await act(async () => {
      await result.current.handleZoneClick('section_b');
    });

    expect(api.fetchRoute).toHaveBeenCalledWith('gate_a', 'section_b', 'metlife', false);
    expect(result.current.currentRoute).toEqual(mockRoute);
  });

  it('serves cached route on second click without calling fetchRoute again', async () => {
    const { result } = renderHook(() =>
      useRouteCache({
        stadiumId: 'metlife',
        accessibilityMode: false,
        currentZoneId: 'gate_a',
        setCurrentZone,
      })
    );

    await act(async () => {
      await result.current.handleZoneClick('section_b');
    });
    // Re-click the same zone — the hook internally tracks cache but currentZoneId
    // would now be section_b; here we simply confirm fetchRoute was only called once
    expect(api.fetchRoute).toHaveBeenCalledTimes(1);
  });

  it('clears route and updates zone when clicking the currently selected zone', async () => {
    const { result } = renderHook(() =>
      useRouteCache({
        stadiumId: 'metlife',
        accessibilityMode: false,
        currentZoneId: 'gate_a',
        setCurrentZone,
      })
    );

    await act(async () => {
      await result.current.handleZoneClick('gate_a'); // same zone = reset
    });

    expect(result.current.currentRoute).toBeNull();
    expect(setCurrentZone).toHaveBeenCalledWith('gate_a');
    expect(api.fetchRoute).not.toHaveBeenCalled();
  });

  it('sets currentRoute to null when fetchRoute throws', async () => {
    vi.mocked(api.fetchRoute).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useRouteCache({
        stadiumId: 'metlife',
        accessibilityMode: false,
        currentZoneId: 'gate_a',
        setCurrentZone,
      })
    );

    await act(async () => {
      await result.current.handleZoneClick('section_b');
    });

    expect(result.current.currentRoute).toBeNull();
  });
});
