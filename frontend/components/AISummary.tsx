'use client';

import React from 'react';

interface RebalancingStep {
  action: 'buy' | 'sell' | 'switch';
  scheme: string;
  reason: string;
  amount_inr: number;
}

interface AISummaryProps {
  grade: 'A' | 'B' | 'C' | 'D';
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  keyInsights: string[];
  rebalancingPlan: RebalancingStep[];
  loading?: boolean;
}

const AISummary = ({ grade, riskLevel, keyInsights, rebalancingPlan, loading }: AISummaryProps) => {
  if (loading) {
    return (
      <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8 h-[500px]">
        <div className="h-6 w-32 bg-[#F2EDD8] rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-4 w-full bg-[#F2EDD8] rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8 shadow-sm">
      <header className="mb-6">
        <h3 className="font-display text-2xl text-[#1C1A12] mb-1">AI Summary</h3>
        <p className="text-xs font-sans text-[#7A7250] tracking-tight">Powered by AI analysis</p>
      </header>

      <div className="flex items-center gap-3 mb-8">
        <div className="px-3 py-1 rounded bg-[#DCEDC8] border border-[#AED581] flex items-center gap-2">
          <span className="text-[11px] font-sans font-bold text-[#1B5E20] uppercase tracking-wider">Grade {grade}</span>
        </div>
      </div>

      <p className="text-[#4A4830] font-sans text-[14px] leading-relaxed mb-8 opacity-90">
        A well-diversified portfolio, requiring minor rebalancing to optimize returns and reduce fees.
      </p>

      <div className="space-y-8">
        <div>
          <div className="text-[11px] font-sans font-bold text-[#7A7250] uppercase tracking-[0.1em] mb-4">Risk: {riskLevel}</div>
          <div className="text-[11px] font-sans font-bold text-[#7A7250] uppercase tracking-[0.1em] mb-4">Key Insights</div>
          <ul className="space-y-4">
            {keyInsights.length > 0 ? keyInsights.map((insight, i) => (
              <li key={i} className="flex gap-3 text-[13px] text-[#4A4830] leading-relaxed relative pl-4">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-[#388E3C]" />
                {insight}
              </li>
            )) : (
              <li className="text-[13px] text-[#7A7250] italic">Generating insights...</li>
            )}
          </ul>
        </div>

        {rebalancingPlan.length > 0 && (
          <div>
            <div className="text-[11px] font-sans font-bold text-[#7A7250] uppercase tracking-[0.1em] mb-4">Rebalancing</div>
            <div className="flex flex-wrap gap-2">
              {rebalancingPlan.map((action, i) => (
                <div 
                  key={i} 
                  className="px-3 py-1.5 rounded-lg border border-[#DDD8C0] bg-[#F7F4E9] text-[11px] font-sans font-medium text-[#4A4830]"
                >
                  <span className={`uppercase mr-2 ${
                    action.action === 'buy' ? 'text-[#1B5E20]' : 
                    action.action === 'sell' ? 'text-[#B71C1C]' : 'text-[#E65100]'
                  }`}>
                    {action.action}
                  </span>
                  {action.scheme}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISummary;
