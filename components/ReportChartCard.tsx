import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList, Legend } from 'recharts';
import type { ChartData } from '../types';
import { SERIES_COLORS } from '../constants';

interface ReportChartCardProps {
    title: string;
    chartData: ChartData;
    color: string;
    dataKey: string | string[];
    view?: 'bar' | 'line';
    isPreTest?: boolean;
}

const ReportChartCard: React.FC<ReportChartCardProps> = ({ title, chartData, color, dataKey, isPreTest = false }) => {
    
    const dataLabel = {
        position: 'top',
        formatter: (value: number) => value > 0 ? value.toFixed(2) : '',
        style: { fill: '#374151', fontSize: 12, fontWeight: 500 },
        offset: 5,
    };

    const legendFormatter = (value: string) => (
        <span style={{ color: '#4b5563', fontWeight: 600 }}>{value}</span>
    );
    
    const tooltipFormatter = (value: number, name: string) => [`${value.toFixed(2)} คะแนน`, name];

    const commonChartComponents = (
        <>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: isPreTest ? 10 : 12, whiteSpace: 'pre' }} interval={0} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
            <Tooltip
                contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                formatter={tooltipFormatter}
            />
            <Legend verticalAlign="bottom" height={36} formatter={legendFormatter} />
        </>
    );

    return (
        <div className="flex flex-col h-96">
            <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">
                {title}
            </h3>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                        {commonChartComponents}
                        {Array.isArray(dataKey) ? (
                            dataKey.map((key, index) => (
                                <Bar key={key} dataKey={key} name={key} fill={SERIES_COLORS[index % SERIES_COLORS.length]} radius={[4, 4, 0, 0]}>
                                     <LabelList dataKey={key} {...dataLabel} />
                                </Bar>
                            ))
                        ) : (
                            <Bar dataKey={dataKey} name="คะแนนเฉลี่ย" fill={color} radius={[4, 4, 0, 0]}>
                                <LabelList dataKey={dataKey} {...dataLabel} />
                            </Bar>
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ReportChartCard;