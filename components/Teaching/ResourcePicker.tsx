import React, { useState, useEffect, useCallback } from 'react';
import { LibraryItem, PresentationItem, QuestionItem, LibraryType, BloomsLevel } from '../../types';
import { fetchLibrary, fetchLibraryPaginated } from '../../services/gasService';
import { fetchPresentationsPaginated } from '../../services/PresentationService';
import { fetchAllQuestionsPaginated } from '../../services/QuestionService';
import { 
  X, 
  Search, 
  BookOpen, 
  Plus,
  Loader2,
  Presentation,
  GraduationCap,
  Calendar,
  User,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { SmartSearchBox } from '../Common/SearchComponents';
import { 
  StandardTableFooter
} from '../Common/TableComponents';
import { CardGridSkeleton } from '../Common/LoadingComponents';

export type PickerType = 'LIBRARY' | 'PRESENTATION' | 'QUESTION';

interface ResourcePickerProps {
  type: PickerType;
  onClose: () => void;
  onSelect: (item: any) => void;
}

const ResourcePicker: React.FC<ResourcePickerProps> = ({ type, onClose, onSelect }) => {
  const [items, setItems] = useState<any[]>([]);
  const [libraryLookup, setLibraryLookup] = useState<Record<string, string>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  
  const itemsPerPage = 10;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch library data for lookup if we are picking questions
      if (type === 'QUESTION' && Object.keys(libraryLookup).length === 0) {
        const libs = await fetchLibrary();
        const lookup: Record<string, string> = {};
        libs.forEach(l => lookup[l.id] = l.title);
        setLibraryLookup(lookup);
      }

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
  }, [type, currentPage, appliedSearch, libraryLookup]);

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

  const getBloomColor = (level: string) => {
    if (level.includes('C1') || level.includes('C2')) return 'bg-green-500';
    if (level.includes('C3') || level.includes('C4')) return 'bg-[#004A74]';
    return 'bg-[#FED400] text-[#004A74]';
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('sv');
    } catch { return "-"; }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in">
       <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          
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
             <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {isLoading ? (
                   <CardGridSkeleton count={itemsPerPage} />
                ) : items.length === 0 ? (
                   <div className="py-20 text-center font-black text-gray-300 uppercase text-xs tracking-widest">No matching items found</div>
                ) : (
                   items.map(item => {
                     return (
                       <div 
                         key={item.id} 
                         onClick={() => onSelect(item)}
                         className="group bg-white border border-gray-100 rounded-3xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-[#004A74]/20 transition-all cursor-pointer relative overflow-hidden"
                       >
                          {/* Side Indicator */}
                          <div className={`w-1.5 h-12 rounded-full shrink-0 ${type === 'QUESTION' ? getBloomColor(item.bloomLevel) : 'bg-[#004A74] group-hover:bg-[#FED400]'} transition-colors`} />
                          
                          <div className="flex-1 min-w-0">
                             {/* Top Labels */}
                             <div className="flex items-center gap-2 mb-1">
                                {type === 'LIBRARY' && (
                                   <>
                                      <span className="px-2 py-0.5 bg-[#004A74]/5 text-[#004A74] text-[7px] font-black uppercase rounded-md">{item.category}</span>
                                      <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[7px] font-black uppercase rounded-md">{item.topic}</span>
                                   </>
                                )}
                                {type === 'PRESENTATION' && (
                                   <span className="px-2 py-0.5 bg-[#FED400]/20 text-[#004A74] text-[7px] font-black uppercase rounded-md">Presentation</span>
                                )}
                                {type === 'QUESTION' && (
                                   <>
                                      <span className={`px-2 py-0.5 text-white text-[7px] font-black uppercase rounded-md ${getBloomColor(item.bloomLevel)}`}>{item.bloomLevel}</span>
                                      <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[7px] font-black uppercase rounded-md">{item.customLabel}</span>
                                   </>
                                )}
                             </div>

                             {/* Main Content */}
                             <h4 className="text-sm font-black text-[#004A74] uppercase leading-tight truncate">
                                {item.title || item.questionText || 'Untitled'}
                             </h4>

                             {/* Bottom Info */}
                             <div className="flex items-center gap-4 mt-1 text-gray-400">
                                <div className="flex items-center gap-1">
                                   <User size={10} />
                                   <span className="text-[9px] font-bold uppercase truncate max-w-[150px]">
                                      {item.authors ? item.authors.join(', ') : (item.presenters ? item.presenters.join(', ') : (libraryLookup[item.collectionId] || 'AI Generated'))}
                                   </span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-gray-200" />
                                <div className="flex items-center gap-1">
                                   <Calendar size={10} />
                                   <span className="text-[9px] font-mono font-bold">{item.year || formatShortDate(item.createdAt)}</span>
                                </div>
                             </div>
                          </div>

                          <button className="shrink-0 px-6 py-2.5 bg-gray-50 text-[#004A74] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FED400] transition-all border border-gray-100 flex items-center justify-center gap-2">
                             Select <Plus size={12} strokeWidth={4} />
                          </button>
                       </div>
                     );
                   })
                )}
             </div>
             
             <div className="mt-4 pt-4 border-t border-gray-100 shrink-0">
                <StandardTableFooter 
                  totalItems={totalCount} 
                  currentPage={currentPage} 
                  itemsPerPage={itemsPerPage} 
                  totalPages={Math.ceil(totalCount / itemsPerPage)} 
                  onPageChange={setCurrentPage} 
                />
             </div>
          </div>
       </div>
    </div>
  );
};

export default ResourcePicker;
