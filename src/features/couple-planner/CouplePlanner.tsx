import React, { useState } from 'react';
import { 
  Users, 
  Heart, 
  TrendingUp, 
  ShieldCheck, 
  Target, 
  Zap, 
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  Table,
  Home,
  GraduationCap,
  Briefcase,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { blink } from '@/blink/client';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface PartnerData {
  name: string;
  age: number;
  income: number;
  expenses: number;
  investments: {
    mf: number;
    fd: number;
    ppf: number;
    nps: number;
    stocks: number;
  };
  rented: boolean;
  hra: number;
  rent: number;
}

interface SharedGoals {
  home: { amount: number, year: number };
  education: { amount: number, year: number };
  retirementAge: number;
}

interface AnalysisData {
  hra_recommendation: { who_should_claim: 'partner1' | 'partner2' | 'both', reason: string, annual_saving_inr: number };
  nps_recommendation: { partner1_additional_inr: number, partner2_additional_inr: number, tax_saving_inr: number, reason: string };
  sip_allocation: { goal: string, total_monthly_sip_inr: number, partner1_share_inr: number, partner2_share_inr: number, suggested_funds: string[], reason: string }[];
  insurance_gaps: { type: string, gap: string, action: string }[];
  combined_net_worth: { current_inr: number, projected_5yr_inr: number, projected_10yr_inr: number };
  key_wins: string[];
  disclaimer: string;
}

export default function CouplePlanner() {
  const [partner1, setPartner1] = useState<PartnerData>({
    name: 'Rahul',
    age: 30,
    income: 1800000,
    expenses: 40000,
    investments: { mf: 500000, fd: 200000, ppf: 150000, nps: 50000, stocks: 100000 },
    rented: true,
    hra: 450000,
    rent: 300000
  });

  const [partner2, setPartner2] = useState<PartnerData>({
    name: 'Priya',
    age: 28,
    income: 1200000,
    expenses: 30000,
    investments: { mf: 300000, fd: 100000, ppf: 150000, nps: 0, stocks: 50000 },
    rented: true,
    hra: 300000,
    rent: 300000
  });

  const [goals, setGoals] = useState<SharedGoals>({
    home: { amount: 8000000, year: 2029 },
    education: { amount: 4000000, year: 2038 },
    retirementAge: 55
  });

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const analyzeJointFinance = async () => {
    setLoading(true);
    try {
      const prompt = `You are India's top financial planner specializing in joint financial planning for couples. Optimize across both incomes for tax efficiency and wealth creation.
      Partner 1 (${partner1.name}, ${partner1.age}): Income ₹${partner1.income}, Expenses ₹${partner1.expenses}, Investments ₹${Object.values(partner1.investments).reduce((a, b) => a + b, 0)}
      Partner 2 (${partner2.name}, ${partner2.age}): Income ₹${partner2.income}, Expenses ₹${partner2.expenses}, Investments ₹${Object.values(partner2.investments).reduce((a, b) => a + b, 0)}
      Shared Goals: Home (₹${goals.home.amount} in ${goals.home.year}), Education (₹${goals.education.amount} in ${goals.education.year}), Retirement at ${goals.retirementAge}.
      
      Return ONLY JSON with these exact keys:
      - hra_recommendation: {who_should_claim: 'partner1'|'partner2'|'both', reason: string, annual_saving_inr: number}
      - nps_recommendation: {partner1_additional_inr: number, partner2_additional_inr: number, tax_saving_inr: number, reason: string}
      - sip_allocation: array of {goal: string, total_monthly_sip_inr: number, partner1_share_inr: number, partner2_share_inr: number, suggested_funds: array of strings, reason: string}
      - insurance_gaps: array of {type: string, gap: string, action: string}
      - combined_net_worth: {current_inr: number, projected_5yr_inr: number, projected_10yr_inr: number}
      - key_wins: array of 3 specific money-saving or wealth-building actions with INR impact
      - disclaimer: string`;

      const response = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            hra_recommendation: {
              type: 'object',
              properties: {
                who_should_claim: { type: 'string', enum: ['partner1', 'partner2', 'both'] },
                reason: { type: 'string' },
                annual_saving_inr: { type: 'number' }
              },
              required: ['who_should_claim', 'reason', 'annual_saving_inr']
            },
            nps_recommendation: {
              type: 'object',
              properties: {
                partner1_additional_inr: { type: 'number' },
                partner2_additional_inr: { type: 'number' },
                tax_saving_inr: { type: 'number' },
                reason: { type: 'string' }
              },
              required: ['partner1_additional_inr', 'partner2_additional_inr', 'tax_saving_inr', 'reason']
            },
            sip_allocation: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  goal: { type: 'string' },
                  total_monthly_sip_inr: { type: 'number' },
                  partner1_share_inr: { type: 'number' },
                  partner2_share_inr: { type: 'number' },
                  suggested_funds: { type: 'array', items: { type: 'string' } },
                  reason: { type: 'string' }
                },
                required: ['goal', 'total_monthly_sip_inr', 'partner1_share_inr', 'partner2_share_inr', 'suggested_funds', 'reason']
              }
            },
            insurance_gaps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  gap: { type: 'string' },
                  action: { type: 'string' }
                },
                required: ['type', 'gap', 'action']
              }
            },
            combined_net_worth: {
              type: 'object',
              properties: {
                current_inr: { type: 'number' },
                projected_5yr_inr: { type: 'number' },
                projected_10yr_inr: { type: 'number' }
              },
              required: ['current_inr', 'projected_5yr_inr', 'projected_10yr_inr']
            },
            key_wins: { type: 'array', items: { type: 'string' } },
            disclaimer: { type: 'string' }
          },
          required: ['hra_recommendation', 'nps_recommendation', 'sip_allocation', 'insurance_gaps', 'combined_net_worth', 'key_wins', 'disclaimer']
        },
        model: 'google/gemini-3-flash'
      });

      setAnalysis(response.object as any);
      toast.success('Couple Finance Plan Generated!');
    } catch (error) {
      console.error('Error generating couple plan:', error);
      toast.error('Failed to generate couple plan');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const chartData = analysis ? [
    { name: 'Current', value: analysis.combined_net_worth.current_inr },
    { name: '5 Years', value: analysis.combined_net_worth.projected_5yr_inr },
    { name: '10 Years', value: analysis.combined_net_worth.projected_10yr_inr }
  ] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-4 animate-fade-in pb-12">
      {/* Input Section */}
      <div className="lg:col-span-1 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          <Card className="border shadow-sm border-blue-500/20 bg-blue-500/5">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Partner 1 (You)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Income (Annual)</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₹</span>
                  <input
                    type="number"
                    className="w-full rounded border bg-background px-6 py-1 text-sm"
                    value={partner1.income}
                    onChange={(e) => setPartner1({ ...partner1, income: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Monthly Expenses</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₹</span>
                  <input
                    type="number"
                    className="w-full rounded border bg-background px-6 py-1 text-sm"
                    value={partner1.expenses}
                    onChange={(e) => setPartner1({ ...partner1, expenses: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm border-rose-500/20 bg-rose-500/5">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-rose-500" />
                Partner 2 (Spouse)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Income (Annual)</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₹</span>
                  <input
                    type="number"
                    className="w-full rounded border bg-background px-6 py-1 text-sm"
                    value={partner2.income}
                    onChange={(e) => setPartner2({ ...partner2, income: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Monthly Expenses</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₹</span>
                  <input
                    type="number"
                    className="w-full rounded border bg-background px-6 py-1 text-sm"
                    value={partner2.expenses}
                    onChange={(e) => setPartner2({ ...partner2, expenses: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Shared Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Home Purchase (Goal ₹)</label>
                <input
                  type="number"
                  className="w-full rounded border bg-background px-3 py-1 text-sm"
                  value={goals.home.amount}
                  onChange={(e) => setGoals({ ...goals, home: { ...goals.home, amount: Number(e.target.value) } })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Children's Education (₹)</label>
                <input
                  type="number"
                  className="w-full rounded border bg-background px-3 py-1 text-sm"
                  value={goals.education.amount}
                  onChange={(e) => setGoals({ ...goals, education: { ...goals.education, amount: Number(e.target.value) } })}
                />
              </div>
              <Button className="w-full h-10 mt-4" onClick={analyzeJointFinance} disabled={loading}>
                {loading ? 'Analyzing...' : 'Generate Joint Plan'}
                <Heart className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="lg:col-span-2 space-y-8">
        {!analysis ? (
          <div className="flex flex-col items-center justify-center h-[500px] border rounded-2xl bg-secondary/5 border-dashed">
            <Users className="h-16 w-16 text-primary/20 mb-4 animate-pulse" />
            <h3 className="text-xl font-serif font-bold text-muted-foreground">Connect your finances</h3>
            <p className="text-sm text-muted-foreground/60 max-w-xs text-center mt-2">
              Enter details for both partners to see a joint wealth creation strategy.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Projections Card */}
            <Card className="border-none shadow-sm bg-secondary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-serif">Combined Wealth Projection</CardTitle>
                  <Badge className="bg-primary px-3">{formatCurrency(analysis.combined_net_worth.current_inr)} Current NW</Badge>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/100000}L`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                      dot={{ r: 6, fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 8, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Strategy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    HRA Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Claim Strategy</span>
                    <Badge variant="outline" className="border-primary text-primary">
                      {analysis.hra_recommendation.who_should_claim === 'partner1' ? partner1.name : analysis.hra_recommendation.who_should_claim === 'partner2' ? partner2.name : 'Split Both'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Estimated Saving</span>
                    <span className="font-bold text-green-500">{formatCurrency(analysis.hra_recommendation.annual_saving_inr)} / yr</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    "{analysis.hra_recommendation.reason}"
                  </p>
                </CardContent>
              </Card>

              <Card className="border-accent/20 bg-accent/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    NPS Matching
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-2 bg-background rounded-lg border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{partner1.name}</p>
                      <p className="text-xs font-bold">₹{analysis.nps_recommendation.partner1_additional_inr}</p>
                    </div>
                    <div className="text-center p-2 bg-background rounded-lg border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{partner2.name}</p>
                      <p className="text-xs font-bold">₹{analysis.nps_recommendation.partner2_additional_inr}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Total Tax Saving</span>
                    <span className="font-bold text-green-500">{formatCurrency(analysis.nps_recommendation.tax_saving_inr)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    "{analysis.nps_recommendation.reason}"
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* SIP Goal Table */}
            <div className="space-y-4">
              <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Goal-Based SIP Allocation
              </h3>
              <div className="rounded-2xl border overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Goal</th>
                      <th className="px-4 py-3 text-right font-bold">Total SIP</th>
                      <th className="px-4 py-3 text-right font-bold">{partner1.name}'s Share</th>
                      <th className="px-4 py-3 text-right font-bold">{partner2.name}'s Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.sip_allocation.map((sip, i) => (
                      <tr key={i} className="border-t bg-background hover:bg-secondary/5 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              {sip.goal.toLowerCase().includes('home') ? <Home className="h-4 w-4 text-primary" /> : <GraduationCap className="h-4 w-4 text-primary" />}
                            </div>
                            <div>
                              <p className="font-bold">{sip.goal}</p>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{sip.suggested_funds[0]}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-bold">{formatCurrency(sip.total_monthly_sip_inr)}</td>
                        <td className="px-4 py-4 text-right text-blue-500 font-medium">{formatCurrency(sip.partner1_share_inr)}</td>
                        <td className="px-4 py-4 text-right text-rose-500 font-medium">{formatCurrency(sip.partner2_share_inr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Key Wins */}
            <Card className="border-none shadow-md bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Key Wealth Creation Wins
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {analysis.key_wins.map((win, i) => (
                  <div key={i} className="p-4 rounded-xl bg-background border flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp className="h-12 w-12" />
                    </div>
                    <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-xs font-medium leading-relaxed">{win}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <p className="text-[10px] text-center text-muted-foreground italic px-12">
              "{analysis.disclaimer}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
