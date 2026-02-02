import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TracerFinanceItem } from '../../../../types';
import { fetchTracerFinance, deleteTracerFinance } from '../../../../services/TracerService';
import { 
  Plus, 
  Trash2, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Filter, 
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  ExternalLink,
  Banknote,
  // Added missing Eye icon import
  Eye
} from 'lucide-react';
import { SmartSearchBox } from '../../../Common/SearchComponents';
import { 
  StandardTableContainer, 
  StandardTableWrapper, 
  StandardTh, 
  StandardTr, 
  StandardTd,
  StandardTableFooter
} from '../../../Common/TableComponents';
// Added missing TableSkeletonRows import
import { CardGridSkeleton, TableSkeletonRows } from '../../../Common/LoadingComponents';
import { showXeenapsToast } from '../../../../utils/toastUtils';
import { showXeenapsDeleteConfirm } from '../../../../utils/confirmUtils';
import FinanceFormModal from '../Modals/FinanceFormModal';

interface FinanceTabProps {
  projectId: string;
}

const CURRENCIES = [
  { code: 'IDR', symbol: 'Rp' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'SGD', symbol: 'S$' }
];

const FinanceTab: React.FC<FinanceTabProps> = ({ projectId }) => {
  const [items, setItems] = useState<TracerFinanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  
  // Filters
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<TracerFinanceItem | undefined>();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTracerFinance(projectId, startDate, endDate, appliedSearch);
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, startDate, endDate, appliedSearch]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = () => {
    setAppliedSearch(localSearch);
  };

  const formatMoney = (val: number) => {
    return `${currency.symbol} ${new Intl.NumberFormat('id-ID').format(val)}`;
  };

  const formatDisplayTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear().toString().substring(2)} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch { return "-"; }
  };

  const totals = useMemo(() => {
    return items.reduce((acc, curr) => ({
      credit: acc.credit + (curr.credit || 0),
      debit: acc.debit + (curr.debit || 0),
      balance: items.length > 0 ? items[items.length - 1].balance : 0
    }), { credit: 0, debit: 0, balance: 0 });
  }, [items]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed) {
      const result = await deleteTracerFinance(id);
      if (result.status === 'success') {
        showXeenapsToast('success', 'Transaction removed from ledger');
        loadData();
      } else {
        showXeenapsToast('error', result.message || 'Balance Integrity Guard Blocked removal');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-20">
      
      {/* 1. TOP HEADER: CURRENCY & BALANCE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Currency Selector */}
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Currency Matrix</h4>
            <select 
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-xs font-black text-[#004A74] outline-none cursor-pointer focus:ring-4 focus:ring-[#004A74]/5"
              value={currency.code}
              onChange={(e) => setCurrency(CURRENCIES.find(c => c.code === e.target.value)!)}
            >
               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
            </select>
         </div>

         {/* Total Credit */}
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shrink-0">
               <TrendingUp size={24} />
            </div>
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Income</p>
               <h3 className="text-lg font-black text-green-600">{formatMoney(totals.credit)}</h3>
            </div>
         </div>

         {/* Total Debit */}
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
               <TrendingDown size={24} />
            </div>
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Expense</p>
               <h3 className="text-lg font-black text-red-600">{formatMoney(totals.debit)}</h3>
            </div>
         </div>

         {/* Balance */}
         <div className="bg-[#004A74] p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden flex items-center gap-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -translate-y-16 translate-x-16 rounded-full" />
            <div className="w-12 h-12 bg-[#FED400] text-[#004A74] rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative z-10">
               <Wallet size={24} />
            </div>
            <div className="relative z-10">
               <p className="text-[9px] font-black text-[#FED400] uppercase tracking-widest">Total Balance</p>
               <h3 className="text-xl font-black text-white">{formatMoney(totals.balance)}</h3>
            </div>
         </div>
      </div>

      {/* 2. FILTER & ACTIONS BAR */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
         <div className="flex flex-col md:flex-row gap-3 w-full lg:max-w-4xl flex-1">
            <SmartSearchBox 
              value={localSearch} 
              onChange={setLocalSearch} 
              onSearch={handleSearch} 
              phrases={["Search description...", "Search expenses...", "Find income..."]}
            />
            <div className="flex flex-col md:flex-row items-center gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200">
               <div className="flex items-center gap-2 px-3 py-1.5 md:py-0">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">From</span>
                  <input type="date" className="bg-transparent text-[10px] font-bold text-[#004A74] outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
               </div>
               <div className="hidden md:block w-px h-4 bg-gray-300" />
               <div className="flex items-center gap-2 px-3 py-1.5 md:py-0">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">To</span>
                  <input type="date" className="bg-transparent text-[10px] font-bold text-[#004A74] outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
               </div>
               {(startDate || endDate) && (
                 <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-2 text-red-400 hover:bg-white rounded-lg transition-all"><X size={14} /></button>
               )}
            </div>
         </div>
         
         <button 
           onClick={() => { setViewingItem(undefined); setIsFormOpen(true); }}
           className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#004A74] text-[#FED400] rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:scale-105 active:scale-95 transition-all"
         >
           <Plus size={18} /> Add Transaction
         </button>
      </div>

      {/* 3. TABLE LEDGER */}
      <div className="flex-1">
        <StandardTableContainer>
          <StandardTableWrapper>
             <thead>
                <tr>
                   <StandardTh width="180px">Timestamp</StandardTh>
                   <StandardTh width="180px">Credit (+)</StandardTh>
                   <StandardTh width="180px">Debit (-)</StandardTh>
                   <StandardTh width="200px">Current Balance</StandardTh>
                   <StandardTh width="300px">Description / Ledger Narrative</StandardTh>
                   <StandardTh width="100px" className="sticky right-0 bg-gray-50">Action</StandardTh>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  /* Fixed: Line 212 - TableSkeletonRows is now imported and usable */
                  <TableSkeletonRows count={5} />
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="py-32 text-center opacity-30"><Banknote size={64} className="mx-auto mb-4 text-[#004A74]" /><p className="text-[10px] font-black uppercase tracking-widest">Financial Ledger Empty</p></td></tr>
                ) : (
                  [...items].reverse().map((item, idx) => {
                     const isLast = idx === 0; // Sejak kita reverse, index 0 adalah row terakhir/terbaru
                     return (
                      <StandardTr key={item.id} onClick={() => { setViewingItem(item); setIsFormOpen(true); }} className="cursor-pointer">
                         <StandardTd className="text-[10px] font-mono font-bold text-gray-400">
                            <div className="flex items-center gap-2">
                               <Clock size={12} className="text-gray-200" />
                               {formatDisplayTime(item.date)}
                            </div>
                         </StandardTd>
                         <StandardTd className="text-center font-black text-green-600">
                            {item.credit > 0 ? `+ ${formatMoney(item.credit)}` : '-'}
                         </StandardTd>
                         <StandardTd className="text-center font-black text-red-500">
                            {item.debit > 0 ? `- ${formatMoney(item.debit)}` : '-'}
                         </StandardTd>
                         <StandardTd className="text-center font-black text-[#004A74] bg-gray-50/50">
                            {formatMoney(item.balance)}
                         </StandardTd>
                         <StandardTd>
                            <div className="flex items-center gap-2">
                               <span className="text-[11px] font-bold text-gray-600 line-clamp-1">{item.description}</span>
                               {item.attachmentsJsonId && <div className="w-2 h-2 rounded-full bg-[#FED400] shrink-0" title="Has Attachments" />}
                            </div>
                         </StandardTd>
                         <StandardTd className="sticky right-0 bg-white group-hover:bg-[#f0f7fa]">
                            <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                               {/* Fixed: Line 243 - Eye is now imported from lucide-react */ }
                               <button onClick={() => { setViewingItem(item); setIsFormOpen(true); }} className="p-2 text-blue-500 hover:bg-white rounded-lg transition-all"><Eye size={16} /></button>
                               {isLast && (
                                 <button onClick={(e) => handleDelete(e, item.id)} className="p-2 text-red-200 hover:text-red-500 hover:bg-white rounded-lg transition-all"><Trash2 size={16} /></button>
                               )}
                            </div>
                         </StandardTd>
                      </StandardTr>
                     );
                  })
                )}
             </tbody>
          </StandardTableWrapper>
        </StandardTableContainer>
      </div>

      {isFormOpen && (
        <FinanceFormModal 
          projectId={projectId} 
          item={viewingItem} 
          currencySymbol={currency.symbol}
          onClose={() => setIsFormOpen(false)} 
          onSave={() => { setIsFormOpen(false); loadData(); }} 
        />
      )}
    </div>
  );
};

export default FinanceTab;