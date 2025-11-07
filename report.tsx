import React from 'react';
import ReactDOM from 'react-dom/client';
import ReportPage from './components/ReportPage';
import type { FullDataSet, AttemptScores } from './types';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

let chartData: FullDataSet = {};
let scoreData: AttemptScores = {};
let error = '';

try {
  const chartDataString = localStorage.getItem('reportData_charts');
  const scoreDataString = localStorage.getItem('reportData_scores');

  if (chartDataString) {
    chartData = JSON.parse(chartDataString);
  } else {
    error = 'ไม่พบข้อมูลสำหรับสร้างกราฟ';
  }

  if (scoreDataString) {
    scoreData = JSON.parse(scoreDataString);
  } else {
    // This might be acceptable if there are no pre-test scores yet
    console.warn('Score data not found in localStorage.');
  }

} catch (e) {
  console.error("Failed to parse data from localStorage:", e);
  error = 'ข้อมูลที่จัดเก็บไว้เสียหาย ไม่สามารถแสดงรายงานได้';
}

const root = ReactDOM.createRoot(rootElement);

if (error) {
  root.render(
    <React.StrictMode>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
           <h1 className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h1>
           <p className="text-gray-700">{error}</p>
           <button 
             onClick={() => window.close()} 
             className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition-colors"
           >
             ปิดหน้านี้
           </button>
        </div>
      </div>
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <ReportPage chartData={chartData} scoreData={scoreData} />
    </React.StrictMode>
  );
}