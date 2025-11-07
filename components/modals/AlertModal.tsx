import React from 'react';
import { InfoIcon } from '../icons/InfoIcon';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message }) => {
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
                    <InfoIcon className="h-16 w-16 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
                <p className="text-gray-600">{message}</p>
                 <button
                    onClick={onClose}
                    className="mt-6 w-full px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    ตกลง
                </button>
            </div>
        </div>
    );
};

export default AlertModal;