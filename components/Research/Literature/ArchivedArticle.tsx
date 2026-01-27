import React, { useState, useEffect, useMemo } from 'react';
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
  FileText
} from 'lucide-react';
import { ArchivedArticleItem } from '../../../types';
import { fetchArchivedArticles, deleteArchivedArticle, toggleFavoriteArticle } from '../../../services/LiteratureService';
import { showXeenapsToast } from '../../../utils/toastUtils';
import { showXeenapsDeleteConfirm } from '../../../utils/confirmUtils';
import { SmartSearchBox } from '../../Common/SearchComponents';
import { 
  StandardTableContainer, 
  StandardTableWrapper, 
  StandardTh, 
  StandardTr, 
  StandardTd, 
  StandardCheckbox,
  ElegantTooltip 
} from '../../Common/TableComponents';
import { 
  StandardQuickAccessBar, 
  StandardQuickActionButton 
} from '../../Common/ButtonComponents';
import { TableSkeletonRows, CardGridSkeleton } from '../../Common/LoadingComponents';

const ArchivedArticle: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ArchivedArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ArchivedArticleItem; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchArchivedArticles();
    setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (appliedSearch) {
      const s = appliedSearch.toLowerCase();
      result = result.filter(i => 
        i.title.toLowerCase().includes(s) || 
        i.label.toLowerCase().includes(s) || 
        i.citationHarvard.toLowerCase().includes(s)
      );
    }
    
    result.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, appliedSearch, sortConfig]);

  const handleSort = (key: keyof ArchivedArticleItem) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIcon = (key: keyof ArchivedArticleItem) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="text-gray-300" />;
    return sortConfig.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) setSelectedIds([]);
    else setSelectedIds(filteredItems.map(i => i.id));
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed) {
      const success = await deleteArchivedArticle(id);
      if (success) {
        showXeenapsToast('success', 'Article removed from archive');
        setItems(prev => prev.filter(i => i.id !== id));
      }
    }
  };

  const handleBatchDelete = async () => {
    const confirmed = await showXeenapsDeleteConfirm(selectedIds.length);
    if (confirmed) {
      showXeenapsToast('info', 'Processing bulk deletion...');
      for (const id of selectedIds) {
        await deleteArchivedArticle(id);
      }
      showXeenapsToast('success', 'Selected articles removed');
      setItems(prev => prev.filter(i => !selectedIds.includes(i.id)));
      setSelectedIds([]);
    }
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    const success = await toggleFavoriteArticle(id, !current);
    if (success) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !current } : i));
    }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-500 overflow-hidden">
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
              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-100">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#004A74] shadow-sm' : 'text-gray-400'}`}><LayoutGrid size={16} /></button>
                <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-[#004A74] shadow-sm' : 'text-gray-400'}`}><List size={16} /></button>
              </div>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
           <SmartSearchBox 
             value={localSearch} 
             onChange={setLocalSearch} 
             onSearch={() => setAppliedSearch(localSearch)}
             phrases={["Search archived title...", "Search by label...", "Search citations..."]}
           />
           <div className="text-[10px] font-black uppercase tracking-widest text-[#004A74]/60 px-4">
             {filteredItems.length} Articles Stored
           </div>
        </div>
      </div>

      <StandardQuickAccessBar isVisible={selectedIds.length > 0} selectedCount={selectedIds.length}>
         <StandardQuickActionButton variant="danger" onClick={handleBatchDelete}><Trash2 size={18} /></StandardQuickActionButton>
      </StandardQuickAccessBar>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-20">
        {isLoading ? (
          viewMode === 'table' ? <TableSkeletonRows count={8} /> : <CardGridSkeleton count={6} />
        ) : filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
            <Archive className="w-20 h-20 mb-4 text-[#004A74]" />
            <h3 className="text-lg font-black text-[#004A74] uppercase tracking-[0.3em]">Archive is Empty</h3>
            <p className="text-sm font-medium mt-2">Go to "Find Article" to start building your reference database.</p>
          </div>
        ) : viewMode === 'table' ? (
          <StandardTableContainer>
            <StandardTableWrapper>
              <thead>
                <tr>
                  <th className="px-6 py-4 w-12 text-center bg-gray-50 border-r border-gray-100/50">
                    <StandardCheckbox onChange={toggleSelectAll} checked={selectedIds.length === filteredItems.length} />
                  </th>
                  <StandardTh onClick={() => handleSort('title')} isActiveSort={sortConfig.key === 'title'}>Title {getSortIcon('title')}</StandardTh>
                  <StandardTh onClick={() => handleSort('label')} isActiveSort={sortConfig.key === 'label'}>Label {getSortIcon('label')}</StandardTh>
                  <StandardTh width="400px">Harvard Citation</StandardTh>
                  <StandardTh onClick={() => handleSort('createdAt')} isActiveSort={sortConfig.key === 'createdAt'}>Saved At {getSortIcon('createdAt')}</StandardTh>
                  <StandardTh className="sticky right-0 bg-gray-50">Action</StandardTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredItems.map(item => (
                  <StandardTr key={item.id} className="cursor-default">
                    <td className="px-6 py-4 text-center border-r border-gray-100/50">
                       <StandardCheckbox checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                    </td>
                    <StandardTd>
                       <ElegantTooltip text={item.title}>
                          <div className="flex items-center gap-3">
                             <button onClick={() => handleToggleFavorite(item.id, item.isFavorite)}>
                               <Star size={16} className={item.isFavorite ? 'text-[#FED400] fill-[#FED400]' : 'text-gray-200'} />
                             </button>
                             <span className="text-xs font-bold text-[#004A74] uppercase line-clamp-2">{item.title}</span>
                          </div>
                       </ElegantTooltip>
                    </StandardTd>
                    <StandardTd>
                       <span className="px-2 py-1 bg-[#004A74]/5 border border-[#004A74]/10 rounded-lg text-[9px] font-black text-[#004A74] uppercase tracking-widest whitespace-nowrap">
                         {item.label}
                       </span>
                    </StandardTd>
                    <StandardTd>
                       <p className="text-[11px] text-gray-500 font-medium italic leading-relaxed line-clamp-2">{item.citationHarvard}</p>
                    </StandardTd>
                    <StandardTd className="text-[10px] font-bold text-gray-400 text-center">
                       {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </StandardTd>
                    <StandardTd className="sticky right-0 bg-white group-hover:bg-[#f0f7fa]">
                       <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => window.open(item.url || `https://doi.org/${item.doi}`, '_blank')}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          >
                             <ExternalLink size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </StandardTd>
                  </StandardTr>
                ))}
              </tbody>
            </StandardTableWrapper>
          </StandardTableContainer>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                className={`group bg-white border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full ${selectedIds.includes(item.id) ? 'border-[#004A74] ring-4 ring-[#004A74]/5' : 'border-gray-100'}`}
              >
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-2">
                     <StandardCheckbox checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                     <button onClick={() => handleToggleFavorite(item.id, item.isFavorite)}>
                       <Star size={18} className={item.isFavorite ? 'text-[#FED400] fill-[#FED400]' : 'text-gray-200'} />
                     </button>
                   </div>
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

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => window.open(item.url || `https://doi.org/${item.doi}`, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#004A74] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#003859] transition-all active:scale-95"
                  >
                    <ExternalLink size={14} /> Open
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
                  >
                    <Trash2 size={16} />
                  </button>
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 74, 116, 0.2); }
      `}</style>
    </div>
  );
};

export default ArchivedArticle;