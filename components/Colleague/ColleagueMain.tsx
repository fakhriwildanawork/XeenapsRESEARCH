
import React, { useState, useEffect, useCallback } from 'react';
import { ColleagueItem } from '../../types';
import { fetchColleaguesPaginated, deleteColleague, saveColleague } from '../../services/ColleagueService';
import { 
  Plus, 
  Trash2, 
  Star, 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  ChevronRight,
  MoreVertical,
  Pencil,
  ShieldCheck,
  Users,
  Check
} from 'lucide-react';
import { SmartSearchBox } from '../Common/SearchComponents';
import { StandardPrimaryButton } from '../Common/ButtonComponents';
import { CardGridSkeleton } from '../Common/LoadingComponents';
import { StandardTableFooter } from '../Common/TableComponents';
import { useAsyncWorkflow } from '../../hooks/useAsyncWorkflow';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import { showXeenapsToast } from '../../utils/toastUtils';
import ColleagueForm from './ColleagueForm';
import { BRAND_ASSETS } from '../../assets';

const ColleagueMain: React.FC = () => {
  const workflow = useAsyncWorkflow(30000);
  
  const [items, setItems] = useState<ColleagueItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ColleagueItem | undefined>();

  const itemsPerPage = 12;

  // Server-side search debounce (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(localSearch);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const loadData = useCallback(() => {
    workflow.execute(
      async (signal) => {
        setIsLoading(true);
        const result = await fetchColleaguesPaginated(
          currentPage, 
          itemsPerPage, 
          appliedSearch, 
          "name", 
          "asc", 
          signal
        );
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

  const handleToggleFavorite = async (e: React.MouseEvent, item: ColleagueItem) => {
    e.stopPropagation();
    const updated = { ...item, isFavorite: !item.isFavorite };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    await saveColleague(updated);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed) {
      const success = await deleteColleague(id);
      if (success) {
        showXeenapsToast('success', 'Colleague removed');
        loadData();
      }
    }
  };

  const handleEdit = (e: React.MouseEvent, item: ColleagueItem) => {
    e.stopPropagation();
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
              <Users size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-[#004A74] uppercase tracking-tight">Colleagues</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Professional Network Management</p>
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1 max-w-2xl justify-end">
          <SmartSearchBox 
            value={localSearch} 
            onChange={setLocalSearch} 
            phrases={["Search by name...", "Search by affiliation...", "Search Unique App ID..."]}
            className="w-full lg:max-w-md"
          />
          <StandardPrimaryButton onClick={() => { setSelectedItem(undefined); setIsFormOpen(true); }} icon={<Plus size={20} />}>
            Add Colleague
          </StandardPrimaryButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {isLoading ? (
          <CardGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <div className="py-40 text-center flex flex-col items-center justify-center space-y-4 opacity-30 grayscale">
             <Users size={80} strokeWidth={1} className="text-[#004A74]" />
             <p className="text-sm font-black uppercase tracking-[0.4em]">Registry is empty</p>
             <p className="text-xs font-bold text-gray-400">Start documenting your professional network.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 px-1">
            {items.map(item => (
              <div 
                key={item.id}
                className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col"
              >
                {/* FAVORITE TOGGLE */}
                <div className="absolute top-6 right-6 z-10">
                   <button onClick={(e) => handleToggleFavorite(e, item)} className="p-1.5 hover:scale-125 transition-transform bg-white/50 backdrop-blur-sm rounded-lg">
                      <Star size={20} className={item.isFavorite ? 'text-[#FED400] fill-[#FED400]' : 'text-gray-200'} />
                   </button>
                </div>

                <div className="flex flex-col items-center text-center space-y-4 mb-6">
                   <div className="w-24 h-24 rounded-full p-1 border-2 border-gray-50 bg-white shadow-md overflow-hidden shrink-0 group-hover:border-[#FED400] transition-colors duration-500">
                      <img 
                        src={item.photoUrl || BRAND_ASSETS.USER_DEFAULT} 
                        className="w-full h-full object-cover rounded-full" 
                        alt={item.name} 
                      />
                   </div>
                   <div className="space-y-1 min-w-0 w-full px-2">
                      <h3 className="text-base font-black text-[#004A74] uppercase truncate leading-tight">{item.name}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{item.affiliation || 'Independent'}</p>
                   </div>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                   <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                      <ShieldCheck size={14} className="text-[#004A74]" />
                      <span className="text-[10px] font-mono font-bold text-[#004A74] tracking-widest uppercase truncate">{item.uniqueAppId}</span>
                   </div>
                   
                   <div className="flex items-center gap-3 text-gray-500 px-2">
                      <Mail size={12} className="shrink-0" />
                      <span className="text-[10px] font-bold truncate">{item.email || '-'}</span>
                   </div>
                   <div className="flex items-center gap-3 text-gray-500 px-2">
                      <Phone size={12} className="shrink-0" />
                      <span className="text-[10px] font-bold">{item.phone || '-'}</span>
                   </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                   <button onClick={(e) => handleDelete(e, item.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                   </button>
                   <button 
                     onClick={(e) => handleEdit(e, item)}
                     className="flex items-center gap-2 px-4 py-2 bg-[#004A74] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:shadow-lg active:scale-95 transition-all"
                   >
                      <Pencil size={14} /> Edit
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <StandardTableFooter 
        totalItems={totalCount} 
        currentPage={currentPage} 
        itemsPerPage={itemsPerPage} 
        totalPages={Math.ceil(totalCount / itemsPerPage)} 
        onPageChange={setCurrentPage} 
      />

      {isFormOpen && (
        <ColleagueForm 
          item={selectedItem} 
          onClose={() => setIsFormOpen(false)} 
          onComplete={() => {
            setIsFormOpen(false);
            loadData();
          }} 
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 74, 116, 0.2); }
      `}</style>
    </div>
  );
};

export default ColleagueMain;
