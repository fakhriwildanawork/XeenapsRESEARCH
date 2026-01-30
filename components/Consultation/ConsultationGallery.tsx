
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ConsultationItem, LibraryItem, ConsultationAnswerContent } from '../../types';
import { fetchRelatedConsultations, deleteConsultation, saveConsultation } from '../../services/ConsultationService';
import { 
  ArrowLeftIcon, 
  ChatBubbleLeftRightIcon, 
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  ClockIcon,
  ChevronRightIcon,
  StarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import ConsultationInputModal from './ConsultationInputModal';
import ConsultationResultView from './ConsultationResultView';
import { CardGridSkeleton } from '../Common/LoadingComponents';
import { SmartSearchBox } from '../Common/SearchComponents';
import { StandardQuickAccessBar, StandardQuickActionButton } from '../Common/ButtonComponents';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import { showXeenapsToast } from '../../utils/toastUtils';
import { fetchFileContent } from '../../services/gasService';

interface ConsultationGalleryProps {
  collection: LibraryItem;
  onBack: () => void;
}

const ConsultationGallery: React.FC<ConsultationGalleryProps> = ({ collection, onBack }) => {
  const [items, setItems] = useState<ConsultationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Navigation States
  const [view, setView] = useState<'gallery' | 'result'>('gallery');
  const [selectedConsult, setSelectedConsult] = useState<ConsultationItem | null>(null);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [activeAnswer, setActiveAnswer] = useState<ConsultationAnswerContent | null>(null);

  const loadConsultations = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchRelatedConsultations(collection.id, currentPage, 20, appliedSearch);
    setItems(result.items);
    setTotalCount(result.totalCount);
    setIsLoading(false);
  }, [collection.id, currentPage, appliedSearch]);

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  const handleSearchTrigger = () => {
    setAppliedSearch(localSearch);
    setCurrentPage(1);
  };

  const toggleSelectItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleFavorite = async (e: React.MouseEvent, item: ConsultationItem) => {
    e.stopPropagation();
    const newVal = !item.isFavorite;
    
    // Optimistic Update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isFavorite: newVal } : i));
    
    // Fetch content first because saveConsultation requires it for sharding logic
    const content = await fetchFileContent(item.answerJsonId, item.nodeUrl);
    if (content) {
      await saveConsultation({ ...item, isFavorite: newVal }, content);
      showXeenapsToast('success', newVal ? 'Marked as Favorite' : 'Removed from Favorites');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed) {
      const success = await deleteConsultation(id);
      if (success) {
        showXeenapsToast('success', 'Consultation purged.');
        loadConsultations();
      }
    }
  };

  const handleMassDelete = async () => {
    const confirmed = await showXeenapsDeleteConfirm(selectedIds.length);
    if (confirmed) {
      setIsLoading(true);
      for (const id of selectedIds) {
        await deleteConsultation(id);
      }
      showXeenapsToast('success', `${selectedIds.length} Sessions Deleted`);
      setSelectedIds([]);
      loadConsultations();
    }
  };

  const handleMassFavorite = async () => {
    const selectedItems = items.filter(i => selectedIds.includes(i.id));
    const anyUnfav = selectedItems.some(i => !i.isFavorite);
    const newValue = anyUnfav;

    setIsLoading(true);
    for (const item of selectedItems) {
       const content = await fetchFileContent(item.answerJsonId, item.nodeUrl);
       if (content) {
         await saveConsultation({ ...item, isFavorite: newValue }, content);
       }
    }
    showXeenapsToast('success', `Bulk Update Complete`);
    setSelectedIds([]);
    loadConsultations();
  };

  const handleOpenConsult = (item: ConsultationItem) => {
    setSelectedConsult(item);
    setActiveAnswer(null);
    setView('result');
  };

  const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const anyUnfavSelected = useMemo(() => {
    return items.filter(i => selectedIds.includes(i.id)).some(i => !i.isFavorite);
  }, [items, selectedIds]);

  if (view === 'result' && selectedConsult) {
    return (
      <ConsultationResultView 
        collection={collection}
        consultation={selectedConsult}
        initialAnswer={activeAnswer}
        onBack={() => {
          setView('gallery');
          setSelectedConsult(null);
          setActiveAnswer(null);
          loadConsultations();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-500 overflow-hidden relative">
      
      {isInputOpen && (
        <ConsultationInputModal 
          collection={collection}
          onClose={() => setIsInputOpen(false)}
          onSuccess={(item, content) => {
            setActiveAnswer(content);
            setSelectedConsult(item);
            setIsInputOpen(false);
            setView('result');
          }}
        />
      )}

      {/* HEADER AREA */}
      <div className="px-6 md:px-10 py-6 border-b border-gray-100 flex flex-col gap-6 bg-white shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] hover:bg-[#FED400]/20 rounded-xl transition-all shadow-sm active:scale-90">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-black text-[#004A74] uppercase tracking-tight">Deep Consultation</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">AI Partner: Groq Reasoner</p>
            </div>
          </div>

          <button 
            onClick={() => setIsInputOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#004A74] text-white rounded-2xl font-bold hover:shadow-lg hover:bg-[#003859] transition-all transform active:scale-95 shadow-lg shadow-[#004A74]/10"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="text-[11px] uppercase tracking-widest font-black">Ask New Question</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
           <SmartSearchBox 
            value={localSearch} 
            onChange={setLocalSearch} 
            onSearch={handleSearchTrigger}
            phrases={["Search by question topic...", "Filter reasoning logs..."]}
            className="w-full lg:max-w-xl"
           />
           <div className="text-[10px] font-black uppercase tracking-widest text-[#004A74]/60 px-4">
             {totalCount} Sessions Stored
           </div>
        </div>
      </div>

      {/* MASS ACTION BAR */}
      <div className="px-6 md:px-10">
        <StandardQuickAccessBar isVisible={selectedIds.length > 0} selectedCount={selectedIds.length}>
          <StandardQuickActionButton variant="danger" onClick={handleMassDelete} title="Mass Delete">
            <TrashIcon className="w-5 h-5" />
          </StandardQuickActionButton>
          <StandardQuickActionButton variant="warning" onClick={handleMassFavorite} title="Mass Favorite">
            {anyUnfavSelected ? <StarIcon className="w-5 h-5" /> : <StarSolid className="w-5 h-5 text-[#FED400]" />}
          </StandardQuickActionButton>
          <button onClick={() => setSelectedIds([])} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#004A74] px-2 transition-all">Clear</button>
        </StandardQuickAccessBar>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
            <ChatBubbleLeftRightIcon className="w-20 h-20 mb-4 text-[#004A74]" />
            <h3 className="text-lg font-black uppercase tracking-widest">No Consultations Yet</h3>
            <p className="text-sm font-medium mt-2">Groq AI is waiting to analyze this document with you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div 
                  key={item.id}
                  onClick={() => handleOpenConsult(item)}
                  className={`group relative bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col h-full ${isSelected ? 'ring-2 ring-[#004A74] border-[#004A74]' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* CIRCLE CHECKBOX */}
                      <button 
                        onClick={(e) => toggleSelectItem(e, item.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#004A74] border-[#004A74] text-white shadow-md' : 'bg-white border-gray-200 hover:border-[#004A74]'}`}
                      >
                         {isSelected && <CheckIcon className="w-4 h-4 stroke-[4]" />}
                      </button>
                      <div className="w-8 h-8 bg-[#004A74] text-[#FED400] rounded-xl flex items-center justify-center shadow-md">
                         <SparklesIcon className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => toggleFavorite(e, item)} className="p-2 hover:scale-125 transition-transform">
                        {item.isFavorite ? <StarSolid className="w-5 h-5 text-[#FED400]" /> : <StarIcon className="w-5 h-5 text-gray-300 hover:text-[#FED400]" />}
                      </button>
                      <button onClick={(e) => handleDelete(e, item.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-[#004A74] leading-relaxed line-clamp-3 mb-6 flex-1">"{item.question}"</h3>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-tight">{formatTimeAgo(item.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#004A74] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-black uppercase">View Analysis</span>
                      <ChevronRightIcon className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ConsultationGallery;
