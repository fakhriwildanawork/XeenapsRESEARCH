
import React, { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { ReviewItem } from '../../../types';
import { fetchReviewsPaginated, deleteReview, saveReview } from '../../../services/ReviewService';
import { 
  Plus, 
  Trash2, 
  Star, 
  BookOpen, 
  ChevronRight,
  Sparkles,
  Check,
  MoreVertical,
  Clock
} from 'lucide-react';
import { SmartSearchBox } from '../../Common/SearchComponents';
import { StandardPrimaryButton, StandardQuickAccessBar, StandardQuickActionButton } from '../../Common/ButtonComponents';
import { CardGridSkeleton } from '../../Common/LoadingComponents';
import { StandardTableFooter } from '../../Common/TableComponents';
import { useAsyncWorkflow } from '../../../hooks/useAsyncWorkflow';
import { useOptimisticUpdate } from '../../../hooks/useOptimisticUpdate';
import { showXeenapsDeleteConfirm } from '../../../utils/confirmUtils';
import { showXeenapsToast } from '../../../utils/toastUtils';
import Swal from 'sweetalert2';
import { XEENAPS_SWAL_CONFIG } from '../../../utils/swalUtils';

const AllReview: React.FC = () => {
  const navigate = useNavigate();
  const workflow = useAsyncWorkflow(30000);
  const { performUpdate, performDelete } = useOptimisticUpdate<ReviewItem>();
  
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const itemsPerPage = 12;

  const loadData = useCallback(() => {
    workflow.execute(
      async (signal) => {
        setIsLoading(true);
        const result = await fetchReviewsPaginated(currentPage, itemsPerPage, appliedSearch, "createdAt", "desc", signal);
        setItems(result.items);
        setTotalCount(result.totalCount);
      },
      () => setIsLoading(false),
      () => setIsLoading(false)
    );
  }, [currentPage, appliedSearch, itemsPerPage, workflow.execute]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNewReview = async () => {
    const { value: label } = await Swal.fire({
      title: 'NEW LITERATURE REVIEW',
      input: 'text',
      inputLabel: 'Review Project Label',
      inputPlaceholder: 'e.g., AI in Healthcare Synthesis...',
      showCancelButton: true,
      confirmButtonText: 'INITIALIZE',
      ...XEENAPS_SWAL_CONFIG,
      inputValidator: (value) => {
        if (!value) return 'Label is mandatory!';
        return null;
      }
    });

    if (label) {
      const id = crypto.randomUUID();
      const newItem: ReviewItem = {
        id,
        label: label.toUpperCase(),
        centralQuestion: '',
        reviewJsonId: '',
        storageNodeUrl: '',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const success = await saveReview(newItem, { matrix: [], finalSynthesis: '' });
      if (success) {
        navigate(`/research/literature-review/${id}`);
      }
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, review: ReviewItem) => {
    e.stopPropagation();
    await performUpdate(
      items,
      setItems,
      [review.id],
      (i) => ({ ...i, isFavorite: !i.isFavorite }),
      async (updated) => await saveReview(updated, { matrix: [], finalSynthesis: '' })
    );
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed) {
      const success = await deleteReview(id);
      if (success) {
        showXeenapsToast('success', 'Review project removed');
        loadData();
      }
    }
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch { return "-"; }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-500 pr-1">
      {/* MODULE HEADER - Now scrolls with the page */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-8 shrink-0 px-1">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen size={24} />
           </div>
           <div>
              <h2 className="text-xl md:text-2xl font-black text-[#004A74] uppercase tracking-tight">Literature Review</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Multi-Source Synthesis Matrix</p>
           </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1 max-w-2xl justify-end">
          <SmartSearchBox 
            value={localSearch} 
            onChange={setLocalSearch} 
            onSearch={() => { setAppliedSearch(localSearch); setCurrentPage(1); }}
            phrases={["Search review project...", "Find academic synthesis..."]}
            className="w-full lg:max-w-md"
          />
          <StandardPrimaryButton onClick={handleNewReview} icon={<Plus size={20} />}>
            Create Review
          </StandardPrimaryButton>
        </div>
      </div>

      {/* CONTENT AREA - No longer has its own scroll to allow full page scroll */}
      <div className="flex-1 pb-10">
        {isLoading ? (
          <CardGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <div className="py-40 text-center flex flex-col items-center justify-center space-y-4 opacity-20 grayscale">
             <BookOpen size={80} strokeWidth={1} className="text-[#004A74]" />
             <p className="text-sm font-black uppercase tracking-[0.4em]">No reviews created</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1 pb-12">
            {items.map(item => (
              <div 
                key={item.id}
                onClick={() => navigate(`/research/literature-review/${item.id}`)}
                className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col h-full"
              >
                <div className="absolute top-8 right-8" onClick={e => handleToggleFavorite(e, item)}>
                   <Star size={20} className={item.isFavorite ? 'text-[#FED400] fill-[#FED400]' : 'text-gray-200'} />
                </div>

                <div className="mb-6">
                   <div className="flex items-center gap-1.5 mb-3">
                      <Sparkles size={12} className="text-[#FED400]" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#004A74]/40">Synthesis Matrix</span>
                   </div>
                   <h3 className="text-base font-black text-[#004A74] uppercase leading-tight line-clamp-3">{item.label}</h3>
                </div>

                <div className="space-y-4 flex-1">
                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Central Question</p>
                      <p className="text-xs font-semibold text-[#004A74] line-clamp-2 italic leading-relaxed">
                        {item.centralQuestion || 'Question not formulated yet...'}
                      </p>
                   </div>
                </div>

                <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-50">
                   <div className="flex items-center gap-1.5 text-gray-300">
                      <Clock size={12} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">{formatShortDate(item.createdAt)}</span>
                   </div>
                   <div className="flex items-center gap-2 text-[#004A74] group-hover:text-blue-600 transition-colors">
                      <span className="text-[9px] font-black uppercase tracking-widest">Open Room</span>
                      <ChevronRight size={14} strokeWidth={3} />
                   </div>
                </div>

                <button 
                  onClick={(e) => handleDelete(e, item.id)}
                  className="absolute bottom-4 left-8 p-2 text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                   <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER - Now part of the scroll flow */}
      <div className="px-1 pb-20">
        <StandardTableFooter 
          totalItems={totalCount} 
          currentPage={currentPage} 
          itemsPerPage={itemsPerPage} 
          totalPages={Math.ceil(totalCount / itemsPerPage)} 
          onPageChange={setCurrentPage} 
        />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 74, 116, 0.2); }
      `}</style>
    </div>
  );
};

export default AllReview;
