import React from 'react';
import type { StudentData, GradeData } from '../types';
import { GRADES_CONFIG } from '../constants';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { UploadIcon } from './icons/UploadIcon';
import { InfoIcon } from './icons/InfoIcon';

const ALL_BANNERS = [...GRADES_CONFIG].sort((a,b) => {
    const levelOrder: { [key: string]: number } = { 'ป': 1, 'ม': 2 };
    
    const [levelA, numA] = a.grade.split('.');
    const [levelB, numB] = b.grade.split('.');

    const orderA = levelOrder[levelA];
    const orderB = levelOrder[levelB];
    
    // Compare education levels (Primary vs. Secondary)
    if (orderA && orderB && orderA !== orderB) {
        return orderA - orderB;
    }

    // If levels are the same, compare grade numbers
    return parseInt(numA, 10) - parseInt(numB, 10);
});


interface StudentListBannersProps {
    studentsByGrade: { [key: string]: GradeData };
    onBannerClick: (grade: string) => void;
}

const formatTimestamp = (isoString: string | null): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const datePart = date.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const timePart = date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).replace(':', '.');
    return `${datePart} เวลา ${timePart} น. ปรับปรุงข้อมูลล่าสุด`;
};


const StudentListBanners: React.FC<StudentListBannersProps> = ({ studentsByGrade, onBannerClick }) => {
    const academicYear = "2568";
    
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
            <h2 className="text-xl font-bold text-gray-700 mb-1">เรียกดูข้อมูลรายชื่อนักเรียน</h2>
            <p className="text-gray-500 text-sm mb-4">ปีการศึกษา {academicYear}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {ALL_BANNERS.map(({ grade, color, hoverColor, textColor }) => {
                    const gradeInfo = studentsByGrade[grade];
                    const gradeData = gradeInfo?.data || [];
                    const lastUpdated = gradeInfo?.lastUpdated || null;
                    const gradesWithClassrooms = ['ม.3', 'ม.6'];
                    const isMultiClass = gradesWithClassrooms.includes(grade);

                    let status: 'NONE' | 'PARTIAL' | 'COMPLETE' = 'NONE';
                    let classroomStatus: { [key: string]: boolean } = {};

                    if (isMultiClass) {
                        const classroomsWithData = new Set(gradeData.map(s => s.classroom));
                        const hasRoom1 = classroomsWithData.has('1');
                        const hasRoom2 = classroomsWithData.has('2');
                        classroomStatus = { '1': hasRoom1, '2': hasRoom2 };
                        
                        if (hasRoom1 && hasRoom2) {
                            status = 'COMPLETE';
                        } else if (hasRoom1 || hasRoom2) {
                            status = 'PARTIAL';
                        }
                    } else {
                        if (gradeData.length > 0) {
                            status = 'COMPLETE';
                        }
                    }

                    const baseButtonClasses = "group px-4 py-3 rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center justify-center text-center";
                    
                    let statusClasses: string;
                    let statusTextColor: string;
                    let StatusIcon: React.FC<React.SVGProps<SVGSVGElement>>;
                    let statusText: string;

                    switch(status) {
                        case 'COMPLETE':
                            statusClasses = `${color} ${hoverColor}`;
                            statusTextColor = textColor;
                            StatusIcon = CheckCircleIcon;
                            statusText = "มีข้อมูลแล้ว";
                            break;
                        case 'PARTIAL':
                            statusClasses = "bg-orange-100 hover:bg-orange-200";
                            statusTextColor = 'text-orange-800';
                            StatusIcon = InfoIcon;
                            statusText = "มีข้อมูลบางส่วน";
                            break;
                        default: // NONE
                            statusClasses = "bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300";
                            statusTextColor = 'text-gray-500';
                            StatusIcon = UploadIcon;
                            statusText = "รอข้อมูล";
                            break;
                    }

                    return (
                        <button
                            key={grade}
                            onClick={() => onBannerClick(grade)}
                            className={`${baseButtonClasses} ${statusClasses}`}
                        >
                           <span className={`text-2xl font-bold ${statusTextColor}`}>{grade}</span>
                           <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${
                                status === 'COMPLETE' ? 'text-green-700' : 
                                status === 'PARTIAL' ? 'text-orange-700' : 'text-gray-500'
                           }`}>
                               <StatusIcon className="h-4 w-4" />
                               <span>{statusText}</span>
                           </div>
                           {isMultiClass && status !== 'NONE' && (
                               <div className={`mt-2 text-xs font-semibold flex gap-2 ${statusTextColor}`}>
                                   <span className={classroomStatus['1'] ? 'text-green-700' : 'text-red-500'}>ห้อง 1: {classroomStatus['1'] ? '✔️' : '❌'}</span>
                                   <span className={classroomStatus['2'] ? 'text-green-700' : 'text-red-500'}>ห้อง 2: {classroomStatus['2'] ? '✔️' : '❌'}</span>
                               </div>
                           )}
                            {lastUpdated && status !== 'NONE' && (
                                <div className="mt-2 text-[10px] text-gray-400 font-normal leading-tight">
                                    {formatTimestamp(lastUpdated)}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default StudentListBanners;