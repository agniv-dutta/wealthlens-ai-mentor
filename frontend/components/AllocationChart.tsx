'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AllocationChartProps {
  data: { name: string; value: number; weight_pct: number }[];
  totalValue: number;
  loading?: boolean;
}

const CHART_COLORS = ['#1B5E20', '#388E3C', '#689F38', '#AED581', '#8D6E63', '#D4A04A'];

const formatINRShort = (n: number) => {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  return '₹' + n.toLocaleString('en-IN');
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#4A4830"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-sans text-[11px] font-medium"
    >
      {`${name} ${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

const AllocationChart = ({ data, totalValue, loading }: AllocationChartProps) => {
  if (loading) {
    return (
      <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8 h-[500px] flex items-center justify-center">
        <div className="w-48 h-48 rounded-full border-4 border-[#F2EDD8] border-t-[#1B5E20] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#DDD8C0] rounded-2xl p-8 shadow-sm">
      <header className="mb-8">
        <h3 className="font-display text-2xl text-[#1C1A12] mb-1">Asset Allocation</h3>
        <p className="text-xs font-sans text-[#7A7250] tracking-tight">By category concentration</p>
      </header>

      <div className="h-[340px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              label={renderCustomLabel}
              labelLine={{ stroke: '#DDD8C0', strokeWidth: 1 }}
            >
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => formatINRShort(v)}
              contentStyle={{
                background: '#FDFAF4',
                border: '1px solid #DDD8C0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                fontFamily: 'DM Sans',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AllocationChart;
