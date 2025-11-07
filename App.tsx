import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MainMenu from './components/MainMenu';
import GradeSelectionModal from './components/modals/GradeSelectionModal';
import ScoreEntryModal from './components/modals/ScoreEntryModal';
import ReportPage from './components/ReportPage';
import { GRADES_CONFIG, ALL_FILTER_OPTIONS, SCORE_ENTRY_ITEMS, PRE_TEST_GROUPS, PRE_TEST_OVERALL_SCORE_KEY } from './constants';
import type { FullDataSet, StudentData, AttemptScores, GradeScores, ChartData, GradeData } from './types';

// Initial student data to simulate a persistent state
const initialStudents: { [key: string]: GradeData } = {
  // All grades are intentionally left empty
  // to show the "Awaiting Data" status until a template file is uploaded.
};


const App: React.FC = () => {
  const [selectedAttempts, setSelectedAttempts] = useState<string[]>(['ภาพรวม']);
  const [studentsByGrade, setStudentsByGrade] = useState<{ [key: string]: GradeData }>(initialStudents);
  const [studentScores, setStudentScores] = useState<AttemptScores>({});
  
  const [isGradeSelectionModalOpen, setIsGradeSelectionModalOpen] = useState(false);
  const [isScoreEntryModalOpen, setIsScoreEntryModalOpen] = useState(false);
  const [editingAttempt, setEditingAttempt] = useState<string | null>(null);
  const [editingPreTestGroup, setEditingPreTestGroup] = useState<string | null>(null);
  const [selectedGradeInfo, setSelectedGradeInfo] = useState<{ grade: string, classroom: string | null } | null>(null);
  const [isReportViewOpen, setIsReportViewOpen] = useState(false);

  const attempts = ALL_FILTER_OPTIONS;

  const handleAttemptChange = (attempt: string) => {
    setSelectedAttempts(prev => {
      const isSelected = prev.includes(attempt);
      if (isSelected) {
        return prev.length > 1 ? prev.filter(a => a !== attempt) : prev;
      } else {
        return [...prev, attempt];
      }
    });
  };

  const handleStudentDataImport = (allNewStudents: StudentData[]) => {
    const groupedByGrade = allNewStudents.reduce((acc, student) => {
        const grade = student.grade;
        if (grade) {
            if (!acc[grade]) {
                acc[grade] = [];
            }
            acc[grade].push(student);
        }
        return acc;
    }, {} as { [key: string]: StudentData[] });
    
    setStudentsByGrade(prev => {
        const newState = JSON.parse(JSON.stringify(prev)); // Deep copy to avoid mutation
        const timestamp = new Date().toISOString();

        for (const grade in groupedByGrade) {
            const newStudentsForGrade = groupedByGrade[grade];
            if (newState[grade] && newState[grade].data) {
                // If grade exists, append new students to the existing data array
                newState[grade].data.push(...newStudentsForGrade);
            } else {
                // If grade is new, create a new entry
                newState[grade] = {
                    data: newStudentsForGrade,
                    lastUpdated: null // Will be set in the next step
                };
            }
            // Always update the timestamp for any grade that was added to or created
            newState[grade].lastUpdated = timestamp;
        }
        return newState;
    });
  };

  const handleStudentDataUpdate = (grade: string, updatedStudents: StudentData[]) => {
      setStudentsByGrade(prev => ({
          ...prev,
          [grade]: {
            data: updatedStudents,
            lastUpdated: new Date().toISOString()
          }
      }));
  };

  const handleStartScoreEntry = (attempt: string) => {
    setEditingAttempt(attempt);
    setIsGradeSelectionModalOpen(true);
  };
  
  const handleStartPreTestEntry = (groupName: string) => {
    setEditingPreTestGroup(groupName);
    setIsScoreEntryModalOpen(true);
  };

  const handleCloseScoreEntry = () => {
    setEditingAttempt(null);
    setEditingPreTestGroup(null);
    setIsScoreEntryModalOpen(false);
    setSelectedGradeInfo(null);
  };

  const handleCloseGradeSelection = () => {
    setEditingAttempt(null);
    setIsGradeSelectionModalOpen(false);
  };

  const handleGradeSelected = (selection: { grade: string, classroom: string | null }) => {
    setSelectedGradeInfo(selection);
    setIsGradeSelectionModalOpen(false);
    setIsScoreEntryModalOpen(true);
  };
  
  const handleScoresSave = (scoresToUpdate: AttemptScores) => {
    setStudentScores(prev => {
        const newState = { ...prev };
        for (const attempt in scoresToUpdate) {
            const existingAttemptScores = newState[attempt] || {};
            const newAttemptScores = scoresToUpdate[attempt];
            
            for (const grade in newAttemptScores) {
                 const existingGradeScores = existingAttemptScores[grade] || {};
                 const newGradeScores = newAttemptScores[grade];
                 existingAttemptScores[grade] = {
                     ...existingGradeScores,
                     ...newGradeScores,
                 };
            }
            newState[attempt] = existingAttemptScores;
        }
        return newState;
    });
    handleCloseScoreEntry();
  };


  const aggregatedDataForCharts = useMemo<FullDataSet>(() => {
    const fullDataSet: FullDataSet = {};
    const calculateAverage = (scores: number[]) => scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0;

    // 1. Collect all raw scores from the state
    const rawScores: { [attempt: string]: { [grade: string]: { [subject: string]: number[] } } } = {};
    const allKnownAttempts = [...SCORE_ENTRY_ITEMS, ...PRE_TEST_GROUPS.flatMap(g => g.attempts)];
    const preTestAttemptNames = new Set(PRE_TEST_GROUPS.flatMap(g => g.attempts));

    for (const attempt in studentScores) {
        if (!rawScores[attempt]) rawScores[attempt] = {};
        for (const grade in studentScores[attempt]) {
            if (!rawScores[attempt][grade]) rawScores[attempt][grade] = {};
            for (const studentId in studentScores[attempt][grade]) {
                const scores = studentScores[attempt][grade][studentId];
                for (const subject in scores) {
                    const score = scores[subject];
                    if (score !== null && score !== undefined) {
                        if (!rawScores[attempt][grade][subject]) rawScores[attempt][grade][subject] = [];
                        rawScores[attempt][grade][subject].push(score);
                    }
                }
            }
        }
    }
    
    // 2. Calculate averages for each attempt (including pre-tests)
    allKnownAttempts.forEach(attempt => {
        const attemptData = rawScores[attempt] || {};
        const gradeAverages: { [grade: string]: number } = {};
        
        const chartData: {
            p1Subjects: ChartData;
            p3Subjects: ChartData;
            p6Subjects: ChartData;
            m3Subjects: ChartData;
            m6Subjects: ChartData;
        } = { p1Subjects: [], p3Subjects: [], p6Subjects: [], m3Subjects: [], m6Subjects: [] };

        const isPreTest = preTestAttemptNames.has(attempt);

        GRADES_CONFIG.forEach(config => {
            const grade = config.grade;
            const gradeData = attemptData[grade] || {};
            const subjectAverages: { name: string; 'คะแนนเฉลี่ย': number }[] = [];
            
            if (isPreTest) {
                const overallScores = gradeData[PRE_TEST_OVERALL_SCORE_KEY] || [];
                const avg = calculateAverage(overallScores);
                config.subjects.forEach(subject => {
                    subjectAverages.push({ name: subject, 'คะแนนเฉลี่ย': avg });
                });
                gradeAverages[grade] = avg;
            } else {
                config.subjects.forEach(subject => {
                    const avg = calculateAverage(gradeData[subject] || []);
                    subjectAverages.push({ name: subject, 'คะแนนเฉลี่ย': avg });
                });
                const validSubjectAverages = subjectAverages.map(s => s['คะแนนเฉลี่ย']).filter(s => s > 0);
                gradeAverages[grade] = calculateAverage(validSubjectAverages);
            }

            if (grade === 'ป.1') chartData.p1Subjects = subjectAverages;
            if (grade === 'ป.3') chartData.p3Subjects = subjectAverages;
            if (grade === 'ป.6') chartData.p6Subjects = subjectAverages;
            if (grade === 'ม.3') chartData.m3Subjects = subjectAverages;
            if (grade === 'ม.6') chartData.m6Subjects = subjectAverages;
        });

        fullDataSet[attempt] = {
            gradeComparison: GRADES_CONFIG.map(config => ({
                name: config.grade,
                'คะแนนเฉลี่ย': gradeAverages[config.grade] || 0
            })),
            p1Subjects: chartData.p1Subjects,
            p3Subjects: chartData.p3Subjects,
            p6Subjects: chartData.p6Subjects,
            m3Subjects: chartData.m3Subjects,
            m6Subjects: chartData.m6Subjects,
        };
    });

    // 3. Calculate overall average ("ภาพรวม") using only SCORE_ENTRY_ITEMS
    const overallTotals: { [chartKey: string]: { [name: string]: { sum: number, count: number } } } = {
        gradeComparison: {}, p1Subjects: {}, p3Subjects: {}, p6Subjects: {}, m3Subjects: {}, m6Subjects: {},
    };

    SCORE_ENTRY_ITEMS.forEach(attempt => {
        if (fullDataSet[attempt]) {
            Object.keys(overallTotals).forEach(chartKey => {
                const chartData = fullDataSet[attempt][chartKey as keyof typeof fullDataSet[string]];
                if (chartData) {
                    chartData.forEach(item => {
                        if ((item['คะแนนเฉลี่ย'] as number) > 0) {
                            if (!overallTotals[chartKey][item.name]) {
                                overallTotals[chartKey][item.name] = { sum: 0, count: 0 };
                            }
                            overallTotals[chartKey][item.name].sum += item['คะแนนเฉลี่ย'] as number;
                            overallTotals[chartKey][item.name].count += 1;
                        }
                    });
                }
            });
        }
    });

    const calculateFinalAverage = (totals: { [name: string]: { sum: number, count: number } }, allNames: string[]) => {
        return allNames.map(name => {
            const total = totals[name];
            const avg = total && total.count > 0 ? parseFloat((total.sum / total.count).toFixed(2)) : 0;
            return { name, 'คะแนนเฉลี่ย': avg };
        });
    };
    
    fullDataSet['ภาพรวม'] = {
        gradeComparison: calculateFinalAverage(overallTotals.gradeComparison, GRADES_CONFIG.map(g => g.grade)),
        p1Subjects: calculateFinalAverage(overallTotals.p1Subjects, GRADES_CONFIG.find(g => g.grade === 'ป.1')?.subjects || []),
        p3Subjects: calculateFinalAverage(overallTotals.p3Subjects, GRADES_CONFIG.find(g => g.grade === 'ป.3')?.subjects || []),
        p6Subjects: calculateFinalAverage(overallTotals.p6Subjects, GRADES_CONFIG.find(g => g.grade === 'ป.6')?.subjects || []),
        m3Subjects: calculateFinalAverage(overallTotals.m3Subjects, GRADES_CONFIG.find(g => g.grade === 'ม.3')?.subjects || []),
        m6Subjects: calculateFinalAverage(overallTotals.m6Subjects, GRADES_CONFIG.find(g => g.grade === 'ม.6')?.subjects || []),
    };

    return fullDataSet;
  }, [studentScores]);

  const handleToggleReportView = () => {
    setIsReportViewOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header />
      <MainMenu 
        onStartScoreEntry={handleStartScoreEntry} 
        onStartPreTestEntry={handleStartPreTestEntry}
        onToggleReportView={handleToggleReportView}
      />
      <main className="p-4 sm:p-6 md:p-8">
        {isReportViewOpen ? (
          <ReportPage 
            chartData={aggregatedDataForCharts}
            onClose={handleToggleReportView}
          />
        ) : (
          <Dashboard 
            attempts={attempts}
            selectedAttempts={selectedAttempts}
            onAttemptChange={handleAttemptChange}
            onPreTestCardClick={handleStartPreTestEntry}
            data={aggregatedDataForCharts}
            studentsByGrade={studentsByGrade}
            onStudentDataImport={handleStudentDataImport}
            onStudentDataUpdate={handleStudentDataUpdate}
          />
        )}
      </main>
      {!isReportViewOpen && (
        <>
          {editingAttempt && (
            <GradeSelectionModal
              isOpen={isGradeSelectionModalOpen}
              onClose={handleCloseGradeSelection}
              onSelect={handleGradeSelected}
              attemptName={editingAttempt}
            />
          )}
          {(editingAttempt || editingPreTestGroup) && (
              <ScoreEntryModal 
                isOpen={isScoreEntryModalOpen}
                onClose={handleCloseScoreEntry}
                onSave={handleScoresSave}
                attemptName={editingAttempt}
                preTestGroupName={editingPreTestGroup}
                selectedGrade={selectedGradeInfo?.grade}
                selectedClassroom={selectedGradeInfo?.classroom}
                studentsByGrade={studentsByGrade}
                initialScores={studentScores}
              />
          )}
        </>
      )}
    </div>
  );
};

export default App;