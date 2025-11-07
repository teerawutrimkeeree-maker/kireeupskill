import React, { useMemo } from 'react';
import { SchoolLogoIcon } from './icons/SchoolLogoIcon';
import ReportChartCard from './ReportChartCard';
import ReportTable from './ReportTable';
import type { FullDataSet, ChartData } from '../types';
import { CHART_CONFIGS, PRE_TEST_GROUPS, GRADES_CONFIG } from '../constants';

interface ReportPageProps {
    chartData: FullDataSet;
    onClose: () => void;
}

const ReportPage: React.FC<ReportPageProps> = ({ chartData, onClose }) => {

    const preTestData = useMemo<ChartData>(() => {
        return PRE_TEST_GROUPS.map(group => {
            const [attempt1Name, attempt2Name] = group.attempts;
            const grade = group.grades[0];
            const gradeConfig = GRADES_CONFIG.find(g => g.grade === grade);

            if (!gradeConfig) {
                return { name: group.groupName, 'ครั้งที่ 1': 0, 'ครั้งที่ 2': 0 };
            }

            const gradeKey = `${grade.replace('.', '').toLowerCase()}Subjects` as keyof typeof chartData[string];

            const attempt1Data = chartData[attempt1Name]?.[gradeKey];
            const avg1 = (attempt1Data && attempt1Data.length > 0) ? (attempt1Data[0]['คะแนนเฉลี่ย'] as number) : 0;

            const attempt2Data = chartData[attempt2Name]?.[gradeKey];
            const avg2 = (attempt2Data && attempt2Data.length > 0) ? (attempt2Data[0]['คะแนนเฉลี่ย'] as number) : 0;

            return {
                name: group.groupName.replace(/ (ป\.\d|ม\.\d)/g, '\n($1)'), // Add line break for better display
                'ครั้งที่ 1': avg1,
                'ครั้งที่ 2': avg2,
            };
        });
    }, [chartData]);

    return (
        <div className="max-w-7xl mx-auto">
            <header className="bg-white shadow-lg rounded-2xl p-6 mb-8 text-center">
                <div className="flex items-center justify-center gap-4">
                    <SchoolLogoIcon className="h-16 w-16 text-warm-orange" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                            รายงานสรุปผลการทดสอบระดับชาติ
                        </h1>
                        <p className="text-sm md:text-base text-gray-500 mt-1">
                            โรงเรียนวัดคิรีวิหาร(สมเด็จพระวันรัต อุปถัมภ์)
                        </p>
                    </div>
                </div>
            </header>

            <main className="space-y-8">
                {/* Data Table Section */}
                <section className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-700 mb-6 text-center border-b pb-4">
                        ตารางสรุปผลคะแนนทั้งหมด
                    </h2>
                    <ReportTable chartData={chartData} />
                </section>

                {/* Dashboard Charts Section */}
                <section className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-700 mb-6 text-center border-b pb-4">
                        ภาพรวมผลการทดสอบ (O-NET / NT / RT)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {CHART_CONFIGS.map(({ id, title, dataKey, color }) => (
                            <ReportChartCard
                                key={id}
                                title={title}
                                chartData={chartData['ภาพรวม']?.[id as keyof typeof chartData['ภาพรวม']] as ChartData || []}
                                color={color}
                                dataKey={dataKey}
                            />
                        ))}
                    </div>
                </section>
                
                {/* Pre-Test Chart Section */}
                <section className="bg-white p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold text-gray-700 mb-6 text-center border-b pb-4">
                        ผลการทดสอบ Pre RT / Pre NT / Pre O-NET
                    </h2>
                    <div className="grid grid-cols-1">
                            <ReportChartCard
                            title="เปรียบเทียบคะแนน Pre-Test ครั้งที่ 1 และ ครั้งที่ 2"
                            chartData={preTestData}
                            color="#8b5cf6"
                            dataKey={['ครั้งที่ 1', 'ครั้งที่ 2']} // Pass multiple keys for comparison
                            view="bar"
                            isPreTest
                        />
                    </div>
                </section>
            </main>
            
            <footer className="text-center mt-8">
                    <button
                    onClick={onClose}
                    className="px-6 py-3 bg-warm-orange text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-all"
                >
                    กลับสู่แดชบอร์ด
                </button>
            </footer>
        </div>
    );
};

export default ReportPage;