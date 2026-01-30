
import React, { useState, useEffect, useRef } from 'react';
import { ConsultationItem, LibraryItem, ConsultationAnswerContent } from '../../types';
import { saveConsultation } from '../../services/ConsultationService';
import { fetchFileContent } from '../../services/gasService';
import { 
  ArrowLeftIcon, 
  SparklesIcon, 
  StarIcon,
  CpuChipIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface ConsultationResultViewProps {
  collection: LibraryItem;
  consultation: ConsultationItem;
  initialAnswer?: ConsultationAnswerContent | null;
  onBack: () => void;
}

const ConsultationResultView: React.FC<ConsultationResultViewProps> = ({ collection, consultation, initialAnswer, onBack }) => {
  const [answerContent, setAnswerContent] = useState<ConsultationAnswerContent | null>(initialAnswer || null);
  const [showReasoning, setShowReasoning] = useState(true);
  const [isFavorite, setIsFavorite] = useState(consultation.isFavorite || false);
  const [isLoading, setIsLoading] = useState(!initialAnswer);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadStoredAnswer = async () => {
      if (!initialAnswer && consultation.answerJsonId) {
        setIsLoading(true);
        const data = await fetchFileContent(consultation.answerJsonId, consultation.nodeUrl);
        if (data) setAnswerContent(data);
        setIsLoading(false);
      }
    };
    loadStoredAnswer();
  }, [consultation, initialAnswer]);

  const toggleFavorite = () => {
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    if (answerContent) {
      saveConsultation({ ...consultation, isFavorite: newVal }, answerContent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-500 overflow-hidden">
      
      {/* HEADER BAR */}
      <div className="px-6 md:px-10 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] hover:bg-[#FED400]/20 rounded-xl transition-all shadow-sm active:scale-90">
               <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0">
               <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight truncate max-w-md">Consultation Analysis</h2>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Synthesized by Groq AI</p>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <button onClick={toggleFavorite} className="p-3 bg-gray-50 text-[#FED400] hover:bg-[#FED400]/10 rounded-xl transition-all shadow-sm active:scale-90 border border-gray-100">
               {isFavorite ? <StarSolid className="w-6 h-6" /> : <StarIcon className="w-6 h-6" />}
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 bg-[#fcfcfc]">
         <div className="max-w-4xl mx-auto space-y-10">
            
            {/* SOURCE BANNER */}
            <div className="bg-[#004A74] rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 -translate-y-24 translate-x-24 rounded-full" />
               <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3 text-[#FED400]">
                     <BookOpenIcon className="w-6 h-6" />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em]">Target Knowledge Root</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase leading-tight tracking-tight">{collection.title}</h3>
                  <div className="pt-4 border-t border-white/10 flex items-center gap-6">
                     <div className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
                        Topic: <span className="text-white">{collection.topic}</span>
                     </div>
                     <div className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
                        Date: <span className="text-white">{new Date(consultation.createdAt).toLocaleDateString()}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* QUESTION DISPLAY */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FED400]" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">User Inquiry</p>
               <h4 className="text-lg md:text-xl font-bold text-[#004A74] leading-relaxed italic">"{consultation.question}"</h4>
            </div>

            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-40 w-full bg-gray-100 rounded-[2rem]" />
                <div className="h-64 w-full bg-gray-100 rounded-[2rem]" />
              </div>
            ) : answerContent && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                 
                 {/* THINKING PROCESS BOX */}
                 {answerContent.reasoning && (
                   <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] overflow-hidden">
                      <button 
                        onClick={() => setShowReasoning(!showReasoning)}
                        className="w-full px-8 py-5 flex items-center justify-between text-[#004A74] hover:bg-gray-100 transition-all"
                      >
                         <div className="flex items-center gap-3">
                            <CpuChipIcon className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">AI Reasoning Context</span>
                         </div>
                         {showReasoning ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </button>
                      
                      {showReasoning && (
                        <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                           <div className="p-6 bg-white border border-gray-100 rounded-2xl text-xs text-gray-500 font-medium italic leading-relaxed whitespace-pre-wrap">
                              {answerContent.reasoning}
                           </div>
                        </div>
                      )}
                   </div>
                 )}

                 {/* FINAL SYNTHESIS BUBBLE */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[#004A74] px-4">
                       <SparklesIcon className="w-6 h-6 text-[#FED400]" />
                       <span className="text-[11px] font-black uppercase tracking-[0.3em]">Knowledge Synthesis Output</span>
                    </div>
                    <div className="p-10 md:p-14 bg-white border border-gray-100 rounded-[3.5rem] shadow-xl relative min-h-[400px]">
                       <div 
                         className="text-base md:text-lg leading-relaxed text-[#004A74] font-medium whitespace-pre-wrap consultation-result-body"
                         dangerouslySetInnerHTML={{ __html: answerContent.answer }} 
                       />
                    </div>
                 </div>
              </div>
            )}

            <div ref={scrollRef} className="h-20" />
         </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
        
        .consultation-result-body b {
           color: #004A74;
           font-weight: 800;
        }

        .xeenaps-highlight {
           background-color: #FED40030;
           color: #004A74;
           padding: 0 4px;
           border-radius: 4px;
           font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default ConsultationResultView;
