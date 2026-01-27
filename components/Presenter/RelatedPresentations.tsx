
import React, { useState, useEffect, useCallback } from 'react';
import { PresentationItem, LibraryItem } from '../../types';
import { fetchRelatedPresentations, deletePresentation } from '../../services/PresentationService';
import { 
  PlusIcon, 
  PresentationChartBarIcon, 
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  ListBulletIcon,
  Squares2X2Icon,
  TrashIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import PresentationSetupModal from './PresentationSetupModal';
import { CardGridSkeleton, TableSkeletonRows } from '../Common/LoadingComponents';
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
import { SmartSearchBox } from '../Common/SearchComponents';
import { 
  StandardFilterButton,
  StandardQuickAccessBar,
  StandardQuickActionButton
} from '../Common/ButtonComponents';
import { useAsyncWorkflow } from '../../hooks/useAsyncWorkflow';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import { showXeenapsToast } from '../../utils/toastUtils';
import { showXeenapsAlert } from '../../utils/swalUtils';

interface RelatedPresentationsProps {
  collection: LibraryItem;
  onBack: () => void;
}

const RelatedPresentations: React.FC<RelatedPresentationsProps> = ({ collection, onBack }) => {
  const workflow = useAsyncWorkflow(30000);
  const { performDelete } = useOptimisticUpdate<PresentationItem>();
  
  // States
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortConfig, setSortConfig] = useState<{key: string, dir: 'asc'|'desc'}>({ key: 'createdAt', dir: 'desc' });
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadPresentations = useCallback(() => {
    workflow.execute(
      async (signal) => {
        setIsLoading(true);
        const result = await fetchRelatedPresentations(
          collection.id,
          currentPage,
          itemsPerPage,
          appliedSearch,
          sortConfig.key,
          sortConfig.dir,
          signal
        );
        setPresentations(result.items);
        setTotalCount(result.totalCount);
      },
      () => setIsLoading(false),
      () => setIsLoading(false)
    );
  }, [collection.id, currentPage, appliedSearch, sortConfig, itemsPerPage]);

  useEffect(() => {
    loadPresentations();
  }, [loadPresentations]);

  const handleSearchTrigger = () => {
    setCurrentPage(1);
    setAppliedSearch(localSearch);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowsUpDownIcon className="w-3 h-3 text-gray-300" />;
    if (sortConfig.dir === 'asc') return <ChevronUpIcon className="w-3 h-3 text-[#004A74]" />;
    if (sortConfig.dir === 'desc') return <ChevronDownIcon className="w-3 h-3 text-[#004A74]" />;
    return <ArrowsUpDownIcon className="w-3 h-3 text-gray-300" />;
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === presentations.length && presentations.length > 0) setSelectedIds([]);
    else setSelectedIds(presentations.map(p => p.id));
  };

  const openInGoogleSlides = (id: string) => {
    window.open(`https://docs.google.com/presentation/d/${id}/edit`, '_blank');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed) {
      await performDelete(
        presentations,
        setPresentations,
        [id],
        async (pid) => await deletePresentation(pid),
        () => showXeenapsAlert({ icon: 'error', title: 'DELETE FAILED', text: 'Server error occurred.' })
      );
      setSelectedIds(prev => prev.filter(i => i !== id));
      showXeenapsToast('success', 'Presentation deleted.');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await showXeenapsDeleteConfirm(selectedIds.length);
    if (confirmed) {
      const idsToDelete = [...selectedIds];
      setSelectedIds([]);
      await performDelete(
        presentations,
        setPresentations,
        idsToDelete,
        async (id) => await deletePresentation(id),
        () => showXeenapsAlert({ icon: 'error', title: 'BATCH DELETE FAILED', text: 'Server error occurred.' })
      );
      showXeenapsToast('success', 'Batch deletion processed.');
    }
  };

  const formatPresentationDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      const day = d.getDate().toString().padStart(2, '0');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch { return "-"; }
  };

  const effectiveViewMode = isMobile ? 'grid' : viewMode;

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar relative">
      {showSetup && (
        <PresentationSetupModal 
          item={collection} 
          onClose={() => setShowSetup(false)} 
          onComplete={() => {
            setShowSetup(false);
            loadPresentations();
          }} 
        />
      )}

      {/* HEADER AREA */}
      <div className="px-6 md:px-10 py-6 border-b border-gray-100 flex flex-col gap-6 bg-white shrink-0 sticky top-0 z-40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] hover:bg-[#FED400]/20 rounded-xl transition-all shadow-sm active:scale-90"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-black text-[#004A74] uppercase tracking-tight">Presentation Gallery</h2>
              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[250px] md:max-w-md">Source: {collection.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex bg-gray-50 p-1 rounded-xl border border-gray-100 mr-2">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#004A74] shadow-sm' : 'text-gray-400'}`}><Squares2X2Icon className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-[#004A74] shadow-sm' : 'text-gray-400'}`}><ListBulletIcon className="w-4 h-4" /></button>
            </div>
            <button 
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#004A74] text-white rounded-2xl font-bold hover:shadow-lg hover:bg-[#003859] transition-all transform active:scale-95 shadow-lg shadow-[#004A74]/10"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="text-[11px] uppercase tracking-widest font-black">Create New</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
           <SmartSearchBox 
            value={localSearch} 
            onChange={setLocalSearch} 
            onSearch={handleSearchTrigger}
            phrases={["Search by Slide Title...", "Search by Presenter..."]}
            className="w-full lg:max-w-xl"
           />
           <div className="text-[10px] font-black uppercase tracking-widest text-[#004A74]/60 px-4">
             {totalCount} Presentations Available
           </div>
        </div>
      </div>

      <div className="p-6 md:p-10 pb-32 flex-1">
        {isLoading ? (
          effectiveViewMode === 'grid' ? <CardGridSkeleton count={6} /> : <div className="mt-4"><TableSkeletonRows count={8} /></div>
        ) : presentations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <PresentationChartBarIcon className="w-20 h-20 mb-4 text-[#004A74]" />
            <h3 className="text-lg font-black text-[#004A74] uppercase tracking-widest">No Presentations Found</h3>
            <p className="text-sm font-medium text-gray-500 mt-2">Transform your collection into visual synthesis.</p>
          </div>
        ) : effectiveViewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {presentations.map((ppt) => (
              <div 
                key={ppt.id} 
                onClick={() => openInGoogleSlides(ppt.gSlidesId)}
                className={`group relative bg-white border border-gray-100 border-l-[6px] rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden h-full flex flex-col ${
                  selectedIds.includes(ppt.id) ? 'ring-4 ring-[#004A74]/10 border-[#004A74]' : ''
                }`}
                style={{ borderLeftColor: ppt.themeConfig.primaryColor }}
              >
                <div 
                  className="absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-8 -translate-y-8 rounded-full"
                  style={{ backgroundColor: ppt.themeConfig.primaryColor }}
                />

                <div className="flex items-start justify-between mb-6">
                   <div 
                     onClick={(e) => { e.stopPropagation(); toggleSelectItem(ppt.id); }}
                     className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                       selectedIds.includes(ppt.id) ? 'bg-[#004A74] border-[#004A74] text-white' : 'bg-white border-gray-200'
                     }`}
                   >
                     {selectedIds.includes(ppt.id) && <PlusIcon className="w-3.5 h-3.5 rotate-45 stroke-[4]" />}
                   </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => handleDelete(e, ppt.id)} className="p-2 text-red-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-300 group-hover:text-[#004A74] transition-colors" />
                  </div>
                </div>

                <h3 className="text-lg font-black text-[#004A74] line-clamp-2 leading-tight mb-4 uppercase flex-1">{ppt.title}</h3>
                
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center gap-2 text-gray-400">
                    <UserGroupIcon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest line-clamp-1">{ppt.presenters.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{formatPresentationDate(ppt.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-end">
                  <span className="text-[10px] font-black text-[#004A74] uppercase tracking-tighter">{ppt.slidesCount} SLIDES</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <StandardTableContainer>
            <StandardTableWrapper>
              <thead>
                <tr>
                  <StandardTh width="60px">
                    <div className="flex items-center justify-center">
                      <StandardCheckbox onChange={toggleSelectAll} checked={presentations.length > 0 && selectedIds.length === presentations.length} />
                    </div>
                  </StandardTh>
                  <StandardTh width="300px" onClick={() => handleSort('title')} isActiveSort={sortConfig.key === 'title'}>Title {getSortIcon('title')}</StandardTh>
                  <StandardTh width="200px" onClick={() => handleSort('presenters')} isActiveSort={sortConfig.key === 'presenters'}>Presenter(s) {getSortIcon('presenters')}</StandardTh>
                  <StandardTh width="100px">Slides</StandardTh>
                  <StandardTh width="180px" onClick={() => handleSort('createdAt')} isActiveSort={sortConfig.key === 'createdAt'}>Date Created {getSortIcon('createdAt')}</StandardTh>
                  <StandardTh width="100px" className="sticky right-0 bg-gray-50">Action</StandardTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {presentations.map((ppt) => (
                  <StandardTr key={ppt.id} onClick={() => toggleSelectItem(ppt.id)} className="cursor-pointer">
                    <td className="px-6 py-4 text-center">
                      <StandardCheckbox checked={selectedIds.includes(ppt.id)} readOnly />
                    </td>
                    <StandardTd>
                      <ElegantTooltip text={ppt.title}>
                        <p className="text-sm font-bold text-[#004A74] uppercase line-clamp-1">{ppt.title}</p>
                      </ElegantTooltip>
                    </StandardTd>
                    <StandardTd className="text-xs text-gray-500 font-semibold">{ppt.presenters.join(', ')}</StandardTd>
                    <StandardTd className="text-center"><span className="px-3 py-1 bg-gray-50 rounded-lg font-black text-[#004A74] text-[10px]">{ppt.slidesCount}</span></StandardTd>
                    <StandardTd className="text-xs text-gray-400 font-medium text-center">{formatPresentationDate(ppt.createdAt)}</StandardTd>
                    <StandardTd className="sticky right-0 bg-white group-hover:bg-[#f0f7fa]">
                       <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                         <button onClick={() => openInGoogleSlides(ppt.gSlidesId)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg"><EyeIcon className="w-4 h-4" /></button>
                         <button onClick={(e) => handleDelete(e, ppt.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                       </div>
                    </StandardTd>
                  </StandardTr>
                ))}
              </tbody>
            </StandardTableWrapper>
          </StandardTableContainer>
        )}
        
        {totalCount > itemsPerPage && (
          <div className="mt-8 bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <StandardTableFooter 
              totalItems={totalCount} 
              currentPage={currentPage} 
              itemsPerPage={itemsPerPage} 
              totalPages={Math.ceil(totalCount / itemsPerPage)} 
              onPageChange={setCurrentPage} 
            />
          </div>
        )}
      </div>

      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${selectedIds.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="px-5 py-3 bg-[#004A74] text-white rounded-full shadow-[0_20px_50px_-10px_rgba(0,74,116,0.4)] flex items-center gap-4 border border-white/10 backdrop-blur-md">
           <div className="flex items-center gap-2 px-1">
             <span className="text-[10px] font-black uppercase tracking-widest text-[#FED400]">{selectedIds.length}</span>
             <span className="text-[10px] font-black uppercase tracking-widest">Selected</span>
           </div>
           <div className="w-px h-5 bg-white/20" />
           <div className="flex items-center gap-2">
              <button 
                onClick={handleBatchDelete}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-sm active:scale-90"
                title="Delete Selected"
              >
                <TrashIcon className="w-4 h-4 stroke-[2.5]" />
              </button>
           </div>
           <div className="w-px h-5 bg-white/20" />
           <button 
             onClick={() => setSelectedIds([])} 
             className="text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all px-2"
           >
             Clear
           </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #004A7420; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default RelatedPresentations;
