'use client';

import React from 'react';

const tabs = [
  "Portfolio X-Ray",
  "Fund Intelligence",
  "Tax Wizard",
  "Couple's Planner",
  "Money Health Score"
];

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

const TabBar = ({ activeTab, onTabChange }: TabBarProps) => {
  return (
    <nav className="h-[48px] bg-sand-50 border-b border-sand-400 flex px-6 gap-6 sticky top-[64px] z-40">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`h-full px-6 flex items-center font-sans transition-all border-b-2 ${
            activeTab === tab
              ? 'border-forest-900 text-forest-900 font-medium'
              : 'border-transparent text-sand-500 hover:text-sand-400'
          }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

export default TabBar;
