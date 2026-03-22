'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtextText?: string;
  variant?: 'xirr' | 'current' | 'invested' | 'gain' | 'fees';
  loading?: boolean;
}

const StatCard = ({ label, value, subtextText, variant, loading }: StatCardProps) => {
  const getValueColor = () => {
    if (variant === 'xirr' || variant === 'gain') {
      return (typeof value === 'string' && (value.startsWith('+') || parseFloat(value) > 0)) ? 'text-[#1B5E20]' : 'text-[#B71C1C]';
    }
    return 'text-[#1C1A12]';
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#DDD8C0] rounded-2xl p-6 h-[120px] skeleton shadow-sm" />
    );
  }

  return (
    <div className="bg-white border border-[#DDD8C0] rounded-2xl p-6 shadow-sm hover:border-[#1B5E20]/30 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-[#7A7250] opacity-80">{label}</span>
        {variant === 'fees' && <div className="w-1.5 h-1.5 rounded-full bg-[#E65100]" />}
      </div>
      
      <div className={`${variant === 'xirr' ? 'font-mono' : 'font-display'} text-[24px] font-semibold leading-none ${getValueColor()}`}>
        {value}
      </div>

      {subtextText && (
        <div className="text-[11px] font-sans font-medium text-[#7A7250] mt-3 opacity-70">
          {subtextText}
        </div>
      )}
    </div>
  );
};

export default StatCard;
