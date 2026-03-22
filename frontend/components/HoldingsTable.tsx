'use client';

import React from 'react';

const formatINR = (n: number) => {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const HoldingsTable = ({ holdings }: { holdings: any[] }) => {
  return (
    <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8 shadow-sm mt-8">
      <header className="mb-8">
        <h3 className="font-display text-2xl font-bold text-[#1C1A12] mb-1">Holdings ({holdings.length})</h3>
        <p className="text-xs font-sans text-[#7A7250] opacity-70">Used for deterministic calculations + AI interpretation</p>
      </header>

      <ul className="space-y-4">
        {holdings.map((fund, i) => (
          <li key={i} className="flex items-start gap-4 text-[13px] text-[#4A4830] font-sans">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#388E3C] shrink-0" />
            <div className="flex-1 flex flex-wrap gap-x-2 gap-y-1">
              <span className="font-semibold text-[#1C1A12]">{fund.scheme}</span>
              <span className="text-[#7A7250]">· {fund.category} ·</span>
              <span className="font-mono font-medium text-[#1B5E20]">{formatINR(fund.current_value)}</span>
              <span className="text-[#7A7250] opacity-60">({fund.category})</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HoldingsTable;
