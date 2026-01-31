import React, { useState } from 'react';
import { LibraryItem } from '../../../../types';
import { X, BookOpen, Quote, Sparkles, ArrowLeft } from 'lucide-react';
import QuoteNowModal from './QuoteNowModal';

interface ReferenceDetailViewProps {
  item: LibraryItem;
  onClose: () => void;
}

const ReferenceDetailView: React.FC<ReferenceDetailViewProps> = ({ item, onClose }) => {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-[1200] bg-white animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col">
      {isQuoteOpen && <QuoteNowModal item={item} onClose={() => setIsQuoteOpen(false)} />}
      
      <header className="px-6 md:px-10 py-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md">
         <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] rounded-xl transition-all shadow-sm"><ArrowLeft size={20} /></button>
            <div className="min-w-0">
               <h2 className="text-sm font-black text-[#004A74] uppercase tracking-widest truncate">Reference Anatomy</h2>
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tracer Intelligence Node</p>
            </div>
         </div>
         <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"><X size={28} /></button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 bg-[#fcfcfc]">
         <div className="max-w-4xl mx-auto space-y-12 pb-32">
            
            <header className="space-y-6">
               <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#004A74] text-white text-[8px] font-black uppercase tracking-widest rounded-full">{item.category}</span>
                  <span className="px-3 py-1 bg-[#FED400] text-[#004A74] text-[8px] font-black uppercase tracking-widest rounded-full">{item.topic}</span>
               </div>
               <h1 className="text-2xl md:text-4xl font-black text-[#004A74] uppercase tracking-tighter leading-tight">{item.title}</h1>
               <div className="flex flex-col gap-1 border-l-4 border-[#FED400] pl-6">
                  <p className="text-sm font-bold text-gray-600">{item.authors.join(', ')}</p>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.publisher} • {item.year}</p>
               </div>
            </header>

            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2"><BookOpen size={16} /> Document Abstract</h3>
               <div className="text-sm md:text-base leading-relaxed text-[#004A74] font-medium" dangerouslySetInnerHTML={{ __html: item.abstract || 'No abstract content available.' }} />
            </section>

            {/* QUOTE NOW ACTION */}
            <section className="flex flex-col items-center pt-10">
               <div className="w-1.5 h-16 bg-gray-100 rounded-full mb-10" />
               <button 
                 onClick={() => setIsQuoteOpen(true)}
                 disabled={!item.extractedJsonId}
                 className={`group relative flex items-center gap-4 px-16 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-sm transition-all duration-700 ${
                   item.extractedJsonId 
                     ? 'bg-[#004A74] text-[#FED400] shadow-[0_20px_50px_-10px_rgba(0,74,116,0.3)] hover:scale-105 active:scale-95' 
                     : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                 }`}
               >
                  <Quote size={20} className="group-hover:rotate-12 transition-transform" />
                  Quote Now with AI
                  {!item.extractedJsonId && <span className="absolute top-full mt-4 text-[8px] font-black text-red-400">Content extraction required</span>}
               </button>
               <p className="mt-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-xs text-center leading-relaxed">
                  Groq Tracer will scan the full document to find contextual evidence.
               </p>
            </section>
         </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ReferenceDetailView;