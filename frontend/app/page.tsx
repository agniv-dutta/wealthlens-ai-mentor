'use client';

import { useMemo, useState } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';

type Action = 'buy' | 'sell' | 'switch';
type Risk = 'conservative' | 'moderate' | 'aggressive';
type Grade = 'A' | 'B' | 'C' | 'D';

interface Holding {
  scheme: string;
  current_value: number;
  invested: number;
  units: number;
  nav: number;
  expense_ratio: number;
  category: string;
  purchase_date: string;
}

interface PortfolioMetrics {
  total_current_value: number;
  total_invested_value: number;
  absolute_gain: number;
  roi_pct: number;
  annual_fees: number;
  xirr_pct: number;
  asset_allocation: { name: string; value: number; weight_pct: number }[];
  overlap_categories: string[];
}

interface Analysis {
  rebalancing_plan: { action: Action; scheme: string; reason: string; amount_inr: number }[];
  key_insights: string[];
  risk_assessment: Risk;
  health_grade: Grade;
  one_line_summary: string;
}

interface AnalyzeResponse {
  portfolio: Holding[];
  metrics: PortfolioMetrics;
  analysis: Analysis;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
const COLORS = ['#0a8f77', '#2d6a9f', '#446577', '#6e8c8f', '#7d8a95', '#9ca9b2'];

const fmt = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export default function Page() {
  const [portfolio, setPortfolio] = useState<Holding[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
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

      const result = (await analyzeRes.json()) as AnalyzeResponse;
      setMetrics(result.metrics);
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const gradeClass = useMemo(() => {
    if (!analysis) return 'badge';
    if (analysis.health_grade === 'A') return 'badge';
    if (analysis.health_grade === 'B') return 'badge';
    if (analysis.health_grade === 'C') return 'badge';
    return 'badge';
  }, [analysis]);

  return (
    <main>
      <div className="container">
        <div className="header">
          <div>
            <h1 className="title">WealthLens Portfolio X-Ray</h1>
            <p className="subtitle">Next.js frontend + FastAPI backend + Groq analysis</p>
          </div>
          <div className="actions">
            <button className="button" onClick={loadDemo} disabled={loading}>
              {loading ? 'Running analysis...' : 'Load Demo & Analyze'}
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setPortfolio([]);
                setMetrics(null);
                setAnalysis(null);
                setError('');
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="grid">
          <div className="card">
            <div className="kpi-label">XIRR</div>
            <div className="kpi-value">{metrics ? `${metrics.xirr_pct.toFixed(2)}%` : '--'}</div>
            <div className="kpi-sub">Calculated from dated cashflows</div>
          </div>
          <div className="card">
            <div className="kpi-label">Current Value</div>
            <div className="kpi-value">{metrics ? fmt(metrics.total_current_value) : '--'}</div>
            <div className="kpi-sub">Live computed from holdings</div>
          </div>
          <div className="card">
            <div className="kpi-label">Invested</div>
            <div className="kpi-value">{metrics ? fmt(metrics.total_invested_value) : '--'}</div>
            <div className="kpi-sub">Total principal deployed</div>
          </div>
          <div className="card">
            <div className="kpi-label">Absolute Gain</div>
            <div className="kpi-value">{metrics ? fmt(metrics.absolute_gain) : '--'}</div>
            <div className="kpi-sub">ROI {metrics ? `${metrics.roi_pct.toFixed(2)}%` : '--'}</div>
          </div>
          <div className="card">
            <div className="kpi-label">Annual Fees</div>
            <div className="kpi-value">{metrics ? fmt(metrics.annual_fees) : '--'}</div>
            <div className="kpi-sub">Expense ratio drag</div>
          </div>
        </div>

        <div className="layout">
          <section className="card">
            <h3>Asset Allocation</h3>
            <p className="subtitle">By category concentration</p>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics?.asset_allocation || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={(entry) => `${entry.name} ${entry.weight_pct.toFixed(1)}%`}
                  >
                    {(metrics?.asset_allocation || []).map((item, index) => (
                      <Cell key={`${item.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => fmt(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card">
            <h3>AI Summary</h3>
            <p className="subtitle">Groq recommendation output</p>
            {analysis ? (
              <>
                <p>
                  <span className={gradeClass}>Grade {analysis.health_grade}</span>
                </p>
                <p>{analysis.one_line_summary}</p>
                <p className="subtitle">Risk: {analysis.risk_assessment.toUpperCase()}</p>
                <h4>Key Insights</h4>
                <ul className="list">
                  {analysis.key_insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
                <h4>Rebalancing</h4>
                <ul className="list">
                  {analysis.rebalancing_plan.map((step, idx) => (
                    <li key={`${step.scheme}-${idx}`}>
                      <strong>{step.action.toUpperCase()}</strong> {step.scheme} ({fmt(step.amount_inr)}) - {step.reason}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="subtitle">Run demo to fetch Groq-backed recommendations.</p>
            )}
          </section>
        </div>

        {portfolio.length > 0 ? (
          <section className="card" style={{ marginTop: 14 }}>
            <h3>Holdings ({portfolio.length})</h3>
            <p className="subtitle">Used for deterministic calculations + AI interpretation</p>
            <ul className="list">
              {portfolio.map((h) => (
                <li key={h.scheme}>{h.scheme} - {fmt(h.current_value)} ({h.category})</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
