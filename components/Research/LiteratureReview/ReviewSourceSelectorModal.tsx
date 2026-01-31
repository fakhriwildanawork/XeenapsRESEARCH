
import React, { useState, useEffect } from 'react';
import { LibraryItem, LibraryType } from '../../../types';
import { fetchLibraryPaginated } from '../../../services/gasService';
import { 
  X, 
  Search, 
  Check, 
  BookOpen, 
  Sparkles,
  Info
} from 'lucide-react';
import { SmartSearchBox } from '../../Common/SearchComponents';
import { 
  StandardTableContainer, 
  StandardTableWrapper, 
  StandardTh, 
  StandardTr, 
  StandardTd, 
  StandardTableFooter,
  ElegantTooltip
} from '../../Common/TableComponents';
import { TableSkeletonRows } from '../../Common/LoadingComponents';

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

  const itemsPerPage = 8;

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
    setSelected([]); // Reset selection state
    onClose(); // Auto-close modal
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        
        {/* Modal Header */}
        <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">Source Literature Discovery</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select 1-3 Collections for Parallel Extraction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
            <X size={32} />
          </button>
        </div>

        {/* Search & Warning Bar */}
        <div className="px-8 py-4 bg-white border-b border-gray-100 shrink-0 space-y-4">
          <SmartSearchBox 
            value={localSearch} 
            onChange={setLocalSearch} 
            onSearch={handleSearch} 
            className="w-full"
          />
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
             <Info className="text-[#004A74] shrink-0" size={16} />
             <p className="text-[10px] font-bold text-[#004A74]/70 uppercase tracking-wide">
                Maximum 3 collections per extraction path. Character limit: 35,000 per source.
             </p>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col bg-[#fcfcfc]">
          <StandardTableContainer>
            <StandardTableWrapper>
              <thead>
                <tr>
                  <StandardTh width="80px">PICK</StandardTh>
                  <StandardTh width="120px">TOPIC</StandardTh>
                  <StandardTh width="450px">LITERATURE TITLE</StandardTh>
                  <StandardTh width="200px">AUTHOR(S)</StandardTh>
                  <StandardTh width="100px">YEAR</StandardTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <TableSkeletonRows count={5} />
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center font-black text-gray-300 uppercase text-xs tracking-widest">No matching literature with extracted content</td></tr>
                ) : (
                  items.map((item) => {
                    const isSelected = selected.some(s => s.id === item.id);
                    const isDisabled = !isSelected && selected.length >= 3;
                    return (
                      <StandardTr 
                        key={item.id} 
                        onClick={() => !isDisabled && toggleSelect(item)} 
                        className={`cursor-pointer transition-all ${isSelected ? 'bg-[#004A74]/5' : isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <td className="px-6 py-4 text-center">
                          <div className={`w-6 h-6 mx-auto rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#004A74] border-[#004A74] text-white shadow-md' : 'border-gray-200 bg-white'}`}>
                            {isSelected && <Check size={14} strokeWidth={4} />}
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
        <div className="px-8 py-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < selected.length ? 'bg-[#FED400] border-[#FED400] shadow-md' : 'bg-white border-gray-200'}`} />
            ))}
            <span className="text-[10px] font-black text-[#004A74] uppercase tracking-widest ml-4">{selected.length} / 3 Selected Slots</span>
          </div>
          <div className="flex gap-4">
             <button onClick={onClose} className="px-8 py-4 bg-white text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
             <button 
                onClick={handleExecute}
                disabled={selected.length === 0}
                className="px-12 py-4 bg-[#004A74] text-[#FED400] rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale"
             >
                <Sparkles size={16} /> Execute Matrix Extraction
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSourceSelectorModal;
