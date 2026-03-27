'use client';

import { useState } from 'react';
import Topbar from '../components/Topbar';
import TabBar from '../components/TabBar';
import StatCard from '../components/StatCard';
import AllocationChart from '../components/AllocationChart';
import AISummary from '../components/AISummary';
import HoldingsTable from '../components/HoldingsTable';

interface Action {
  action: 'buy' | 'sell' | 'switch';
  scheme: string;
  reason: string;
  amount_inr: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8001';

// Formatters exactly as specified in design docs
const formatINR = (n: number) => {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const formatINRShort = (n: number) => {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  return '₹' + n.toLocaleString('en-IN');
};

const formatPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

export default function Page() {
  const [activeTab, setActiveTab] = useState('Portfolio X-Ray');
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const demoRes = await fetch(`${API_BASE}/api/demo-portfolio`);
      if (!demoRes.ok) throw new Error(`Demo failed: ${demoRes.status}`);
      const demo = await demoRes.json();
      setPortfolio(demo.portfolio || []);

      const analyzeRes = await fetch(`${API_BASE}/api/portfolio/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio: demo.portfolio }),
      });
      if (!analyzeRes.ok) throw new Error(`Analyze failed: ${analyzeRes.status}`);

      const result = await analyzeRes.json();
      setMetrics(result.metrics);
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const resetPortfolio = () => {
    setPortfolio([]);
    setMetrics(null);
    setAnalysis(null);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      <Topbar
        onLoadDemo={loadDemo}
        onReset={resetPortfolio}
        loading={loading}
        grade={analysis?.health_grade}
      />

      {/* TabBar is at top on Desktop, bottom on Mobile */}
      <div className="hidden md:block">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop only */}
        <aside className="hidden lg:flex w-[240px] bg-[#F7F4E9] border-r border-[#DDD8C0] flex-col font-sans p-6 gap-2 shrink-0">
          <div className="mb-4 text-[10px] font-sans uppercase tracking-[0.1em] text-sand-500 font-semibold opacity-60">General</div>
          <nav className="flex flex-col gap-1.5">
            <button className="text-left px-4 py-2 rounded-lg bg-[#EDE6CC] text-[#1B5E20] font-semibold text-[13px]">Portfolio X-Ray</button>
            <button className="text-left px-4 py-2 rounded-lg text-sand-500 hover:bg-[#EDE6CC] transition-colors text-[13px]">Tax Wizard</button>
            <button className="text-left px-4 py-2 rounded-lg text-sand-500 hover:bg-[#EDE6CC] transition-colors text-[13px]">Couple's Planner</button>
            <button className="text-left px-4 py-2 rounded-lg text-sand-500 hover:bg-[#EDE6CC] transition-colors text-[13px]">Health Score</button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-12 px-10 pb-[100px] md:pb-16 bg-[#FDFAF4]">
          <div className="max-w-[1100px] mx-auto w-full">
            
            <header className="mb-12">
              <h1 className="font-display text-[42px] text-[#1C1A12] mb-3 leading-tight tracking-tight">WealthLens Portfolio X-Ray</h1>
              <p className="text-[#7A7250] font-sans text-sm opacity-80">Next.js frontend + FastAPI backend + Groq analysis</p>
            </header>

            {error && (
              <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl p-8 flex flex-col items-center justify-center text-center mb-10 group transition-all hover:scale-[1.01]">
                <svg className="w-16 h-16 text-forest-200 mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 85C69.33 85 85 69.33 85 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M50 85V40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M50 40C50 40 55 30 70 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M50 50L30 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <rect x="40" y="85" width="20" height="10" rx="2" fill="currentColor" opacity="0.4" />
                </svg>
                <h3 className="font-display text-lg text-[#B71C1C]">Analysis unavailable</h3>
                <p className="font-sans text-sm text-[#D32F2F] mt-1 mb-6">Try reloading the demo data</p>
                <button
                  onClick={loadDemo}
                  className="px-6 py-2 rounded-lg bg-[#B71C1C] text-white font-sans font-medium text-sm hover:bg-[#D32F2F] transition-colors"
                >
                  Retry Analysis
                </button>
              </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
              <StatCard
                label="XIRR"
                value={metrics ? formatPct(metrics.xirr_pct) : '--'}
                subtextText="Calculated from dated cashflows"
                variant="xirr"
                loading={loading}
              />
              <StatCard
                label="Current Value"
                value={metrics ? formatINRShort(metrics.total_current_value) : '--'}
                subtextText="Live computed from holdings"
                variant="current"
                loading={loading}
              />
              <StatCard
                label="Invested"
                value={metrics ? formatINRShort(metrics.total_invested_value) : '--'}
                subtextText="Total principal deployed"
                variant="invested"
                loading={loading}
              />
              <StatCard
                label="Absolute Gain"
                value={metrics ? (metrics.absolute_gain >= 0 ? '+' : '') + formatINRShort(metrics.absolute_gain) : '--'}
                subtextText={metrics ? `ROI ${formatPct(metrics.roi_pct)}` : 'Growth vs Benchmark'}
                variant="gain"
                loading={loading}
              />
              <StatCard
                label="Annual Fees"
                value={metrics ? formatINR(metrics.annual_fees) : '--'}
                subtextText="Expense ratio drag"
                variant="fees"
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[60fr_40fr] gap-6 items-start">
              <AllocationChart
                data={metrics?.asset_allocation || []}
                totalValue={metrics?.total_current_value || 0}
                loading={loading}
              />

              <AISummary
                grade={analysis?.health_grade || 'B'}
                riskLevel={(analysis?.risk_assessment?.toUpperCase() as any) || 'MODERATE'}
                keyInsights={analysis?.key_insights || []}
                rebalancingPlan={analysis?.rebalancing_plan || []}
                loading={loading}
              />
            </div>

            {portfolio.length > 0 && !loading && (
              <HoldingsTable holdings={portfolio} />
            )}
          </div>
        </main>
      </div>

      {/* TabBar at bottom on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <footer className="bg-sand-300 border-t border-sand-400 py-6 px-10 flex flex-col items-center justify-center font-sans text-center">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-forest-200" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4.5 9.5a7 7 0 000 9.9 7 7 0 009.9 0l8.1-8.1-10.5-1.3L12 2z" />
          </svg>
          <span className="text-[11px] text-sand-500 font-normal tracking-wide">
            WealthLens is for educational purposes only. Not SEBI-registered investment advice.
          </span>
        </div>
        <p className="text-[11px] text-sand-500 opacity-60">Consult a qualified financial advisor before making investment decisions.</p>
      </footer>
    </div>
  );
}
