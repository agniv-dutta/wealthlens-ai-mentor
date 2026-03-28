'use client';

import { useState } from 'react';
import Topbar from '../components/Topbar';
import TabBar from '../components/TabBar';
import StatCard from '../components/StatCard';
import AllocationChart from '../components/AllocationChart';
import AISummary from '../components/AISummary';
import HoldingsTable from '../components/HoldingsTable';
import FundIntelligence from '../components/FundIntelligence';

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
  const absN = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (absN >= 10000000) return sign + '₹' + (absN / 10000000).toFixed(1) + 'Cr';
  if (absN >= 100000) return sign + '₹' + (absN / 100000).toFixed(1) + 'L';
  return sign + '₹' + absN.toLocaleString('en-IN');
};

const formatPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

const TABS = ['Portfolio X-Ray', 'Fund Intelligence', 'Tax Wizard', "Couple's Planner", 'Money Health Score'] as const;
type TabType = typeof TABS[number];

const InsightBar = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#E6DDBE] border-l-[3px] border-[#1B5E20] px-4 py-3 rounded-lg text-[14px] font-sans text-[#4A4830] mb-8 animate-in fade-in slide-in-from-left-2 duration-500">
    {children}
  </div>
);

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('Portfolio X-Ray');
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  
  const [taxAnalysis, setTaxAnalysis] = useState<any>(null);
  const [couplesAnalysis, setCouplesAnalysis] = useState<any>(null);
  const [healthAnalysis, setHealthAnalysis] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const loadDemo = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Main Portfolio
      const demoRes = await fetch(`${API_BASE}/api/demo-portfolio`);
      if (!demoRes.ok) throw new Error(`Demo failed: ${demoRes.status}`);
      const demo = await demoRes.json();
      setPortfolio(demo.portfolio || []);

      // 2. Parallel Analysis for All Tabs
      const [pRes, tRes, hRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/api/portfolio/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolio: demo.portfolio }),
        }),
        fetch(`${API_BASE}/api/tax/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolio: demo.portfolio }),
        }),
        fetch(`${API_BASE}/api/health-score/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolio: demo.portfolio }),
        }),
        fetch(`${API_BASE}/api/demo-secondary-portfolio`),
      ]);

      if (!pRes.ok) {
        throw new Error(`Portfolio analysis failed: ${pRes.status}`);
      }

      const p = await pRes.json();
      const mergedMetrics = {
        ...(demo.metrics || {}),
        ...(p.metrics || {}),
        fund_xirr_pct:
          p?.metrics?.fund_xirr_pct ||
          demo?.metrics?.fund_xirr_pct ||
          {},
      };
      setMetrics(mergedMetrics);
      setAnalysis(p.analysis);
      if (tRes.ok) setTaxAnalysis(await tRes.json());
      if (hRes.ok) setHealthAnalysis(await hRes.json());
      
      if (sRes.ok) {
        const secondary = await sRes.json();
        const cRes = await fetch(`${API_BASE}/api/couples-planner/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolio_1: demo.portfolio, portfolio_2: secondary.portfolio }),
        });
        if (cRes.ok) setCouplesAnalysis(await cRes.json());
      }
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
    setTaxAnalysis(null);
    setCouplesAnalysis(null);
    setHealthAnalysis(null);
    setError('');
  };

  const exportReport = () => {
    window.print();
  };

  const renderPortfolioXRay = () => (
    <>
      <header className="mb-8">
        <h1 className="font-display text-[42px] text-[#1C1A12] mb-3 leading-tight tracking-tight">WealthLens Portfolio X-Ray</h1>
        <InsightBar>
          {metrics ? (
            <>Your <span className="font-bold">{formatINRShort(metrics.total_invested_value)}</span> has grown to <span className="font-bold">{formatINRShort(metrics.total_current_value)}</span> — but you're paying <span className="font-bold text-[#B71C1C]">{formatINR(metrics.annual_fees)}/year</span> in fees that could be cut in half.</>
          ) : (
            <>Your <span className="font-bold">₹9.4L</span> has grown to <span className="font-bold">₹12.0L</span> — but you're paying <span className="font-bold text-[#B71C1C]">₹14,564/year</span> in fees that could be cut in half.</>
          )}
        </InsightBar>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10 print-xray-stats">
        <StatCard label="XIRR" value={metrics ? formatPct(metrics.xirr_pct) : '--'} subtextText="Calculated from dated cashflows" variant="xirr" loading={loading} />
        <StatCard label="Current Value" value={metrics ? formatINRShort(metrics.total_current_value) : '--'} subtextText="Live computed from holdings" variant="current" loading={loading} />
        <StatCard label="Invested" value={metrics ? formatINRShort(metrics.total_invested_value) : '--'} subtextText="Total principal deployed" variant="invested" loading={loading} />
        <StatCard label="Absolute Gain" value={metrics ? (metrics.absolute_gain >= 0 ? '+' : '') + formatINRShort(metrics.absolute_gain) : '--'} subtextText={metrics ? `ROI ${formatPct(metrics.roi_pct)}` : 'Growth vs Benchmark'} variant="gain" loading={loading} />
        <StatCard label="Annual Fees" value={metrics ? formatINR(metrics.annual_fees) : '--'} subtextText="Expense ratio drag" variant="fees" loading={loading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[60fr_40fr] gap-6 items-start print-xray-core">
        <AllocationChart data={metrics?.asset_allocation || []} totalValue={metrics?.total_current_value || 0} loading={loading} />
        <AISummary grade={analysis?.health_grade || 'B'} riskLevel={(analysis?.risk_assessment?.toUpperCase() as any) || 'MODERATE'} keyInsights={analysis?.key_insights || []} rebalancingPlan={analysis?.rebalancing_plan || []} loading={loading} />
      </div>
      {portfolio.length > 0 && !loading && (
        <div className="print-xray-holdings">
          <HoldingsTable holdings={portfolio} />
        </div>
      )}
    </>
  );

  const renderFundIntelligence = () => (
    <FundIntelligence portfolio={portfolio} metrics={metrics} analysis={analysis} />
  );

  const renderTaxWizard = () => (
    <>
      <header className="mb-8">
        <h1 className="font-display text-[42px] text-[#1C1A12] mb-3 leading-tight tracking-tight">Tax Wizard</h1>
        <InsightBar>
          You're potentially missing <span className="font-bold text-[#1B5E20]">{formatINR(67500)}</span> in tax savings this financial year.
        </InsightBar>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <StatCard label="LTCG Estimated" value={taxAnalysis ? formatINR(taxAnalysis.ltcg_estimated_inr) : '--'} subtextText="Equity > 1 year" variant="current" loading={loading} />
        <StatCard label="STCG Estimated" value={taxAnalysis ? formatINR(taxAnalysis.stcg_estimated_inr) : '--'} subtextText="Short-term realization" variant="current" loading={loading} />
        <StatCard label="Tax Efficiency" value={taxAnalysis?.tax_efficiency_grade || '--'} subtextText="Based on portfolio churn" variant="current" loading={loading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8">
          <h3 className="font-display text-2xl mb-6">Harvesting Opportunities</h3>
          <ul className="space-y-4">
            {taxAnalysis?.tax_harvesting_suggestions?.map((s: any, i: number) => (
              <li key={i} className="p-4 bg-[#F2EDD8] rounded-xl border border-[#DDD8C0]">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-[#1C1A12]">{s.scheme}</span>
                  <span className="text-[#B71C1C] font-mono">{formatINR(s.harvestable_loss_inr)}</span>
                </div>
                <p className="text-xs text-[#7A7250]">{s.reason}</p>
              </li>
            ))}
            {(!taxAnalysis || taxAnalysis.tax_harvesting_suggestions.length === 0) && <p className="text-sand-500 italic">No harvesting suggestions currently.</p>}
          </ul>
        </div>
        <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8">
          <h3 className="font-display text-2xl mb-6">Tax Insights</h3>
          <ul className="space-y-4">
            {taxAnalysis?.key_tax_insights?.map((insight: string, i: number) => (
              <li key={i} className="flex gap-3 text-[13px] text-[#4A4830] pl-4 relative">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-[#1B5E20]" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="font-display text-2xl text-[#1C1A12] mb-6">Tax Regime Comparison</h3>
        <div className="bg-white border border-[#DDD8C0] rounded-2xl overflow-hidden shadow-sm relative">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Old Regime */}
            <div className="p-8 border-r border-[#DDD8C0]/50 bg-[#FDFAF4]/50">
              <div className="text-[11px] font-sans font-bold text-[#7A7250] uppercase tracking-wider mb-6">Old Regime</div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#4A4830]">Taxable Income</span>
                  <span className="font-mono font-bold text-[#1C1A12]">{formatINR(1200000)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#4A4830]">Tax Payable</span>
                  <span className="font-mono font-bold text-[#B71C1C]">{formatINR(117000)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#4A4830]">Effective Rate</span>
                  <span className="font-mono font-bold text-[#1C1A12]">9.75%</span>
                </div>
                <div className="pt-4 border-t border-[#DDD8C0]/30 flex justify-between items-center">
                  <span className="text-xs font-bold text-[#7A7250] uppercase">Annual Take-home</span>
                  <span className="text-xl font-display font-bold text-[#1C1A12]">{formatINR(1083000)}</span>
                </div>
              </div>
            </div>

            {/* New Regime */}
            <div className="p-8 bg-[#DCEDC8]/10 border-2 border-[#1B5E20] m-[-2px] rounded-2xl relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="text-[11px] font-sans font-bold text-[#1B5E20] uppercase tracking-wider">New Regime (Recommended)</div>
                <div className="px-2 py-0.5 bg-[#C5E1A5] text-[#1B5E20] text-[9px] font-bold rounded uppercase">Best Value</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#4A4830]">Taxable Income</span>
                  <span className="font-mono font-bold text-[#1C1A12]">{formatINR(1200000)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#4A4830]">Tax Payable</span>
                  <span className="font-mono font-bold text-[#1B5E20]">{formatINR(90000)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#4A4830]">Effective Rate</span>
                  <span className="font-mono font-bold text-[#1C1A12]">7.50%</span>
                </div>
                <div className="pt-4 border-t border-[#1B5E20]/20 flex justify-between items-center">
                  <span className="text-xs font-bold text-[#1B5E20] uppercase">Annual Take-home</span>
                  <span className="text-xl font-display font-bold text-[#1B5E20]">{formatINR(1110000)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Savings Banner */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block z-20">
            <div className="bg-[#1B5E20] text-white px-6 py-2 rounded-full shadow-lg text-sm font-bold whitespace-nowrap">
              Switch to new regime → Save {formatINR(27000)}/year
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-white border border-[#DDD8C0] rounded-2xl overflow-hidden shadow-sm">
        <header className="p-8 pb-4">
          <h3 className="font-display text-2xl text-[#1C1A12] mb-1">Missed Deductions</h3>
          <p className="text-xs font-sans text-[#7A7250] opacity-70">Optimization opportunities for your current profile</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#E6DDBE] border-b border-[#DDD8C0]">
                <th className="px-8 py-3 text-[11px] font-sans font-bold uppercase tracking-wider text-[#7A7250]">Section</th>
                <th className="px-6 py-3 text-[11px] font-sans font-bold uppercase tracking-wider text-[#7A7250]">Description</th>
                <th className="px-6 py-3 text-[11px] font-sans font-bold uppercase tracking-wider text-[#7A7250] text-right">Current</th>
                <th className="px-6 py-3 text-[11px] font-sans font-bold uppercase tracking-wider text-[#7A7250] text-right">Max Limit</th>
                <th className="px-8 py-3 text-[11px] font-sans font-bold uppercase tracking-wider text-[#7A7250] text-right">Potential Saving</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD8C0]/30 text-[13px] font-sans text-[#4A4830]">
              <tr className="bg-[#FDFAF4] hover:bg-[#F2EDD8] transition-colors">
                <td className="px-8 py-4 font-bold">80C</td>
                <td className="px-6 py-4">ELSS, EPF, LIC, PPF etc.</td>
                <td className="px-6 py-4 text-right font-mono text-[#7A7250]">{formatINR(0)}</td>
                <td className="px-6 py-4 text-right font-mono text-[#1C1A12]">{formatINR(150000)}</td>
                <td className="px-8 py-4 text-right font-mono font-bold text-[#1B5E20]">{formatINR(45000)}</td>
              </tr>
              <tr className="bg-[#F2EDD8] hover:bg-[#EDE6CC] transition-colors">
                <td className="px-8 py-4 font-bold">80D</td>
                <td className="px-6 py-4">Health Insurance Premiums</td>
                <td className="px-6 py-4 text-right font-mono text-[#7A7250]">{formatINR(0)}</td>
                <td className="px-6 py-4 text-right font-mono text-[#1C1A12]">{formatINR(25000)}</td>
                <td className="px-8 py-4 text-right font-mono font-bold text-[#1B5E20]">{formatINR(7500)}</td>
              </tr>
              <tr className="bg-[#FDFAF4] hover:bg-[#F2EDD8] transition-colors">
                <td className="px-8 py-4 font-bold">80CCD(1B)</td>
                <td className="px-6 py-4">NPS Tier 1 Contributions</td>
                <td className="px-6 py-4 text-right font-mono text-[#7A7250]">{formatINR(0)}</td>
                <td className="px-6 py-4 text-right font-mono text-[#1C1A12]">{formatINR(50000)}</td>
                <td className="px-8 py-4 text-right font-mono font-bold text-[#1B5E20]">{formatINR(15000)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 bg-[#1B5E20] rounded-2xl p-10 shadow-xl text-center group hover:scale-[1.005] transition-transform">
        <h4 className="text-[#C5E1A5] font-sans font-bold uppercase tracking-[0.2em] text-xs mb-4 opacity-80">Final Optimization Potential</h4>
        <div className="text-white font-display text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          You could save {formatINR(67500)} more in taxes
        </div>
        <p className="text-[#C5E1A5] text-sm opacity-70">Based on missed section 80C, 80D and NPS deductions</p>
      </div>
    </>
  );

  const renderCouplesPlanner = () => (
    <>
      <header className="mb-8">
        <h1 className="font-display text-[42px] text-[#1C1A12] mb-3 leading-tight tracking-tight">Couple's Planner</h1>
        <InsightBar>
          {couplesAnalysis ? (
            <>Together, your <span className="font-bold">{formatINRShort(couplesAnalysis.combined_metrics.total_current_value)}</span> portfolio earns <span className="font-bold text-[#1B5E20]">{formatPct(couplesAnalysis.combined_metrics.combined_xirr_pct)} XIRR</span> — here's how to optimize it jointly.</>
          ) : (
            <>Together, your <span className="font-bold">₹16.6L</span> portfolio earns <span className="font-bold text-[#1B5E20]">5.99% XIRR</span> — here's how to optimize it jointly.</>
          )}
        </InsightBar>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Combined Value" value={couplesAnalysis ? formatINRShort(couplesAnalysis.combined_metrics.total_current_value) : '--'} variant="current" loading={loading} />
        <StatCard label="Combined XIRR" value={couplesAnalysis ? formatPct(couplesAnalysis.combined_metrics.combined_xirr_pct) : '--'} variant="xirr" loading={loading} />
        <StatCard label="Unique Schemes" value={couplesAnalysis ? '12' : '--'} variant="current" loading={loading} />
        <StatCard label="Joint Grade" value={couplesAnalysis?.joint_health_grade || '--'} variant="current" loading={loading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[40fr_60fr] gap-6">
        <div className="bg-[#1B5E20] text-white rounded-2xl p-8 shadow-xl">
          <h3 className="font-display text-2xl mb-6">Merging Strategy</h3>
          <p className="text-[14px] leading-relaxed opacity-90">{couplesAnalysis?.merging_strategy || 'Merging insights will appear once data is loaded.'}</p>
        </div>
        <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8">
          <h3 className="font-display text-2xl mb-6">Combined Insights</h3>
          <div className="space-y-4">
            {couplesAnalysis?.key_combined_insights?.map((s: string, i: number) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-sand-50 rounded-xl border border-[#DDD8C0]">
                <div className="w-2 h-2 rounded-full bg-[#1B5E20]" />
                <span className="text-sm text-[#4A4830]">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderHealthScore = () => (
    <>
      <header className="mb-8">
        <h1 className="font-display text-[42px] text-[#1C1A12] mb-3 leading-tight tracking-tight">Money Health Score</h1>
        <InsightBar>
          {healthAnalysis ? (
            <>Your financial health scores <span className="font-bold">{healthAnalysis.overall_health_score}/100</span> — strong investments, but insurance gap needs attention.</>
          ) : (
            <>Your financial health scores <span className="font-bold">82/100</span> — strong investments, but insurance gap needs attention.</>
          )}
        </InsightBar>
      </header>
      <div className="flex flex-col lg:flex-row gap-8 items-start mb-10">
        <div className="bg-white border border-[#DDD8C0] rounded-3xl p-10 flex flex-col items-center justify-center min-w-[300px] shadow-sm">
          <div className="text-[11px] font-sans font-bold text-[#7A7250] uppercase tracking-widest mb-6">Overall Score</div>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" className="stroke-[#F2EDD8] stroke-[12] fill-none" />
              <circle cx="80" cy="80" r="70" 
                className="stroke-[#1B5E20] stroke-[12] fill-none" 
                style={{ strokeDasharray: 440, strokeDashoffset: 440 - (440 * (healthAnalysis?.overall_health_score || 0)) / 100 }} 
              />
            </svg>
            <span className="absolute font-display text-5xl font-bold text-[#1C1A12]">{healthAnalysis?.overall_health_score || '--'}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 w-full">
          <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8">
            <h4 className="text-[11px] font-sans font-bold text-[#7A7250] uppercase mb-4">Emergency Fund</h4>
            <div className="text-2xl font-display text-[#1C1A12] mb-2">{healthAnalysis?.emergency_fund_status || '--'}</div>
            <p className="text-xs text-sand-500">Based on monthly outflow estimates</p>
          </div>
          <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8">
            <h4 className="text-[11px] font-sans font-bold text-[#7A7250] uppercase mb-4">Insurance Coverage</h4>
            <div className="text-2xl font-display text-[#1C1A12] mb-2">{healthAnalysis ? `${healthAnalysis.insurance_coverage_score}/100` : '--'}</div>
            <p className="text-xs text-sand-500">Term + Health protection gap</p>
          </div>
          <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8 md:col-span-2">
            <h4 className="text-[11px] font-sans font-bold text-[#7A7250] uppercase mb-6">Expert Insights</h4>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {healthAnalysis?.health_insights?.map((h: string, i: number) => (
                <li key={i} className="text-[13px] text-[#4A4830] opacity-90 italic">"{h}"</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      <Topbar
        onLoadDemo={loadDemo}
        onReset={resetPortfolio}
        onExportReport={exportReport}
        loading={loading}
        grade={analysis?.health_grade}
      />

      {/* TabBar is at top on Desktop, bottom on Mobile */}
      <div className="hidden md:block">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex-1 flex overflow-hidden print-shell">
        {/* Sidebar - Desktop only */}
        <aside className="hidden lg:flex w-[240px] bg-[#F7F4E9] border-r border-[#DDD8C0] flex-col font-sans p-6 gap-2 shrink-0 print-hide-sidebar">
          <div className="mb-4 text-[10px] font-sans uppercase tracking-[0.1em] text-sand-500 font-semibold opacity-60">General</div>
          <nav className="flex flex-col gap-1.5">
            {TABS.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left px-4 py-2 rounded-lg transition-all text-[13px] ${
                  activeTab === tab 
                    ? 'bg-[#EDE6CC] text-[#1B5E20] font-semibold shadow-sm' 
                    : 'text-sand-500 hover:bg-[#EDE6CC]/50'
                }`}
              >
                {tab.replace('Money ', '')}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-12 px-10 pb-[100px] md:pb-16 bg-[#FDFAF4] print-main-content">
          <div className="max-w-[1100px] mx-auto w-full">
            
            {activeTab === 'Portfolio X-Ray' && renderPortfolioXRay()}
            {activeTab === 'Fund Intelligence' && renderFundIntelligence()}
            {activeTab === 'Tax Wizard' && renderTaxWizard()}
            {activeTab === "Couple's Planner" && renderCouplesPlanner()}
            {activeTab === 'Money Health Score' && renderHealthScore()}
          </div>

          <section className="print-report-sheet" aria-hidden="true" style={{ display: 'none' }}>
            <header className="print-report-header">
              <div className="print-report-title">WealthLens Portfolio X-Ray Report</div>
              <div className="print-report-date">{reportDate}</div>
            </header>

            <div className="print-report-body">
              <div className="print-xray-stats">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
                  <StatCard label="XIRR" value={metrics ? formatPct(metrics.xirr_pct) : '--'} subtextText="Calculated from dated cashflows" variant="xirr" loading={false} />
                  <StatCard label="Current Value" value={metrics ? formatINRShort(metrics.total_current_value) : '--'} subtextText="Live computed from holdings" variant="current" loading={false} />
                  <StatCard label="Invested" value={metrics ? formatINRShort(metrics.total_invested_value) : '--'} subtextText="Total principal deployed" variant="invested" loading={false} />
                  <StatCard label="Absolute Gain" value={metrics ? (metrics.absolute_gain >= 0 ? '+' : '') + formatINRShort(metrics.absolute_gain) : '--'} subtextText={metrics ? `ROI ${formatPct(metrics.roi_pct)}` : 'Growth vs Benchmark'} variant="gain" loading={false} />
                  <StatCard label="Annual Fees" value={metrics ? formatINR(metrics.annual_fees) : '--'} subtextText="Expense ratio drag" variant="fees" loading={false} />
                </div>
              </div>

              <div className="print-xray-core">
                <div className="grid grid-cols-1 lg:grid-cols-[60fr_40fr] gap-6 items-start">
                  <AllocationChart data={metrics?.asset_allocation || []} totalValue={metrics?.total_current_value || 0} loading={false} />
                  <AISummary grade={analysis?.health_grade || 'B'} riskLevel={(analysis?.risk_assessment?.toUpperCase() as any) || 'MODERATE'} keyInsights={analysis?.key_insights || []} rebalancingPlan={analysis?.rebalancing_plan || []} loading={false} />
                </div>
              </div>

              <div className="print-xray-holdings">
                {portfolio.length > 0 ? <HoldingsTable holdings={portfolio} /> : null}
              </div>
            </div>

            <footer className="print-report-footer">Confidential — for educational purposes only</footer>
          </section>
        </main>
      </div>

      {/* TabBar at bottom on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] print-hide-tabbar">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <footer className="print-hide-app-footer bg-sand-300 border-t border-sand-400 py-6 px-10 flex flex-col items-center justify-center font-sans text-center">
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
