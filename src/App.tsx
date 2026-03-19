import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { 
  LineChart, 
  Wallet, 
  ShieldCheck, 
  Heart, 
  Zap,
  TrendingUp,
  FileText,
  Users,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';
import { cn } from './lib/utils';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { useAuth } from './hooks/useAuth';

// Feature Components
import MoneyHealthScore from './features/health-score/MoneyHealthScore';
import PortfolioXRay from './features/portfolio-xray/PortfolioXRay';
import TaxWizard from './features/tax-wizard/TaxWizard';
import CouplePlanner from './features/couple-planner/CouplePlanner';

export default function App() {
  const { user, loading, login, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('health');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Scanning WealthLens...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 text-center animate-fade-in">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <TrendingUp className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">WealthLens</h1>
            <p className="text-lg text-muted-foreground">Your AI Money Mentor for Indian Investors</p>
          </div>

          <div className="rounded-2xl border bg-card p-8 shadow-xl shadow-black/5">
            <h2 className="text-xl font-semibold mb-6">Welcome Back</h2>
            <Button size="lg" className="w-full text-lg h-12" onClick={login}>
              Sign In to Continue
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8 opacity-60">
            <div className="flex flex-col items-center gap-2 text-sm">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Safe & Secure</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-sm">
              <Zap className="h-5 w-5 text-primary" />
              <span>AI Insights</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'health', label: 'Health Score', icon: Heart },
    { id: 'portfolio', label: 'Portfolio X-Ray', icon: Wallet },
    { id: 'tax', label: 'Tax Wizard', icon: FileText },
    { id: 'couple', label: 'Couple Planner', icon: Users },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background selection:bg-primary/20">
      <Toaster position="top-right" />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground hidden sm:block">WealthLens</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
              </div>
              <span className="text-sm font-medium">{user?.displayName || 'Investor'}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background md:hidden pt-20">
          <div className="flex flex-col gap-4 p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  className="w-full justify-start text-lg h-14"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Icon className="mr-3 h-6 w-6" />
                  {tab.label}
                </Button>
              );
            })}
            <div className="mt-8 pt-8 border-t flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user?.displayName || 'Investor'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex items-center justify-between overflow-x-auto pb-4 scrollbar-hide">
            <TabsList className="bg-secondary/30 p-1 border h-12">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex items-center gap-2 px-6 h-10 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="health" className="animate-fade-in focus-visible:outline-none">
            <MoneyHealthScore />
          </TabsContent>

          <TabsContent value="portfolio" className="animate-fade-in focus-visible:outline-none">
            <PortfolioXRay />
          </TabsContent>

          <TabsContent value="tax" className="animate-fade-in focus-visible:outline-none">
            <TaxWizard />
          </TabsContent>

          <TabsContent value="couple" className="animate-fade-in focus-visible:outline-none">
            <CouplePlanner />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer Disclaimer */}
      <footer className="w-full border-t bg-secondary/20 py-8 px-4 mt-auto">
        <div className="mx-auto max-w-7xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary opacity-50" />
            <span className="font-serif font-bold text-muted-foreground">WealthLens</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            WealthLens is for educational purposes only. Not SEBI-registered investment advice. 
            Financial decisions involve risk. Consult a qualified financial advisor before making any investment or tax-related decisions. 
            AI-generated insights should be verified with official documents.
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-4">
            Built for ET AI Hackathon 2026 • PS #9 — AI Money Mentor
          </p>
        </div>
      </footer>
    </div>
  );
}
