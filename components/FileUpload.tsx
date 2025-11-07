import React, { useState, useCallback } from 'react';
import type { StudentData } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';

declare const XLSX: any; // Use SheetJS from CDN

interface FileUploadProps {
    onFilesParsed: (studentGroups: StudentData[][], fileNames: string[]) => void;
    onError: (message: string) => void;
}

const parseFile = (file: File): Promise<StudentData[]> => {
    return new Promise((resolve, reject) => {
        if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(file.type)) {
            return reject(`รูปแบบไฟล์ไม่ถูกต้องสำหรับไฟล์: ${file.name}. กรุณาอัปโหลด .xlsx หรือ .csv เท่านั้น`);
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellStyles: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: (string | number)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const rows = json.slice(1);

                const students: StudentData[] = rows
                    .map((row, index) => {
                        const [no, name, grade, classroom] = row.map(cell => (cell != null ? String(cell).trim() : ''));
                        if (!no && !name && !grade && !classroom) return null;
                        return {
                            id: Date.now() + Math.random() + index,
                            no: no || '',
                            name: name || '',
                            grade: grade || '',
                            classroom: classroom || '',
                        };
                    })
                    .filter((student): student is StudentData => student !== null);
                
                resolve(students);

            } catch (err) {
                console.error(`File parsing error in ${file.name}:`, err);
                reject(`เกิดข้อผิดพลาดในการประมวลผลไฟล์: ${file.name}`);
            }
        };
        reader.onerror = () => reject(`ไม่สามารถอ่านไฟล์: ${file.name}`);
        reader.readAsBinaryString(file);
    });
};

const FileUpload: React.FC<FileUploadProps> = ({ onFilesParsed, onError }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        onError(''); // Clear previous errors

        try {
            const fileList = Array.from(files);
            const fileNames = fileList.map(f => f.name);
            const parsingPromises = fileList.map(parseFile);
            const studentArrays = await Promise.all(parsingPromises);
            const allStudents = studentArrays.flat();

            if (allStudents.length === 0) {
                onError('ไม่พบข้อมูลนักเรียนในไฟล์ที่เลือก หรือไฟล์อาจจะว่างเปล่า');
                return;
            }

            // Validate data across all parsed files
            const seen = new Set<string>();
            const duplicates: StudentData[] = [];
            const missingInfoStudents: StudentData[] = [];
            
            for (const student of allStudents) {
                const name = student.name.trim();
                const grade = student.grade.trim();
                
                // 1. Check for missing required info (name and grade are essential)
                if (!name || !grade) {
                    missingInfoStudents.push(student);
                    continue; // Skip duplicate check for incomplete entries
                }
                
                // 2. Check for duplicates based on a unique key
                const classroom = student.classroom.trim();
                const key = `${name}|${grade}|${classroom}`;
                if (seen.has(key)) {
                    duplicates.push(student);
                } else {
                    seen.add(key);
                }
            }
            
            const errorMessages: string[] = [];
            if (missingInfoStudents.length > 0) {
                const problematicRows = missingInfoStudents.slice(0, 3).map(s => `(เลขที่: ${s.no || 'N/A'}, ชื่อ: ${s.name || 'N/A'})`).join(', ');
                errorMessages.push(`พบ ${missingInfoStudents.length} รายการข้อมูลไม่สมบูรณ์ (ไม่มีชื่อหรือระดับชั้น) ตัวอย่าง: ${problematicRows}.`);
            }
            if (duplicates.length > 0) {
                const duplicateNames = duplicates.slice(0, 3).map(d => `${d.name} (ชั้น ${d.grade})`).join(', ');
                errorMessages.push(`พบ ${duplicates.length} รายการข้อมูลนักเรียนซ้ำซ้อน ตัวอย่าง: ${duplicateNames}.`);
            }
            
            if (errorMessages.length > 0) {
                onError(`เกิดข้อผิดพลาดในการตรวจสอบไฟล์: ${errorMessages.join(' ')} กรุณาแก้ไขข้อมูลในไฟล์แล้วลองอีกครั้ง`);
                return; // Stop the process and show error
            }

            onFilesParsed(studentArrays, fileNames);
        } catch (err: any) {
            onError(err.toString());
        }
    }, [onFilesParsed, onError]);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ["เลขที่", "คำนำหน้าชื่อ ชื่อ - สกุล", "ระดับชั้น", "ห้องเรียน"];
        const ws_data = [ headers ];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        
        ws['!dataValidation'] = [
            { sqref: 'C2:C1000', type: 'list', formula1: '"ป.1,ป.3,ป.6,ม.3,ม.6"' },
            { sqref: 'D2:D1000', type: 'list', formula1: '"1,2"' }
        ];
        
        const headerStyle = { font: { bold: true }, alignment: { vertical: 'center' } };
        ws['A1'].s = { ...headerStyle, alignment: { ...headerStyle.alignment, horizontal: 'center' } };
        ws['B1'].s = { ...headerStyle, alignment: { ...headerStyle.alignment, horizontal: 'left' } };
        ws['C1'].s = { ...headerStyle, alignment: { ...headerStyle.alignment, horizontal: 'center' } };
        ws['D1'].s = { ...headerStyle, alignment: { ...headerStyle.alignment, horizontal: 'center' } };

        ws['!cols'] = [ { wch: 10 }, { wch: 40 }, { wch: 15 }, { wch: 15 } ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "รายชื่อนักเรียน");
        XLSX.writeFile(wb, "student-list-template.xlsx");
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div 
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative flex-grow w-full border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${isDragging ? 'border-warm-orange bg-light-cream' : 'border-gray-300 bg-gray-50'}`}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".xlsx, .csv"
                    multiple // Allow multiple files
                />
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer">
                    <UploadIcon className="h-12 w-12 text-gray-400 mb-2" />
                    <span className="font-semibold text-gray-600">ลากไฟล์มาวาง หรือ <span className="text-warm-orange">คลิกเพื่อเลือกไฟล์</span></span>
                    <p className="text-sm text-gray-500 mt-1">สามารถเลือกได้หลายไฟล์ | รองรับ .xlsx, .csv</p>
                </label>
            </div>
            <div className="flex-shrink-0">
                <button 
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all"
                >
                   <DownloadIcon className="h-5 w-5" />
                    ดาวน์โหลดไฟล์ Template
                </button>
            </div>
        </div>
    );
};

export default FileUpload;