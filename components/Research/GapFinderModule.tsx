
import React from 'react';
// @ts-ignore
import { Routes, Route, Navigate } from 'react-router-dom';
import { LibraryItem } from '../../types';
import ResearchMainView from './ResearchMainView';
import ResearchForm from './ResearchForm';
import ResearchWorkArea from './ResearchWorkArea';
import AllBrainstorming from './Brainstorming/AllBrainstorming';
import BrainstormingDetail from './Brainstorming/BrainstormingDetail';

interface GapFinderModuleProps {
  items: LibraryItem[];
}

const GapFinderModule: React.FC<GapFinderModuleProps> = ({ items }) => {
  return (
    <div className="absolute inset-0 bg-white overflow-hidden flex flex-col animate-in fade-in duration-700">
      <Routes>
        <Route path="/" element={<ResearchMainView items={items} />} />
        <Route path="/new" element={<ResearchForm items={items} />} />
        <Route path="/work/:projectId" element={<ResearchWorkArea libraryItems={items} />} />
        
        {/* BRAINSTORMING ROUTES */}
        <Route path="/brainstorming" element={<AllBrainstorming />} />
        <Route path="/brainstorming/:id" element={<BrainstormingDetail libraryItems={items} />} />
        
        <Route path="*" element={<Navigate to="/research" replace />} />
      </Routes>
    </div>
  );
};

export default GapFinderModule;
