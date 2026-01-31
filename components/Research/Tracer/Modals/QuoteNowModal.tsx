import React, { useState } from 'react';
import { LibraryItem, TracerQuote } from '../../../../types';
import { extractTracerQuote, enhanceTracerQuote } from '../../../../services/TracerService';
import { 
  X, 
  Search, 
  Quote, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare,
  Copy,
  Layout,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { showXeenapsToast } from '../../../../utils/toastUtils';

interface QuoteNowModalProps {
  item: LibraryItem;
  onClose: () => void;
}

const QuoteNowModal: React.FC<QuoteNowModalProps> = ({ item, onClose }) => {
  const [stage, setStage] = useState<'input' | 'extraction' | 'result'>('input');
  const [query, setQuery] = useState('');
  const [quoteData, setQuoteData] = useState<Partial<TracerQuote> | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleStartExtraction = async () => {
    if (!query.trim()) return;
    setIsBusy(true);
    setStage('extraction');
    const result = await extractTracerQuote(item.id, query);
    if (result && result.originalText) {
      setQuoteData(result);
      setStage('result');
    } else {
      showXeenapsToast('error', 'No relevant quote found for this context');
      setStage('input');
    }
    setIsBusy(false);
  };

  const handleEnhance = async () => {
    if (!quoteData?.originalText) return;
    setIsEnhancing(true);
    const citation = `${item.authors[0].split(' ').pop()} (${item.year})`;
    const result = await enhanceTracerQuote(quoteData.originalText, citation);
    if (result) {
      setQuoteData({ ...quoteData, enhancedText: result });
      showXeenapsToast('success', 'Academic enhancement complete');
    }
    setIsEnhancing(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showXeenapsToast('success', 'Copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20 relative">
        
        <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg"><Zap size={24} /></div>
              <div>
                 <h3 className="text-xl font-black text-[#004A74] uppercase tracking-tight">Groq Tracer Engine</h3>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">In-Document Evidence Discovery</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"><X size={28} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
           {stage === 'input' && (
             <div className="space-y-10 animate-in zoom-in-95">
                <div className="text-center space-y-4">
                   <h2 className="text-2xl font-black text-[#004A74] uppercase tracking-tight">What context are you tracing?</h2>
                   <p className="text-xs font-medium text-gray-500 max-w-md mx-auto leading-relaxed">Groq AI will scan the source text to find the most relevant verbatim paragraph for your manuscript.</p>
                </div>
                <div className="relative group">
                   <MessageSquare className="absolute left-6 top-8 w-6 h-6 text-gray-300 group-focus-within:text-[#FED400] transition-colors" />
                   <textarea autoFocus className="w-full bg-gray-50 p-8 pl-16 border border-gray-200 rounded-[2.5rem] outline-none text-base font-bold text-[#004A74] transition-all focus:bg-white focus:ring-8 focus:ring-[#004A74]/5 min-h-[150px] resize-none" placeholder="e.g., Explain the specific methodology used for DNA quantification..." value={query} onChange={e => setQuery(e.target.value)} />
                </div>
                <button onClick={handleStartExtraction} disabled={!query.trim() || isBusy} className="w-full py-5 bg-[#004A74] text-[#FED400] rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl flex items-center justify-center gap-3"><Sparkles size={18} /> Execute Trace</button>
             </div>
           )}

           {stage === 'extraction' && (
             <div className="py-20 flex flex-col items-center text-center space-y-6 animate-in fade-in">
                <div className="relative">
                   <div className="w-20 h-20 border-4 border-[#004A74]/10 rounded-full" />
                   <div className="w-20 h-20 border-4 border-[#FED400] border-t-transparent rounded-full animate-spin absolute inset-0" />
                   <Search className="w-8 h-8 absolute inset-0 m-auto text-[#004A74] animate-pulse" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-[#004A74] uppercase tracking-tighter">Scanning Document Nodes</h3>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Searching for contextual verbatim matches...</p>
                </div>
             </div>
           )}

           {stage === 'result' && quoteData && (
             <div className="space-y-12 animate-in slide-in-from-bottom-4">
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2"><Quote size={14} /> Verbatim Evidence</h4>
                      <button onClick={() => handleCopy(quoteData.originalText!)} className="p-2 bg-gray-50 text-[#004A74] rounded-lg hover:bg-white transition-all shadow-sm"><Copy size={14} /></button>
                   </div>
                   <div className="p-8 bg-[#004A74]/5 border border-[#004A74]/10 rounded-[2.5rem] border-l-[6px] border-l-[#FED400]">
                      <p className="text-xs md:text-sm font-bold text-[#004A74] leading-relaxed italic">"{quoteData.originalText}"</p>
                   </div>
                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-4 italic">Context: {quoteData.contextFound}</p>
                </div>

                <div className="space-y-6 border-t border-gray-100 pt-10">
                   <div className="flex items-center justify-between px-2">
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#004A74] flex items-center gap-2"><Sparkles size={14} className="text-[#FED400] fill-[#FED400]" /> Academic Enhancement</h4>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Seamless Paraphrasing for Manuscript Integration</p>
                      </div>
                      <button 
                        onClick={handleEnhance} 
                        disabled={isEnhancing}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2 ${quoteData.enhancedText ? 'bg-white text-[#004A74] border border-gray-100' : 'bg-[#FED400] text-[#004A74] hover:scale-105 active:scale-95'}`}
                      >
                         {isEnhancing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />} 
                         {quoteData.enhancedText ? 'Re-Enhance' : 'Enhance Quote'}
                      </button>
                   </div>

                   {quoteData.enhancedText ? (
                      <div className="p-10 bg-white border-2 border-gray-100 rounded-[3rem] shadow-xl relative overflow-hidden group animate-in zoom-in-95">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-[#FED400]/10 -translate-y-12 translate-x-12 rounded-full" />
                         <p className="text-sm md:text-base font-medium text-[#004A74] leading-relaxed relative z-10">{quoteData.enhancedText}</p>
                         <button onClick={() => handleCopy(quoteData.enhancedText!)} className="absolute bottom-6 right-8 p-3 bg-[#004A74] text-white rounded-2xl shadow-lg hover:scale-110 active:scale-90 transition-all"><Copy size={18} /></button>
                      </div>
                   ) : (
                      <div className="p-10 bg-gray-50 border border-dashed border-gray-200 rounded-[3rem] text-center">
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Click enhance to generate scholarly text</p>
                      </div>
                   )}
                </div>

                <div className="flex justify-center pt-6">
                   <button onClick={() => setStage('input')} className="text-[10px] font-black text-[#004A74] uppercase underline tracking-[0.2em] hover:text-blue-600 transition-colors">Start New Trace</button>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default QuoteNowModal;