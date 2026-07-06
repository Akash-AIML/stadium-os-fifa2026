import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatWindow } from '../src/features/chat/ChatWindow';
import { AppProvider } from '../src/shared/context/AppContext';
import * as api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  sendChatMessage: vi.fn(),
}));

describe('ChatWindow Component', () => {
  it('renders chat instruction text on empty chat history', () => {
    render(
      <AppProvider>
        <ChatWindow />
      </AppProvider>
    );

    expect(screen.getByText('Smart Guide AI Assistant')).toBeInTheDocument();
  });

  it('allows user to type and send messages', async () => {
    const mockResponse = {
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
    };
    vi.spyOn(api, 'sendChatMessage').mockResolvedValue(mockResponse);

    render(
      <AppProvider>
        <ChatWindow />
      </AppProvider>
    );

    const input = screen.getByPlaceholderText('Ask about stadium navigation or section crowding...');
    const submitBtn = screen.getByRole('button', { name: 'Send message' });

    fireEvent.change(input, { target: { value: 'Where should I eat?' } });
    fireEvent.click(submitBtn);

    // Verify user message is shown
    expect(screen.getByText('Where should I eat?')).toBeInTheDocument();

    // Verify mock is called
    expect(api.sendChatMessage).toHaveBeenCalled();

    // Verify response is displayed
    await waitFor(() => {
      expect(screen.getByText('I recommend eating at Food Court C.')).toBeInTheDocument();
    });
  });
});
