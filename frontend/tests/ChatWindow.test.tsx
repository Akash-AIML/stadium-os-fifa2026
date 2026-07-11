import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatWindow } from '../src/features/chat/ChatWindow';
import { AppProvider } from '../src/shared/context/AppContext';

// ── Prevent WebSocket from connecting during unit tests ───────────────────────
vi.mock('../src/services/api', () => ({
  sendChatMessage: vi.fn().mockResolvedValue({
    message: {
      id: 'msg-1',
      role: 'model',
      content: 'I recommend eating at Food Court C.',
      timestamp: new Date().toISOString(),
      intent: 'recommendation',
      context_snapshot: [],
      is_fallback: false,
      language: 'en',
    },
  }),
  fetchRoute:      vi.fn().mockResolvedValue(null),
  fetchCrowdData:  vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/shared/hooks/useSimulation', () => ({
  useSimulation: () => ({ setMatchTime: vi.fn() }),
}));

// Mock WebSocket so AppProvider doesn't error in jsdom
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

describe('ChatWindow Component', () => {
  it('renders welcome chip buttons on empty chat history', () => {
    render(<ChatWindow />, { wrapper: Wrapper });
    // The welcome view shows suggestion chips like "Navigate", "Food", etc.
    expect(screen.getByText('Navigate')).toBeInTheDocument();
    expect(screen.getByText('Exit')).toBeInTheDocument();
  });

  it('renders the chat header with Smart Guide AI label', () => {
    render(<ChatWindow />, { wrapper: Wrapper });
    expect(screen.getByText('Smart Guide AI')).toBeInTheDocument();
    expect(screen.getByText('FIFA Stadium Assistant')).toBeInTheDocument();
  });

  it('submit button is disabled when input is empty', () => {
    render(<ChatWindow />, { wrapper: Wrapper });
    const submitBtn = screen.getByRole('button', { name: 'Send message' });
    expect(submitBtn).toBeDisabled();
  });

  it('submit button becomes enabled when user types text', () => {
    render(<ChatWindow />, { wrapper: Wrapper });
    const input = screen.getByRole('textbox', { name: 'Chat message input' });
    const submitBtn = screen.getByRole('button', { name: 'Send message' });

    fireEvent.change(input, { target: { value: 'Where is the exit?' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('allows user to type and submit a message', async () => {
    render(<ChatWindow />, { wrapper: Wrapper });
    const input = screen.getByRole('textbox', { name: 'Chat message input' });
    const submitBtn = screen.getByRole('button', { name: 'Send message' });

    fireEvent.change(input, { target: { value: 'Where should I eat?' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Where should I eat?')).toBeInTheDocument();
    });
  });
});
