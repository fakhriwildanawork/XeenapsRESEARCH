import React, { useState, useEffect, useCallback } from 'react';
import { LibraryItem, TeachingItem } from '../../types';
import { fetchTeachingPaginated, saveTeachingItem } from '../../services/TeachingService';
import { 
  X, 
  BookOpenCheck, 
  Plus, 
  Loader2,
  ChevronRight,
  Calendar,
  School
} from 'lucide-react';
import { SmartSearchBox } from '../Common/SearchComponents';
import { 
  StandardTableContainer, 
  StandardTableWrapper, 
  StandardTh, 
  StandardTr, 
  StandardTd, 
  StandardTableFooter
} from '../Common/TableComponents';
import { TableSkeletonRows } from '../Common/LoadingComponents';
import { showXeenapsToast } from '../../utils/toastUtils';

interface TeachingSessionPickerProps {
  item: LibraryItem;
  onClose: () => void;
}

const TeachingSessionPicker: React.FC<TeachingSessionPickerProps> = ({ item, onClose }) => {
  const [sessions, setSessions] = useState<TeachingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const itemsPerPage = 6;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchTeachingPaginated(currentPage, itemsPerPage, search);
      setSessions(result.items);
      setTotalCount(result.totalCount);
    } catch (e) {
      console.error("Teaching sessions fetch error", e);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelect = async (session: TeachingItem) => {
    setIsLinking(true);
    showXeenapsToast('info', `Linking to ${session.courseTitle || session.label}...`);
    
    try {
      const currentRefs = Array.isArray(session.referenceLinks) ? session.referenceLinks : [];
      if (currentRefs.some(r => r.id === item.id)) {
        showXeenapsToast('warning', 'Already linked to this session');
        setIsLinking(false);
        return;
      }

      const updatedSession = {
        ...session,
        referenceLinks: [...currentRefs, { id: item.id, title: item.title }],
        updatedAt: new Date().toISOString()
      };

      const success = await saveTeachingItem(updatedSession);
      
      if (success) {
        showXeenapsToast('success', 'Session reference synchronized');
        onClose();
      } else {
        showXeenapsToast('error', 'Synchronization failed');
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
             <p className="text-sm font-black text-[#004A74] uppercase tracking-[0.2em] animate-pulse">Synchronizing Intelligence...</p>
           </div>
         </div>
       )}

       <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          
          <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
                   <BookOpenCheck size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">Teaching Resource</h2>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select session to attach literature</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"><X size={24} /></button>
          </div>

          <div className="px-8 py-4 bg-white border-b border-gray-100 shrink-0">
             <SmartSearchBox 
               value={search} 
               onChange={setSearch} 
               className="w-full"
               onSearch={() => setCurrentPage(1)}
               phrases={["Search course title...", "Search session label..."]}
             />
          </div>

          <div className="flex-1 overflow-hidden p-6 flex flex-col bg-[#fcfcfc]">
             <StandardTableContainer>
                <StandardTableWrapper>
                   <thead>
                      <tr>
                         <StandardTh width="120px">Session Date</StandardTh>
                         <StandardTh width="300px">Course / Topic</StandardTh>
                         <StandardTh width="250px">Institution</StandardTh>
                         <StandardTh width="100px" className="sticky right-0 bg-gray-50">Action</StandardTh>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {isLoading ? (
                         <TableSkeletonRows count={5} />
                      ) : sessions.length === 0 ? (
                         <tr><td colSpan={4} className="py-20 text-center font-black text-gray-300 uppercase text-xs tracking-widest">No matching teaching sessions</td></tr>
                      ) : (
                         sessions.map(s => (
                             <StandardTr key={s.id}>
                               <StandardTd className="font-mono text-[10px] font-bold text-gray-400">
                                  {s.teachingDate}
                               </StandardTd>
                               <StandardTd>
                                  <p className="text-xs font-bold text-[#004A74] uppercase truncate">{s.courseTitle || 'Untitled Course'}</p>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase truncate mt-0.5">{s.label}</p>
                               </StandardTd>
                               <StandardTd className="text-[10px] font-bold text-gray-500 uppercase truncate">{s.institution || 'N/A'}</StandardTd>
                               <StandardTd className="sticky right-0 bg-white group-hover:bg-[#f0f7fa]">
                                  <button 
                                    disabled={isLinking}
                                    onClick={() => handleSelect(s)}
                                    className="w-full py-2 bg-[#004A74] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FED400] hover:text-[#004A74] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                  >
                                     {isLinking ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} strokeWidth={4} />} Link
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

export default TeachingSessionPicker;