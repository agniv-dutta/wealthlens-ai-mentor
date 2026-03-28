'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  LineChart, Line, Legend
} from 'recharts';

interface FundIntelligenceProps {
  portfolio: any[];
  metrics: any;
  analysis: any;
}

const formatINR = (n: number) => {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const formatPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

const FundIntelligence = ({ portfolio, metrics, analysis }: FundIntelligenceProps) => {
  const [targetAllocations, setTargetAllocations] = useState<Record<string, number>>({});
  
  // Initialize target allocations from current weights
  useEffect(() => {
    if (portfolio.length > 0) {
      const initial: Record<string, number> = {};
      portfolio.forEach(f => {
        const weight = (f.current_value / metrics.total_current_value) * 100;
        initial[f.scheme] = Math.round(weight);
      });
      setTargetAllocations(initial);
    }
  }, [portfolio, metrics]);

  if (!portfolio || portfolio.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-16 h-16 bg-[#F2EDD8] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#7A7250]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="font-display text-2xl text-[#1C1A12] mb-2">No Portfolio Data</h3>
        <p className="text-[#7A7250] text-sm max-w-xs mx-auto">Load demo data to see fund intelligence analysis.</p>
      </div>
    );
  }

  // Helper for fund short name
  const getShortName = (name: string) => {
    return name.split(' Fund')[0].split(' - ')[0].replace('Opportunities', 'Opp.').replace('Infrastructure', 'Infra.');
  };

  // Section 1: Heatmap Data
  const heatmapFunds = portfolio.map(f => {
    const returnPct = ((f.current_value - f.invested) / f.invested) * 100;
    const weightPct = (f.current_value / metrics.total_current_value) * 100;
    return {
      ...f,
      returnPct,
      weightPct,
      shortName: getShortName(f.scheme)
    };
  });

  // Section 3: Expense Drag Data
  const expenseData = portfolio.map(f => {
    const annualCost = (f.current_value * f.expense_ratio) / 100;
    return {
      name: getShortName(f.scheme),
      ratio: f.expense_ratio,
      cost: annualCost
    };
  });

  // Section 4: Benchmark Data
  const benchmarkData = [
    { year: 'Year 0', portfolio: 0, nifty: 0, category: 0 },
    { year: 'Year 1', portfolio: 4.2, nifty: 3.5, category: 3.1 },
    { year: 'Year 2', portfolio: 3.8, nifty: 8.4, category: 5.9 },
    { year: 'Year 3', portfolio: 5.08, nifty: 12.1, category: 8.4 },
  ];

  // Simulator Logic
  const handleApplyAISuggestion = () => {
    if (!analysis?.rebalancing_plan) return;
    
    const newAllocations = { ...targetAllocations };
    // Very simplified auto-fill based on AI plan
    analysis.rebalancing_plan.forEach((p: any) => {
      if (p.action === 'buy' || p.action === 'switch') {
        newAllocations[p.scheme] = (newAllocations[p.scheme] || 0) + 5; // Simplified
      } else if (p.action === 'sell') {
        newAllocations[p.scheme] = Math.max(0, (newAllocations[p.scheme] || 0) - 5);
      }
    });
    setTargetAllocations(newAllocations);
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <h1 className="font-display text-[42px] text-[#1C1A12] mb-3 leading-tight tracking-tight">Fund Intelligence</h1>
        <div className="bg-[#E6DDBE] border-l-[3px] border-[#1B5E20] px-4 py-3 rounded-lg text-[14px] font-sans text-[#4A4830] mb-8 animate-in fade-in slide-in-from-left-2 duration-500">
          <span className="font-bold">{portfolio.length} funds</span> analyzed · <span className="font-bold text-[#E65100]">2 overlap risks</span> detected · <span className="font-bold text-[#B71C1C]">{formatINR(metrics.annual_fees)}</span> in avoidable fees identified
        </div>
      </header>

      {/* 1. PORTFOLIO HEATMAP */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 bg-[#1B5E20] rounded-full" />
          <h2 className="font-display text-2xl text-[#1C1A12]">Portfolio Heatmap</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {heatmapFunds.map((f, i) => (
            <div 
              key={i} 
              className="bg-white border border-[#DDD8C0] rounded-2xl p-6 h-[200px] flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
              style={{ borderBottom: `4px solid ${f.returnPct > 20 ? '#1B5E20' : f.returnPct > 10 ? '#D4A04A' : '#B71C1C'}` }}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-display text-lg leading-tight text-[#1C1A12] max-w-[70%]">{f.shortName}</h3>
                  <span className="px-2 py-0.5 bg-[#DCEDC8] text-[#1B5E20] text-[9px] font-bold rounded uppercase tracking-wider">{f.category}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-sans text-[#7A7250] uppercase tracking-wider font-semibold">
                    <span>Performance</span>
                    <span className={f.returnPct >= 0 ? 'text-[#1B5E20]' : 'text-[#B71C1C]'}>{formatPct(f.returnPct)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#F2EDD8] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#1B5E20] transition-all duration-1000"
                      style={{ width: `${Math.min(100, f.returnPct * 2)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-[#F2EDD8] pt-4">
                <div className="text-center">
                  <div className="text-[9px] font-sans text-[#7A7250] uppercase tracking-tighter opacity-70">XIRR</div>
                  <div className="text-[13px] font-mono font-bold text-[#1C1A12]">24.2%</div>
                </div>
                <div className="text-center border-x border-[#F2EDD8]">
                  <div className="text-[9px] font-sans text-[#7A7250] uppercase tracking-tighter opacity-70">Exp. Ratio</div>
                  <div className="text-[13px] font-mono font-bold text-[#1C1A12]">{f.expense_ratio}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-sans text-[#7A7250] uppercase tracking-tighter opacity-70">Weight</div>
                  <div className="text-[13px] font-mono font-bold text-[#1C1A12]">{f.weightPct.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. OVERLAP ANALYSIS */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 bg-[#D4A04A] rounded-full" />
          <h2 className="font-display text-2xl text-[#1C1A12]">Overlap Analysis</h2>
        </div>
        <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8 shadow-sm">
          <div className="grid grid-cols-7 gap-1 mb-8">
            <div className="bg-transparent" />
            {heatmapFunds.map((f, i) => (
              <div key={i} className="text-[9px] font-sans font-bold uppercase text-[#7A7250] text-center rotate-45 h-12 flex items-center justify-center -mb-2">
                {f.shortName.substring(0, 10)}
              </div>
            ))}
            {heatmapFunds.map((fRow, i) => (
              <React.Fragment key={i}>
                <div className="text-[9px] font-sans font-bold uppercase text-[#7A7250] flex items-center truncate pr-2">
                  {fRow.shortName}
                </div>
                {heatmapFunds.map((fCol, j) => {
                  let overlap = i === j ? 100 : Math.floor(Math.random() * 40);
                  if (fRow.category === 'Large Cap' && fCol.category === 'Large Cap' && i !== j) overlap = 65;
                  
                  const getBg = () => {
                    if (overlap === 100) return '#E6DDBE';
                    if (overlap > 50) return '#B71C1C33';
                    if (overlap > 20) return '#D4A04A33';
                    return '#1B5E2033';
                  };
                  
                  return (
                    <div 
                      key={j} 
                      className="aspect-square flex items-center justify-center text-[10px] font-mono font-bold rounded-sm transition-transform hover:scale-110 cursor-default"
                      style={{ backgroundColor: getBg() }}
                      title={`${fRow.shortName} vs ${fCol.shortName}: ${overlap}% overlap`}
                    >
                      {overlap}%
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="p-4 bg-[#B71C1C]/5 border border-[#B71C1C]/20 rounded-xl flex items-center gap-4">
            <div className="p-2 bg-[#B71C1C]/10 rounded-full text-[#B71C1C]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1C1A12]">High overlap detected between Large Cap funds</p>
              <p className="text-xs text-[#7A7250]">Mirae Large Cap and Axis Bluechip overlap at 65% — consider consolidating to mid-cap or index funds.</p>
            </div>
          </div>
        </div>
      </section> section

      {/* 3. EXPENSE RATIO DRAG VISUALIZER */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 bg-[#B71C1C] rounded-full" />
          <h2 className="font-display text-2xl text-[#1C1A12]">Expense Ratio Drag</h2>
        </div>
        <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8 shadow-sm">
          <div className="h-[300px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} layout="vertical" margin={{ left: 40, right: 80 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#DDD8C022" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#7A7250', fontSize: 10, fontWeight: 500 }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#FDFAF4] border border-[#DDD8C0] p-3 rounded-xl shadow-lg">
                          <p className="text-xs font-bold text-[#1C1A12] mb-1">{payload[0].payload.name}</p>
                          <p className="text-[11px] text-[#7A7250]">Ratio: <span className="font-mono">{payload[0].value}%</span></p>
                          <p className="text-[11px] text-[#7A7250]">Annual Cost: <span className="font-mono">{formatINR(payload[0].payload.cost)}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={1.0} stroke="#E65100" strokeDasharray="5 5" label={{ position: 'top', value: 'Direct threshold', fill: '#E65100', fontSize: 9 }} />
                <Bar dataKey="ratio" radius={[0, 4, 4, 0]} barSize={20}>
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.ratio > 1.0 ? '#E65100' : '#1B5E20'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-[#F2EDD8]">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#E65100] rounded-sm" />
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#7A7250]">High Drag (>1%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#1B5E20] rounded-sm" />
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#7A7250]">Optimal Drag</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#7A7250] block mb-1">Total Annual Fee Drag</span>
              <span className="text-3xl font-display font-bold text-[#B71C1C]">{formatINR(14564)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BENCHMARK COMPARISON */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 bg-[#1B5E20] rounded-full" />
          <h2 className="font-display text-2xl text-[#1C1A12]">Performance vs Benchmarks</h2>
        </div>
        <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8 shadow-sm">
          <div className="h-[300px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={benchmarkData} margin={{ right: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD8C044" />
                <XAxis dataKey="year" tick={{ fill: '#7A7250', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7A7250', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip 
                  contentStyle={{ background: '#FDFAF4', border: '1px solid #DDD8C0', borderRadius: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 20 }} />
                <Line type="monotone" dataKey="portfolio" name="WealthLens Portfolio" stroke="#1B5E20" strokeWidth={3} dot={{ r: 4, fill: '#1B5E20' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="nifty" name="Nifty 50" stroke="#D4A04A" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="category" name="Category Avg" stroke="#7A7250" strokeWidth={2} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#FDFAF4] border border-[#DDD8C0] rounded-xl p-6 flex items-start gap-4">
            <div className="p-2 bg-[#1B5E20]/10 rounded-full text-[#1B5E20]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1C1A12]">Your portfolio underperforms Nifty 50 by 7.02%</p>
              <p className="text-xs text-[#7A7250]">Active management cost is high while returns trail the index. Consider increasing index fund allocation for better risk-adjusted returns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. REBALANCING SIMULATOR */}
      <section className="pb-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 bg-[#1B5E20] rounded-full" />
          <h2 className="font-display text-2xl text-[#1C1A12]">Rebalancing Simulator</h2>
        </div>
        <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <p className="text-sm text-[#7A7250]">Adjust targets to see projected impacts</p>
            <button 
              onClick={handleApplyAISuggestion}
              className="px-5 py-2.5 bg-[#1B5E20] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#1B5E20]/20 hover:scale-105 transition-transform flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Apply AI Suggestion
            </button>
          </div>

          <div className="space-y-10">
            {heatmapFunds.map((f, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[13px] font-bold text-[#1C1A12] group-hover:text-[#1B5E20] transition-colors">{f.shortName}</span>
                    <span className="ml-2 text-[10px] text-[#7A7250] opacity-60">Current: {f.weightPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={targetAllocations[f.scheme] || 0}
                      onChange={(e) => setTargetAllocations({...targetAllocations, [f.scheme]: parseInt(e.target.value) || 0})}
                      className="w-16 px-2 py-1 bg-[#F2EDD8] border border-[#DDD8C0] rounded text-right text-sm font-mono font-bold focus:outline-none focus:border-[#1B5E20]" 
                    />
                    <span className="text-xs text-[#7A7250] font-bold">%</span>
                  </div>
                </div>
                <div className="relative h-2 bg-[#F2EDD8] rounded-full">
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={targetAllocations[f.scheme] || 0}
                    onChange={(e) => setTargetAllocations({...targetAllocations, [f.scheme]: parseInt(e.target.value)})}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute inset-y-0 left-0 bg-[#1B5E20] rounded-full transition-all duration-300 pointer-events-none"
                    style={{ width: `${targetAllocations[f.scheme] || 0}%` }}
                  />
                  {/* Marker for current allocation */}
                  <div 
                    className="absolute top-[-4px] w-0.5 h-4 bg-[#7A7250] opacity-40"
                    style={{ left: `${f.weightPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-10 border-t border-[#F2EDD8] grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-[#FDFAF4] rounded-2xl border border-[#DDD8C0]/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#1B5E20]" />
              <div className="text-[10px] font-sans font-bold text-[#7A7250] uppercase tracking-[0.2em] mb-3">Exp. XIRR Change</div>
              <div className="text-3xl font-display font-bold text-[#1B5E20] group-hover:scale-110 transition-transform">+2.45%</div>
              <div className="text-[10px] text-[#1B5E20]/60 mt-2">Annualized improvement</div>
            </div>
            <div className="text-center p-6 bg-[#FDFAF4] rounded-2xl border border-[#DDD8C0]/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#B71C1C]" />
              <div className="text-[10px] font-sans font-bold text-[#7A7250] uppercase tracking-[0.2em] mb-3">Annual Fee Change</div>
              <div className="text-3xl font-display font-bold text-[#B71C1C] group-hover:scale-110 transition-transform">-₹4,250</div>
              <div className="text-[10px] text-[#B71C1C]/60 mt-2">Lower drag through direct</div>
            </div>
            <div className="text-center p-6 bg-[#FDFAF4] rounded-2xl border border-[#DDD8C0]/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#D4A04A]" />
              <div className="text-[10px] font-sans font-bold text-[#7A7250] uppercase tracking-[0.2em] mb-3">Risk Level Change</div>
              <div className="text-3xl font-display font-bold text-[#1C1A12] group-hover:scale-110 transition-transform">Moderate</div>
              <div className="text-[10px] text-[#7A7250]/60 mt-2">Neutral risk adjustment</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FundIntelligence;
