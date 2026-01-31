
import React, { useState, useEffect } from 'react';
import { LibraryItem, TracerReference } from '../../../../types';
import { fetchTracerReferences, linkTracerReference, unlinkTracerReference } from '../../../../services/TracerService';
import { fetchLibraryPaginated } from '../../../../services/gasService';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Loader2, 
  Eye, 
  Quote,
  Sparkles,
  ExternalLink,
  /* Added missing icon import */
  Library
} from 'lucide-react';
import { SmartSearchBox } from '../../../Common/SearchComponents';
import { showXeenapsToast } from '../../../../utils/toastUtils';
import ReferenceDetailView from '../Modals/ReferenceDetailView';

interface ReferenceTabProps {
  projectId: string;
  libraryItems: LibraryItem[];
}

const ReferenceTab: React.FC<ReferenceTabProps> = ({ projectId, libraryItems }) => {
  const [refs, setRefs] = useState<TracerReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<LibraryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRef, setSelectedRef] = useState<LibraryItem | null>(null);

  const loadRefs = async () => {
    setIsLoading(true);
    const data = await fetchTracerReferences(projectId);
    setRefs(data);
    setIsLoading(false);
  };

  useEffect(() => { loadRefs(); }, [projectId]);

  const handleSearch = async () => {
    if (localSearch.length < 3) return;
    setIsSearching(true);
    const result = await fetchLibraryPaginated(1, 10, localSearch, 'Literature', 'research');
    setSearchResults(result.items);
    setIsSearching(false);
  };

  const handleLink = async (lib: LibraryItem) => {
    if (refs.some(r => r.collectionId === lib.id)) {
      showXeenapsToast('warning', 'Already linked');
      return;
    }
    const success = await linkTracerReference({ projectId, collectionId: lib.id });
    if (success) {
      showXeenapsToast('success', 'Reference anchored');
      loadRefs();
      setSearchResults([]);
      setLocalSearch('');
    }
  };

  const handleUnlink = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (await unlinkTracerReference(id)) {
      showXeenapsToast('success', 'Reference unlinked');
      loadRefs();
    }
  };

  const associatedItems = refs.map(r => {
    const lib = libraryItems.find(it => it.id === r.collectionId);
    return lib ? { ...lib, refRowId: r.id } : null;
  }).filter(Boolean) as (LibraryItem & { refRowId: string })[];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
      {selectedRef && <ReferenceDetailView item={selectedRef} onClose={() => setSelectedRef(null)} />}

      {/* SEARCH SECTION */}
      <section className="space-y-4">
         <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Anchor New Reference</h3>
         <div className="relative">
            <SmartSearchBox value={localSearch} onChange={setLocalSearch} onSearch={handleSearch} className="w-full" phrases={["Search in main library to link..."]} />
            {isSearching && <div className="absolute right-16 top-1/2 -translate-y-1/2"><Loader2 size={16} className="animate-spin text-[#004A74]" /></div>}
         </div>

         {searchResults.length > 0 && (
           <div className="grid grid-cols-1 gap-3 animate-in slide-in-from-top-2">
              {searchResults.map(lib => (
                <div key={lib.id} onClick={() => handleLink(lib)} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between cursor-pointer hover:border-[#FED400] hover:shadow-lg transition-all">
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-[#004A74] uppercase truncate">{lib.title}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">{lib.authors[0]} • {lib.year}</p>
                   </div>
                   <Plus size={18} className="text-[#004A74]" />
                </div>
              ))}
           </div>
         )}
      </section>

      {/* ASSOCIATED REFERENCES */}
      <section className="space-y-6">
         <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#004A74]">Project Reference Pool</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? <div className="col-span-full h-32 skeleton rounded-[2rem]" /> : associatedItems.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-20"><Library size={48} className="mx-auto mb-2" /><p className="text-[10px] font-black uppercase">No references linked</p></div>
            ) : associatedItems.map(lib => (
              <div key={lib.id} onClick={() => setSelectedRef(lib)} className="group bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col hover:shadow-2xl transition-all duration-500 cursor-pointer relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-[#004A74]/5 -translate-y-12 translate-x-12 rounded-full" />
                 <div className="flex items-start justify-between mb-4">
                    <span className="px-2 py-0.5 bg-gray-50 text-[#004A74] text-[8px] font-black uppercase rounded-md">{lib.topic}</span>
                    <button onClick={(e) => handleUnlink(e, lib.refRowId)} className="p-2 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                 </div>
                 <h4 className="text-sm font-black text-[#004A74] uppercase leading-tight line-clamp-2 mb-4 flex-1">{lib.title}</h4>
                 <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-gray-400">
                       <Quote size={12} className="text-[#FED400]" />
                       <span className="text-[8px] font-black uppercase tracking-widest group-hover:text-[#004A74]">Ready to Quote</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-200 group-hover:text-[#004A74]" />
                 </div>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};

export default ReferenceTab;
