'use client';

import React from 'react';

const formatINR = (n: number) => {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const formatPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

const HoldingsTable = ({ holdings }: { holdings: any[] }) => {
  return (
    <div className="bg-white border border-[#DDD8C0] rounded-2xl overflow-hidden shadow-sm mt-8">
      <header className="p-8 pb-4">
        <h3 className="font-display text-2xl font-bold text-[#1C1A12] mb-1">Holdings ({holdings.length})</h3>
        <p className="text-xs font-sans text-[#7A7250] opacity-70">Detailed breakdown of your current portfolio positions</p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#E6DDBE] border-b border-[#DDD8C0]">
              <th className="px-8 py-3 text-[11px] font-sans font-bold uppercase tracking-wider text-[#7A7250]">Fund Name</th>
              <th className="px-6 py-3 text-[11px] font-sans font-bold uppercase tracking-wider text-[#7A7250]">Category</th>
              <th className="px-6 py-3 text-[11px] font-sans font-bold uppercase tracking-wider text-[#7A7250] text-right">Current Value</th>
              <th className="px-6 py-3 text-[11px] font-sans font-bold uppercase tracking-wider text-[#7A7250] text-right">Return %</th>
              <th className="px-8 py-3 text-[11px] font-sans font-bold uppercase tracking-wider text-[#7A7250] text-right">Exp. Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDD8C0]/30">
            {holdings.map((fund, i) => {
              const returnValue = ((fund.current_value - fund.invested) / fund.invested) * 100;
              const isHighExpense = fund.expense_ratio > 1.5;
              
              return (
                <tr key={i} className={`group transition-colors ${i % 2 === 0 ? 'bg-[#F2EDD8]' : 'bg-[#FDFAF4]'} hover:bg-[#EDE6CC]`}>
                  <td className="px-8 py-4">
                    <div 
                      className="text-[13px] font-medium text-[#1C1A12] max-w-[280px] truncate cursor-help"
                      title={fund.scheme}
                    >
                      {fund.scheme.length > 35 ? fund.scheme.substring(0, 32) + '...' : fund.scheme}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#1B5E20] text-white text-[10px] font-bold uppercase tracking-tight">
                      {fund.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[13px] font-bold text-[#1B5E20]">
                    {formatINR(fund.current_value)}
                  </td>
                  <td className={`px-6 py-4 text-right font-sans text-[13px] font-medium ${returnValue >= 0 ? 'text-[#388E3C]' : 'text-[#B71C1C]'}`}>
                    {formatPct(returnValue)}
                  </td>
                  <td className={`px-8 py-4 text-right font-mono text-[13px] font-medium ${isHighExpense ? 'text-[#E65100]' : 'text-[#7A7250]'}`}>
                    {fund.expense_ratio.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoldingsTable;
