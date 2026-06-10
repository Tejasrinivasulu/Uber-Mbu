
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Driver } from '../types';

interface EarningsChartProps {
  data: Driver['weeklyEarnings'];
}

const EarningsChart: React.FC<EarningsChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid-color)" />
          <XAxis dataKey="day" tick={{ fill: 'var(--text-muted-color)', fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fill: 'var(--text-muted-color)', fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: 'var(--accent-bg-translucent)' }}
            formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Earnings']}
            contentStyle={{
              background: 'var(--chart-tooltip-bg)',
              border: '1px solid var(--chart-tooltip-border)',
              color: 'var(--text-color)',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="earnings" name="Earnings" fill="var(--chart-bar-fill)" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EarningsChart;
