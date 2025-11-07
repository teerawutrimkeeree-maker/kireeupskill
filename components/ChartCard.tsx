import React, { useState } from 'react';
import ScoreChart from './ScoreChart';
import { analyzeScores } from '../services/geminiService';
import type { ChartData } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { LineChartIcon } from './icons/LineChartIcon';

interface ChartCardProps {
  title: string;
  chartData: { [key: string]: ChartData };
  selectedAttempts: string[];
  chartColor: string;
  dataKey: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, chartData, selectedAttempts, chartColor, dataKey }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [chartView, setChartView] = useState<'bar' | 'line'>('bar');
  const [showTarget, setShowTarget] = useState(false);
  const [targetScore, setTargetScore] = useState(70);

  const handleAnalysis = async () => {
    setIsLoading(true);
    setError('');
    setAnalysis('');
    try {
      // Pass the entire chartData object for comparison
      const result = await analyzeScores(title, chartData, showTarget ? targetScore : undefined);
      setAnalysis(result);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transition-shadow hover:shadow-xl flex flex-col">
      <h3 
        className="self-start text-lg font-bold text-gray-800 mb-4 px-4 py-2 rounded-xl"
        style={{ backgroundColor: chartColor }}
      >
        {title}
      </h3>
      <div className="h-64 w-full mb-4">
        <ScoreChart 
          data={chartData} 
          dataKey={dataKey} 
          color={chartColor} 
          view={chartView}
          targetScore={showTarget ? targetScore : undefined}
          attempts={selectedAttempts}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setChartView('bar')} 
            className={`p-1.5 rounded-md transition-colors ${chartView === 'bar' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
            aria-label="Bar chart view"
          >
            <ChartBarIcon className="h-5 w-5 text-gray-600"/>
          </button>
           <button 
            onClick={() => setChartView('line')} 
            className={`p-1.5 rounded-md transition-colors ${chartView === 'line' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
            aria-label="Line chart view"
           >
            <LineChartIcon className="h-5 w-5 text-gray-600"/>
          </button>
        </div>

        <div className="flex items-center gap-2">
            <input 
                type="checkbox"
                id={`target-toggle-${title.replace(/\s/g, '-')}`}
                checked={showTarget}
                onChange={(e) => setShowTarget(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-warm-orange focus:ring-warm-orange"
            />
            <label htmlFor={`target-toggle-${title.replace(/\s/g, '-')}`} className="text-sm font-medium text-gray-700">แสดงเป้าหมาย</label>
            {showTarget && (
                 <input 
                    type="number"
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className="w-20 p-1 border border-gray-300 rounded-md text-sm focus:ring-warm-orange focus:border-warm-orange"
                    min="0"
                    max="100"
                    aria-label="Target score"
                 />
            )}
        </div>
      </div>

      <div className="mt-auto text-center">
        <button
          onClick={handleAnalysis}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-warm-orange text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="h-5 w-5"/>
          {isLoading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ด้วย AI'}
        </button>
      </div>
      {error && <p className="mt-4 text-center text-red-500">{error}</p>}
      {analysis && (
        <div className="mt-4 p-4 bg-light-cream/50 rounded-lg border border-light-cream">
          <h4 className="font-bold text-warm-orange mb-2">ผลการวิเคราะห์จาก AI</h4>
          <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: analysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartCard;