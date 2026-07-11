import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StadiumMap } from '../src/features/navigation/StadiumMap';
import { CrowdZone, ZoneStatus } from '../src/shared/types';

// ── Mock framer-motion to avoid animation complexity in jsdom ─────────────────
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion') as object;
  return {
    ...actual,
    motion: new Proxy({}, {
      get: (_target, prop) => {
        // Return a simple forwardRef component for each motion element
        const React = require('react');
        return React.forwardRef(({ children, ...props }: any, ref: any) =>
          React.createElement(prop as string, { ...props, ref }, children)
        );
      },
    }),
    AnimatePresence: ({ children }: any) => children,
  };
});

vi.mock('../src/shared/hooks/useHeatMap', () => ({
  useHeatMap: () => ({ heatmapZones: [] }),
}));

// ─────────────────────────────────────────────────────────────────────────────

const mockZones: CrowdZone[] = [
  {
    id: 'gate_north',
    label: 'North Gate',
    type: 'entrance',
    location: [400, 100],
    status: ZoneStatus.CLEAR,
    density: 0.2,
    queueTime: 2,
    trend: 'stable',
    history: [0.2, 0.2, 0.2, 0.2],
    waitHistory: [2, 2, 2, 2],
    recommendations: [],
  },
  {
    id: 'section_a',
    label: 'Section A',
    type: 'seating',
    location: [300, 200],
    status: ZoneStatus.CONGESTED,
    density: 0.95,
    queueTime: 20,
    trend: 'up',
    history: [0.8, 0.85, 0.9, 0.95],
    waitHistory: [15, 17, 18, 20],
    recommendations: [],
  },
];

describe('StadiumMap Component', () => {
  it('renders the stadium map application container', () => {
    render(<StadiumMap zones={mockZones} selectedZoneId={null} onZoneClick={vi.fn()} />);
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  it('renders Indoor View and Outdoor Transit toggle buttons', () => {
    render(<StadiumMap zones={mockZones} selectedZoneId={null} onZoneClick={vi.fn()} />);
    expect(screen.getByText('Indoor View')).toBeInTheDocument();
    expect(screen.getByText('Outdoor Transit')).toBeInTheDocument();
  });

  it('renders zone markers with correct aria-labels', () => {
    render(<StadiumMap zones={mockZones} selectedZoneId={null} onZoneClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'North Gate, clear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Section A, congested' })).toBeInTheDocument();
  });

  it('triggers onZoneClick with the correct zone id', () => {
    const handleZoneClick = vi.fn();
    render(<StadiumMap zones={mockZones} selectedZoneId={null} onZoneClick={handleZoneClick} />);

    const northGateBtn = screen.getByRole('button', { name: 'North Gate, clear' });
    fireEvent.click(northGateBtn);

    expect(handleZoneClick).toHaveBeenCalledWith('gate_north');
    expect(handleZoneClick).toHaveBeenCalledTimes(1);
  });

  it('marks the selected zone with aria-pressed="true"', () => {
    render(<StadiumMap zones={mockZones} selectedZoneId="gate_north" onZoneClick={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /North Gate, clear, selected/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });
});
