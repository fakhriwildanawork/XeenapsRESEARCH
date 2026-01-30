
import React, { useState, useEffect, useCallback } from 'react';
import { ConsultationItem, LibraryItem, ConsultationAnswerContent } from '../../types';
import { fetchRelatedConsultations, deleteConsultation } from '../../services/ConsultationService';
import { 
  ArrowLeftIcon, 
  ChatBubbleLeftRightIcon, 
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  ClockIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import ConsultationInputModal from './ConsultationInputModal';
import ConsultationResultView from './ConsultationResultView';
import { CardGridSkeleton } from '../Common/LoadingComponents';
import { SmartSearchBox } from '../Common/SearchComponents';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import { showXeenapsToast } from '../../utils/toastUtils';

interface ConsultationGalleryProps {
  collection: LibraryItem;
  onBack: () => void;
}

const ConsultationGallery: React.FC<ConsultationGalleryProps> = ({ collection, onBack }) => {
  const [items, setItems] = useState<ConsultationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Navigation States
  const [view, setView] = useState<'gallery' | 'result'>('gallery');
  const [selectedConsult, setSelectedConsult] = useState<ConsultationItem | null>(null);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [activeAnswer, setActiveAnswer] = useState<ConsultationAnswerContent | null>(null);

  const loadConsultations = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchRelatedConsultations(collection.id, currentPage, 20, search);
    setItems(result.items);
    setTotalCount(result.totalCount);
    setIsLoading(false);
  }, [collection.id, currentPage, search]);

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

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
            value={search} 
            onChange={setSearch} 
            onSearch={() => setCurrentPage(1)}
            phrases={["Search by question topic...", "Filter reasoning logs..."]}
            className="w-full lg:max-w-xl"
           />
           <div className="text-[10px] font-black uppercase tracking-widest text-[#004A74]/60 px-4">
             {totalCount} Sessions Stored
           </div>
        </div>
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
            {items.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleOpenConsult(item)}
                className={`group relative bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col h-full ${item.isFavorite ? 'border-l-[6px] border-l-[#FED400]' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#004A74] text-[#FED400] rounded-xl flex items-center justify-center shadow-md">
                       <SparklesIcon className="w-4 h-4" />
                    </div>
                    {item.isFavorite && <StarSolid className="w-4 h-4 text-[#FED400]" />}
                  </div>
                  <button onClick={(e) => handleDelete(e, item.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all">
                    <TrashIcon className="w-5 h-5" />
                  </button>
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
            ))}
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
