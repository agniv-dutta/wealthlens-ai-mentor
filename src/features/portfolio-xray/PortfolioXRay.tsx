import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  FileUp, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  Wallet,
  History, 
  ExternalLink,
  ChevronRight,
  Info,
  BadgeAlert,
  BadgeCheck,
  Zap,
  Download,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#00B894', '#00CEC9', '#0F1B2D', '#2D3436', '#636E72', '#B2BEC3'];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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

interface AnalysisData {
  rebalancing_plan: { action: 'buy' | 'sell' | 'switch', scheme: string, reason: string, amount_inr: number }[];
  key_insights: string[];
  risk_assessment: 'conservative' | 'moderate' | 'aggressive';
  health_grade: 'A' | 'B' | 'C' | 'D';
  one_line_summary: string;
}

interface AnalyzeResponse {
  portfolio: Holding[];
  metrics: PortfolioMetrics;
  analysis: AnalysisData;
}

export default function PortfolioXRay() {
  const [portfolio, setPortfolio] = useState<Holding[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDemoData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/demo-portfolio`);
      if (!response.ok) {
        throw new Error(`Failed to load demo data: ${response.status}`);
      }

      const data = await response.json();
      setPortfolio(data.portfolio || []);
      await analyzePortfolio(data.portfolio || []);
      toast.success('Demo portfolio loaded!');
    } catch (error) {
      console.error('Error loading demo portfolio:', error);
      toast.error('Failed to load demo portfolio');
    } finally {
      setLoading(false);
    }
  };

  const analyzePortfolio = async (data: Holding[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/portfolio/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ portfolio: data })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json() as AnalyzeResponse;

      setMetrics(result.metrics);
      setAnalysis(result.analysis);
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      toast.error('Failed to analyze portfolio');
    }
  };

  const totalCurrentValue = metrics?.total_current_value ?? portfolio.reduce((sum, item) => sum + item.current_value, 0);
  const totalInvestedValue = metrics?.total_invested_value ?? portfolio.reduce((sum, item) => sum + item.invested, 0);
  const absoluteGain = metrics?.absolute_gain ?? (totalCurrentValue - totalInvestedValue);
  const annualFees = metrics?.annual_fees ?? portfolio.reduce((sum, item) => sum + (item.current_value * item.expense_ratio / 100), 0);
  const xirrValue = metrics?.xirr_pct ?? 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const localAllocationData = portfolio.reduce((acc: any[], item) => {
    const existing = acc.find(a => a.name === item.category);
    if (existing) {
      existing.value += item.current_value;
    } else {
      acc.push({ name: item.category, value: item.current_value });
    }
    return acc;
  }, []);

  const localOverlapIssues = portfolio.reduce((acc: string[], item) => {
    const count = portfolio.filter(p => p.category === item.category).length;
    if (count > 2 && !acc.includes(item.category)) {
      acc.push(item.category);
    }
    return acc;
  }, []);

  const assetAllocationData = metrics?.asset_allocation ?? localAllocationData;
  const overlapIssues = metrics?.overlap_categories ?? localOverlapIssues;

  const exportPDF = async () => {
    const element = document.getElementById('portfolio-report');
    if (!element) return;
    
    toast.loading('Generating PDF...', { id: 'pdf-toast' });
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('WealthLens-Portfolio-XRay.pdf');
      toast.success('PDF Exported!', { id: 'pdf-toast' });
    } catch (error) {
      toast.error('Failed to export PDF', { id: 'pdf-toast' });
    }
  };

  if (portfolio.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 animate-pulse">
          <FileUp className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-3xl font-serif font-bold mb-4">Upload your CAS PDF</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Upload your CAMS or KFintech consolidated account statement for a deep X-Ray of your wealth.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="h-12 px-8" disabled={loading}>
            <FileUp className="mr-2 h-5 w-5" />
            Upload PDF Statement
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8" onClick={loadDemoData} disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading...
              </div>
            ) : (
              <>
                <Database className="mr-2 h-5 w-5" />
                Load Demo Data
              </>
            )}
          </Button>
        </div>
        
        <div className="mt-12 flex items-center gap-6 opacity-40 grayscale">
          <img src="https://www.camsonline.com/Images/logo.png" alt="CAMS" className="h-8 object-contain" />
          <img src="https://mfs.kfintech.com/investor/images/Kfin-Logo.png" alt="KFintech" className="h-8 object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div id="portfolio-report" className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold flex items-center gap-3">
            Portfolio X-Ray
            <Badge className={cn(
              "text-lg px-4",
              analysis?.health_grade === 'A' ? 'bg-green-500' : analysis?.health_grade === 'B' ? 'bg-blue-500' : 'bg-orange-500'
            )}>
              Grade {analysis?.health_grade || '...'}
            </Badge>
          </h2>
          <p className="text-muted-foreground mt-1">{analysis?.one_line_summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setPortfolio([]); setMetrics(null); setAnalysis(null); }}>
            Reset
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Portfolio XIRR', value: `${xirrValue}%`, icon: TrendingUp, sub: 'vs 12.8% Benchmark', color: 'text-primary' },
          { label: 'Current Value', value: formatCurrency(totalCurrentValue), icon: Wallet, sub: 'Last Updated: Today' },
          { label: 'Invested Value', value: formatCurrency(totalInvestedValue), icon: Activity, sub: `${portfolio.length} Schemes` },
          { label: 'Absolute Gain', value: formatCurrency(absoluteGain), icon: Zap, sub: `+${Math.round((absoluteGain/totalInvestedValue)*100)}% ROI`, color: 'text-green-500' },
          { label: 'Annual Fees', value: formatCurrency(annualFees), icon: ShieldAlert, sub: 'Expense Ratio Drag', color: 'text-rose-500' },
        ].map((stat, i) => (
          <Card key={i} className="bg-secondary/5 border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={cn("h-4 w-4 opacity-40", stat.color)} />
              </div>
              <div className={cn("text-xl font-bold font-serif mb-1", stat.color)}>{stat.value}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-secondary/5">
            <CardHeader>
              <CardTitle className="text-lg">Scheme Allocation</CardTitle>
              <CardDescription>Invested vs Current Value per scheme</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={portfolio}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="scheme" 
                    type="category" 
                    width={120} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(val) => val.split(' ').slice(0, 2).join(' ')}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Legend />
                  <Bar dataKey="invested" name="Invested" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="current_value" name="Current" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Overlap Warning */}
          {overlapIssues.length > 0 && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-4">
                <BadgeAlert className="h-10 w-10 text-destructive shrink-0" />
                <div>
                  <h4 className="font-bold text-destructive">High Overlap Warning</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You have multiple funds in <span className="font-bold">{overlapIssues.join(', ')}</span>. 
                    This reduces diversification and increases risk. Consider merging them into top-performing funds.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rebalancing Plan */}
          <div className="space-y-4">
            <h3 className="text-xl font-serif font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Rebalancing Plan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysis?.rebalancing_plan.map((plan, i) => (
                <Card key={i} className="border bg-secondary/5 overflow-hidden">
                  <div className={cn(
                    "h-1 w-full",
                    plan.action === 'buy' ? 'bg-green-500' : plan.action === 'sell' ? 'bg-rose-500' : 'bg-amber-500'
                  )} />
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={plan.action === 'buy' ? 'outline' : 'destructive'} className={cn(
                        "capitalize",
                        plan.action === 'buy' && "border-green-500 text-green-500",
                        plan.action === 'switch' && "border-amber-500 text-amber-500"
                      )}>
                        {plan.action}
                      </Badge>
                      <span className="text-sm font-bold text-primary">{formatCurrency(plan.amount_inr)}</span>
                    </div>
                    <CardTitle className="text-sm mt-2">{plan.scheme}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground">{plan.reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <Card className="border-none bg-secondary/5 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Asset Allocation</CardTitle>
              <CardDescription>By category concentration</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis?.key_insights.map((insight, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    "{insight}"
                  </p>
                </div>
              ))}
            </CardContent>
            <CardFooter className="bg-primary/5 border-t pt-4">
              <p className="text-[10px] text-muted-foreground">
                <Info className="inline h-3 w-3 mr-1" />
                Risk Profile: <span className="font-bold text-primary uppercase">{analysis?.risk_assessment}</span>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
