import React, { useState } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  Briefcase, 
  Landmark, 
  Wallet,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { blink } from '@/blink/client';

type Dimension = 'emergency_preparedness' | 'insurance_coverage' | 'investment_diversification' | 'debt_health' | 'tax_efficiency' | 'retirement_readiness';

interface ScoreData {
  emergency_preparedness: number;
  insurance_coverage: number;
  investment_diversification: number;
  debt_health: number;
  tax_efficiency: number;
  retirement_readiness: number;
  summary: string;
  top_action: string;
  overall: number;
}

const QUESTIONS = [
  {
    id: 'income',
    label: 'Monthly Income (₹)',
    type: 'number',
    placeholder: 'e.g. 100000',
    description: 'Enter your post-tax monthly income'
  },
  {
    id: 'expenses',
    label: 'Monthly Expenses (₹)',
    type: 'number',
    placeholder: 'e.g. 40000',
    description: 'Average monthly spends including rent/EMI'
  },
  {
    id: 'emergency',
    label: 'Do you have an emergency fund?',
    type: 'select',
    options: [
      { value: 'none', label: 'None', score: 0 },
      { value: 'less3', label: 'Less than 3 months', score: 30 },
      { value: '3to6', label: '3–6 months', score: 70 },
      { value: '6plus', label: '6+ months', score: 100 }
    ]
  },
  {
    id: 'insurance',
    label: 'Do you have term + health insurance?',
    type: 'select',
    options: [
      { value: 'neither', label: 'Neither', score: 0 },
      { value: 'one', label: 'Only one', score: 50 },
      { value: 'both', label: 'Both', score: 100 }
    ]
  },
  {
    id: 'investments',
    label: 'Where do you invest? (Select all that apply)',
    type: 'multi',
    options: [
      { value: 'mf', label: 'Mutual Funds' },
      { value: 'fd', label: 'Fixed Deposits' },
      { value: 'stocks', label: 'Stocks' },
      { value: 'nps', label: 'NPS' },
      { value: 'ppf', label: 'PPF' },
      { value: 'nothing', label: 'Nothing' }
    ]
  },
  {
    id: 'loans',
    label: 'Do you have any active loans?',
    type: 'multi',
    options: [
      { value: 'home', label: 'Home Loan' },
      { value: 'personal', label: 'Personal/Credit Card Loan' },
      { value: 'none', label: 'None' }
    ]
  }
];

export default function MoneyHealthScore() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScoreData | null>(null);

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      generateReport();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const updateAnswer = (id: string, value: any) => {
    setAnswers({ ...answers, [id]: value });
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const prompt = `You are a financial wellness advisor for Indian retail investors. 
      Given this user's financial profile:
      Income: ₹${answers.income}
      Expenses: ₹${answers.expenses}
      Emergency Fund: ${answers.emergency}
      Insurance: ${answers.insurance}
      Investments: ${Array.isArray(answers.investments) ? answers.investments.join(', ') : answers.investments}
      Loans: ${Array.isArray(answers.loans) ? answers.loans.join(', ') : answers.loans}
      
      Generate a Money Health Score from 0-100 for each of these 6 dimensions: emergency_preparedness, insurance_coverage, investment_diversification, debt_health, tax_efficiency, retirement_readiness. 
      Return ONLY a JSON object with these 6 keys and integer values 0-100, plus a 'summary' key with one sentence of overall assessment and a 'top_action' key with the single most important thing they should do. No markdown, no explanation, pure JSON.`;

      const response = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            emergency_preparedness: { type: 'integer', minimum: 0, maximum: 100 },
            insurance_coverage: { type: 'integer', minimum: 0, maximum: 100 },
            investment_diversification: { type: 'integer', minimum: 0, maximum: 100 },
            debt_health: { type: 'integer', minimum: 0, maximum: 100 },
            tax_efficiency: { type: 'integer', minimum: 0, maximum: 100 },
            retirement_readiness: { type: 'integer', minimum: 0, maximum: 100 },
            summary: { type: 'string' },
            top_action: { type: 'string' }
          },
          required: [
            'emergency_preparedness', 'insurance_coverage', 'investment_diversification', 
            'debt_health', 'tax_efficiency', 'retirement_readiness', 'summary', 'top_action'
          ]
        },
        model: 'google/gemini-3-flash'
      });

      const scoreData = response.object as any;
      const overall = Math.round(
        (scoreData.emergency_preparedness + scoreData.insurance_coverage + 
        scoreData.investment_diversification + scoreData.debt_health + 
        scoreData.tax_efficiency + scoreData.retirement_readiness) / 6
      );

      setResults({ ...scoreData, overall });
      toast.success('Your Financial Health Report is ready!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = results ? [
    { subject: 'Emergency', A: results.emergency_preparedness, fullMark: 100 },
    { subject: 'Insurance', A: results.insurance_coverage, fullMark: 100 },
    { subject: 'Investment', A: results.investment_diversification, fullMark: 100 },
    { subject: 'Debt', A: results.debt_health, fullMark: 100 },
    { subject: 'Tax', A: results.tax_efficiency, fullMark: 100 },
    { subject: 'Retirement', A: results.retirement_readiness, fullMark: 100 }
  ] : [];

  if (results) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4 animate-fade-in">
        <div className="space-y-6">
          <Card className="border-primary/20 bg-secondary/10 shadow-lg shadow-black/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="font-serif text-3xl">Money Health Score</CardTitle>
                <CardDescription>Based on your current financial snapshot</CardDescription>
              </div>
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-primary/10 border-4 border-primary/20">
                <span className="text-3xl font-bold text-primary">{results.overall}</span>
                <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Health</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Health"
                      dataKey="A"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
              <div className="flex items-center gap-3 text-sm">
                <Info className="h-5 w-5 text-primary" />
                <p className="font-medium text-foreground">{results.summary}</p>
              </div>
              <div className="w-full rounded-xl bg-primary/5 p-4 border border-primary/10">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Top Recommendation</p>
                <p className="text-sm font-medium">{results.top_action}</p>
              </div>
            </CardFooter>
          </Card>

          <Button variant="outline" className="w-full h-12" onClick={() => { setResults(null); setStep(0); setAnswers({}); }}>
            Recalculate Score
          </Button>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold font-serif mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Dimension Deep Dive
          </h3>
          
          <div className="grid gap-4">
            {[
              { id: 'emergency_preparedness', label: 'Emergency Fund', icon: ShieldCheck, color: 'text-blue-500' },
              { id: 'insurance_coverage', label: 'Insurance Coverage', icon: Briefcase, color: 'text-green-500' },
              { id: 'investment_diversification', label: 'Investment Mix', icon: TrendingUp, color: 'text-purple-500' },
              { id: 'debt_health', label: 'Debt Management', icon: Landmark, color: 'text-orange-500' },
              { id: 'tax_efficiency', label: 'Tax Efficiency', icon: Wallet, color: 'text-yellow-500' },
              { id: 'retirement_readiness', label: 'Retirement Readiness', icon: Activity, color: 'text-rose-500' }
            ].map((dim) => (
              <Card key={dim.id} className="border-none bg-secondary/10 shadow-sm overflow-hidden relative">
                <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-primary/50", results[dim.id as keyof ScoreData] as number < 50 ? 'bg-destructive' : 'bg-primary')} />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <dim.icon className={cn("h-4 w-4", dim.color)} />
                      <span className="text-sm font-medium">{dim.label}</span>
                    </div>
                    <span className="text-sm font-bold">{results[dim.id as keyof ScoreData] as number}%</span>
                  </div>
                  <Progress value={results[dim.id as keyof ScoreData] as number} className="h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = QUESTIONS[step];

  return (
    <div className="max-w-2xl mx-auto py-8 animate-fade-in">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-serif font-bold text-center">Let's check your money health</h2>
        <p className="text-muted-foreground text-center">Take a 2-minute pulse check to find your financial wellness score</p>
      </div>

      <div className="mb-6 flex justify-between text-xs font-medium text-muted-foreground">
        <span>Question {step + 1} of {QUESTIONS.length}</span>
        <span>{Math.round(((step + 1) / QUESTIONS.length) * 100)}% Complete</span>
      </div>
      <Progress value={((step + 1) / QUESTIONS.length) * 100} className="mb-8 h-2" />

      <Card className="border shadow-xl shadow-black/5 bg-secondary/5">
        <CardHeader>
          <CardTitle className="text-xl">{currentQuestion.label}</CardTitle>
          {currentQuestion.description && (
            <CardDescription>{currentQuestion.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.type === 'number' && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <input
                type="number"
                className="w-full rounded-lg border bg-background px-8 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder={currentQuestion.placeholder}
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
              />
            </div>
          )}

          {currentQuestion.type === 'select' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options?.map((opt) => (
                <Button
                  key={opt.value}
                  variant={answers[currentQuestion.id] === opt.value ? 'default' : 'outline'}
                  className={cn(
                    "h-16 justify-start px-4 text-sm font-medium transition-all hover:scale-[1.02]",
                    answers[currentQuestion.id] === opt.value && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  onClick={() => updateAnswer(currentQuestion.id, opt.value)}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border mr-3 shrink-0">
                    {answers[currentQuestion.id] === opt.value && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  {opt.label}
                </Button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'multi' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options?.map((opt) => {
                const isSelected = Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(opt.value);
                return (
                  <Button
                    key={opt.value}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      "h-16 justify-start px-4 text-sm font-medium transition-all hover:scale-[1.02]",
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                    onClick={() => {
                      const current = answers[currentQuestion.id] || [];
                      if (current.includes(opt.value)) {
                        updateAnswer(currentQuestion.id, current.filter((v: string) => v !== opt.value));
                      } else {
                        updateAnswer(currentQuestion.id, [...current, opt.value]);
                      }
                    }}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded border mr-3 shrink-0">
                      {isSelected && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
            Back
          </Button>
          <Button 
            className="px-8" 
            onClick={handleNext} 
            disabled={!answers[currentQuestion.id] || (Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].length === 0) || loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Processing...
              </div>
            ) : (
              <>
                {step === QUESTIONS.length - 1 ? 'Analyze Health' : 'Next Question'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
