import React from 'react';
import { PencilSquareIcon } from './icons/PencilSquareIcon';

interface FilterProps {
  groups: {
    col1: {
        title: string;
        items: string[];
    };
    col2: {
        title: string;
        groups: {
            groupName: string;
            attempts: string[];
        }[];
    };
  };
  selectedValues: string[];
  onChange: (value: string) => void;
  onPreTestCardClick: (groupName: string) => void;
}

const Filter: React.FC<FilterProps> = ({ groups, selectedValues, onChange, onPreTestCardClick }) => {

  const renderCol1Button = (option: string) => {
    const isSelected = selectedValues.includes(option);
    return (
        <button
            key={option}
            onClick={() => onChange(option)}
            className={`w-full px-3 py-4 text-md font-bold rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 ${
            isSelected
                ? 'bg-warm-orange text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
            }`}
            aria-pressed={isSelected}
        >
            {option}
        </button>
    );
  };
  
  // Split groups for the new layout
  const row1Groups = groups.col2.groups.filter(g => g.groupName.includes('RT') || g.groupName.includes('NT'));
  const row2Groups = groups.col2.groups.filter(g => g.groupName.includes('O-NET'));

  // Reusable function to render a single card
  const renderPreTestCard = (group: { groupName: string; attempts: string[] }) => (
    <div key={group.groupName} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl text-center transition-shadow hover:shadow-lg w-full">
        <p className="text-sm font-semibold text-gray-700 mb-2.5 truncate w-full h-10 flex items-center justify-center" title={group.groupName}>
            {group.groupName}
        </p>
        <div className="mt-2.5 w-full">
             <button
                onClick={() => onPreTestCardClick(group.groupName)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-white bg-warm-orange hover:bg-opacity-90 transition-all transform hover:scale-105 shadow"
            >
                <PencilSquareIcon className="h-4 w-4" />
                บันทึก / ดูผลคะแนน
            </button>
        </div>
    </div>
  );


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start border-t pt-4">
        {/* Column 1 - Updated Layout */}
        <div className="border-r-0 md:border-r md:pr-8">
            <h4 className="text-md font-semibold text-gray-600 mb-4 text-center">{groups.col1.title}</h4>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {groups.col1.items.map(option => renderCol1Button(option))}
            </div>
        </div>

        {/* Column 2 - Redesigned with new layout */}
        <div>
            <h4 className="text-md font-semibold text-gray-600 mb-4 text-center">{groups.col2.title}</h4>
            <div className="flex flex-col items-center space-y-3">
                 {/* Row 1 */}
                 <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                     {row1Groups.map(renderPreTestCard)}
                 </div>
                 {/* Row 2 */}
                 <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                     {row2Groups.map(renderPreTestCard)}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default Filter;