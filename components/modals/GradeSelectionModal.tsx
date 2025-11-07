
import React from 'react';
import { GRADES_CONFIG, SCORE_ENTRY_GROUPS } from '../../constants';
import { XCircleIcon } from '../icons/XCircleIcon';

interface GradeSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selection: { grade: string; classroom: string | null }) => void;
    attemptName: string;
}

const GradeSelectionModal: React.FC<GradeSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    attemptName
}) => {
    if (!isOpen) return null;
    
    // Find which grades are relevant for the selected attempt
    const relevantGrades = SCORE_ENTRY_GROUPS.find(group => group.attempts.includes(attemptName))?.grades || [];
    
    // Filter the main GRADES_CONFIG to only show relevant grades
    const relevantGradeConfigs = GRADES_CONFIG.filter(config => relevantGrades.includes(config.grade));

    const gradesWithClassrooms = ['ม.3', 'ม.6'];

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all animate-in zoom-in-95">
                 <header className="flex-shrink-0 p-4 flex justify-between items-center border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">บันทึกคะแนน: <span className="text-warm-orange">{attemptName}</span></h2>
                        <p className="text-sm text-gray-500">กรุณาเลือกระดับชั้นและห้องเรียนที่ต้องการบันทึก</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                        <XCircleIcon className="h-7 w-7"/>
                    </button>
                </header>
                <main className="p-6 sm:p-8 space-y-6">
                    {relevantGradeConfigs.length > 0 ? relevantGradeConfigs.map(config => (
                        <div key={config.grade} className={`p-4 rounded-lg border ${config.color.replace('bg-', 'border-')}`}>
                            <h3 className={`text-lg font-semibold ${config.textColor}`}>{config.name}</h3>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {gradesWithClassrooms.includes(config.grade) ? (
                                    <>
                                        <button 
                                            onClick={() => onSelect({ grade: config.grade, classroom: '1' })}
                                            className={`w-full text-center px-4 py-3 font-semibold rounded-lg shadow-sm transition-transform transform hover:scale-105 ${config.color} ${config.hoverColor} ${config.textColor}`}
                                        >
                                            ห้อง 1
                                        </button>
                                        <button 
                                            onClick={() => onSelect({ grade: config.grade, classroom: '2' })}
                                            className={`w-full text-center px-4 py-3 font-semibold rounded-lg shadow-sm transition-transform transform hover:scale-105 ${config.color} ${config.hoverColor} ${config.textColor}`}
                                        >
                                            ห้อง 2
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => onSelect({ grade: config.grade, classroom: null })}
                                        className={`sm:col-span-2 w-full text-center px-4 py-3 font-semibold rounded-lg shadow-sm transition-transform transform hover:scale-105 ${config.color} ${config.hoverColor} ${config.textColor}`}
                                    >
                                        บันทึกคะแนน {config.grade}
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500">ไม่มีระดับชั้นที่เกี่ยวข้องกับการทดสอบนี้</p>
                    )}
                </main>
            </div>
        </div>
    );
};

export default GradeSelectionModal;