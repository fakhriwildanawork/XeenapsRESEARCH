import React, { useState, useEffect, useCallback } from 'react';
import { LibraryItem, TracerProject } from '../../../types';
import { fetchTracerProjects, linkTracerReference } from '../../../services/TracerService';
import { 
  X, 
  Target, 
  Plus, 
  Loader2,
  ChevronRight,
  Calendar,
  User
} from 'lucide-react';
import { SmartSearchBox } from '../../Common/SearchComponents';
import { 
  StandardTableContainer, 
  StandardTableWrapper, 
  StandardTh, 
  StandardTr, 
  StandardTd, 
  StandardTableFooter
} from '../../Common/TableComponents';
import { TableSkeletonRows } from '../../Common/LoadingComponents';
import { showXeenapsToast } from '../../../utils/toastUtils';

interface TracerProjectPickerProps {
  item: LibraryItem;
  onClose: () => void;
}

const TracerProjectPicker: React.FC<TracerProjectPickerProps> = ({ item, onClose }) => {
  const [projects, setProjects] = useState<TracerProject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  
  const itemsPerPage = 10;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchTracerProjects(currentPage, itemsPerPage, appliedSearch);
      setProjects(result.items);
      setTotalCount(result.totalCount);
    } catch (e) {
      console.error("Tracer projects fetch error", e);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, appliedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelect = async (project: TracerProject) => {
    setIsLinking(true);
    showXeenapsToast('info', `Anchoring knowledge to ${project.label}...`);
    
    try {
      const result = await linkTracerReference({
        projectId: project.id,
        collectionId: item.id
      });
      
      if (result) {
        showXeenapsToast('success', 'Document anchored in project trail');
        onClose();
      } else {
        showXeenapsToast('error', 'Anchoring failed');
      }
    } catch (e) {
      showXeenapsToast('error', 'Connection error');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
       {/* FULL BODY OVERLAY LOADER */}
       {isLinking && (
         <div className="fixed inset-0 z-[9999] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="flex flex-col items-center gap-4">
             <Loader2 size={48} className="text-[#004A74] animate-spin" />
             <p className="text-sm font-black text-[#004A74] uppercase tracking-[0.2em] animate-pulse">Anchoring Intelligence...</p>
           </div>
         </div>
       )}

       <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          
          <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
                   <Target size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">Tracer Deployment</h2>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select target project for audit trail</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"><X size={24} /></button>
          </div>

          <div className="px-8 py-4 bg-white border-b border-gray-100 shrink-0">
             <SmartSearchBox 
               value={search} 
               onChange={setSearch} 
               className="w-full"
               onSearch={() => {
                 setAppliedSearch(search);
                 setCurrentPage(1);
               }}
               phrases={["Search project name...", "Search by label..."]}
             />
          </div>

          <div className="flex-1 overflow-hidden p-6 flex flex-col bg-[#fcfcfc]">
             <StandardTableContainer>
                <StandardTableWrapper>
                   <thead>
                      <tr>
                         <StandardTh width="600px" className="text-left">Research Tracer</StandardTh>
                         <StandardTh width="120px" className="sticky right-0 bg-gray-50">Action</StandardTh>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {isLoading ? (
                         <TableSkeletonRows count={5} />
                      ) : projects.length === 0 ? (
                         <tr><td colSpan={2} className="py-20 text-center font-black text-gray-300 uppercase text-xs tracking-widest">No active tracer projects</td></tr>
                      ) : (
                         projects.map(p => (
                             <StandardTr key={p.id}>
                               <StandardTd>
                                  <p className="text-xs font-bold text-[#004A74] uppercase line-clamp-1">{p.title || p.label}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-black bg-[#004A74]/5 text-[#004A74] px-1.5 py-0.5 rounded-md uppercase">{p.label}</span>
                                  </div>
                                  <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 italic">
                                     {Array.isArray(p.authors) ? p.authors.join(', ') : 'N/A'}
                                  </p>
                               </StandardTd>
                               <StandardTd className="sticky right-0 bg-white group-hover:bg-[#f0f7fa]">
                                  <button 
                                    disabled={isLinking}
                                    onClick={() => handleSelect(p)}
                                    className="w-full py-2 bg-[#004A74] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FED400] hover:text-[#004A74] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                  >
                                     {isLinking ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={4} />} Select
                                  </button>
                               </StandardTd>
                             </StandardTr>
                         ))
                      )}
                   </tbody>
                </StandardTableWrapper>
                <StandardTableFooter 
                  totalItems={totalCount} 
                  currentPage={currentPage} 
                  itemsPerPage={itemsPerPage} 
                  totalPages={Math.ceil(totalCount / itemsPerPage)} 
                  onPageChange={setCurrentPage} 
                />
             </StandardTableContainer>
          </div>
       </div>
    </div>
  );
};

export default TracerProjectPicker;

const Check = (props: any) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);