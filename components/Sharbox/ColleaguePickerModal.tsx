import React, { useState, useEffect } from 'react';
import { ColleagueItem, LibraryItem } from '../../types';
import { fetchColleaguesPaginated } from '../../services/ColleagueService';
import { shareToColleague } from '../../services/SharboxService';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon,
  CheckIcon,
  UserIcon,
  ShareIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  ChatBubbleBottomCenterTextIcon,
  ShieldCheckIcon,
  BuildingLibraryIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { SmartSearchBox } from '../Common/SearchComponents';
import { 
  StandardTableContainer, 
  StandardTableWrapper, 
  StandardTh, 
  StandardTr, 
  StandardTd, 
  StandardTableFooter
} from '../Common/TableComponents';
import { TableSkeletonRows } from '../Common/LoadingComponents';
import { showXeenapsToast } from '../../utils/toastUtils';
import { BRAND_ASSETS } from '../../assets';

interface ColleaguePickerModalProps {
  item: LibraryItem;
  onClose: () => void;
}

const ColleaguePickerModal: React.FC<ColleaguePickerModalProps> = ({ item, onClose }) => {
  const [colleagues, setColleagues] = useState<ColleagueItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Step Management
  const [step, setStep] = useState<'SELECT' | 'CONFIRM'>('SELECT');
  const [selectedColleague, setSelectedColleague] = useState<ColleagueItem | null>(null);
  const [message, setMessage] = useState('');
  
  const itemsPerPage = 6;

  useEffect(() => {
    if (step === 'SELECT') {
      const loadData = async () => {
        setIsLoading(true);
        const result = await fetchColleaguesPaginated(currentPage, itemsPerPage, search);
        setColleagues(result.items);
        setTotalCount(result.totalCount);
        setIsLoading(false);
      };
      loadData();
    }
  }, [currentPage, search, step]);

  const handleInitiateShare = (colleague: ColleagueItem) => {
    setSelectedColleague(colleague);
    setStep('CONFIRM');
  };

  const handleExecuteShare = async () => {
    if (!selectedColleague) return;
    setIsSharing(true);
    showXeenapsToast('info', `Authorizing P2P Sync to ${selectedColleague.name}...`);
    
    const success = await shareToColleague(
      selectedColleague.uniqueAppId, 
      selectedColleague.name, 
      selectedColleague.photoUrl || '', 
      message,
      item
    );
    
    if (success) {
      showXeenapsToast('success', 'Shared successfully');
      onClose();
    } else {
      showXeenapsToast('error', 'Sharing failed. Check recipient ID.');
    }
    setIsSharing(false);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20">
        
        {/* SHARED HEADER */}
        <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
              {step === 'SELECT' ? <ShareIcon className="w-6 h-6" /> : <PaperAirplaneIcon className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">
                {step === 'SELECT' ? 'Select Recipient' : 'Authorize Sync'}
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global P2P Exchange</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>

        {step === 'SELECT' ? (
          /* STEP 1: SELECTION TABLE */
          <>
            <div className="px-8 py-4 bg-white border-b border-gray-100 shrink-0">
              <SmartSearchBox 
                value={search} 
                onChange={setSearch} 
                className="w-full"
                phrases={["Search colleagues by name...", "Search by unique ID..."]}
              />
            </div>

            <div className="flex-1 overflow-hidden p-6 flex flex-col bg-[#fcfcfc]">
              <StandardTableContainer>
                <StandardTableWrapper>
                  <thead>
                    <tr>
                      <StandardTh width="80px">Portrait</StandardTh>
                      <StandardTh width="300px">Name & ID</StandardTh>
                      <StandardTh width="250px">Affiliation</StandardTh>
                      <StandardTh width="100px" className="sticky right-0 bg-gray-50">Action</StandardTh>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoading ? (
                      <TableSkeletonRows count={5} />
                    ) : colleagues.length === 0 ? (
                      <tr><td colSpan={4} className="py-20 text-center font-black text-gray-300 uppercase text-xs tracking-widest">No colleagues found</td></tr>
                    ) : (
                      colleagues.map((col) => (
                        <StandardTr key={col.id}>
                          <td className="px-6 py-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm mx-auto">
                              <img src={col.photoUrl || BRAND_ASSETS.USER_DEFAULT} className="w-full h-full object-cover" alt={col.name} />
                            </div>
                          </td>
                          <StandardTd>
                            <p className="text-xs font-bold text-[#004A74] uppercase truncate">{col.name}</p>
                            <p className="text-[8px] font-mono text-gray-400 uppercase">{col.uniqueAppId}</p>
                          </StandardTd>
                          <StandardTd className="text-[10px] font-bold text-gray-500 uppercase truncate">{col.affiliation || 'Independent'}</StandardTd>
                          <StandardTd className="sticky right-0 bg-white group-hover:bg-[#f0f7fa]">
                            <button 
                              onClick={() => handleInitiateShare(col)}
                              className="w-full py-2 bg-[#004A74] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FED400] hover:text-[#004A74] transition-all flex items-center justify-center gap-2"
                            >
                              <ShareIcon className="w-3 h-3" />
                              Select
                            </button>
                          </StandardTd>
                        </StandardTr>
                      ))
                    )}
                  </tbody>
                </StandardTableWrapper>
                <StandardTableFooter 
                  totalItems={totalCount} 
                  currentPage={currentPage} 
                  itemsPerPage={itemsPerPage} 
                  totalPages={Math.ceil(totalCount / itemsPerPage)} 
                  onPageChange={setCurrentPage} 
                />
              </StandardTableContainer>
            </div>
          </>
        ) : (
          /* STEP 2: CONFIRMATION FORM */
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 animate-in slide-in-from-right duration-500">
            <div className="max-w-3xl mx-auto space-y-10 pb-10">
              
              {/* Recipient Profile Section */}
              <div className="flex flex-col md:flex-row items-center gap-8 bg-gray-50 p-8 rounded-[3rem] border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#004A74]/5 -translate-y-10 translate-x-10 rounded-full" />
                
                <div className="relative shrink-0">
                  <div className="w-32 h-32 rounded-full border-4 border-[#FED400] overflow-hidden shadow-xl bg-white">
                    <img src={selectedColleague?.photoUrl || BRAND_ASSETS.USER_DEFAULT} className="w-full h-full object-cover" alt="Recipient" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-[#004A74] text-white p-2 rounded-xl shadow-lg border-2 border-white">
                    <UserIcon className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-3">
                  <div>
                    <h3 className="text-2xl font-black text-[#004A74] uppercase tracking-tight">{selectedColleague?.name}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                      <AcademicCapIcon className="w-4 h-4" /> {selectedColleague?.affiliation || 'Independent Scholar'}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
                    <ShieldCheckIcon className="w-4 h-4 text-[#004A74]" />
                    <span className="text-[10px] font-mono font-black text-[#004A74] uppercase tracking-widest">{selectedColleague?.uniqueAppId}</span>
                  </div>
                </div>
              </div>

              {/* Source Highlight Section */}
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-4 flex items-center gap-2">
                  <BuildingLibraryIcon className="w-3.5 h-3.5" /> Source Document Ready for Transmit
                </label>
                <div className="bg-white p-6 border-2 border-dashed border-gray-100 rounded-3xl flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-[#FED400]/20 group-hover:text-[#004A74] transition-all">
                    <BuildingLibraryIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-[#004A74] uppercase leading-tight line-clamp-2">{item.title}</h4>
                </div>
              </div>

              {/* Message Input Section */}
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-4 flex items-center gap-2">
                  <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5" /> Custom Message (Optional)
                </label>
                <textarea 
                  autoFocus
                  className="w-full bg-gray-50 p-6 border border-gray-200 rounded-[2.5rem] outline-none text-sm font-medium text-[#004A74] placeholder:text-gray-300 min-h-[120px] resize-none transition-all focus:bg-white focus:ring-4 focus:ring-[#004A74]/5"
                  placeholder="Tell your colleague why you are sharing this knowledge..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex gap-4">
                <button 
                  onClick={() => setStep('SELECT')}
                  disabled={isSharing}
                  className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
                >
                  <ArrowLeftIcon className="w-4 h-4 stroke-[3]" /> Change Recipient
                </button>
                <button 
                  onClick={handleExecuteShare}
                  disabled={isSharing}
                  className="flex-[2] py-5 bg-[#004A74] text-[#FED400] rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-[#004A74]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {isSharing ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />}
                  Confirm & Transmit Knowledge
                </button>
              </div>
            </div>
          </div>
        )}
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

export default ColleaguePickerModal;