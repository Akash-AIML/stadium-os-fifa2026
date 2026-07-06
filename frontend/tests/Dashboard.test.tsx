import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Dashboard } from '../src/features/crowd/Dashboard';
import { Alert } from '../src/shared/types';

describe('Dashboard Component', () => {
  const mockAlerts: Alert[] = [
    {
      id: 'alert_1',
      level: 'critical',
      message: 'Heavy congestion near North Gate',
      zone_id: 'gate_north',
    },
    {
      id: 'alert_2',
      level: 'warning',
      message: 'Moderate queues at Restroom South',
      zone_id: 'wc_south',
    },
  ];

  const mockCrowdData = [
    { zone_id: 'gate_north', density: 0.9 },
    { zone_id: 'wc_south', density: 0.5 },
  ];

  it('renders metrics cards with correct calculations', () => {
    render(<Dashboard alerts={mockAlerts} crowdData={mockCrowdData} />);

    // Critical Alerts count
    const criticalCard = screen.getByText('Critical Alerts').closest('div');
    expect(criticalCard).toHaveTextContent('1');

    // Warnings count
    const warningCard = screen.getByText('Warnings').closest('div');
    expect(warningCard).toHaveTextContent('1');

    // Avg Density: (0.9 + 0.5) / 2 = 0.7 = 70%
    const densityCard = screen.getByText('Avg Density').closest('div');
    expect(densityCard).toHaveTextContent('70%');

    // Total Zones
    const zonesCard = screen.getByText('Total Zones').closest('div');
    expect(zonesCard).toHaveTextContent('2');
  });

  it('renders list of active alerts', () => {
    render(<Dashboard alerts={mockAlerts} crowdData={mockCrowdData} />);

    expect(screen.getByText('Active Security Alerts')).toBeInTheDocument();
    expect(screen.getByText('Heavy congestion near North Gate')).toBeInTheDocument();
    expect(screen.getByText('Moderate queues at Restroom South')).toBeInTheDocument();
  });
});
