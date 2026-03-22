'use client';

import React from 'react';

interface TopbarProps {
  onLoadDemo: () => void;
  onReset: () => void;
  loading: boolean;
  grade?: 'A' | 'B' | 'C' | 'D';
}

const Topbar = ({ onLoadDemo, onReset, loading, grade }: TopbarProps) => {
  return (
    <header className="h-[64px] bg-white border-b border-[#DDD8C0] px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-[#E6DDBE] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B5E20]" />
        </div>
        <div className="flex items-center">
          <span className="font-display text-[22px] text-[#1C1A12]">Wealth</span>
          <span className="font-sans font-semibold text-[22px] text-[#1B5E20]">Lens</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
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
      </div>
    </header>
  );
};

export default Topbar;
