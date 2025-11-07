export interface ScoreData {
  name: string;
  [key: string]: string | number;
}

export type ChartData = ScoreData[];

export interface AttemptData {
  gradeComparison: ChartData;
  p1Subjects: ChartData;
  p3Subjects: ChartData;
  p6Subjects: ChartData;
  m3Subjects: ChartData;
  m6Subjects: ChartData;
}

export interface FullDataSet {
  [key: string]: AttemptData;
}

export interface StudentData {
    id: number;
    no: string;
    name: string;
    grade: 'ป.1' | 'ป.3' | 'ป.6' | 'ม.3' | 'ม.6' | string;
    classroom: '1' | '2' | string;
}

export interface GradeData {
    data: StudentData[];
    lastUpdated: string | null;
}

// New types for individual student scores
export interface StudentScores {
    [studentId: number]: {
        [subject: string]: number | null; // subject name -> score
    };
}

export interface GradeScores {
    [grade: string]: StudentScores; // e.g., 'ป.6'
}

export interface AttemptScores {
    [attempt: string]: GradeScores; // e.g., 'ครั้งที่ 1'
}