
import React from 'react';
import { SchoolLogoIcon } from './icons/SchoolLogoIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md p-4">
      <div className="container mx-auto flex items-center justify-center text-center flex-col space-y-2">
        <SchoolLogoIcon className="h-20 w-20 text-warm-orange" />
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800">
            ระบบรายงานผลการยกระดับผลสัมฤทธิ์ทางการทดสอบระดับชาติ RT / NT / O-NET
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            โรงเรียนวัดคิรีวิหาร(สมเด็จพระวันรัต อุปถัมภ์) สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจันทบุรี
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
