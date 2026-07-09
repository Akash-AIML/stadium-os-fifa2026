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
    { zone_id: 'gate_north', density: 0.9, queue_time: 15, status: 'congested' as any },
    { zone_id: 'wc_south', density: 0.5, queue_time: 5, status: 'busy' as any },
  ];

  it('renders metrics cards with correct calculations', () => {
    render(<Dashboard alerts={mockAlerts} crowdData={mockCrowdData} />);

    // Active Alerts count (critical 1 + warning 1 = 2)
    const alertsCard = screen.getAllByText('Active Alerts')[0].closest('div');
    expect(alertsCard).toHaveTextContent('2');

    // Overall Density: (0.9 + 0.5) / 2 = 0.7 = 70%
    const densityCard = screen.getByText('Overall Density').closest('div');
    expect(densityCard).toHaveTextContent('70%');

    // Active Zones
    const zonesCard = screen.getByText('Active Zones').closest('div');
    expect(zonesCard).toHaveTextContent('2');
  });

  it('renders list of active alerts', () => {
    render(<Dashboard alerts={mockAlerts} crowdData={mockCrowdData} />);

    // Assert that the alerts block is in the document by verifying alert header and messages
    expect(screen.getByText('Heavy congestion near North Gate')).toBeInTheDocument();
    expect(screen.getByText('Moderate queues at Restroom South')).toBeInTheDocument();
  });
});
