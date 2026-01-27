
import React, { useState, useEffect } from 'react';
import { LibraryItem, LibraryType } from '../../types';
import { fetchLibraryPaginated } from '../../services/gasService';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon,
  CheckIcon,
  BookOpenIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { SmartSearchBox } from '../Common/SearchComponents';
import { 
  StandardTableContainer, 
  StandardTableWrapper, 
  StandardTh, 
  StandardTr, 
  StandardTd, 
  StandardTableFooter,
  StandardCheckbox,
  ElegantTooltip
} from '../Common/TableComponents';
import { TableSkeletonRows } from '../Common/LoadingComponents';

interface ResearchSourceSelectorModalProps {
  onClose: () => void;
  onAudit: (selected: LibraryItem[]) => void;
}

const ResearchSourceSelectorModal: React.FC<ResearchSourceSelectorModalProps> = ({ onClose, onAudit }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selected, setSelected] = useState<LibraryItem[]>([]);

  const itemsPerPage = 10;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const result = await fetchLibraryPaginated(currentPage, itemsPerPage, appliedSearch, LibraryType.LITERATURE, 'research', 'createdAt', 'desc');
      setItems(result.items);
      setTotalCount(result.totalCount);
      setIsLoading(false);
    };
    loadData();
  }, [currentPage, appliedSearch]);

  const handleSearch = () => {
    setAppliedSearch(localSearch);
    setCurrentPage(1);
  };

  const toggleSelect = (item: LibraryItem) => {
    const isAlreadySelected = selected.some(s => s.id === item.id);
    if (isAlreadySelected) {
      setSelected(selected.filter(s => s.id !== item.id));
    } else {
      if (selected.length >= 3) return; // Limit 3
      setSelected([...selected, item]);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpenIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">Smart Source Selector</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select 1-3 Items for Matrix Audit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 shrink-0">
          <SmartSearchBox 
            value={localSearch} 
            onChange={setLocalSearch} 
            onSearch={handleSearch} 
            className="w-full"
          />
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col">
          <StandardTableContainer>
            <StandardTableWrapper>
              <thead>
                <tr>
                  <StandardTh width="60px">Pick</StandardTh>
                  <StandardTh width="120px">Topic</StandardTh>
                  <StandardTh width="400px">Title (Search Identical Metadata)</StandardTh>
                  <StandardTh width="200px">Authors</StandardTh>
                  <StandardTh width="100px">Year</StandardTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <TableSkeletonRows count={5} />
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center font-bold text-gray-400 uppercase text-xs">No matching literature</td></tr>
                ) : (
                  items.map((item) => {
                    const isSelected = selected.some(s => s.id === item.id);
                    return (
                      <StandardTr 
                        key={item.id} 
                        onClick={() => toggleSelect(item)} 
                        className={`cursor-pointer ${isSelected ? 'bg-[#004A74]/5' : ''}`}
                      >
                        <td className="px-6 py-4 text-center">
                          <div className={`w-5 h-5 mx-auto rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#004A74] border-[#004A74] text-white shadow-md' : 'border-gray-200 bg-white'}`}>
                            {isSelected && <CheckIcon className="w-3 h-3 stroke-[4]" />}
                          </div>
                        </td>
                        <StandardTd>
                          <span className="text-[10px] font-black uppercase text-[#004A74] opacity-70 truncate block">{item.topic || 'General'}</span>
                        </StandardTd>
                        <StandardTd>
                          <ElegantTooltip text={item.title}>
                            <p className="text-xs font-bold text-[#004A74] uppercase line-clamp-1">{item.title}</p>
                          </ElegantTooltip>
                        </StandardTd>
                        <StandardTd className="text-xs italic text-gray-500 truncate">{item.authors?.join(', ')}</StandardTd>
                        <StandardTd className="text-center text-xs font-mono font-bold text-gray-400">{item.year}</StandardTd>
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

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < selected.length ? 'bg-[#FED400]' : 'bg-gray-200'}`} />
            ))}
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{selected.length} / 3 Selected</span>
          </div>
          <button 
            onClick={() => onAudit(selected)}
            disabled={selected.length === 0}
            className="px-10 py-4 bg-[#004A74] text-[#FED400] rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#004A74]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale"
          >
            <SparklesIcon className="w-5 h-5" /> Start Matrix Audit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResearchSourceSelectorModal;
