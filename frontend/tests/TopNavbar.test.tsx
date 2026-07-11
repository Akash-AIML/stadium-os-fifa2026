import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopNavbar } from '../src/shared/components/TopNavbar';
import { AppProvider } from '../src/shared/context/AppContext';

// ── Prevent WebSocket and simulation hooks from connecting ────────────────────
vi.mock('../src/shared/hooks/useSimulation', () => ({
  useSimulation: () => ({ setMatchTime: vi.fn() }),
}));

vi.mock('../src/services/api', () => ({
  sendChatMessage: vi.fn().mockResolvedValue(null),
  fetchRoute:      vi.fn().mockResolvedValue(null),
  fetchCrowdData:  vi.fn().mockResolvedValue([]),
}));

class MockWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  send = vi.fn();
  close = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}
vi.stubGlobal('WebSocket', MockWebSocket);

// ─────────────────────────────────────────────────────────────────────────────

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

const defaultProps = {
  showChat: false,
  onToggleChat: vi.fn(),
  onNavigate: vi.fn(),
};

describe('TopNavbar Component', () => {
  it('renders brand logo and "FIFA 2026" label', () => {
    render(<TopNavbar {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText('FIFA 2026')).toBeInTheDocument();
    expect(screen.getByText('Smart Guide')).toBeInTheDocument();
  });

  it('shows the active stadium name (MetLife by default)', () => {
    render(<TopNavbar {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText(/MetLife Stadium/i)).toBeInTheDocument();
  });

  it('renders the accessibility toggle button', () => {
    render(<TopNavbar {...defaultProps} />, { wrapper: Wrapper });
    const btn = screen.getByRole('button', { name: /Toggle accessibility mode/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles accessibility mode on click', () => {
    render(<TopNavbar {...defaultProps} />, { wrapper: Wrapper });
    const btn = screen.getByRole('button', { name: /Toggle accessibility mode/i });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders AI assistant toggle button', () => {
    render(<TopNavbar {...defaultProps} />, { wrapper: Wrapper });
    const btn = screen.getByRole('button', { name: /Toggle AI Assistant/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onToggleChat when AI assistant button is clicked', () => {
    const onToggleChat = vi.fn();
    render(<TopNavbar {...defaultProps} onToggleChat={onToggleChat} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /Toggle AI Assistant/i }));
    expect(onToggleChat).toHaveBeenCalledTimes(1);
  });
});
