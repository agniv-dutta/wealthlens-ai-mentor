'use client';

import React from 'react';

interface TopbarProps {
  onLoadDemo: () => void;
  onReset: () => void;
  onExportReport: () => void;
  loading: boolean;
  grade?: 'A' | 'B' | 'C' | 'D';
}

const Topbar = ({ onLoadDemo, onReset, onExportReport, loading, grade }: TopbarProps) => {
  return (
    <header className="h-[64px] bg-white border-b border-[#DDD8C0] px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 8 C48 8 56 20 56 32 C56 44 44 52 32 52 C32 52 8 44 8 28 C8 16 20 8 32 8Z" fill="#DCEDC8" stroke="#1B5E20" strokeWidth="1.5"/>
          <rect x="18" y="36" width="6" height="10" rx="2" fill="#1B5E20" opacity="0.5"/>
          <rect x="27" y="28" width="6" height="18" rx="2" fill="#1B5E20" opacity="0.75"/>
          <rect x="36" y="20" width="6" height="26" rx="2" fill="#1B5E20"/>
          <path d="M32 52 C32 56 28 58 26 60" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
        <div className="flex items-center">
          <span className="font-display text-[22px] text-[#1C1A12]">Wealth</span>
          <span className="font-sans font-semibold text-[22px] text-[#1B5E20]">Lens</span>
        </div>
      </div>

      <div className="flex items-center gap-4 print-hide-topbar-buttons">
        <button
          onClick={onLoadDemo}
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-[#1B5E20] text-white font-sans font-semibold text-[13px] hover:bg-[#388E3C] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : null}
          {loading ? 'Analyzing...' : 'Load Demo & Analyze'}
        </button>
        <button
          onClick={onReset}
          className="px-6 py-2 rounded-lg bg-[#F2EDD8] text-[#4A4830] font-sans font-semibold text-[13px] hover:bg-[#EDE6CC] transition-all border border-[#DDD8C0]"
        >
          Reset
        </button>
        <button
          onClick={onExportReport}
          className="px-6 py-2 rounded-lg bg-transparent font-sans font-semibold text-[13px] transition-all border flex items-center gap-2"
          style={{ borderColor: 'var(--border-strong, #C5BFA6)', color: 'var(--text-secondary, #7A7250)' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 4V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8.5 10.5L12 14L15.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 18.5H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Export Report
        </button>
      </div>
    </header>
  );
};

export default Topbar;
