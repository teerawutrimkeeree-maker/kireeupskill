import React, { useState, useEffect, useRef } from 'react';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SCORE_ENTRY_MENU_CONFIG } from '../constants';

interface MainMenuProps {
    onStartScoreEntry: (attempt: string) => void;
    onStartPreTestEntry: (groupName: string) => void;
    onToggleReportView: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartScoreEntry, onStartPreTestEntry, onToggleReportView }) => {
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleMenu = (menu: string) => {
        setOpenMenu(prev => (prev === menu ? null : menu));
    };
    
    const handleScoreEntryClick = (item: string) => {
        onStartScoreEntry(item);
        setOpenMenu(null);
    };

    const handlePreTestEntryClick = (groupName: string) => {
        onStartPreTestEntry(groupName);
        setOpenMenu(null);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const renderDropdown = (menuName: string, children: React.ReactNode, widthClass: string = 'w-64') => (
        <div className={`absolute top-full mt-2 ${widthClass} rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-out origin-top ${openMenu === menuName ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="py-1 max-h-96 overflow-y-auto" role="menu" aria-orientation="vertical">
                {children}
            </div>
        </div>
    );
    
    const MenuButton: React.FC<{ menuKey: string, icon: React.ReactNode, label: string, baseClasses: string, activeClasses: string, hasDropdown?: boolean }> = ({ menuKey, icon, label, baseClasses, activeClasses, hasDropdown = true }) => (
        <button
            onClick={() => hasDropdown ? toggleMenu(menuKey) : onToggleReportView()}
            className={`inline-flex w-72 items-center justify-center gap-4 px-6 py-4 text-lg font-bold rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${openMenu === menuKey ? activeClasses : baseClasses}`}
        >
            {icon}
            <span className="leading-tight">{label}</span>
            {hasDropdown && <ChevronDownIcon className={`h-6 w-6 transition-transform duration-200 ${openMenu === menuKey ? 'rotate-180' : ''}`} />}
        </button>
    );

    return (
        <nav ref={menuRef} className="bg-white shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 md:px-8">
                <div className="relative flex items-center justify-center h-24 space-x-8">
                    
                    {/* Menu: Score Entry */}
                    <div className="relative">
                         <MenuButton 
                            menuKey="score-entry" 
                            icon={<PencilSquareIcon className="h-7 w-7" />} 
                            label="บันทึกคะแนน"
                            baseClasses="bg-light-green text-gray-700 hover:bg-blue-gray focus:ring-blue-gray"
                            activeClasses="bg-blue-gray text-gray-800 focus:ring-blue-gray"
                         />
                         {renderDropdown('score-entry',
                            <>
                                {/* Single Attempts */}
                                <div>
                                    <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">{SCORE_ENTRY_MENU_CONFIG[0].groupName}</div>
                                    {SCORE_ENTRY_MENU_CONFIG[0].items.map(item => (
                                        <button key={item} onClick={() => handleScoreEntryClick(item)} className="w-full text-left block px-5 py-2 text-base text-gray-700 hover:bg-gray-100" role="menuitem">
                                            {item}
                                        </button>
                                    ))}
                                </div>

                                <div className="border-t my-1 mx-2"></div>

                                {/* Pre-Tests */}
                                <div>
                                    {SCORE_ENTRY_MENU_CONFIG[1].items.map(item => (
                                        <button key={item.value} onClick={() => handlePreTestEntryClick(item.value)} className="w-full text-left block px-5 py-2 text-base text-gray-700 hover:bg-gray-100" role="menuitem">
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </>,
                            'w-72'
                         )}
                    </div>
                    
                    {/* Button: Download Report */}
                    <div className="relative">
                        <MenuButton 
                            menuKey="download" 
                            icon={<ArrowDownTrayIcon className="h-7 w-7" />} 
                            label="รายงานระดับสถานศึกษา"
                            baseClasses="bg-light-cream text-warm-orange hover:bg-orange-200 focus:ring-warm-orange"
                            activeClasses="bg-orange-200 text-warm-orange focus:ring-warm-orange"
                            hasDropdown={false}
                        />
                    </div>

                </div>
            </div>
        </nav>
    );
};

export default MainMenu;