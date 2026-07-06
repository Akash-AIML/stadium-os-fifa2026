import React, { useState } from 'react';
import { useApp } from '../../shared/context/AppContext';

export function OnboardingModal() {
  const { state, setUser } = useApp();
  const [name, setName] = useState(state.user.name);
  const [language, setLanguage] = useState(state.user.language);
  const [seatNumber, setSeatNumber] = useState(state.user.seat_number || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ name, language, seat_number: seatNumber || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 id="modal-title" className="text-2xl font-bold mb-4">Welcome to FIFA 2026 Smart Guide</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Your Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium mb-1">Preferred Language</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="pt">Português</option>
              <option value="ar">العربية</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </div>

          <div>
            <label htmlFor="seat" className="block text-sm font-medium mb-1">Seat Number (Optional)</label>
            <input
              id="seat"
              type="text"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              placeholder="e.g., A-101"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}