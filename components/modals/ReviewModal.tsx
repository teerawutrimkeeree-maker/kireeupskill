import React, { useState, useEffect } from 'react';
import type { StudentData } from '../../types';
import { GRADES_CONFIG } from '../../constants';

interface ReviewModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: (students: StudentData[]) => void;
    initialStudents: StudentData[];
    reviewQueueInfo?: {
        current: number;
        total: number;
        fileName: string;
    };
    confirmButtonText?: string;
}

const CLASSROOMS = ['1', '2'];

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onCancel, onConfirm, initialStudents, reviewQueueInfo, confirmButtonText }) => {
    const [students, setStudents] = useState<StudentData[]>([]);

    useEffect(() => {
        if (isOpen) {
            setStudents(JSON.parse(JSON.stringify(initialStudents))); // Deep copy
        }
    }, [isOpen, initialStudents]);

    if (!isOpen) return null;

    const handleStudentChange = (id: number, field: keyof Omit<StudentData, 'id'>, value: string) => {
        setStudents(prev => 
            prev.map(student => 
                student.id === id ? { ...student, [field]: value } : student
            )
        );
    };
    
    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col" role="dialog" aria-modal="true">
            <header className="flex-shrink-0 bg-white shadow-md p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center min-w-0">
                    {reviewQueueInfo
                        ? <>
                            <span className="flex-shrink-0">ตรวจสอบไฟล์ ({reviewQueueInfo.current}/{reviewQueueInfo.total}):</span>
                            <span className="ml-2 font-normal text-gray-600 text-base truncate" title={reviewQueueInfo.fileName}>{reviewQueueInfo.fileName}</span>
                          </>
                        : 'ตรวจสอบและแก้ไขข้อมูลนักเรียน'
                    }
                </h2>
                <div className="space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={() => onConfirm(students)}
                        className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-warm-orange hover:bg-opacity-90 transition-colors"
                    >
                        {confirmButtonText || 'ยืนยันและนำเข้าข้อมูล'}
                    </button>
                </div>
            </header>

            <main className="flex-grow p-4 sm:p-6 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 w-20 text-center">เลขที่</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">ชื่อ - สกุล</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 w-32 text-center">ระดับชั้น</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 w-32 text-center">ห้องเรียน</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td className="px-2 py-1 text-center">
                                            <input
                                                type="text"
                                                value={student.no}
                                                onChange={(e) => handleStudentChange(student.id, 'no', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-md text-center focus:ring-warm-orange focus:border-warm-orange"
                                            />
                                        </td>
                                        <td className="px-2 py-1">
                                            <input
                                                type="text"
                                                value={student.name}
                                                onChange={(e) => handleStudentChange(student.id, 'name', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-warm-orange focus:border-warm-orange"
                                            />
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            <select
                                                value={student.grade}
                                                onChange={(e) => handleStudentChange(student.id, 'grade', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-warm-orange focus:border-warm-orange"
                                            >
                                                <option value="" disabled>--เลือกระดับชั้น--</option>
                                                {GRADES_CONFIG.map(g => <option key={g.grade} value={g.grade}>{g.grade}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                             <select
                                                value={student.classroom}
                                                onChange={(e) => handleStudentChange(student.id, 'classroom', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-warm-orange focus:border-warm-orange"
                                            >
                                                <option value="" disabled>--เลือกห้อง--</option>
                                                {CLASSROOMS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                 {students.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p>ไม่มีข้อมูลนักเรียนที่จะแสดง</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReviewModal;