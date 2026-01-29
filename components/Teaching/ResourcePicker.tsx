
import React, { useState, useEffect } from 'react';
import { LibraryItem, LibraryType } from '../../types';
import { fetchLibraryPaginated } from '../../services/gasService';
import { 
  X, 
  Search, 
  BookOpen, 
  Check, 
  Plus,
  Loader2,
  Filter
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

interface ResourcePickerProps {
  onClose: () => void;
  onSelect: (id: string) => void;
}

const ResourcePicker: React.FC<ResourcePickerProps> = ({ onClose, onSelect }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  
  const itemsPerPage = 10;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const result = await fetchLibraryPaginated(currentPage, itemsPerPage, appliedSearch, 'All', '', 'createdAt', 'desc');
      setItems(result.items);
      setTotalCount(result.totalCount);
      setIsLoading(false);
    };
    load();
  }, [currentPage, appliedSearch]);

  const handleSearch = () => {
    setAppliedSearch(localSearch);
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in">
       <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          
          <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg"><BookOpen size={24} /></div>
                <div>
                   <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">Resource Picker</h2>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attach collections from Xeenaps Librarian</p>
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
             />
          </div>

          <div className="flex-1 overflow-hidden p-6 flex flex-col bg-[#fcfcfc]">
             <StandardTableContainer>
                <StandardTableWrapper>
                   <thead>
                      <tr>
                         <StandardTh width="120px">Type</StandardTh>
                         <StandardTh width="400px">Title / Asset Identity</StandardTh>
                         <StandardTh width="200px">Author</StandardTh>
                         <StandardTh width="100px" className="sticky right-0 bg-gray-50">Action</StandardTh>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {isLoading ? (
                         <TableSkeletonRows count={5} />
                      ) : items.length === 0 ? (
                         <tr><td colSpan={4} className="py-20 text-center font-black text-gray-300 uppercase text-xs tracking-widest">No matching library items</td></tr>
                      ) : (
                         items.map(item => (
                            <StandardTr key={item.id}>
                               <StandardTd>
                                  <span className="px-3 py-1 bg-[#004A74]/5 text-[#004A74] text-[8px] font-black uppercase tracking-widest rounded-full">{item.type}</span>
                               </StandardTd>
                               <StandardTd>
                                  <ElegantTooltip text={item.title}>
                                     <p className="text-xs font-bold text-[#004A74] uppercase line-clamp-1">{item.title}</p>
                                  </ElegantTooltip>
                               </StandardTd>
                               <StandardTd className="text-[10px] font-bold text-gray-400 italic truncate">{item.authors?.join(', ') || '-'}</StandardTd>
                               <StandardTd className="sticky right-0 bg-white group-hover:bg-[#f0f7fa]">
                                  <button 
                                    onClick={() => onSelect(item.id)}
                                    className="w-full py-2 bg-[#004A74] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FED400] hover:text-[#004A74] transition-all flex items-center justify-center gap-2"
                                  >
                                     <Plus size={12} strokeWidth={4} /> Select
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

export default ResourcePicker;
