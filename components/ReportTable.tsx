import React, { useMemo } from 'react';
import type { FullDataSet } from '../types';
import { GRADES_CONFIG, SCORE_ENTRY_ITEMS, PRE_TEST_GROUPS } from '../constants';

interface ReportTableProps {
    chartData: FullDataSet;
}

interface TableRow {
    grade: string;
    subject: string;
    [attempt: string]: string | number;
}

const ReportTable: React.FC<ReportTableProps> = ({ chartData }) => {

    const tableData = useMemo<TableRow[]>(() => {
        const rows: TableRow[] = [];
        const allAttempts = [...SCORE_ENTRY_ITEMS, ...PRE_TEST_GROUPS.flatMap(g => g.attempts)];

        GRADES_CONFIG.forEach(gradeConfig => {
            gradeConfig.subjects.forEach(subject => {
                const row: TableRow = {
                    grade: gradeConfig.grade,
                    subject: subject
                };
                
                allAttempts.forEach(attempt => {
                    const isPreTest = attempt.startsWith('Pre');
                    const preTestGroup = isPreTest ? PRE_TEST_GROUPS.find(g => g.attempts.includes(attempt)) : null;
                    
                    if (isPreTest && !preTestGroup?.grades.includes(gradeConfig.grade)) {
                        row[attempt] = 'N/A'; // Not applicable for this grade
                    } else {
                        const gradeKey = `${gradeConfig.grade.replace('.', '').toLowerCase()}Subjects`;
                        const subjectData = chartData[attempt]?.[gradeKey as keyof typeof chartData[string]] || [];
                        const scoreData = subjectData.find(d => d.name === subject);
                        const score = scoreData ? (scoreData['คะแนนเฉลี่ย'] as number) : 0;
                        row[attempt] = score > 0 ? score.toFixed(2) : '-';
                    }
                });

                rows.push(row);
            });
        });
        return rows;
    }, [chartData]);

    const attemptHeaders = [...SCORE_ENTRY_ITEMS, ...PRE_TEST_GROUPS.flatMap(g => g.attempts)];
    
    // Group Pre-Test headers for better display
    const groupedHeaders: { name: string, colSpan: number, isPreTest: boolean }[] = [];
    SCORE_ENTRY_ITEMS.forEach(item => groupedHeaders.push({ name: item, colSpan: 1, isPreTest: false }));
    PRE_TEST_GROUPS.forEach(group => groupedHeaders.push({ name: group.groupName, colSpan: 2, isPreTest: true }));

    const subHeaders: string[] = [];
    // Only Pre-Test groups have sub-headers
    PRE_TEST_GROUPS.forEach(() => {
        subHeaders.push('ครั้งที่ 1');
        subHeaders.push('ครั้งที่ 2');
    });

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
                <thead className="bg-gray-100 text-sm">
                    <tr>
                        <th rowSpan={2} className="px-2 py-3 font-semibold text-gray-700 border border-gray-300 align-middle">ระดับชั้น</th>
                        <th rowSpan={2} className="px-2 py-3 font-semibold text-gray-700 border border-gray-300 align-middle">รายวิชา</th>
                        {groupedHeaders.map((header, index) => (
                             <th 
                                key={index} 
                                colSpan={header.colSpan} 
                                rowSpan={header.isPreTest ? 1 : 2}
                                className={`px-2 py-2 font-semibold text-gray-700 border border-gray-300 ${header.isPreTest ? 'bg-purple-100' : 'bg-blue-100 align-middle'}`}
                            >
                                {header.name}
                            </th>
                        ))}
                    </tr>
                     <tr>
                        {/* Render sub-headers only for Pre-Test columns */}
                        {PRE_TEST_GROUPS.map((group) => (
                            <React.Fragment key={group.groupName}>
                                <th className="px-2 py-2 font-medium text-gray-600 border border-gray-300 bg-gray-50">ครั้งที่ 1</th>
                                <th className="px-2 py-2 font-medium text-gray-600 border border-gray-300 bg-gray-50">ครั้งที่ 2</th>
                            </React.Fragment>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-center text-sm">
                    {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                            <td className="px-2 py-2 border border-gray-300 font-medium bg-gray-50">{row.grade}</td>
                            <td className="px-2 py-2 border border-gray-300 text-left">{row.subject}</td>
                            {attemptHeaders.map((header, colIndex) => (
                                <td key={colIndex} className={`px-2 py-2 border border-gray-300 ${row[header] === 'N/A' ? 'bg-gray-200 text-gray-400' : ''}`}>
                                    {row[header]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReportTable;