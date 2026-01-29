
import React, { useState, useEffect, useCallback } from 'react';
import { LibraryItem, PresentationItem, QuestionItem, LibraryType } from '../../types';
import { fetchLibraryPaginated } from '../../services/gasService';
import { fetchPresentationsPaginated } from '../../services/PresentationService';
import { fetchAllQuestionsPaginated } from '../../services/QuestionService';
import { 
  X, 
  Search, 
  BookOpen, 
  Plus,
  Loader2,
  Presentation,
  GraduationCap
} from 'lucide-react';
import { SmartSearchBox } from '../Common/SearchComponents';
import { 
  StandardTableContainer, 
  StandardTableWrapper, 
  StandardTh, 
  StandardTr, 
  StandardTd, 
  StandardTableFooter,
  ElegantTooltip
} from '../Common/TableComponents';
import { TableSkeletonRows } from '../Common/LoadingComponents';

export type PickerType = 'LIBRARY' | 'PRESENTATION' | 'QUESTION';

interface ResourcePickerProps {
  type: PickerType;
  onClose: () => void;
  onSelect: (id: string, title: string) => void;
}

const ResourcePicker: React.FC<ResourcePickerProps> = ({ type, onClose, onSelect }) => {
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  
  const itemsPerPage = 8;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (type === 'LIBRARY') {
        const res = await fetchLibraryPaginated(currentPage, itemsPerPage, appliedSearch, 'All', '', 'createdAt', 'desc');
        setItems(res.items);
        setTotalCount(res.totalCount);
      } else if (type === 'PRESENTATION') {
        const res = await fetchPresentationsPaginated(currentPage, itemsPerPage, appliedSearch);
        setItems(res.items);
        setTotalCount(res.totalCount);
      } else if (type === 'QUESTION') {
        const res = await fetchAllQuestionsPaginated(currentPage, itemsPerPage, appliedSearch);
        setItems(res.items);
        setTotalCount(res.totalCount);
      }
    } catch (e) {
      console.error("Picker load error", e);
    } finally {
      setIsLoading(false);
    }
  }, [type, currentPage, appliedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = () => {
    setAppliedSearch(localSearch);
    setCurrentPage(1);
  };

  const getIcon = () => {
    if (type === 'PRESENTATION') return <Presentation size={24} />;
    if (type === 'QUESTION') return <GraduationCap size={24} />;
    return <BookOpen size={24} />;
  };

  const getTitle = () => {
    if (type === 'PRESENTATION') return "Presentation Repository";
    if (type === 'QUESTION') return "AI Question Bank";
    return "Xeenaps Librarian";
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in">
       <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          
          <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
                   {getIcon()}
                </div>
                <div>
                   <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">{getTitle()}</h2>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select relevant resources for your session</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"><X size={24} /></button>
          </div>

          <div className="px-8 py-4 bg-white border-b border-gray-100 shrink-0">
             <SmartSearchBox 
               value={localSearch} 
               onChange={setLocalSearch} 
               onSearch={handleSearch} 
               className="w-full"
               phrases={["Search title...", "Search keywords...", "Search presenters..."]}
             />
          </div>

          <div className="flex-1 overflow-hidden p-6 flex flex-col bg-[#fcfcfc]">
             <StandardTableContainer>
                <StandardTableWrapper>
                   <thead>
                      <tr>
                         <StandardTh width="450px">Resource Title / Identity</StandardTh>
                         <StandardTh width="150px">{type === 'LIBRARY' ? 'Category' : type === 'PRESENTATION' ? 'Presenters' : 'Bloom Tier'}</StandardTh>
                         <StandardTh width="120px">Date</StandardTh>
                         <StandardTh width="100px" className="sticky right-0 bg-gray-50">Action</StandardTh>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {isLoading ? (
                         <TableSkeletonRows count={5} />
                      ) : items.length === 0 ? (
                         <tr><td colSpan={4} className="py-20 text-center font-black text-gray-300 uppercase text-xs tracking-widest">No matching items found</td></tr>
                      ) : (
                         items.map(item => {
                           const displayTitle = item.title || item.questionText || 'Untitled';
                           const subInfo = item.category || (item.presenters ? item.presenters.join(', ') : item.bloomLevel) || '-';
                           const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-';
                           
                           return (
                             <StandardTr key={item.id}>
                               <StandardTd>
                                  <ElegantTooltip text={displayTitle}>
                                     <p className="text-xs font-bold text-[#004A74] uppercase line-clamp-1">{displayTitle}</p>
                                  </ElegantTooltip>
                               </StandardTd>
                               <StandardTd className="text-[10px] font-bold text-gray-500 uppercase truncate">{subInfo}</StandardTd>
                               <StandardTd className="text-[10px] font-mono font-bold text-gray-400 text-center">{date}</StandardTd>
                               <StandardTd className="sticky right-0 bg-white group-hover:bg-[#f0f7fa]">
                                  <button 
                                    onClick={() => onSelect(item.id, displayTitle)}
                                    className="w-full py-2 bg-[#004A74] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FED400] hover:text-[#004A74] transition-all flex items-center justify-center gap-2"
                                  >
                                     <Plus size={12} strokeWidth={4} /> Select
                                  </button>
                               </StandardTd>
                             </StandardTr>
                           );
                         })
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

export default ResourcePicker;
