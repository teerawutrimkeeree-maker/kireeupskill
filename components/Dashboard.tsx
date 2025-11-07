import React, { useState, useMemo } from 'react';
import Filter from './Filter';
import ChartCard from './ChartCard';
import FileUpload from './FileUpload';
import ReviewModal from './modals/ReviewModal';
import SuccessModal from './modals/SuccessModal';
import AlertModal from './modals/AlertModal';
import StudentListBanners from './StudentListBanners';
import type { FullDataSet, AttemptData, ChartData, StudentData, GradeData } from '../types';
import { CHART_CONFIGS, FILTER_GROUPS } from '../constants';

interface DashboardProps {
  attempts: string[];
  selectedAttempts: string[];
  onAttemptChange: (attempt: string) => void;
  onPreTestCardClick: (groupName: string) => void;
  data: FullDataSet;
  studentsByGrade: { [key: string]: GradeData };
  onStudentDataImport: (students: StudentData[]) => void;
  onStudentDataUpdate: (grade: string, students: StudentData[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  attempts,
  selectedAttempts,
  onAttemptChange,
  onPreTestCardClick,
  data,
  studentsByGrade,
  onStudentDataImport,
  onStudentDataUpdate,
}) => {
  const [reviewingStudents, setReviewingStudents] = useState<StudentData[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [uploadError, setUploadError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewingGrade, setReviewingGrade] = useState<string | null>(null);

  // State for sequential file review
  const [reviewQueue, setReviewQueue] = useState<{ students: StudentData[], fileName: string }[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const handleFilesUpload = (studentGroups: StudentData[][], fileNames: string[]) => {
    setUploadError('');
    setReviewingGrade(null); // This is a new upload, not an edit.
    
    if (studentGroups.length === 0 || studentGroups.flat().length === 0) {
        setUploadError('ไม่พบข้อมูลนักเรียนในไฟล์');
        return;
    }

    const queue = studentGroups.map((students, index) => ({
        students,
        fileName: fileNames[index]
    }));

    setReviewQueue(queue);
    setCurrentReviewIndex(0);
    setReviewingStudents(queue[0].students);
    setIsReviewModalOpen(true);
  };

  const handleReviewCancel = () => {
    setIsReviewModalOpen(false);
    setReviewingStudents([]);
    setReviewingGrade(null);
    setReviewQueue([]); // Also reset queue
  };

  const handleReviewConfirm = (finalStudents: StudentData[]) => {
    // Logic to update state based on `reviewingGrade` (for edits) or import new
    if (reviewingGrade) {
        onStudentDataUpdate(reviewingGrade, finalStudents);
    } else {
        onStudentDataImport(finalStudents);
    }
    
    // Advance queue
    const nextIndex = currentReviewIndex + 1;
    if (nextIndex < reviewQueue.length) {
        setCurrentReviewIndex(nextIndex);
        setReviewingStudents(reviewQueue[nextIndex].students);
    } else {
        // Finished the queue
        setIsReviewModalOpen(false);
        
        let message = '';
        if (reviewingGrade) {
            message = `ข้อมูลระดับชั้น ${reviewingGrade} ได้รับการอัปเดตแล้ว`;
        } else {
            const totalStudents = reviewQueue.reduce((acc, item) => acc + item.students.length, 0);
            message = `นำเข้าข้อมูลนักเรียน ${totalStudents} คน จาก ${reviewQueue.length} ไฟล์สำเร็จ`;
        }
        setSuccessMessage(message);
        setIsSuccessModalOpen(true);
        
        // Reset state
        setReviewingGrade(null);
        setReviewQueue([]);
    }
  };
  
  const handleUploadError = (message: string) => {
      setUploadError(message);
  };
  
  const handleBannerClick = (grade: string) => {
    const gradeInfo = studentsByGrade[grade];
    if (gradeInfo && gradeInfo.data.length > 0) {
        setReviewingGrade(grade);
        const queue = [{ students: gradeInfo.data, fileName: `นักเรียนชั้น ${grade}` }];
        setReviewQueue(queue);
        setCurrentReviewIndex(0);
        setReviewingStudents(queue[0].students);
        setIsReviewModalOpen(true);
    } else {
        setAlertMessage('ไม่มีข้อมูลนักเรียน');
        setIsAlertModalOpen(true);
    }
  };

  const aggregatedData = useMemo(() => {
    const result: { [key: string]: { [key: string]: ChartData } } = {};

    CHART_CONFIGS.forEach(config => {
      result[config.id] = {};
      selectedAttempts.forEach(attempt => {
        if (data[attempt]) {
           // Fix: Corrected key from config.dataKey to config.id to correctly retrieve chart data.
           result[config.id][attempt] = data[attempt][config.id as keyof AttemptData] as ChartData;
        }
      });
    });

    return result;
  }, [data, selectedAttempts]);
  
  const reviewQueueInfo = reviewQueue.length > 0 ? {
    current: currentReviewIndex + 1,
    total: reviewQueue.length,
    fileName: reviewQueue[currentReviewIndex]?.fileName || ''
  } : undefined;

  const confirmButtonText = reviewQueueInfo && reviewQueueInfo.current < reviewQueueInfo.total
      ? 'ยืนยันและไฟล์ถัดไป'
      : reviewingGrade ? 'ยืนยันการแก้ไข' : 'ยืนยันและนำเข้าข้อมูล';

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StudentListBanners studentsByGrade={studentsByGrade} onBannerClick={handleBannerClick} />
          <div className="bg-white p-6 rounded-2xl shadow-lg h-full flex flex-col">
              <h2 className="text-xl font-bold text-gray-700 mb-4">นำเข้าข้อมูลนักเรียน</h2>
              <FileUpload onFilesParsed={handleFilesUpload} onError={handleUploadError} />
              {uploadError && <p className="mt-4 text-center text-red-500">{uploadError}</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">เลือกครั้งที่สอบเพื่อแสดงผล</h3>
          <Filter
            groups={FILTER_GROUPS}
            selectedValues={selectedAttempts}
            onChange={onAttemptChange}
            onPreTestCardClick={onPreTestCardClick}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CHART_CONFIGS.map(({ id, title, dataKey, color }) => (
            <ChartCard
              key={id}
              title={title}
              chartData={aggregatedData[id]}
              selectedAttempts={selectedAttempts}
              chartColor={color}
              dataKey={dataKey}
            />
          ))}
        </div>
      </div>
      
      <ReviewModal 
        isOpen={isReviewModalOpen}
        onCancel={handleReviewCancel}
        onConfirm={handleReviewConfirm}
        initialStudents={reviewingStudents}
        reviewQueueInfo={reviewQueueInfo}
        confirmButtonText={confirmButtonText}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
      
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title="แจ้งเตือน"
        message={alertMessage}
      />
    </>
  );
};

export default Dashboard;