import React, { useState } from 'react';
import { useApp } from '../../shared/context/AppContext';

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: Readonly<OnboardingModalProps>) {
  const { state, setUser } = useApp();
  const [name, setName] = useState(state.user.name);
  const [language, setLanguage] = useState(state.user.language);
  const [seatNumber, setSeatNumber] = useState(state.user.seat_number || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ name, language, seat_number: seatNumber || undefined });
    localStorage.setItem('fifa_onboarding_complete', 'true');
    onComplete();
  };

  return (
    <dialog open className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 border-0" aria-modal="true" aria-labelledby="modal-title">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-800/80 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop decorative bubbles */}
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-cyan-500/10 blur-xl" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-violet-500/10 blur-xl" />

        <div className="text-center mb-6">
          <span className="text-4xl">🏆</span>
          <h2 id="modal-title" className="text-2xl font-black mt-3 tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            FIFA 2026 Smart Guide
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Welcome! Enter your details to configure your customized stadium guide.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lionel Messi"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Preferred Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
            <label htmlFor="seat" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Seat Number (Optional)
            </label>
            <input
              id="seat"
              type="text"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              placeholder="e.g. SEC-104-A"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-600/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Get Started
          </button>
        </form>
      </div>
    </dialog>
  );
}