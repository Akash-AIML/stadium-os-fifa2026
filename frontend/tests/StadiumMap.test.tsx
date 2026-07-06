import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StadiumMap } from '../src/features/navigation/StadiumMap';
import { Zone, ZoneStatus } from '../src/shared/types';

describe('StadiumMap Component', () => {
  const mockZones: Zone[] = [
    {
      id: 'gate_north',
      label: 'North Gate',
      type: 'entrance',
      location: [400, 100],
      status: ZoneStatus.CLEAR,
    },
    {
      id: 'section_a',
      label: 'Section A',
      type: 'seating',
      location: [300, 200],
      status: ZoneStatus.CONGESTED,
    },
  ];

  it('renders interactive map with correct elements and labels', () => {
    const handleZoneClick = vi.fn();
    render(
      <StadiumMap
        zones={mockZones}
        selectedZoneId={null}
        onZoneClick={handleZoneClick}
      />
    );

    // Check if the legend statuses are present
    expect(screen.getByText('clear')).toBeInTheDocument();
    expect(screen.getByText('congested')).toBeInTheDocument();

    // Check if the zones are rendered with labels
    expect(screen.getByRole('button', { name: 'North Gate, clear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Section A, congested' })).toBeInTheDocument();
  });

  it('triggers onZoneClick when a zone is clicked', () => {
    const handleZoneClick = vi.fn();
    render(
      <StadiumMap
        zones={mockZones}
        selectedZoneId={null}
        onZoneClick={handleZoneClick}
      />
    );

    const northGateButton = screen.getByRole('button', { name: 'North Gate, clear' });
    fireEvent.click(northGateButton);

    expect(handleZoneClick).toHaveBeenCalledWith('gate_north');
  });
});
