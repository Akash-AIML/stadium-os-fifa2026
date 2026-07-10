import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopNavbar } from '../src/shared/components/TopNavbar';
import { AppProvider } from '../src/shared/context/AppContext';

// Simple mock for useSimulation to prevent WebSockets starting during unit tests
vi.mock('../src/shared/hooks/useSimulation', () => ({
  useSimulation: () => ({
    setMatchTime: vi.fn(),
  }),
}));

describe('TopNavbar Component', () => {
  const defaultProps = {
    showChat: false,
    onToggleChat: vi.fn(),
    onNavigate: vi.fn(),
  };

  it('renders brand titles and selector elements', () => {
    render(
      <AppProvider>
        <TopNavbar {...defaultProps} />
      </AppProvider>
    );

    // Verify logo title
    expect(screen.getByText('FIFA 2026')).toBeInTheDocument();
    expect(screen.getByText('Smart Guide')).toBeInTheDocument();

    // Verify dropdown button shows current stadium
    expect(screen.getByText(/MetLife Stadium/i)).toBeInTheDocument();
  });

  it('renders accessibility button toggles mode correctly', () => {
    render(
      <AppProvider>
        <TopNavbar {...defaultProps} />
      </AppProvider>
    );

    const accessibilityBtn = screen.getByRole('button', { name: /Toggle accessibility mode/i });
    expect(accessibilityBtn).toBeInTheDocument();

    // Toggles mode on click
    fireEvent.click(accessibilityBtn);
    expect(accessibilityBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
