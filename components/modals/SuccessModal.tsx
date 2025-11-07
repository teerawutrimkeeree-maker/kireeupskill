import React, { useEffect } from 'react';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
    duration?: number;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, message, duration = 3000 }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose, duration]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-sm w-full text-center transform transition-all animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center mb-4">
                    <CheckCircleIcon className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">สำเร็จ!</h2>
                <p className="text-gray-600">{message}</p>
                 <button
                    onClick={onClose}
                    className="mt-6 w-full px-4 py-2 text-sm font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    ปิด
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
