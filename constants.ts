import type { FullDataSet } from './types';

export const GRADES_CONFIG = [
    { grade: 'ป.1', name: 'ประถมศึกษาปีที่ 1', subjects: ['การอ่านรู้เรื่อง', 'การอ่านออกเสียง'], color: 'bg-sky-100', hoverColor: 'hover:bg-sky-200', textColor: 'text-sky-800' },
    { grade: 'ป.3', name: 'ประถมศึกษาปีที่ 3', subjects: ['ความสามารถด้านภาษาไทย', 'ความสามารถด้านคำนวณ'], color: 'bg-orange-100', hoverColor: 'hover:bg-orange-200', textColor: 'text-orange-800' },
    { grade: 'ป.6', name: 'ประถมศึกษาปีที่ 6', subjects: ['ภาษาไทย', 'คณิตศาสตร์', 'วิทยาศาสตร์', 'ภาษาอังกฤษ'], color: 'bg-yellow-100', hoverColor: 'hover:bg-yellow-200', textColor: 'text-yellow-800' },
    { grade: 'ม.3', name: 'มัธยมศึกษาปีที่ 3', subjects: ['ภาษาไทย', 'คณิตศาสตร์', 'วิทยาศาสตร์', 'ภาษาอังกฤษ'], color: 'bg-green-100', hoverColor: 'hover:bg-green-200', textColor: 'text-green-800' },
    { grade: 'ม.6', name: 'มัธยมศึกษาปีที่ 6', subjects: ['ภาษาไทย', 'คณิตศาสตร์', 'วิทยาศาสตร์', 'สังคมศึกษา', 'ภาษาอังกฤษ'], color: 'bg-red-100', hoverColor: 'hover:bg-red-200', textColor: 'text-red-800' },
];

export const CHART_CONFIGS = [
    { id: 'gradeComparison', title: 'ผลคะแนนรวมเปรียบเทียบระดับชั้น', dataKey: 'คะแนนเฉลี่ย', color: '#B2EBF2'},
    { id: 'p1Subjects', title: 'ผลคะแนนรายวิชา ระดับชั้น ป.1 (RT)', dataKey: 'คะแนนเฉลี่ย', color: '#A7F3D0'},
    { id: 'p3Subjects', title: 'ผลคะแนนรายวิชา ระดับชั้น ป.3 (NT)', dataKey: 'คะแนนเฉลี่ย', color: '#FED7AA'},
    { id: 'p6Subjects', title: 'ผลคะแนนรายวิชา ระดับชั้น ป.6', dataKey: 'คะแนนเฉลี่ย', color: '#FFECB3'},
    { id: 'm3Subjects', title: 'ผลคะแนนรายวิชา ระดับชั้น ม.3', dataKey: 'คะแนนเฉลี่ย', color: '#C8E6C9'},
    { id: 'm6Subjects', title: 'ผลคะแนนรายวิชา ระดับชั้น ม.6', dataKey: 'คะแนนเฉลี่ย', color: '#FFCDD2'},
];

export const SERIES_COLORS = [
    '#38bdf8', // sky-400
    '#fb923c', // orange-400
    '#4ade80', // green-400
    '#f472b6', // pink-400
    '#a78bfa', // violet-400
    '#2dd4bf', // teal-400
    '#facc15', // yellow-400
    '#fb7185', // rose-400
    '#60a5fa', // blue-400
    '#818cf8', // indigo-400
    '#c084fc', // purple-400
];

export const SCORE_ENTRY_ITEMS = [
    ...Array.from({ length: 5 }, (_, i) => `ครั้งที่ ${i + 1}`),
];

export const PRE_TEST_GROUPS = [
    { 
        groupName: 'Pre RT ป.1', 
        grades: ['ป.1'],
        attempts: ['Pre RT ป.1 (ครั้งที่ 1)', 'Pre RT ป.1 (ครั้งที่ 2)'] 
    },
    { 
        groupName: 'Pre NT ป.3', 
        grades: ['ป.3'],
        attempts: ['Pre NT ป.3 (ครั้งที่ 1)', 'Pre NT ป.3 (ครั้งที่ 2)'] 
    },
    { 
        groupName: 'Pre O-NET ป.6', 
        grades: ['ป.6'],
        attempts: ['Pre O-NET ป.6 (ครั้งที่ 1)', 'Pre O-NET ป.6 (ครั้งที่ 2)'] 
    },
    { 
        groupName: 'Pre O-NET ม.3', 
        grades: ['ม.3'],
        attempts: ['Pre O-NET ม.3 (ครั้งที่ 1)', 'Pre O-NET ม.3 (ครั้งที่ 2)'] 
    },
    { 
        groupName: 'Pre O-NET ม.6', 
        grades: ['ม.6'],
        attempts: ['Pre O-NET ม.6 (ครั้งที่ 1)', 'Pre O-NET ม.6 (ครั้งที่ 2)'] 
    },
];

export const SCORE_ENTRY_GROUPS = [
    {
        groupName: 'O-NET / NT / RT (รายครั้ง)',
        grades: ['ป.1', 'ป.3', 'ป.6', 'ม.3', 'ม.6'],
        attempts: SCORE_ENTRY_ITEMS,
    },
    ...PRE_TEST_GROUPS,
];

// New constant to drive the restructured MainMenu score entry dropdown.
export const SCORE_ENTRY_MENU_CONFIG = [
    {
        groupName: 'O-NET / NT / RT (รายครั้ง ครั้งที่ 1 - 5)',
        type: 'single-attempt',
        items: SCORE_ENTRY_ITEMS,
    },
    {
        groupName: 'Pre-Tests', // Not rendered, just for internal grouping
        type: 'pre-test',
        items: PRE_TEST_GROUPS.map(g => ({
            // Creates user-friendly labels like "Pre RT (ป.1)"
            label: g.groupName.replace(/ (ป\.\d|ม\.\d)/g, ' ($1)'),
            // The original groupName value needed by the handler, e.g., "Pre RT ป.1"
            value: g.groupName, 
        }))
    }
];


export const FILTER_GROUPS = {
    col1: {
        title: 'ผลการทดสอบรายครั้ง',
        items: ['ภาพรวม', ...SCORE_ENTRY_ITEMS],
    },
    col2: {
        title: 'ผลการทดสอบ Pre RT / Pre NT / Pre O-NET',
        groups: PRE_TEST_GROUPS.map(({ groupName, attempts }) => ({ groupName, attempts })),
    },
};


export const ALL_FILTER_OPTIONS = [
    ...FILTER_GROUPS.col1.items,
    // Pre-test attempts are no longer general filters; they are handled in a separate modal.
];

export const PRE_TEST_OVERALL_SCORE_KEY = 'overall_score';