import React, { useState, useEffect, useCallback } from 'react';
import { SharboxItem, SharboxStatus } from '../../types';
import { fetchSharboxItems, claimSharboxItem } from '../../services/SharboxService';
import { 
  InboxIcon, 
  PaperAirplaneIcon, 
  PlusIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  SparklesIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ChatBubbleBottomCenterTextIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { SmartSearchBox } from '../Common/SearchComponents';
import { StandardFilterButton } from '../Common/ButtonComponents';
import { CardGridSkeleton } from '../Common/LoadingComponents';
import { showXeenapsToast } from '../../utils/toastUtils';
import { BRAND_ASSETS } from '../../assets';
import SharboxWorkflowModal from './SharboxWorkflowModal';
import SharboxDetailView from './SharboxDetailView';

const SharboxMain: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Inbox' | 'Sent'>('Inbox');
  const [items, setItems] = useState<SharboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Workflow state
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SharboxItem | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchSharboxItems(activeTab);
    setItems(data);
    setIsLoading(false);
  }, [activeTab]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleClaim = async (e: React.MouseEvent, item: SharboxItem) => {
    e.stopPropagation();
    showXeenapsToast('info', 'Importing knowledge to your library...');
    const success = await claimSharboxItem(item.id);
    if (success) {
      showXeenapsToast('success', 'Claimed successfully');
      loadItems();
    } else {
      showXeenapsToast('error', 'Import failed');
    }
  };

  const filteredItems = items.filter(i => {
    const s = search.toLowerCase();
    const titleMatch = (i.title || '').toLowerCase().includes(s);
    const senderMatch = (i.senderName || '').toLowerCase().includes(s);
    const receiverMatch = (i.receiverName || '').toLowerCase().includes(s);
    const affiliationMatch = (i.senderAffiliation || '').toLowerCase().includes(s);
    const messageMatch = (i.message || '').toLowerCase().includes(s);
    
    return titleMatch || senderMatch || receiverMatch || affiliationMatch || messageMatch;
  });

  const formatTimestamp = (iso: string) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "-";
      return `${d.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]} ${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch { return "-"; }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      {/* SHARBOX DETAIL VIEW OVERLAY */}
      {selectedItem && (
        <SharboxDetailView 
          item={selectedItem} 
          activeTab={activeTab} 
          onClose={() => setSelectedItem(null)} 
        />
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between mb-8 shrink-0 px-1">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
              <InboxIcon className="w-6 h-6" />
           </div>
           <div>
              <h2 className="text-xl md:text-2xl font-black text-[#004A74] uppercase tracking-tight">Sharbox</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cross-User Knowledge Hub</p>
           </div>
        </div>

        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-100 shrink-0">
          <button 
            onClick={() => setActiveTab('Inbox')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'Inbox' ? 'bg-[#004A74] text-white shadow-md' : 'text-gray-400 hover:text-[#004A74]'}`}
          >
            <InboxIcon className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Inbox</span>
          </button>
          <button 
            onClick={() => setActiveTab('Sent')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'Sent' ? 'bg-[#004A74] text-white shadow-md' : 'text-gray-400 hover:text-[#004A74]'}`}
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sent</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 px-1 items-center">
        <div className="flex-1 w-full">
          <SmartSearchBox 
            value={search} 
            onChange={setSearch} 
            className="w-full lg:max-w-2xl"
            phrases={["Search incoming items...", "Find shared history...", "Search by sender..."]}
          />
        </div>
        {activeTab === 'Sent' && (
          <button 
            onClick={() => setIsWorkflowOpen(true)}
            className="flex items-center justify-center gap-3 px-8 py-3.5 bg-[#FED400] text-[#004A74] rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 transition-all w-full md:w-auto"
          >
            <ShareIcon className="w-4 h-4 stroke-[3]" /> Share New Knowledge
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
        {isLoading ? (
          <CardGridSkeleton count={8} />
        ) : filteredItems.length === 0 ? (
          <div className="py-40 text-center flex flex-col items-center justify-center space-y-4 opacity-20 grayscale">
             <InboxIcon className="w-20 h-20 text-[#004A74]" />
             <p className="text-sm font-black uppercase tracking-[0.4em]">No activity found in your {activeTab}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm shrink-0 bg-gray-50">
                      <img 
                        src={activeTab === 'Inbox' ? (item.senderPhotoUrl || BRAND_ASSETS.USER_DEFAULT) : (item.receiverPhotoUrl || BRAND_ASSETS.USER_DEFAULT)} 
                        className="w-full h-full object-cover" 
                        alt="User" 
                      />
                   </div>
                   <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                        {activeTab === 'Inbox' ? 'FROM' : 'TO'}
                      </p>
                      <h4 className="text-[10px] font-bold text-[#004A74] truncate uppercase">
                        {activeTab === 'Inbox' ? (item.senderName || 'Anonymous') : (item.receiverName || 'Recipient')}
                      </h4>
                   </div>
                   <div className="ml-auto">
                     {item.status === SharboxStatus.CLAIMED && (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                     )}
                   </div>
                </div>

                <div className="mb-4">
                   <div className="flex items-center gap-1.5 mb-2">
                      <SparklesIcon className="w-3 h-3 text-[#FED400]" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#004A74]/40">{item.category || 'General'}</span>
                   </div>
                   <h3 className="text-sm font-black text-[#004A74] uppercase leading-tight line-clamp-2">{item.title || 'Untitled Document'}</h3>
                </div>

                {/* Message Snippet UI */}
                {item.message && (
                  <div className="mb-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 relative overflow-hidden group/msg">
                    <ChatBubbleBottomCenterTextIcon className="absolute -bottom-1 -right-1 w-8 h-8 text-[#004A74]/5" />
                    <p className="text-[10px] font-bold text-[#004A74]/70 italic leading-relaxed line-clamp-2">
                      "{item.message}"
                    </p>
                  </div>
                )}

                <div className="space-y-2 mb-6 flex-1">
                   <p className="text-[10px] font-bold text-gray-500 italic line-clamp-1">
                      {Array.isArray(item.authors) ? item.authors.join(', ') : 'Unknown Authors'}
                   </p>
                   <div className="flex items-center gap-2 text-gray-400">
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold uppercase tracking-tight">{formatTimestamp(item.timestamp)}</span>
                   </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                   {activeTab === 'Inbox' && item.status === SharboxStatus.UNCLAIMED ? (
                     <button 
                       onClick={(e) => handleClaim(e, item)}
                       className="flex items-center gap-2 px-4 py-2 bg-[#FED400] text-[#004A74] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:scale-105 transition-all"
                     >
                        <PlusIcon className="w-3 h-3 stroke-[3]" /> Claim/Import
                     </button>
                   ) : (
                     <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${item.status === SharboxStatus.CLAIMED ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.status}
                     </span>
                   )}
                   <div className="p-2 bg-gray-50 rounded-xl text-gray-300 group-hover:text-[#004A74] transition-colors">
                      <ChevronRightIcon className="w-4 h-4" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isWorkflowOpen && (
        <SharboxWorkflowModal 
          onClose={() => {
            setIsWorkflowOpen(false);
            loadItems();
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

export default SharboxMain;