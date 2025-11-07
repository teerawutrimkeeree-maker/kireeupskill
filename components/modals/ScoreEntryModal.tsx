import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { StudentData, GradeScores, GradeData, AttemptScores } from '../../types';
import { GRADES_CONFIG, PRE_TEST_GROUPS, PRE_TEST_OVERALL_SCORE_KEY } from '../../constants';
import { SaveIcon } from '../icons/SaveIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { UsersGroupIcon } from '../icons/UsersGroupIcon';
import { DocumentDuplicateIcon } from '../icons/DocumentDuplicateIcon';
import { DocumentArrowDownIcon } from '../icons/DocumentArrowDownIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { UsersIcon } from '../icons/UsersIcon';


declare const XLSX: any;
declare const jspdf: any;

interface ScoreEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (scores: AttemptScores) => void;
    attemptName: string | null;
    preTestGroupName: string | null;
    selectedGrade?: string | null;
    selectedClassroom?: string | null;
    studentsByGrade: { [key: string]: GradeData };
    initialScores: AttemptScores;
}

const PASSING_SCORE = 50;


// --- Helper Components & Functions ---

const DevelopmentScore: React.FC<{ score1: number | null, score2: number | null }> = ({ score1, score2 }) => {
    if (score1 === null || score2 === null || isNaN(score1) || isNaN(score2)) {
        return <span className="text-gray-500">-</span>;
    }
    const diff = score2 - score1;
    const color = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-700';
    const sign = diff > 0 ? '+' : '';
    return <span className={`font-bold ${color}`}>{`${sign}${diff.toFixed(2)}`}</span>;
};

const AverageScore: React.FC<{ scores: (number | null)[] }> = ({ scores }) => {
    const validScores = scores.filter((s): s is number => s !== null && !isNaN(s));
    if (validScores.length === 0) {
        return <span className="text-gray-500">-</span>;
    }
    const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
    return <span>{avg.toFixed(2)}</span>;
};


const getStatus = (score: number | null | undefined): { text: string; color: string } => {
    if (score === null || score === undefined || isNaN(score)) {
        return { text: '-', color: 'text-gray-500' };
    }
    if (score >= PASSING_SCORE) {
        return { text: 'ผ่าน', color: 'text-green-600 font-semibold' };
    }
    return { text: 'ไม่ผ่าน', color: 'text-red-600 font-semibold' };
};

const calculateAverage = (scores: { [subject: string]: number | null }): string => {
    const validScores = Object.values(scores).filter((s): s is number => typeof s === 'number' && !isNaN(s));
    if (validScores.length === 0) {
        return '-';
    }
    const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
    return avg.toFixed(2);
};

// --- PDF/Excel Generation ---
const generateStudentPdfPage = (doc: any, student: StudentData, studentScores: { [subject: string]: number | null }, subjects: string[], attemptName: string) => {
    const PRIMARY_COLOR = '#EDA35A'; 
    const PRIMARY_COLOR_LIGHT = '#FEE8D9';
    const TEXT_COLOR_DARK = '#1F2937';
    const TEXT_COLOR_MEDIUM = '#4B5563';
    const TEXT_COLOR_LIGHT = '#FFFFFF';
    const BORDER_COLOR = '#E5E7EB';
    const SUCCESS_COLOR = '#10B981';
    const FAIL_COLOR = '#EF4444';

    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
    const MARGIN = 15;
    let currentY = 0;

    doc.setFont('THSarabun', 'normal');
    doc.setFillColor(PRIMARY_COLOR);
    doc.rect(0, 0, PAGE_WIDTH, 25, 'F');
    
    doc.setFontSize(16);
    doc.setFont('THSarabun', 'bold');
    doc.setTextColor(TEXT_COLOR_LIGHT);
    doc.text('โรงเรียนวัดคิรีวิหาร (สมเด็จพระวันรัต อุปถัมภ์)', MARGIN, 12);
    
    doc.setFontSize(14);
    doc.setFont('THSarabun', 'normal');
    doc.text('ใบรายงานผลการทดสอบ', PAGE_WIDTH - MARGIN, 12, { align: 'right' });
    currentY = 25;

    currentY += 20;
    doc.setFontSize(22);
    doc.setFont('THSarabun', 'bold');
    doc.setTextColor(TEXT_COLOR_DARK);
    doc.text(`ผลการทดสอบ: ${attemptName}`, PAGE_WIDTH / 2, currentY, { align: 'center' });
    
    currentY += 15;
    doc.setDrawColor(BORDER_COLOR);
    doc.setFillColor(PRIMARY_COLOR_LIGHT);
    doc.roundedRect(MARGIN, currentY, PAGE_WIDTH - MARGIN * 2, 25, 3, 3, 'FD');
    
    doc.setFontSize(14);
    doc.setTextColor(TEXT_COLOR_DARK);
    const studentInfoY = currentY + 8;
    const col1X = MARGIN + 8;
    
    doc.setFont('THSarabun', 'bold');
    doc.text('ชื่อ-สกุล:', col1X, studentInfoY);
    doc.text('ระดับชั้น:', col1X, studentInfoY + 9);
    
    doc.setFont('THSarabun', 'normal');
    doc.text(student.name, col1X + 22, studentInfoY);
    doc.text(`${student.grade}${student.classroom ? ` / ${student.classroom}` : ''}`, col1X + 22, studentInfoY + 9);

    doc.setFont('THSarabun', 'bold');
    doc.text('เลขที่:', PAGE_WIDTH / 2, studentInfoY);
    doc.text('ปีการศึกษา:', PAGE_WIDTH / 2, studentInfoY + 9);
    
    doc.setFont('THSarabun', 'normal');
    doc.text(student.no, PAGE_WIDTH / 2 + 15, studentInfoY);
    doc.text('2568', PAGE_WIDTH / 2 + 20, studentInfoY + 9);
    currentY += 35;

    const averageScore = parseFloat(calculateAverage(studentScores));
    const overallStatus = getStatus(isNaN(averageScore) ? null : averageScore);
    
    const tableBody = subjects.map(subject => {
        const score = studentScores[subject];
        const status = getStatus(score);
        return [
            subject,
            score?.toFixed(2) ?? '-',
            { content: status.text, styles: { textColor: status.text === 'ผ่าน' ? SUCCESS_COLOR : FAIL_COLOR } }
        ];
    });

    (doc as any).autoTable({
        startY: currentY,
        head: [['รายวิชา', 'คะแนนที่ได้ (100)', 'ผลการประเมิน']],
        body: tableBody,
        foot: [[
            { content: 'คะแนนเฉลี่ย', styles: { fontStyle: 'bold', halign: 'right' } },
            { content: isNaN(averageScore) ? '-' : averageScore.toFixed(2), styles: { fontStyle: 'bold' } },
            { content: isNaN(averageScore) ? '-' : overallStatus.text, styles: { fontStyle: 'bold', textColor: overallStatus.text === 'ผ่าน' ? SUCCESS_COLOR : FAIL_COLOR } }
        ]],
        theme: 'grid',
        headStyles: { fillColor: TEXT_COLOR_DARK, textColor: TEXT_COLOR_LIGHT, font: 'THSarabun', fontStyle: 'bold', halign: 'center', fontSize: 14 },
        footStyles: { fillColor: BORDER_COLOR, textColor: TEXT_COLOR_DARK, font: 'THSarabun', fontSize: 14 },
        styles: { font: 'THSarabun', cellPadding: 3, fontSize: 14, lineColor: BORDER_COLOR, lineWidth: 0.1 },
        alternateRowStyles: { fillColor: '#F9FAFB' },
        didParseCell: (data: any) => { data.cell.styles.font = 'THSarabun'; },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } },
    });
};
const generateStudentExcelWorksheet = (student: StudentData, studentScores: { [subject: string]: number | null }, subjects: string[], attemptName: string): any => {
    const data = [
        ['ใบรายงานผลการทดสอบระดับชาติ O-NET'],
        [`โรงเรียนวัดคิรีวิหาร(สมเด็จพระวันรัต อุปถัมภ์)`],
        [],
        ['ชื่อ-สกุล', student.name],
        ['ระดับชั้น', student.grade, 'ห้องเรียน', student.classroom],
        ['เลขที่', student.no, 'ครั้งที่สอบ', attemptName],
        [],
        ['รายวิชา', 'คะแนน', 'สถานะ']
    ];
    subjects.forEach(subject => {
        const score = studentScores[subject];
        data.push([subject, String(score ?? '-'), getStatus(score).text]);
    });
    return XLSX.utils.aoa_to_sheet(data);
};

const generatePreTestStudentPdf = (student: StudentData, scores: { attempt1: number | null; attempt2: number | null }, groupName: string) => {
    const doc = new jspdf.jsPDF();
    const { attempt1, attempt2 } = scores;
    const diff = (attempt2 ?? 0) - (attempt1 ?? 0);
    const validScores = [attempt1, attempt2].filter((s): s is number => s !== null && !isNaN(s));
    const avg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;

    doc.setFont('THSarabun', 'bold');
    doc.setFontSize(20);
    doc.text(`ใบรายงานผลการทดสอบ: ${groupName}`, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text(`ชื่อ-สกุล: ${student.name}`, 20, 40);
    doc.text(`ระดับชั้น: ${student.grade}${student.classroom ? ` / ${student.classroom}` : ''}`, 20, 50);
    doc.text(`เลขที่: ${student.no}`, doc.internal.pageSize.getWidth() - 50, 40);

    (doc as any).autoTable({
        startY: 60,
        head: [['รายการ', 'คะแนน']],
        body: [
            ['ผลการทดสอบครั้งที่ 1', attempt1?.toFixed(2) ?? '-'],
            ['ผลการทดสอบครั้งที่ 2', attempt2?.toFixed(2) ?? '-'],
            ['คะแนนพัฒนาการ', (attempt1 !== null && attempt2 !== null) ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}` : '-'],
            ['คะแนนเฉลี่ย', avg?.toFixed(2) ?? '-'],
        ],
        theme: 'grid',
        styles: { font: 'THSarabun', fontSize: 14 },
        headStyles: { font: 'THSarabun', fontStyle: 'bold' }
    });

    doc.output('dataurlnewwindow');
};

const generatePreTestStudentExcel = (student: StudentData, scores: { attempt1: number | null; attempt2: number | null }, groupName: string) => {
    const { attempt1, attempt2 } = scores;
    const diff = (attempt2 ?? 0) - (attempt1 ?? 0);
    const validScores = [attempt1, attempt2].filter((s): s is number => s !== null && !isNaN(s));
    const avg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;

    const data = [
        ['ใบรายงานผลการทดสอบ', groupName],
        ['ชื่อ-สกุล', student.name],
        ['ระดับชั้น', student.grade, 'ห้องเรียน', student.classroom],
        ['เลขที่', student.no],
        [],
        ['รายการ', 'คะแนน'],
        ['ผลการทดสอบครั้งที่ 1', attempt1?.toFixed(2) ?? '-'],
        ['ผลการทดสอบครั้งที่ 2', attempt2?.toFixed(2) ?? '-'],
        ['คะแนนพัฒนาการ', (attempt1 !== null && attempt2 !== null) ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}` : '-'],
        ['คะแนนเฉลี่ย', avg?.toFixed(2) ?? '-'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ผลคะแนน');
    XLSX.writeFile(wb, `รายงานผล_${groupName}_${student.name}.xlsx`);
};

const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({
    isOpen,
    onClose,
    onSave,
    attemptName,
    preTestGroupName,
    selectedGrade,
    selectedClassroom,
    studentsByGrade,
    initialScores,
}) => {
    // --- Render Logic ---
    if (!isOpen) return null;

    if (preTestGroupName) {
        return <PreTestView 
            isOpen={isOpen}
            onClose={onClose}
            onSave={onSave}
            groupName={preTestGroupName}
            studentsByGrade={studentsByGrade}
            initialScores={initialScores}
        />
    }

    return <SingleAttemptView 
        isOpen={isOpen}
        onClose={onClose}
        onSave={onSave}
        attemptName={attemptName!}
        selectedGrade={selectedGrade!}
        selectedClassroom={selectedClassroom}
        studentsByGrade={studentsByGrade}
        initialScores={initialScores}
    />
};

// --- Pre-Test View Component ---
type LocalPreTestScores = { attempt1: number | null; attempt2: number | null };
interface PreTestViewProps extends Omit<ScoreEntryModalProps, 'attemptName' | 'preTestGroupName' | 'selectedGrade' | 'selectedClassroom'> {
    groupName: string;
}

const PreTestView: React.FC<PreTestViewProps> = ({ isOpen, onClose, onSave, groupName, studentsByGrade, initialScores }) => {
    const [scores, setScores] = useState<{ [studentId: number]: LocalPreTestScores }>({});
    const [activeClassroom, setActiveClassroom] = useState<string>('all');
    const [studentExportMenu, setStudentExportMenu] = useState<number | null>(null);
    const studentExportMenuRef = useRef<HTMLDivElement>(null);

    const groupInfo = useMemo(() => PRE_TEST_GROUPS.find(g => g.groupName === groupName), [groupName]);
    const gradeConfig = useMemo(() => GRADES_CONFIG.find(c => c.grade === groupInfo?.grades[0]), [groupInfo]);
    
    useEffect(() => {
        if (isOpen && gradeConfig && groupInfo) {
            const [attempt1Name, attempt2Name] = groupInfo.attempts;
            const studentsInGrade = studentsByGrade[gradeConfig.grade]?.data || [];
            const newScores: { [studentId: number]: LocalPreTestScores } = {};

            studentsInGrade.forEach(student => {
                newScores[student.id] = {
                    attempt1: initialScores[attempt1Name]?.[gradeConfig.grade]?.[student.id]?.[PRE_TEST_OVERALL_SCORE_KEY] ?? null,
                    attempt2: initialScores[attempt2Name]?.[gradeConfig.grade]?.[student.id]?.[PRE_TEST_OVERALL_SCORE_KEY] ?? null,
                };
            });
            setScores(newScores);
        }
    }, [isOpen, groupInfo, gradeConfig, studentsByGrade, initialScores]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (studentExportMenu !== null && studentExportMenuRef.current && !studentExportMenuRef.current.contains(event.target as Node)) {
                const targetIsButton = (event.target as HTMLElement).closest('.student-export-button');
                if (!targetIsButton) {
                   setStudentExportMenu(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [studentExportMenu]);
    
    const students = useMemo(() => {
        const studentsInGrade = studentsByGrade[gradeConfig?.grade ?? '']?.data || [];
        if (activeClassroom === 'all') return studentsInGrade;
        return studentsInGrade.filter(s => s.classroom === activeClassroom);
    }, [studentsByGrade, gradeConfig, activeClassroom]);
    
    const handleScoreChange = (studentId: number, attemptKey: 'attempt1' | 'attempt2', value: string) => {
        const newScore = value === '' ? null : Number(value);
        if (value !== '' && (isNaN(newScore!) || newScore! < 0 || newScore! > 100)) return;
        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [attemptKey]: newScore
            }
        }));
    };
    
    const handleSave = () => {
        if (!groupInfo || !gradeConfig) return;
        const [attempt1Name, attempt2Name] = groupInfo.attempts;
        const grade = gradeConfig.grade;
        
        const scores1: GradeScores = { [grade]: {} };
        const scores2: GradeScores = { [grade]: {} };

        for (const studentId in scores) {
            const studentScores = scores[Number(studentId)];
            scores1[grade][studentId] = { [PRE_TEST_OVERALL_SCORE_KEY]: studentScores.attempt1 };
            scores2[grade][studentId] = { [PRE_TEST_OVERALL_SCORE_KEY]: studentScores.attempt2 };
        }
        
        onSave({ [attempt1Name]: scores1, [attempt2Name]: scores2 });
    };

    const handleExportStudentReport = (student: StudentData, format: 'pdf' | 'excel') => {
        const studentScores = scores[student.id];
        if (!studentScores) return;

        if (format === 'pdf') {
            generatePreTestStudentPdf(student, studentScores, groupName);
        } else {
            generatePreTestStudentExcel(student, studentScores, groupName);
        }
        setStudentExportMenu(null);
    };

    if (!gradeConfig || !groupInfo) return null; // Should not happen if isOpen
    const isMultiClass = ['ม.3', 'ม.6'].includes(gradeConfig.grade);

    return (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-gray-50 rounded-2xl shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
                <header className="flex-shrink-0 bg-white shadow-md p-4 flex justify-between items-center rounded-t-2xl">
                     <h2 className="text-xl font-bold text-gray-700">{groupName}: ภาพรวมผลการทดสอบ</h2>
                     <div className="flex items-center gap-3">
                        <button onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300"><XCircleIcon className="h-5 w-5"/>ปิด</button>
                        <button onClick={handleSave} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700"><SaveIcon className="h-5 w-5"/>บันทึกข้อมูล</button>
                    </div>
                </header>
                 <main className="flex-grow p-4 sm:p-6 overflow-hidden flex flex-col gap-4">
                     {isMultiClass && (
                        <div className="flex-shrink-0 flex justify-center">
                            <div className="p-1 bg-gray-200 rounded-lg flex items-center space-x-1">
                                {['all', '1', '2'].map(c => (
                                    <button key={c} onClick={() => setActiveClassroom(c)} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeClassroom === c ? 'bg-white shadow' : 'text-gray-600 hover:bg-white/50'}`}>
                                        {c === 'all' ? 'ทุกห้อง' : `ห้อง ${c}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                     )}
                     <div className="bg-white rounded-xl shadow overflow-hidden flex flex-col flex-grow">
                        <div className="overflow-auto flex-grow">
                            <table className="w-full min-w-max table-auto">
                                <thead className="bg-gray-100 text-left sticky top-0 z-10">
                                    <tr>
                                        <th className="px-2 py-3 text-sm font-semibold text-gray-600 w-20 text-center border-r">เลขที่</th>
                                        <th className="px-2 py-3 text-sm font-semibold text-gray-600 w-64 border-r">ชื่อ - สกุล</th>
                                        <th className="px-2 py-3 text-sm font-semibold text-gray-600 text-center border-r">ครั้งที่ 1</th>
                                        <th className="px-2 py-3 text-sm font-semibold text-gray-600 text-center border-r">ครั้งที่ 2</th>
                                        <th className="px-2 py-3 text-sm font-semibold text-gray-600 text-center border-r">คะแนนพัฒนาการ</th>
                                        <th className="px-2 py-3 text-sm font-semibold text-gray-600 text-center border-r">คะแนนเฉลี่ย</th>
                                        <th className="px-2 py-3 text-sm font-semibold text-gray-600 w-32 text-center">ส่งออกรายงาน</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {students.map(student => {
                                        const studentScores = scores[student.id] || { attempt1: null, attempt2: null };
                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50 h-14">
                                                <td className="px-2 py-1 text-center text-gray-700 border-r">{student.no}</td>
                                                <td className="px-2 py-1 font-medium text-gray-800 border-r truncate">{student.name}</td>
                                                <td className="px-2 py-1 border-r">
                                                    <input type="number" value={studentScores.attempt1 ?? ''} onChange={(e) => handleScoreChange(student.id, 'attempt1', e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-center focus:ring-warm-orange focus:border-warm-orange" min="0" max="100" placeholder="-" />
                                                </td>
                                                <td className="px-2 py-1 border-r">
                                                    <input type="number" value={studentScores.attempt2 ?? ''} onChange={(e) => handleScoreChange(student.id, 'attempt2', e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-center focus:ring-warm-orange focus:border-warm-orange" min="0" max="100" placeholder="-" />
                                                </td>
                                                <td className="px-2 py-1 text-center text-sm border-r">
                                                    <DevelopmentScore score1={studentScores.attempt1} score2={studentScores.attempt2} />
                                                </td>
                                                <td className="px-2 py-1 text-center text-sm font-medium border-r">
                                                    <AverageScore scores={[studentScores.attempt1, studentScores.attempt2]} />
                                                </td>
                                                <td className="px-2 py-1 text-center">
                                                    <div className="relative inline-block" ref={studentExportMenu === student.id ? studentExportMenuRef : null}>
                                                        <button onClick={() => setStudentExportMenu(student.id === studentExportMenu ? null : student.id)} className="p-1 rounded-full hover:bg-gray-200 student-export-button">
                                                            <DocumentArrowDownIcon className="h-6 w-6 text-gray-500 hover:text-blue-600" />
                                                        </button>
                                                        {studentExportMenu === student.id && (
                                                            <div className="absolute top-full right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                                                                <div className="py-1">
                                                                    <button onClick={() => handleExportStudentReport(student, 'pdf')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><DocumentTextIcon className="h-5 w-5 text-red-500"/> ดาวน์โหลด (PDF)</button>
                                                                    <button onClick={() => handleExportStudentReport(student, 'excel')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><DocumentDuplicateIcon className="h-5 w-5 text-green-500"/> ดาวน์โหลด (Excel)</button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                             {students.length === 0 && <div className="text-center py-10 text-gray-500">ไม่มีข้อมูลนักเรียน</div>}
                        </div>
                     </div>
                 </main>
            </div>
         </div>
    );
};


// --- Single Attempt View Component ---
interface SingleAttemptViewProps extends Omit<ScoreEntryModalProps, 'preTestGroupName'> {
    attemptName: string;
    selectedGrade: string;
}

const SingleAttemptView: React.FC<SingleAttemptViewProps> = ({ isOpen, onClose, onSave, attemptName, selectedGrade, selectedClassroom, studentsByGrade, initialScores }) => {
    const [scores, setScores] = useState<GradeScores>({});
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [studentExportMenu, setStudentExportMenu] = useState<number | null>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const studentExportMenuRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if (isOpen) {
            const newScores: GradeScores = JSON.parse(JSON.stringify(initialScores[attemptName] || {}));
            const gradeConfig = GRADES_CONFIG.find(c => c.grade === selectedGrade);
            const studentsForGrade = studentsByGrade[selectedGrade]?.data || [];
            if (gradeConfig && studentsForGrade.length > 0) {
                if (!newScores[selectedGrade]) newScores[selectedGrade] = {};
                studentsForGrade.forEach(student => {
                    if (!newScores[selectedGrade][student.id]) newScores[selectedGrade][student.id] = {};
                    gradeConfig.subjects.forEach(subject => {
                        if (newScores[selectedGrade][student.id][subject] === undefined) {
                            newScores[selectedGrade][student.id][subject] = null;
                        }
                    });
                });
            }
            setScores({ [selectedGrade]: newScores[selectedGrade]});
        }
    }, [isOpen, initialScores, studentsByGrade, selectedGrade, attemptName]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
            if (studentExportMenu !== null && studentExportMenuRef.current && !studentExportMenuRef.current.contains(event.target as Node)) {
                const targetIsButton = (event.target as HTMLElement).closest('.student-export-button');
                if (!targetIsButton) {
                   setStudentExportMenu(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [studentExportMenu]);

    const handleScoreChange = (studentId: number, subject: string, value: string) => {
        const newScore = value === '' ? null : Number(value);
        if (value !== '' && (isNaN(newScore!) || newScore! < 0 || newScore! > 100)) return;
        setScores(prev => ({ ...prev, [selectedGrade]: { ...prev[selectedGrade], [studentId]: { ...prev[selectedGrade]?.[studentId], [subject]: newScore } } }));
    };

    const handleSave = () => onSave({ [attemptName]: scores });
    
    const activeGradeConfig = GRADES_CONFIG.find(g => g.grade === selectedGrade);
    
    const currentStudents = useMemo(() => {
        const studentsInGrade = studentsByGrade[selectedGrade]?.data || [];
        if (selectedClassroom) {
            return studentsInGrade.filter(s => s.classroom === selectedClassroom);
        }
        return studentsInGrade;
    }, [studentsByGrade, selectedGrade, selectedClassroom]);
    
    // --- Export handlers (unchanged) ---
    const handleClassExport = (format: 'excel' | 'pdf') => {
        if (!activeGradeConfig) return;
        const subjects = activeGradeConfig.subjects;
        const title = `ผลสัมฤทธิ์ O-NET ${selectedGrade} ${selectedClassroom ? `ห้อง ${selectedClassroom}` : ''} ${attemptName}`;

        const head = [
            ['เลขที่', 'ชื่อ - สกุล', ...subjects.flatMap(s => [s, 'สถานะ']), 'คะแนนรวมเฉลี่ย']
        ];
        const body = currentStudents.map(student => {
            const studentScores = scores[selectedGrade]?.[student.id] || {};
            const avg = calculateAverage(studentScores);
            return [
                student.no,
                student.name,
                ...subjects.flatMap(subject => {
                    const score = studentScores[subject];
                    return [score ?? '', getStatus(score).text];
                }),
                avg
            ];
        });

        if (format === 'excel') {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([head[0], ...body]);
            XLSX.utils.book_append_sheet(wb, ws, `สรุปผลคะแนน`);
            XLSX.writeFile(wb, `${title}.xlsx`);
        } else { // PDF
            const doc = new jspdf.jsPDF({ orientation: 'landscape' });
            doc.setFont('THSarabun', 'normal');
            doc.text(title, 14, 10);
            (doc as any).autoTable({ 
                head, 
                body, 
                startY: 15,
                styles: { font: 'THSarabun' },
                headStyles: { font: 'THSarabun', fontStyle: 'bold' },
                didParseCell: function (data: any) {
                    data.cell.styles.font = 'THSarabun';
                }
            });
            doc.output('dataurlnewwindow');
        }
        setIsExportMenuOpen(false);
    };
    const handleBatchExportStudentReports = (format: 'pdf' | 'excel') => {
        if (!activeGradeConfig || currentStudents.length === 0) return;
        const subjects = activeGradeConfig.subjects;
        if (format === 'pdf') {
            const doc = new jspdf.jsPDF();
            currentStudents.forEach((student, index) => {
                if (index > 0) doc.addPage();
                const studentScores = scores[selectedGrade]?.[student.id] || {};
                generateStudentPdfPage(doc, student, studentScores, subjects, attemptName);
            });
            doc.output('dataurlnewwindow');
        } else {
            const wb = XLSX.utils.book_new();
            currentStudents.forEach(student => {
                const studentScores = scores[selectedGrade]?.[student.id] || {};
                const ws = generateStudentExcelWorksheet(student, studentScores, subjects, attemptName);
                const sheetName = student.name.replace(/[*?:/\\\[\]]/g, '').substring(0, 31);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });
            XLSX.writeFile(wb, `รายงานรายบุคคล_${selectedGrade}${selectedClassroom ? `_ห้อง${selectedClassroom}` : ''}_${attemptName}.xlsx`);
        }
        setIsExportMenuOpen(false);
    };
    const handleExportStudentReport = (student: StudentData, format: 'pdf' | 'excel') => {
        if (!activeGradeConfig) return;
        const studentScores = scores[selectedGrade]?.[student.id] || {};
        const subjects = activeGradeConfig.subjects;
        if (format === 'pdf') {
            const doc = new jspdf.jsPDF();
            generateStudentPdfPage(doc, student, studentScores, subjects, attemptName);
            doc.output('dataurlnewwindow');
        } else {
            const wb = XLSX.utils.book_new();
            const ws = generateStudentExcelWorksheet(student, studentScores, subjects, attemptName);
            XLSX.utils.book_append_sheet(wb, ws, 'ผลคะแนน');
            XLSX.writeFile(wb, `รายงานผล_${student.name}.xlsx`);
        }
        setStudentExportMenu(null);
    };

    const currentSubjects = activeGradeConfig?.subjects || [];
    
    const summaryAverages = useMemo(() => {
        if (!currentStudents.length || !activeGradeConfig) return null;
        
        const subjectAvgs: { [subject: string]: number } = {};
        activeGradeConfig.subjects.forEach(subject => {
            const validScores = currentStudents
                .map(s => scores[selectedGrade]?.[s.id]?.[subject])
                .filter((s): s is number => typeof s === 'number' && !isNaN(s));
            subjectAvgs[subject] = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
        });
        const validSubjectAvgs = Object.values(subjectAvgs).filter(avg => avg > 0);
        const totalAvg = validSubjectAvgs.length > 0 ? validSubjectAvgs.reduce((a, b) => a + b, 0) / validSubjectAvgs.length : 0;
        
        return { subjectAvgs, totalAvg };
    }, [scores, selectedGrade, currentStudents, activeGradeConfig]);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-gray-50 rounded-2xl shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
                <header className="flex-shrink-0 bg-white shadow-md p-4 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-700">บันทึกผลการทดสอบ</h2>
                    <div className="flex items-center gap-3">
                        <div className="relative" ref={exportMenuRef}>
                            <button onClick={() => setIsExportMenuOpen(prev => !prev)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-gray-400" disabled={!activeGradeConfig}>
                                <DocumentArrowDownIcon className="h-5 w-5"/> ส่งออกข้อมูล
                            </button>
                            {isExportMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                    <div className="py-1">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">สรุปผลคะแนน (ห้องเรียนนี้)</div>
                                        <button onClick={() => handleClassExport('excel')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><DocumentDuplicateIcon className="h-5 w-5 text-green-700"/> ดาวน์โหลด (Excel)</button>
                                        <button onClick={() => handleClassExport('pdf')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><DocumentTextIcon className="h-5 w-5 text-red-700"/> ดาวน์โหลด (PDF)</button>
                                        <div className="border-t my-1"></div>
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">รายงานรายบุคคล (ทุกคนในห้องนี้)</div>
                                        <button onClick={() => handleBatchExportStudentReports('excel')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><UsersIcon className="h-5 w-5 text-green-700"/> ดาวน์โหลด (Excel)</button>
                                        <button onClick={() => handleBatchExportStudentReports('pdf')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><UsersIcon className="h-5 w-5 text-red-700"/> ดาวน์โหลด (PDF)</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300"><XCircleIcon className="h-5 w-5"/>ยกเลิก</button>
                        <button onClick={handleSave} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700"><SaveIcon className="h-5 w-5"/>บันทึกข้อมูล</button>
                    </div>
                </header>
                <main className="flex-grow p-4 sm:p-6 overflow-hidden flex flex-col gap-4">
                     <div className="text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{`ผลการทดสอบ O-NET ${activeGradeConfig?.name || ''} ${selectedClassroom ? `ห้อง ${selectedClassroom}` : ''}`}</h2>
                        <h3 className="text-3xl md:text-4xl font-bold text-warm-orange mt-1">
                             {attemptName}
                        </h3>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-lg text-gray-600 bg-blue-50 border border-blue-200 p-3 rounded-lg max-w-3xl mx-auto">
                            <span className="font-semibold">คำชี้แจง:</span> ผลการทดสอบแต่ละรายวิชาต้องมีคะแนนร้อยละ 50.00 ขึ้นไป จึงจะผ่านการทดสอบ
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow overflow-hidden flex flex-col flex-grow">
                         <div className="overflow-y-auto flex-grow">
                             <table className="w-full min-w-max table-auto">
                                <thead className="bg-gray-100 text-left sticky top-0 z-10">
                                    <tr>
                                        <th rowSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-600 w-16 text-center border-r">เลขที่</th>
                                        <th rowSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-600 border-r">ชื่อ - สกุล</th>
                                        {currentSubjects.map(subject => (
                                            <th key={subject} colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-600 text-center border-b border-r">{subject}</th>
                                        ))}
                                        <th rowSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-600 w-32 text-center border-r">คะแนนรวมเฉลี่ย</th>
                                        <th rowSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-600 w-32 text-center">ส่งออกรายงาน</th>
                                    </tr>
                                    <tr>
                                        {currentSubjects.map(subject => (
                                            <React.Fragment key={`${subject}-sub`}>
                                                <th className="px-2 py-2 text-xs font-medium text-gray-500 text-center border-r">คะแนน</th>
                                                <th className="px-2 py-2 text-xs font-medium text-gray-500 text-center border-r">สถานะ</th>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                 <tbody className="divide-y divide-gray-200">
                                     {currentStudents.length > 0 ? currentStudents.map((student) => {
                                         const studentScores = scores[selectedGrade]?.[student.id] || {};
                                         const averageScore = calculateAverage(studentScores);
                                         const avgScoreValue = parseFloat(averageScore);
                                         const avgScoreColorClass = !isNaN(avgScoreValue)
                                            ? avgScoreValue >= PASSING_SCORE ? 'text-green-600' : 'text-red-600'
                                            : 'text-gray-800';

                                         return (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-1 text-center text-gray-700 border-r">{student.no}</td>
                                                <td className="px-4 py-1 font-medium text-gray-800 border-r">{student.name}</td>
                                                {currentSubjects.map(subject => {
                                                    const score = studentScores[subject];
                                                    const status = getStatus(score);
                                                    return (
                                                        <React.Fragment key={subject}>
                                                            <td className="px-2 py-1 border-r">
                                                                <input type="number" value={score ?? ''} onChange={(e) => handleScoreChange(student.id, subject, e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-center focus:ring-warm-orange focus:border-warm-orange" min="0" max="100" placeholder="-" />
                                                            </td>
                                                            <td className={`px-2 py-1 text-center text-sm border-r ${status.color}`}> {status.text} </td>
                                                        </React.Fragment>
                                                    );
                                                })}
                                                <td className={`px-4 py-1 text-center font-bold border-r ${avgScoreColorClass}`}>{averageScore}</td>
                                                <td className="px-4 py-1 text-center border-r">
                                                    <div className="relative inline-block" ref={studentExportMenu === student.id ? studentExportMenuRef : null}>
                                                        <button onClick={() => setStudentExportMenu(student.id === studentExportMenu ? null : student.id)} className="p-1 rounded-full hover:bg-gray-200 student-export-button">
                                                            <DocumentArrowDownIcon className="h-6 w-6 text-gray-500 hover:text-blue-600" />
                                                        </button>
                                                        {studentExportMenu === student.id && (
                                                            <div className="absolute top-full right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                                                                <div className="py-1">
                                                                    <button onClick={() => handleExportStudentReport(student, 'pdf')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><DocumentTextIcon className="h-5 w-5 text-red-500"/> ดาวน์โหลด (PDF)</button>
                                                                    <button onClick={() => handleExportStudentReport(student, 'excel')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><DocumentDuplicateIcon className="h-5 w-5 text-green-500"/> ดาวน์โหลด (Excel)</button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                     }) : (
                                         <tr>
                                             <td colSpan={currentSubjects.length * 2 + 4} className="text-center py-10 text-gray-500">
                                                {'ไม่มีข้อมูลนักเรียนสำหรับห้องเรียนที่เลือก'}
                                             </td>
                                         </tr>
                                     )}
                                 </tbody>
                                 {summaryAverages && (
                                    <tfoot className="bg-gray-200">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-2 font-bold text-gray-800 text-right border-r">คะแนนเฉลี่ยรวม</td>
                                            {currentSubjects.map(subject => (
                                                <td key={subject} colSpan={2} className="px-2 py-2 text-center font-bold text-gray-800 border-r">
                                                    {summaryAverages.subjectAvgs[subject].toFixed(2)}
                                                </td>
                                            ))}
                                            <td className={`px-4 py-2 text-center font-bold border-r ${
                                                summaryAverages.totalAvg >= PASSING_SCORE 
                                                    ? 'text-green-700 bg-green-100'
                                                    : 'text-red-700 bg-red-100'
                                            }`}>{summaryAverages.totalAvg.toFixed(2)}</td>
                                            <td className="border-r"></td>
                                        </tr>
                                    </tfoot>
                                 )}
                             </table>
                         </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ScoreEntryModal;