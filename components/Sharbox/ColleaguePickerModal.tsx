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
  ArrowPathIcon
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
  
  const itemsPerPage = 6;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const result = await fetchColleaguesPaginated(currentPage, itemsPerPage, search);
      setColleagues(result.items);
      setTotalCount(result.totalCount);
      setIsLoading(false);
    };
    loadData();
  }, [currentPage, search]);

  const handleShare = async (colleague: ColleagueItem) => {
    setIsSharing(true);
    showXeenapsToast('info', `Authorizing P2P Sync to ${colleague.name}...`);
    
    const success = await shareToColleague(colleague.uniqueAppId, colleague.name, colleague.photoUrl || '', item);
    
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
        
        <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
              <ShareIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">Select Recipient</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global P2P Exchange</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>

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
                          disabled={isSharing}
                          onClick={() => handleShare(col)}
                          className="w-full py-2 bg-[#004A74] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FED400] hover:text-[#004A74] transition-all flex items-center justify-center gap-2"
                        >
                          {isSharing ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <ShareIcon className="w-3 h-3" />}
                          Share
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
      </div>
    </div>
  );
};

export default ColleaguePickerModal;