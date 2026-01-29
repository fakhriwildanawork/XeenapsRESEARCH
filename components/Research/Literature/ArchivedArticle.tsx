import React, { useState, useEffect, useMemo, useCallback } from 'react';
// @ts-ignore - Resolving TS error for missing exported member useNavigate
import { useNavigate } from 'react-router-dom';
import { 
  Archive, 
  Trash2, 
  Star, 
  Search, 
  LayoutGrid, 
  List, 
  ExternalLink, 
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  FileText,
  Settings2 as AdjustmentsHorizontal,
  Plus,
  Eye,
  Check,
  X,
  Info,
  BookOpen,
  Calendar,
  Link as LinkIcon
} from 'lucide-react';
import { ArchivedArticleItem } from '../../../types';
import { fetchArchivedArticlesPaginated, deleteArchivedArticle, toggleFavoriteArticle } from '../../../services/LiteratureService';
import { showXeenapsToast } from '../../../utils/toastUtils';
import { showXeenapsDeleteConfirm } from '../../../utils/confirmUtils';
import { SmartSearchBox } from '../../Common/SearchComponents';
import { 
  StandardTableContainer, 
  StandardTableWrapper, 
  StandardTh, 
  StandardTr, 
  StandardTd, 
  StandardTableFooter,
  StandardCheckbox,
  ElegantTooltip,
  StandardGridContainer,
  StandardItemCard
} from '../../Common/TableComponents';
import { 
  StandardQuickAccessBar, 
  StandardQuickActionButton 
} from '../../Common/ButtonComponents';
import { TableSkeletonRows, CardGridSkeleton } from '../../Common/LoadingComponents';
import { useAsyncWorkflow } from '../../../hooks/useAsyncWorkflow';
import { useOptimisticUpdate } from '../../../hooks/useOptimisticUpdate';

const ArchivedArticle: React.FC = () => {
  const navigate = useNavigate();
  const workflow = useAsyncWorkflow(30000);
  const { performUpdate, performDelete } = useOptimisticUpdate<ArchivedArticleItem>();
  
  // States
  const [serverItems, setServerItems] = useState<ArchivedArticleItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ArchivedArticleItem; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [detailItem, setDetailItem] = useState<ArchivedArticleItem | null>(null);

  const itemsPerPage = isMobile ? 12 : 20;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = useCallback(() => {
    // Requirement 1 Fix: Ensure loading state is reset correctly on every fetch attempt
    setIsLoading(true);
    workflow.execute(
      async (signal) => {
        const result = await fetchArchivedArticlesPaginated(
          currentPage,
          itemsPerPage,
          appliedSearch,
          sortConfig.key,
          sortConfig.dir,
          signal
        );
        setServerItems(result.items);
        setTotalItems(result.totalCount);
      },
      () => setIsLoading(false),
      () => setIsLoading(false)
    );
    // Fix: Using workflow.execute as stable dependency instead of workflow object to prevent infinite loop
  }, [currentPage, appliedSearch, sortConfig, itemsPerPage, workflow.execute]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchTrigger = () => {
    setCurrentPage(1);
    setAppliedSearch(localSearch);
  };

  const handleSort = (key: keyof ArchivedArticleItem) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (key: keyof ArchivedArticleItem) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="text-gray-300" />;
    return sortConfig.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === serverItems.length && serverItems.length > 0) setSelectedIds([]);
    else setSelectedIds(serverItems.map(i => i.id));
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed) {
      await performDelete(
        serverItems,
        setServerItems,
        [id],
        async (articleId) => await deleteArchivedArticle(articleId)
      );
      showXeenapsToast('success', 'Article removed from archive');
      if (detailItem?.id === id) setDetailItem(null);
    }
  };

  const handleBatchDelete = async (selectedIdsToDel: string[]) => {
    if (selectedIdsToDel.length === 0) return;
    const confirmed = await showXeenapsDeleteConfirm(selectedIdsToDel.length);
    if (confirmed) {
      const idsToDelete = [...selectedIdsToDel];
      setSelectedIds([]);
      await performDelete(
        serverItems,
        setServerItems,
        idsToDelete,
        async (id) => await deleteArchivedArticle(id)
      );
      showXeenapsToast('success', 'Selected articles removed');
    }
  };

  const handleBatchDeleteFromBar = () => handleBatchDelete(selectedIds);

  const handleToggleFavorite = async (e: React.MouseEvent, item: ArchivedArticleItem) => {
    e.stopPropagation();
    await performUpdate(
      serverItems,
      setServerItems,
      [item.id],
      (i) => ({ ...i, isFavorite: !i.isFavorite }),
      async (updated) => await toggleFavoriteArticle(updated.id, updated.isFavorite)
    );
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch { return '-'; }
  };

  const effectiveViewMode = isMobile ? 'grid' : viewMode;

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar bg-white animate-in slide-in-from-right duration-500">
      {/* Detail Modal for Archived Items */}
      {detailItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] border border-white/20">
            <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-black text-[#004A74] uppercase tracking-tight truncate max-w-md">Archive Detail</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Personal Knowledge Asset</p>
                  </div>
               </div>
               <button onClick={() => setDetailItem(null)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
                  <X className="w-8 h-8" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 space-y-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[#FED400] text-[#004A74] text-[10px] font-black uppercase tracking-widest rounded-full">{detailItem.label}</span>
                    <button onClick={(e) => handleToggleFavorite(e, detailItem)} className="p-1 hover:scale-125 transition-transform">
                      <Star size={20} className={detailItem.isFavorite ? 'text-[#FED400] fill-[#FED400]' : 'text-gray-200'} />
                    </button>
                  </div>
                  <h1 className="text-2xl font-black text-[#004A74] leading-tight uppercase">{detailItem.title}</h1>
               </div>

               <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#004A74] uppercase tracking-[0.2em]">
                     <FileText className="w-4 h-4" /> Harvard Citation
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-bold italic">
                    {detailItem.citationHarvard}
                  </p>
               </div>

               {detailItem.info && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Info className="w-3.5 h-3.5" /> Personal Remark / Abstract
                    </h4>
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {detailItem.info}
                    </div>
                  </div>
               )}

               <div className="flex flex-col gap-2 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                    <Calendar className="w-3 h-3" /> Saved on {formatDateTime(detailItem.createdAt)}
                  </div>
                  {detailItem.doi && (
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                       <span className="text-[9px] font-black uppercase tracking-widest">DOI:</span>
                       <span className="font-mono text-[11px] text-[#004A74] opacity-70">{detailItem.doi}</span>
                    </div>
                  )}
               </div>
            </div>

            <div className="px-10 py-8 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/30">
               <button 
                 onClick={(e) => handleDelete(e, detailItem.id)}
                 className="p-3 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                 title="Delete from Archive"
               >
                 <Trash2 className="w-5 h-5" />
               </button>
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => window.open(detailItem.url || `https://doi.org/${detailItem.doi}`, '_blank')}
                    className="px-8 py-4 text-[#004A74] bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-[#FED400]/20 transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Source
                  </button>
                  <button 
                    onClick={() => setDetailItem(null)}
                    className="px-8 py-4 bg-[#004A74] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#004A74]/10 hover:scale-105 active:scale-95 transition-all"
                  >
                    Dismiss
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="px-6 md:px-10 py-6 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/find-article')}
                className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] hover:bg-[#FED400]/20 rounded-xl transition-all shadow-sm active:scale-90"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#004A74] uppercase tracking-tight leading-none">Archived Articles</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Saved Global References</p>
              </div>
           </div>

           <div className="flex items-center gap-2">
              <div className="hidden lg:flex bg-gray-100 p-1 rounded-xl border border-gray-100">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#004A74] shadow-sm' : 'text-gray-400'}`}><LayoutGrid size={16} /></button>
                <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-[#004A74] shadow-sm' : 'text-gray-400'}`}><List size={16} /></button>
              </div>
              <button 
                onClick={() => navigate('/find-article')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#004A74] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-lg shadow-md active:scale-95"
              >
                <Plus size={16} /> <span className="hidden sm:inline">Add Reference</span>
              </button>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
           <SmartSearchBox 
             value={localSearch} 
             onChange={setLocalSearch} 
             onSearch={handleSearchTrigger}
             phrases={["Search archived title...", "Search by label...", "Search citations..."]}
             className="w-full lg:max-w-xl"
           />
           <div className="text-[10px] font-black uppercase tracking-widest text-[#004A74]/60 px-4">
             {totalItems} Articles Stored
           </div>
        </div>
      </div>

      {/* MOBILE SORT & SELECT ALL BAR */}
      <div className="lg:hidden flex items-center justify-start gap-4 px-4 py-2 shrink-0 bg-gray-50/50">
        <div className="relative">
          <button onClick={() => setShowSortMenu(!showSortMenu)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${showSortMenu ? 'bg-[#004A74] border-[#004A74] text-white shadow-md' : 'bg-white border-gray-100 text-[#004A74] shadow-sm'}`}><AdjustmentsHorizontal size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Sort</span></button>
          {showSortMenu && (
            <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] p-2 animate-in fade-in zoom-in-95">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2 border-b border-gray-50 mb-1">Sort By</p>
              {(['title', 'label', 'createdAt'] as (keyof ArchivedArticleItem)[]).map((k) => (
                <button key={k} onClick={() => { handleSort(k); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${sortConfig.key === k ? 'bg-[#004A74]/10 text-[#004A74]' : 'text-gray-500 hover:bg-gray-50'}`}><span>{k === 'createdAt' ? 'Date' : k.charAt(0).toUpperCase() + k.slice(1)}</span>{sortConfig.key === k && (sortConfig.dir === 'asc' ? <ArrowUpDown size={12} /> : <ChevronDown size={12} />)}</button>
              ))}
            </div>
          )}
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <button onClick={toggleSelectAll} className={`text-[10px] font-black uppercase tracking-widest transition-all ${selectedIds.length === serverItems.length && serverItems.length > 0 ? 'text-red-500' : 'text-[#004A74]'}`}>{selectedIds.length === serverItems.length && serverItems.length > 0 ? 'Deselect All' : 'Select All'}</button>
      </div>

      <StandardQuickAccessBar isVisible={selectedIds.length > 0} selectedCount={selectedIds.length}>
         <StandardQuickActionButton variant="danger" onClick={handleBatchDeleteFromBar} title="Mass Delete"><Trash2 size={18} /></StandardQuickActionButton>
      </StandardQuickAccessBar>

      {/* Content Area */}
      <div className="flex-1 p-6 md:p-10 pb-20">
        {isLoading ? (
          effectiveViewMode === 'table' ? <TableSkeletonRows count={8} /> : <CardGridSkeleton count={6} />
        ) : serverItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
            <Archive className="w-20 h-20 mb-4 text-[#004A74]" />
            <h3 className="text-lg font-black text-[#004A74] uppercase tracking-[0.3em]">Archive is Empty</h3>
            <p className="text-sm font-medium mt-2">Go to "Find Article" to start building your reference database.</p>
          </div>
        ) : effectiveViewMode === 'table' ? (
          <StandardTableContainer>
            <StandardTableWrapper>
              <thead>
                <tr>
                  <th className="sticky left-0 z-50 px-6 py-4 w-12 text-center bg-gray-50 border-r border-gray-100/50">
                    <StandardCheckbox onChange={toggleSelectAll} checked={serverItems.length > 0 && selectedIds.length === serverItems.length} />
                  </th>
                  <StandardTh onClick={() => handleSort('title')} isActiveSort={sortConfig.key === 'title'}>Title {getSortIcon('title')}</StandardTh>
                  <StandardTh onClick={() => handleSort('label')} isActiveSort={sortConfig.key === 'label'}>Label {getSortIcon('label')}</StandardTh>
                  <StandardTh width="400px">Harvard Citation</StandardTh>
                  <StandardTh onClick={() => handleSort('createdAt')} isActiveSort={sortConfig.key === 'createdAt'}>Saved At {getSortIcon('createdAt')}</StandardTh>
                  <StandardTh width="120px" className="sticky right-0 bg-gray-50">Action</StandardTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {serverItems.map(item => (
                  <StandardTr key={item.id} className="cursor-pointer" onClick={() => setDetailItem(item)}>
                    <td className="px-6 py-4 sticky left-0 z-20 border-r border-gray-100/50 bg-white group-hover:bg-[#f0f7fa] shadow-sm text-center" onClick={e => e.stopPropagation()}>
                       <StandardCheckbox checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                    </td>
                    <StandardTd>
                       <ElegantTooltip text={item.title}>
                          <div className="flex items-center gap-3">
                             <button onClick={(e) => handleToggleFavorite(e, item)} className="p-1 hover:scale-125 transition-transform">
                               <Star size={16} className={item.isFavorite ? 'text-[#FED400] fill-[#FED400]' : 'text-gray-200'} />
                             </button>
                             <span className="text-sm font-bold text-[#004A74] uppercase line-clamp-2 leading-tight">{item.title}</span>
                          </div>
                       </ElegantTooltip>
                    </StandardTd>
                    <StandardTd>
                       <span className="px-2 py-1 bg-[#004A74]/5 border border-[#004A74]/10 rounded-lg text-[9px] font-black text-[#004A74] uppercase tracking-widest whitespace-nowrap">
                         {item.label}
                       </span>
                    </StandardTd>
                    <StandardTd>
                       <ElegantTooltip text={item.citationHarvard}>
                          <p className="text-[11px] text-gray-500 font-medium italic leading-relaxed line-clamp-2">{item.citationHarvard}</p>
                       </ElegantTooltip>
                    </StandardTd>
                    <StandardTd className="text-[10px] font-bold text-gray-400 text-center">
                       {formatDateTime(item.createdAt)}
                    </StandardTd>
                    <StandardTd className="sticky right-0 bg-white group-hover:bg-[#f0f7fa] text-center shadow-[-4px_0_10px_rgba(0,0,0,0.02)]" onClick={e => e.stopPropagation()}>
                       <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => window.open(item.url || `https://doi.org/${item.doi}`, '_blank')}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Open Link"
                          >
                             <ExternalLink size={16} />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, item.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </StandardTd>
                  </StandardTr>
                ))}
              </tbody>
            </StandardTableWrapper>
            <StandardTableFooter 
              totalItems={totalItems} 
              currentPage={currentPage} 
              itemsPerPage={itemsPerPage} 
              totalPages={Math.ceil(totalItems / itemsPerPage)} 
              onPageChange={setCurrentPage} 
            />
          </StandardTableContainer>
        ) : (
          <div className="flex flex-col h-full">
            <StandardGridContainer>
              {serverItems.map(item => (
                <StandardItemCard 
                  key={item.id}
                  isSelected={selectedIds.includes(item.id)}
                  onClick={() => setDetailItem(item)}
                  className="cursor-pointer"
                >
                  <div className="absolute top-4 right-4 flex gap-1.5 z-10" onClick={e => handleToggleFavorite(e, item)}>
                    <Star size={18} className={item.isFavorite ? 'text-[#FED400] fill-[#FED400]' : 'text-gray-200'} />
                  </div>

                  <div className="flex items-center gap-3 mb-4" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(item.id)} className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedIds.includes(item.id) ? 'bg-[#004A74] border-[#004A74] text-white' : 'bg-white border-gray-200'}`}>
                      {selectedIds.includes(item.id) && <Check size={12} strokeWidth={4} />}
                    </button>
                    <span className="px-3 py-1 bg-[#004A74]/5 text-[#004A74] text-[8px] font-black uppercase tracking-widest rounded-full">
                      {item.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-[#004A74] leading-tight mb-4 uppercase line-clamp-3 flex-1">
                    {item.title}
                  </h3>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                     <p className="text-[10px] text-gray-500 font-bold leading-relaxed italic line-clamp-3">
                       {item.citationHarvard}
                     </p>
                  </div>

                  <div className="flex items-center justify-between text-gray-400 pt-4 border-t border-gray-50">
                    <span className="text-[9px] font-bold uppercase tracking-tight">{formatDateTime(item.createdAt)}</span>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => window.open(item.url || `https://doi.org/${item.doi}`, '_blank')}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </StandardItemCard>
              ))}
            </StandardGridContainer>
            
            <div className="mt-8">
              <StandardTableFooter 
                totalItems={totalItems} 
                currentPage={currentPage} 
                itemsPerPage={itemsPerPage} 
                totalPages={Math.ceil(totalItems / itemsPerPage)} 
                onPageChange={setCurrentPage} 
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 74, 116, 0.2); }
      `}</style>
    </div>
  );
};

export default ArchivedArticle;