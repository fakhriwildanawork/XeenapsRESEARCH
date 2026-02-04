import React, { useState, useEffect } from 'react';
import { LibraryItem, LibraryType } from '../../../types';
import { fetchLibraryPaginated } from '../../../services/gasService';
import { 
  XMarkIcon, 
  CheckIcon, 
  PlusIcon,
  BookOpenIcon, 
  SparklesIcon,
  CheckCircleIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import { SmartSearchBox } from '../../Common/SearchComponents';
import { 
  StandardTableFooter
} from '../../Common/TableComponents';
import { CardGridSkeleton } from '../../Common/LoadingComponents';

interface ReviewSourceSelectorModalProps {
  onClose: () => void;
  onConfirm: (selected: LibraryItem[]) => void;
}

const ReviewSourceSelectorModal: React.FC<ReviewSourceSelectorModalProps> = ({ onClose, onConfirm }) => {
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
      // Filter hanya tipe Literature yang punya extractedJsonId
      const result = await fetchLibraryPaginated(currentPage, itemsPerPage, appliedSearch, LibraryType.LITERATURE, 'research', 'createdAt', 'desc');
      setItems(result.items.filter(it => !!it.extractedJsonId));
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
      if (selected.length >= 3) return; // STRICT LIMIT: 3 Items
      setSelected([...selected, item]);
    }
  };

  const handleExecute = () => {
    if (selected.length === 0) return;
    onConfirm(selected);
    setSelected([]); 
    onClose(); 
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/20">
        
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpenIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">Source Lit discovery</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select 1-3 Collections for Parallel Extraction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>

        {/* Search & Meta Bar */}
        <div className="px-8 py-4 bg-white border-b border-gray-100 shrink-0 space-y-3">
          <SmartSearchBox 
            value={localSearch} 
            onChange={setLocalSearch} 
            onSearch={handleSearch} 
            className="w-full"
            phrases={["Filter by title...", "Filter by topic..."]}
          />
          <div className="flex items-center gap-2.5 p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
             <CheckCircleIcon className="text-[#004A74] shrink-0 w-3.5 h-3.5" />
             <p className="text-[8px] font-black text-[#004A74]/70 uppercase tracking-widest">
                Verified literature with extracted content ready for synthesis.
             </p>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col bg-[#fcfcfc]">
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1 pb-4">
              {isLoading ? (
                <CardGridSkeleton count={6} />
              ) : items.length === 0 ? (
                <div className="py-24 text-center opacity-30 flex flex-col items-center">
                   <InboxIcon className="w-16 h-16 mb-4 text-[#004A74]" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No verified literature found</p>
                </div>
              ) : (
                items.map((item) => {
                  const isSelected = selected.some(s => s.id === item.id);
                  const isFull = !isSelected && selected.length >= 3;
                  
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => !isFull && toggleSelect(item)} 
                      className={`bg-white border rounded-[1.5rem] p-4 flex items-center gap-5 shadow-sm transition-all duration-300 relative overflow-hidden group ${isSelected ? 'border-[#004A74] ring-2 ring-[#004A74]/5 bg-blue-50/30' : isFull ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:border-[#004A74]/30 hover:shadow-md cursor-pointer'}`}
                    >
                        {/* Selector Indicator */}
                        <div className={`shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#004A74] border-[#004A74] text-white shadow-lg' : 'bg-white border-gray-200 group-hover:border-[#004A74]/40'}`}>
                           {isSelected ? <CheckIcon className="w-4 h-4 stroke-[4]" /> : <PlusIcon className="w-4 h-4 text-gray-300" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                           <h4 className="text-sm font-black text-[#004A74] uppercase leading-tight truncate">{item.title}</h4>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="px-2 py-0.5 bg-[#004A74]/5 text-[#004A74] text-[8px] font-black uppercase rounded-md tracking-widest">{item.topic || 'Literature'}</span>
                              <div className="w-1 h-1 rounded-full bg-gray-200" />
                              <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{item.year}</span>
                           </div>
                        </div>
                    </div>
                  );
                })
              )}
           </div>

           <div className="shrink-0 border-t border-gray-100 pt-4 mt-2">
              <StandardTableFooter 
                totalItems={totalCount} 
                currentPage={currentPage} 
                itemsPerPage={itemsPerPage} 
                totalPages={Math.ceil(totalCount / itemsPerPage)} 
                onPageChange={setCurrentPage} 
              />
           </div>
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${i < selected.length ? 'bg-[#FED400] border-[#FED400] shadow-sm' : 'bg-white border-gray-200'}`} />
                ))}
             </div>
             <span className="text-[10px] font-black text-[#004A74] uppercase tracking-widest ml-2">{selected.length} / 3 Selected</span>
          </div>
          <div className="flex gap-3">
             <button onClick={onClose} className="px-8 py-3.5 bg-white text-gray-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all shadow-sm">Cancel</button>
             <button 
                onClick={handleExecute}
                disabled={selected.length === 0}
                className="px-10 py-4 bg-[#004A74] text-[#FED400] rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale"
             >
                <SparklesIcon className="w-4 h-4" /> Execute Extraction
             </button>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ReviewSourceSelectorModal;