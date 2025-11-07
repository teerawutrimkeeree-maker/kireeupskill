import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, LabelList, Legend } from 'recharts';
import type { ChartData } from '../types';
import { SERIES_COLORS } from '../constants';


interface ScoreChartProps {
  data: { [key: string]: ChartData };
  dataKey: string;
  color: string;
  view: 'bar' | 'line';
  targetScore?: number;
  attempts: string[];
}

const darkenColor = (hex: string, percent: number): string => {
  hex = hex.replace(/^\s*#|\s*$/g, '');
  if (hex.length === 3) {
    hex = hex.replace(/(.)/g, '$1$1');
  }
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const calculatedR = Math.max(0, Math.floor(r * (100 - percent) / 100));
  const calculatedG = Math.max(0, Math.floor(g * (100 - percent) / 100));
  const calculatedB = Math.max(0, Math.floor(b * (100 - percent) / 100));

  const toHex = (c: number) => ('00' + c.toString(16)).slice(-2);

  return `#${toHex(calculatedR)}${toHex(calculatedG)}${toHex(calculatedB)}`;
};

const ScoreChart: React.FC<ScoreChartProps> = ({ data, dataKey, color, view, targetScore, attempts }) => {

  const processedData = useMemo(() => {
    if (!attempts || attempts.length === 0 || !data) return [];
    
    // Get all unique names (subjects/grades) from all selected attempts
    const allNames = new Set<string>();
    attempts.forEach(attempt => {
      if(data[attempt]) {
        data[attempt].forEach(item => allNames.add(item.name));
      }
    });

    const nameArray = Array.from(allNames);

    // Create a new data structure for recharts
    return nameArray.map(name => {
      const dataPoint: { [key: string]: string | number } = { name };
      attempts.forEach(attempt => {
        const attemptData = data[attempt]?.find(item => item.name === name);
        // Use attempt name as the key, recharts will use this for Bars/Lines
        dataPoint[attempt] = attemptData ? attemptData[dataKey] : 0;
      });
      return dataPoint;
    });
  }, [data, attempts, dataKey]);

  const isSingleView = attempts.length === 1;
  const singleViewAttemptName = attempts[0];

  const dataLabel = {
    position: 'top',
    formatter: (value: number) => value.toFixed(2),
    style: { fill: '#374151', fontSize: 12, fontWeight: 500 },
    offset: 5,
  };

  const legendFormatter = (value: string, entry: any) => {
    const legendColor = isSingleView ? darkenColor(entry.color, 50) : entry.color;
    return <span style={{ color: legendColor, fontWeight: 600 }}>{value}</span>;
  };
  
  const tooltipFormatter = (value: number, name: string) => [`${value.toFixed(2)} คะแนน`, name];

  const commonChartComponents = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
      <Tooltip
        contentStyle={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
        labelStyle={{ color: '#1f2937', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}
        itemStyle={{ fontWeight: '500' }}
        cursor={{ fill: 'rgba(200, 200, 200, 0.1)' }}
        formatter={tooltipFormatter}
      />
      <Legend verticalAlign="bottom" height={36} formatter={legendFormatter} />
      {targetScore && (
        <ReferenceLine 
            y={targetScore} 
            label={{ value: `เป้าหมาย: ${targetScore}`, position: 'insideTopRight', fill: '#dc2626', fontSize: 12 }} 
            stroke="#dc2626" 
            strokeDasharray="4 4" 
        />
      )}
    </>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      {view === 'bar' ? (
        <BarChart data={processedData} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
          {commonChartComponents}
          {isSingleView ? (
              <Bar dataKey={singleViewAttemptName} name="คะแนนเฉลี่ย" fill={color} radius={[4, 4, 0, 0]} barSize={40}>
                 <LabelList dataKey={singleViewAttemptName} {...dataLabel} />
              </Bar>
          ) : (
            attempts.map((attempt, index) => (
                <Bar key={attempt} dataKey={attempt} name={attempt} fill={SERIES_COLORS[index % SERIES_COLORS.length]} radius={[4, 4, 0, 0]} />
            ))
          )}
        </BarChart>
      ) : (
        <LineChart data={processedData} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
          {commonChartComponents}
          {isSingleView ? (
            <Line type="monotone" dataKey={singleViewAttemptName} name="คะแนนเฉลี่ย" stroke={color} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }}>
                 <LabelList dataKey={singleViewAttemptName} {...dataLabel} />
            </Line>
          ) : (
             attempts.map((attempt, index) => (
                <Line key={attempt} type="monotone" dataKey={attempt} name={attempt} stroke={SERIES_COLORS[index % SERIES_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
             ))
          )}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};

export default ScoreChart;