import React, { useState } from 'react';
import { 
  Calculator, 
  ShieldCheck, 
  TrendingUp, 
  Briefcase, 
  Landmark, 
  Wallet,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
  Zap,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  Table
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { blink } from '@/blink/client';

interface TaxInputs {
  salary: number;
  hra: number;
  rent: number;
  isMetro: boolean;
  standardDeduction: number;
  section80c: number;
  section80d: number;
  nps: number;
  homeLoanInterest: number;
  otherDeductions: number;
}

interface TaxResult {
  taxableIncome: number;
  taxPayable: number;
  cess: number;
  totalTax: number;
  takeHome: number;
  slabs: { range: string, tax: number }[];
}

interface AnalysisData {
  recommended_regime: 'old' | 'new';
  tax_savings_inr: number;
  missed_deductions: { section: string, description: string, max_limit_inr: number, current_inr: number, potential_saving_inr: number }[];
  action_items: string[];
}

export default function TaxWizard() {
  const [inputs, setInputs] = useState<TaxInputs>({
    salary: 1500000,
    hra: 450000,
    rent: 300000,
    isMetro: true,
    standardDeduction: 75000,
    section80c: 150000,
    section80d: 25000,
    nps: 50000,
    homeLoanInterest: 200000,
    otherDeductions: 0
  });

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const calculateOldRegime = (): TaxResult => {
    // Basic HRA Calculation
    const rentPaidLess10PercentSalary = inputs.rent - (inputs.salary * 0.1);
    const hraActual = inputs.hra;
    const hraFiftyPercentSalary = inputs.isMetro ? inputs.salary * 0.5 : inputs.salary * 0.4;
    const hraExemption = Math.max(0, Math.min(hraActual, rentPaidLess10PercentSalary, hraFiftyPercentSalary));

    const totalDeductions = inputs.standardDeduction + 
                            hraExemption + 
                            Math.min(150000, inputs.section80c) + 
                            Math.min(25000, inputs.section80d) + 
                            Math.min(50000, inputs.nps) + 
                            Math.min(200000, inputs.homeLoanInterest) + 
                            inputs.otherDeductions;

    const taxableIncome = Math.max(0, inputs.salary - totalDeductions);
    
    // Tax Slabs (Old Regime)
    let tax = 0;
    const slabs = [];

    if (taxableIncome <= 250000) {
      tax = 0;
    } else if (taxableIncome <= 500000) {
      tax = (taxableIncome - 250000) * 0.05;
      slabs.push({ range: '₹2.5L - ₹5L', tax });
    } else if (taxableIncome <= 1000000) {
      tax = 12500 + (taxableIncome - 500000) * 0.20;
      slabs.push({ range: '₹2.5L - ₹5L', tax: 12500 });
      slabs.push({ range: '₹5L - ₹10L', tax: tax - 12500 });
    } else {
      tax = 112500 + (taxableIncome - 1000000) * 0.30;
      slabs.push({ range: '₹2.5L - ₹5L', tax: 12500 });
      slabs.push({ range: '₹5L - ₹10L', tax: 100000 });
      slabs.push({ range: '> ₹10L', tax: tax - 112500 });
    }

    // Rebate 87A for old regime
    if (taxableIncome <= 500000) tax = 0;

    const cess = tax * 0.04;
    const totalTax = tax + cess;

    return {
      taxableIncome,
      taxPayable: tax,
      cess,
      totalTax,
      takeHome: inputs.salary - totalTax,
      slabs
    };
  };

  const calculateNewRegime = (): TaxResult => {
    const standardDeduction = 75000; // New budget rule
    const taxableIncome = Math.max(0, inputs.salary - standardDeduction);
    
    // Tax Slabs (New Regime 2024-25)
    let tax = 0;
    const slabs = [];

    if (taxableIncome <= 300000) {
      tax = 0;
    } else if (taxableIncome <= 700000) {
      tax = (taxableIncome - 300000) * 0.05;
      slabs.push({ range: '₹3L - ₹7L', tax });
    } else if (taxableIncome <= 1000000) {
      tax = 20000 + (taxableIncome - 700000) * 0.10;
      slabs.push({ range: '₹3L - ₹7L', tax: 20000 });
      slabs.push({ range: '₹7L - ₹10L', tax: tax - 20000 });
    } else if (taxableIncome <= 1200000) {
      tax = 50000 + (taxableIncome - 1000000) * 0.15;
      slabs.push({ range: '₹3L - ₹7L', tax: 20000 });
      slabs.push({ range: '₹7L - ₹10L', tax: 30000 });
      slabs.push({ range: '₹10L - ₹12L', tax: tax - 50000 });
    } else if (taxableIncome <= 1500000) {
      tax = 80000 + (taxableIncome - 1200000) * 0.20;
      slabs.push({ range: '₹3L - ₹7L', tax: 20000 });
      slabs.push({ range: '₹7L - ₹10L', tax: 30000 });
      slabs.push({ range: '₹10L - ₹12L', tax: 30000 });
      slabs.push({ range: '₹12L - ₹15L', tax: tax - 80000 });
    } else {
      tax = 140000 + (taxableIncome - 1500000) * 0.30;
      slabs.push({ range: '₹3L - ₹7L', tax: 20000 });
      slabs.push({ range: '₹7L - ₹10L', tax: 30000 });
      slabs.push({ range: '₹10L - ₹12L', tax: 30000 });
      slabs.push({ range: '₹12L - ₹15L', tax: 60000 });
      slabs.push({ range: '> ₹15L', tax: tax - 140000 });
    }

    // Rebate 87A for new regime
    if (taxableIncome <= 700000) tax = 0;

    const cess = tax * 0.04;
    const totalTax = tax + cess;

    return {
      taxableIncome,
      taxPayable: tax,
      cess,
      totalTax,
      takeHome: inputs.salary - totalTax,
      slabs
    };
  };

  const analyzeTaxes = async () => {
    setLoading(true);
    try {
      const oldR = calculateOldRegime();
      const newR = calculateNewRegime();
      
      const prompt = `You are a CA (Chartered Accountant) assistant. Analyze this Indian taxpayer's profile and identify optimization opportunities.
      Salary: ₹${inputs.salary}
      Old Regime Total Tax: ₹${oldR.totalTax}
      New Regime Total Tax: ₹${newR.totalTax}
      Deductions: 80C=₹${inputs.section80c}, 80D=₹${inputs.section80d}, NPS=₹${inputs.nps}, HRA=₹${inputs.hra}, Home Loan=₹${inputs.homeLoanInterest}
      
      Return ONLY JSON with: recommended_regime ('old'|'new'), tax_savings_inr (amount saved by switching if applicable), missed_deductions (array of {section, description, max_limit_inr, current_inr, potential_saving_inr}), action_items (array of specific steps). Disclaimer must be appended.`;

      const response = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            recommended_regime: { type: 'string', enum: ['old', 'new'] },
            tax_savings_inr: { type: 'number' },
            missed_deductions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  section: { type: 'string' },
                  description: { type: 'string' },
                  max_limit_inr: { type: 'number' },
                  current_inr: { type: 'number' },
                  potential_saving_inr: { type: 'number' }
                }
              }
            },
            action_items: { type: 'array', items: { type: 'string' } }
          },
          required: ['recommended_regime', 'tax_savings_inr', 'missed_deductions', 'action_items']
        },
        model: 'google/gemini-3-flash'
      });

      setAnalysis(response.object as any);
      toast.success('Tax Wizard analysis complete!');
    } catch (error) {
      console.error('Error analyzing taxes:', error);
      toast.error('Failed to analyze taxes');
    } finally {
      setLoading(false);
    }
  };

  const oldResult = calculateOldRegime();
  const newResult = calculateNewRegime();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-4 animate-fade-in pb-12">
      {/* Input Section */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Tax Inputs
            </CardTitle>
            <CardDescription>Adjust your salary and deductions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Gross Annual Salary</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <input
                  type="number"
                  className="w-full rounded-md border bg-background px-8 py-2 text-sm focus:ring-1 focus:ring-primary"
                  value={inputs.salary}
                  onChange={(e) => setInputs({ ...inputs, salary: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">80C (PPF/ELSS)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input
                    type="number"
                    className="w-full rounded-md border bg-background px-8 py-2 text-xs"
                    value={inputs.section80c}
                    onChange={(e) => setInputs({ ...inputs, section80c: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">80D (Health)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input
                    type="number"
                    className="w-full rounded-md border bg-background px-8 py-2 text-xs"
                    value={inputs.section80d}
                    onChange={(e) => setInputs({ ...inputs, section80d: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Rent Paid (Annual)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <input
                  type="number"
                  className="w-full rounded-md border bg-background px-8 py-2 text-sm"
                  value={inputs.rent}
                  onChange={(e) => setInputs({ ...inputs, rent: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Home Loan Interest</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <input
                  type="number"
                  className="w-full rounded-md border bg-background px-8 py-2 text-sm"
                  value={inputs.homeLoanInterest}
                  onChange={(e) => setInputs({ ...inputs, homeLoanInterest: Number(e.target.value) })}
                />
              </div>
            </div>

            <Button className="w-full h-12 mt-4" onClick={analyzeTaxes} disabled={loading}>
              {loading ? 'Analyzing...' : 'Wizard Analysis'}
              <Zap className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-none">
          <CardContent className="p-4">
            <h4 className="font-bold flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary" />
              Quick Tip
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If your deductions exceed <span className="font-bold">₹3.75 Lakhs</span>, the Old Regime might still be better for you at a 15L salary level. 
              WealthLens Wizard will check all scenarios for you.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Section */}
      <div className="lg:col-span-2 space-y-8">
        {/* Comparison Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className={cn(
            "border shadow-lg",
            analysis?.recommended_regime === 'old' && "ring-2 ring-primary ring-offset-2"
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Old Regime</CardTitle>
              {analysis?.recommended_regime === 'old' && <Badge className="bg-primary">Recommended</Badge>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Total Tax Payable</span>
                  <span className="text-2xl font-bold font-serif">{formatCurrency(oldResult.totalTax)}</span>
                </div>
                <div className="space-y-2 pt-2 border-t text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxable Income</span>
                    <span>{formatCurrency(oldResult.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective Tax Rate</span>
                    <span>{((oldResult.totalTax / inputs.salary) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border shadow-lg",
            analysis?.recommended_regime === 'new' && "ring-2 ring-primary ring-offset-2"
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">New Regime</CardTitle>
              {analysis?.recommended_regime === 'new' && <Badge className="bg-primary">Recommended</Badge>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Total Tax Payable</span>
                  <span className="text-2xl font-bold font-serif">{formatCurrency(newResult.totalTax)}</span>
                </div>
                <div className="space-y-2 pt-2 border-t text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxable Income</span>
                    <span>{formatCurrency(newResult.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective Tax Rate</span>
                    <span>{((newResult.totalTax / inputs.salary) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        {analysis && (
          <div className="space-y-6 animate-fade-in">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  Wizard Optimization Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background border border-primary/20">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h5 className="font-bold text-lg">Potential Annual Savings</h5>
                    <p className="text-primary font-bold text-2xl">{formatCurrency(analysis.tax_savings_inr)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h6 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Optimization Action Items</h6>
                  <div className="grid gap-3">
                    {analysis.action_items.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h6 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Missed Deductions Checker</h6>
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="px-4 py-2 text-left font-bold">Section</th>
                          <th className="px-4 py-2 text-left font-bold">Status</th>
                          <th className="px-4 py-2 text-right font-bold">Potential Saving</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.missed_deductions.map((ded, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-4 py-3">
                              <p className="font-bold text-primary">{ded.section}</p>
                              <p className="text-xs text-muted-foreground">{ded.description}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={ded.current_inr > 0 ? 'secondary' : 'outline'}>
                                {ded.current_inr > 0 ? 'Invested' : 'Missed'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-green-500">
                              {formatCurrency(ded.potential_saving_inr)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
