
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { ReviewItem, ReviewContent, ReviewMatrixRow, LibraryItem } from '../../../types';
import { fetchReviewsPaginated, fetchReviewContent, saveReview, runMatrixExtraction, runReviewSynthesis } from '../../../services/ReviewService';
import { 
  ArrowLeft, 
  Sparkles, 
  Trash2, 
  Plus, 
  Save, 
  Loader2, 
  BookOpen, 
  MessageSquare,
  Zap,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ClipboardList,
  Eye,
  Star,
  RefreshCcw,
  Languages
} from 'lucide-react';
import ReviewSourceSelectorModal from './ReviewSourceSelectorModal';
import { showXeenapsToast } from '../../../utils/toastUtils';
import { showXeenapsDeleteConfirm } from '../../../utils/confirmUtils';
import { fetchFileContent } from '../../../services/gasService';

const ReviewDetail: React.FC<{ libraryItems: LibraryItem[] }> = ({ libraryItems }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [review, setReview] = useState<ReviewItem | null>(null);
  const [content, setContent] = useState<ReviewContent>({ matrix: [], finalSynthesis: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetchReviewsPaginated(1, 1000);
      const found = res.items.find(i => i.id === id);
      if (found) {
        setReview(found);
        const detail = await fetchReviewContent(found.reviewJsonId, found.storageNodeUrl);
        if (detail) setContent(detail);
      } else {
        navigate('/research/literature-review');
      }
      setIsLoading(false);
    };
    load();
  }, [id, navigate]);

  // Auto-save logic
  useEffect(() => {
    if (!review || isLoading) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await saveReview(review, content);
    }, 2000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [review?.label, review?.centralQuestion, content, isLoading]);

  const handleStartExtraction = async (selectedLibs: LibraryItem[]) => {
    if (!review?.centralQuestion.trim()) {
      showXeenapsToast('warning', 'Please formulate a Central Question first.');
      return;
    }

    setIsSelectorOpen(false);
    setIsBusy(true);
    showXeenapsToast('info', `Running sequential analysis on ${selectedLibs.length} papers...`);

    const newRows: ReviewMatrixRow[] = [];
    
    // SEQUENTIAL AI PROCESSING (35k char logic is in Backend callGroqReviewExtractor)
    for (const lib of selectedLibs) {
      try {
        const result = await runMatrixExtraction(lib.id, review.centralQuestion);
        if (result) {
          newRows.push({
            collectionId: lib.id,
            title: lib.title,
            answer: result.answer,
            verbatim: result.verbatim
          });
          // Optimistic update per item for UI feedback
          setContent(prev => ({ ...prev, matrix: [...prev.matrix, ...newRows] }));
        }
      } catch (e) {
        showXeenapsToast('error', `Failed to analyze: ${lib.title}`);
      }
    }

    setIsBusy(false);
    showXeenapsToast('success', 'Review Matrix Updated');
  };

  const handleSynthesize = async () => {
    if (content.matrix.length === 0) {
      showXeenapsToast('warning', 'Matrix is empty. Add literature first.');
      return;
    }
    setIsBusy(true);
    showXeenapsToast('info', 'Synthesizing global narrative...');
    
    const result = await runReviewSynthesis(content.matrix, review!.centralQuestion);
    if (result) {
      setContent(prev => ({ ...prev, finalSynthesis: result }));
      showXeenapsToast('success', 'Synthesis Complete');
    }
    setIsBusy(false);
  };

  const removeRow = async (libId: string) => {
    const confirm = await showXeenapsDeleteConfirm(1);
    if (confirm) {
      setContent(prev => ({ ...prev, matrix: prev.matrix.filter(m => m.collectionId !== libId) }));
      showXeenapsToast('success', 'Source removed from matrix');
    }
  };

  const handleOpenSource = (libId: string) => {
    const lib = libraryItems.find(it => it.id === libId);
    if (lib) {
      navigate('/', { state: { openItem: lib } });
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black text-[#004A74] uppercase tracking-widest">Opening Review Workspace...</div>;
  if (!review) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcfcfc] overflow-hidden relative">
      
      {/* HUD HEADER */}
      <header className="px-6 md:px-10 py-5 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shrink-0 z-50">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate('/research/literature-review')} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] hover:bg-[#FED400]/20 rounded-xl transition-all shadow-sm">
               <ArrowLeft size={20} strokeWidth={3} />
            </button>
            <div className="min-w-0">
               <input 
                 className="text-lg md:text-xl font-black text-[#004A74] uppercase tracking-tighter leading-none bg-transparent border-none outline-none focus:ring-0 truncate max-w-xs md:max-w-xl placeholder:text-gray-200"
                 value={review.label}
                 onChange={(e) => setReview({ ...review, label: e.target.value.toUpperCase() })}
                 placeholder="REVIEW PROJECT LABEL..."
               />
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Multi-Source Synthesis Matrix</p>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <button 
              onClick={() => setReview({ ...review, isFavorite: !review.isFavorite })}
              className={`p-2.5 rounded-xl border transition-all ${review.isFavorite ? 'bg-yellow-50 border-yellow-200 text-[#FED400]' : 'bg-white border-gray-100 text-gray-300'}`}
            >
              <Star size={18} fill={review.isFavorite ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={handleSynthesize}
              disabled={isBusy || content.matrix.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#004A74] text-[#FED400] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
            >
               {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Synthesize Review
            </button>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-12 pb-32">
         
         {/* 1. CENTRAL QUESTION HUB */}
         <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
               <Zap size={14} className="text-[#FED400] fill-[#FED400]" /> The Compass: Central Review Question
            </h3>
            <div className="relative group">
               <MessageSquare className="absolute left-6 top-8 w-6 h-6 text-gray-200 group-focus-within:text-[#FED400] transition-colors" />
               <textarea 
                 className="w-full bg-white p-8 pl-16 border border-gray-200 rounded-[3rem] outline-none text-base md:text-lg font-bold text-[#004A74] placeholder:text-gray-200 resize-none transition-all focus:border-[#FED400] focus:ring-8 focus:ring-[#FED400]/5 min-h-[120px]"
                 placeholder="What specific question should AI answer across all selected papers?"
                 value={review.centralQuestion}
                 onChange={(e) => setReview({ ...review, centralQuestion: e.target.value })}
               />
            </div>
         </section>

         {/* 2. MATRIX AUDIT TABLE */}
         <section className="space-y-6">
            <div className="flex items-center justify-between px-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2"><ClipboardList size={16} /> Comparative Analysis Matrix</h3>
               <button 
                 onClick={() => setIsReviewSelectorOpen(true)}
                 disabled={isBusy}
                 className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-[#004A74] rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
               >
                 <Plus size={14} /> Add Sources
               </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
               <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                     <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                           <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400 w-[20%]">Source Identity</th>
                           <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400 w-[40%]">AI Analysis Result</th>
                           <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400 w-[30%]">Verbatim Evidence</th>
                           <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400 w-[10%] text-center">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {content.matrix.length === 0 ? (
                           <tr>
                              <td colSpan={4} className="py-24 text-center opacity-30">
                                 <BookOpen size={48} className="mx-auto mb-4 text-[#004A74]" />
                                 <p className="text-[10px] font-black uppercase tracking-widest">Synthesis Matrix is empty</p>
                              </td>
                           </tr>
                        ) : content.matrix.map((row, idx) => (
                           <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-6 align-top">
                                 <div className="space-y-2">
                                    <span className="text-[8px] font-black text-[#FED400] bg-[#004A74] px-2 py-0.5 rounded-full uppercase tracking-tighter">SOURCE 0{idx+1}</span>
                                    <h4 
                                       onClick={() => handleOpenSource(row.collectionId)}
                                       className="text-xs font-black text-[#004A74] uppercase leading-snug hover:underline cursor-pointer"
                                    >
                                       {row.title}
                                    </h4>
                                 </div>
                              </td>
                              <td className="p-6 align-top">
                                 <div className="text-[11px] font-semibold text-gray-600 leading-relaxed">
                                    {row.answer}
                                 </div>
                              </td>
                              <td className="p-6 align-top">
                                 {row.verbatim ? (
                                    <div className="p-4 bg-[#004A74]/5 border border-[#004A74]/10 rounded-2xl text-[10px] font-bold italic text-[#004A74]/70 leading-relaxed">
                                       "{row.verbatim}"
                                    </div>
                                 ) : <span className="text-[9px] text-gray-300 italic">No quote extracted.</span>}
                              </td>
                              <td className="p-6 text-center align-top">
                                 <button onClick={() => removeRow(row.collectionId)} className="p-2.5 text-red-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                                    <Trash2 size={16} />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </section>

         {/* 3. FINAL SYNTHESIS NARRATIVE */}
         <section className="space-y-6 pt-10">
            <div className="flex items-center justify-between px-4">
               <div className="space-y-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2"><Sparkles size={14} className="text-[#FED400]" /> Integrated Review Synthesis</h3>
                  <h2 className="text-3xl font-black text-[#004A74] uppercase tracking-tighter">THE FINAL REVIEW</h2>
               </div>
               <button 
                  onClick={handleSynthesize}
                  disabled={isBusy || content.matrix.length === 0}
                  className="p-3 bg-white border border-gray-200 rounded-xl text-[#004A74] hover:bg-gray-50 transition-all shadow-sm"
                  title="Re-Synthesize"
               >
                  <RefreshCcw size={18} className={isBusy ? 'animate-spin' : ''} />
               </button>
            </div>

            <div className="relative">
               {isBusy && !content.finalSynthesis && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-[3.5rem]">
                    <Loader2 size={40} className="text-[#004A74] animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004A74]">Architecting Narrative...</p>
                 </div>
               )}
               <div className="bg-white p-10 md:p-16 border border-gray-100 rounded-[3.5rem] shadow-xl relative overflow-hidden min-h-[400px]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FED400]/5 -translate-y-24 translate-x-24 rounded-full" />
                  <div 
                    className="text-sm md:text-base leading-[1.8] text-[#004A74] font-medium italic relative z-10 review-output-body"
                    dangerouslySetInnerHTML={{ __html: content.finalSynthesis || '<p className="text-gray-200 text-center py-20 uppercase font-black tracking-widest">Synthesis Pending Matrix Completion</p>' }}
                  />
               </div>
            </div>

            {content.finalSynthesis && (
               <div className="p-8 bg-[#004A74]/5 rounded-[2.5rem] border border-[#004A74]/10 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-14 h-14 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shrink-0 shadow-xl"><ShieldAlert size={28} /></div>
                  <div>
                    <h4 className="text-sm font-black text-[#004A74] uppercase tracking-widest mb-1">Scientific Integrity Guard</h4>
                    <p className="text-xs font-bold text-[#004A74]/50 leading-relaxed italic">
                      "The narrative above is synthesized from the matrix. Please verify and cite correctly using the original sources linked in the matrix table."
                    </p>
                  </div>
               </div>
            )}
         </section>

      </div>

      {isReviewSelectorOpen && (
        <ReviewSourceSelectorModal 
          onClose={() => setIsReviewSelectorOpen(false)}
          onConfirm={handleStartExtraction}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
        
        .review-output-body b { font-weight: 900; color: #004A74; text-decoration: underline; text-decoration-color: #FED40060; }
        .review-output-body br { margin-bottom: 1rem; content: ""; display: block; }
      `}</style>
    </div>
  );
};

// Internal variable for modal state to avoid confusion with selector modal
let isReviewSelectorOpen: boolean;
let setIsReviewSelectorOpen: (o: boolean) => void;

const ReviewWorkspace: React.FC<{ libraryItems: LibraryItem[] }> = (props) => {
  const [open, setOpen] = useState(false);
  isReviewSelectorOpen = open;
  setIsReviewSelectorOpen = setOpen;
  return <ReviewDetail {...props} />;
};

export default ReviewWorkspace;
