
import React, { useState, useEffect } from 'react';
import { LibraryItem, BloomsLevel, QuestionItem, QuestionOption, LibraryType } from '../../types';
import { generateQuestionsWorkflow, saveQuestionRecord } from '../../services/QuestionService';
import { fetchLibraryPaginated } from '../../services/gasService';
import { 
  XMarkIcon, 
  SparklesIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  CheckBadgeIcon,
  TagIcon,
  PencilSquareIcon,
  CheckIcon as CheckIconSolid,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { FormField, FormDropdown } from '../Common/FormComponents';
import Swal from 'sweetalert2';
import { XEENAPS_SWAL_CONFIG } from '../../utils/swalUtils';
import { showXeenapsToast } from '../../utils/toastUtils';

interface QuestionSetupModalProps {
  item?: LibraryItem;
  items?: LibraryItem[]; // Not used for direct source anymore to avoid heavy load
  onClose: () => void;
  onComplete: () => void;
}

const QuestionSetupModal: React.FC<QuestionSetupModalProps> = ({ item, onClose, onComplete }) => {
  const [mode, setMode] = useState<'AI' | 'MANUAL'>('AI');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  
  // Dynamic Source Selection State
  const [selectedSource, setSelectedSource] = useState<LibraryItem | null>(item || null);
  const [sourceSearch, setSourceSearch] = useState('');
  const [availableSources, setAvailableSources] = useState<LibraryItem[]>([]);
  const [isSearchingSources, setIsSearchingSources] = useState(false);

  const [formData, setFormData] = useState({
    bloomLevel: BloomsLevel.C2_UNDERSTAND,
    customLabel: '',
    count: 3,
    additionalContext: '',
    language: 'English'
  });

  // Manual Entry State
  const [manualData, setManualData] = useState({
    questionText: '',
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' },
      { key: 'E', text: '' }
    ] as QuestionOption[],
    correctAnswer: 'A',
    reasoningCorrect: '',
    reasoningDistractors: {
      'A': '', 'B': '', 'C': '', 'D': '', 'E': ''
    } as Record<string, string>,
    verbatimReference: ''
  });

  const bloomOptions = Object.values(BloomsLevel);
  const languages = ['English', 'Indonesian', 'French', 'German', 'Spanish'];

  // Effect for Lazy Loading Sources from Backend
  useEffect(() => {
    if (item) return; // If context item exists, no need to search
    
    const delayDebounceFn = setTimeout(async () => {
      if (sourceSearch.length < 2) {
        setAvailableSources([]);
        return;
      }
      
      setIsSearchingSources(true);
      try {
        // Fetch from backend using metadata search
        const result = await fetchLibraryPaginated(1, 10, sourceSearch, 'All', 'research');
        setAvailableSources(result.items);
      } catch (err) {
        console.error("Failed to fetch sources", err);
      } finally {
        setIsSearchingSources(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [sourceSearch, item]);

  const validateManual = () => {
    if (!selectedSource) return "Source Collection is mandatory.";
    if (!formData.customLabel.trim()) return "Question Set Label is mandatory.";
    if (!manualData.questionText.trim()) return "Question Text is mandatory.";
    if (manualData.options.some(opt => !opt.text.trim())) return "All 5 options are mandatory.";
    if (!manualData.reasoningCorrect.trim()) return "Correct Answer Rationale is mandatory.";
    if (Object.values(manualData.reasoningDistractors).filter(v => !!v.trim()).length < 4) return "All 4 Distractor Logics are mandatory.";
    if (!manualData.verbatimReference.trim()) return "Verbatim Evidence is mandatory.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource) {
      showXeenapsToast('error', 'Please select a source collection.');
      return;
    }
    if (!formData.customLabel.trim()) {
      showXeenapsToast('error', 'Question set label is mandatory.');
      return;
    }

    if (mode === 'AI') {
      setIsGenerating(true);
      try {
        const result = await generateQuestionsWorkflow({
          collectionId: selectedSource.id,
          extractedJsonId: selectedSource.extractedJsonId || '',
          nodeUrl: selectedSource.storageNodeUrl,
          ...formData
        });
        if (result) {
          setGeneratedCount(result.length);
          setIsGenerating(false);
        } else throw new Error();
      } catch (err) {
        showXeenapsToast('error', 'AI Generation Failed.');
        setIsGenerating(false);
      }
    } else {
      const error = validateManual();
      if (error) {
        showXeenapsToast('warning', error);
        return;
      }

      setIsGenerating(true);
      try {
        const cleanDistractors: Record<string, string> = {};
        Object.keys(manualData.reasoningDistractors).forEach(k => {
          if (k !== manualData.correctAnswer) cleanDistractors[k] = manualData.reasoningDistractors[k];
        });

        const newQuestion: QuestionItem = {
          id: crypto.randomUUID(),
          collectionId: selectedSource.id,
          bloomLevel: formData.bloomLevel,
          customLabel: formData.customLabel,
          questionText: manualData.questionText,
          options: manualData.options,
          correctAnswer: manualData.correctAnswer,
          reasoningCorrect: manualData.reasoningCorrect,
          reasoningDistractors: cleanDistractors,
          verbatimReference: manualData.verbatimReference,
          language: formData.language,
          createdAt: new Date().toISOString()
        };

        const success = await saveQuestionRecord(newQuestion);
        if (success) {
          setGeneratedCount(1);
        } else throw new Error();
      } catch (e) {
        showXeenapsToast('error', 'Manual save failed.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden relative flex flex-col max-h-[95vh] md:max-h-[90vh]">
        
        {isGenerating && (
          <div className="absolute inset-0 z-[300] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
            <div className="w-20 h-20 mb-6 relative">
              <div className="absolute inset-0 border-4 border-[#004A74]/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#004A74] border-t-transparent rounded-full animate-spin" />
              <AcademicCapIcon className="absolute inset-0 m-auto w-8 h-8 text-[#004A74] animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-[#004A74] uppercase tracking-tighter mb-2">Processing Data</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Synchronizing with Cloud Registry...</p>
          </div>
        )}

        {generatedCount !== null && (
          <div className="absolute inset-0 z-[310] bg-white flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-emerald-100">
              <CheckBadgeIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#004A74] uppercase tracking-tight mb-2">Success!</h2>
            <p className="text-xs md:text-sm font-medium text-gray-500 mb-10">Knowledge record has been successfully anchored.</p>
            <button onClick={onComplete} className="w-full max-w-xs py-4 bg-[#004A74] text-[#FED400] rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl">Return to Gallery</button>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 md:px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#004A74] text-[#FED400] rounded-xl flex items-center justify-center shadow-lg">
              <AcademicCapIcon className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-[#004A74] uppercase tracking-tight">Question Builder</h2>
              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assessment & Evaluation Hub</p>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button onClick={() => setMode('AI')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${mode === 'AI' ? 'bg-[#004A74] text-white shadow-md' : 'text-gray-400'}`}>
                <SparklesIcon className="w-3.5 h-3.5" /> AI Mode
             </button>
             <button onClick={() => setMode('MANUAL')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${mode === 'MANUAL' ? 'bg-[#004A74] text-white shadow-md' : 'text-gray-400'}`}>
                <PencilSquareIcon className="w-3.5 h-3.5" /> Manual
             </button>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
          
          {/* COMMON FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!item ? (
              <FormField label="Source Collection (Lazy Search)" required>
                <div className="relative group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      {isSearchingSources ? <AcademicCapIcon className="w-4 h-4 text-[#004A74] animate-spin" /> : <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
                   </div>
                   <FormDropdown 
                      value={selectedSource?.title || ''} 
                      options={availableSources.map(it => it.title)} 
                      onChange={(val) => setSelectedSource(availableSources.find(it => it.title === val) || null)} 
                      placeholder="Type title to search..." 
                      showSearch={true}
                      allowCustom={false}
                      // Pass the search input state to parent component if FormDropdown supports it, 
                      // or we rely on the Internal input of FormDropdown if we modify its logic.
                      // Here we use it as a simple selector since we manage availableSources via useEffect.
                   />
                   <input 
                      className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none" 
                      onInput={(e) => setSourceSearch((e.target as HTMLInputElement).value)}
                   />
                </div>
              </FormField>
            ) : (
              <FormField label="Context Literature">
                 <div className="px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black text-[#004A74] uppercase truncate shadow-inner">
                    {item.title}
                 </div>
              </FormField>
            )}
            <FormField label="Question Set Label" required>
              <div className="relative">
                <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="w-full pl-11 pr-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#004A74] outline-none focus:bg-white" placeholder="e.g., Exam Set A..." value={formData.customLabel} onChange={(e) => setFormData({...formData, customLabel: e.target.value.toUpperCase()})} />
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Cognitive Level" required>
              <FormDropdown value={formData.bloomLevel} options={bloomOptions} onChange={(v) => setFormData({...formData, bloomLevel: v as BloomsLevel})} placeholder="Level" allowCustom={false} showSearch={false} />
            </FormField>
            <FormField label="Language" required>
              <FormDropdown 
                value={formData.language} 
                options={languages} 
                onChange={(v) => setFormData({...formData, language: v})} 
                placeholder="Select Language" 
                allowCustom={false} 
                showSearch={false} 
                disabled={mode === 'MANUAL'}
              />
            </FormField>
          </div>

          <div className="h-px bg-gray-100" />

          {mode === 'AI' ? (
            /* AI CONFIG VIEW */
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <FormField label="Number of Questions (Max 5)">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <input type="range" min="1" max="5" value={formData.count} onChange={(e) => setFormData({...formData, count: parseInt(e.target.value)})} className="flex-1 accent-[#004A74]" />
                  <span className="w-10 h-10 bg-[#004A74] text-white rounded-xl flex items-center justify-center font-black text-sm">{formData.count}</span>
                </div>
              </FormField>
              <FormField label="Additional Context (Optional)">
                <textarea className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm min-h-[120px] outline-none focus:bg-white" placeholder="Specific sub-chapters..." value={formData.additionalContext} onChange={(e) => setFormData({...formData, additionalContext: e.target.value})} />
              </FormField>
            </div>
          ) : (
            /* MANUAL FORM VIEW */
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
               <FormField label="Question Core Text" required>
                  <textarea className="w-full px-6 py-4 bg-[#004A74]/5 border border-[#004A74]/10 rounded-2xl text-sm font-bold text-[#004A74] min-h-[100px] outline-none focus:bg-white" placeholder="Enter your question here..." value={manualData.questionText} onChange={(e) => setManualData({...manualData, questionText: e.target.value})} />
               </FormField>

               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Response Options & Key *</label>
                  <div className="grid grid-cols-1 gap-3">
                    {manualData.options.map((opt, idx) => {
                      const isCorrect = manualData.correctAnswer === opt.key;
                      return (
                        <div key={opt.key} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${isCorrect ? 'bg-green-50 border-green-500/30' : 'bg-gray-50 border-gray-100'}`}>
                           <button type="button" onClick={() => setManualData({...manualData, correctAnswer: opt.key})} className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm transition-all ${isCorrect ? 'bg-green-500 text-white' : 'bg-white text-gray-400'}`}>
                             {isCorrect ? <CheckIconSolid className="w-4 h-4" strokeWidth={3} /> : opt.key}
                           </button>
                           <input className="flex-1 bg-transparent border-none p-0 text-xs font-bold text-[#004A74] outline-none" placeholder={`Option ${opt.key} text...`} value={opt.text} onChange={(e) => {
                              const newOpts = [...manualData.options];
                              newOpts[idx].text = e.target.value;
                              setManualData({...manualData, options: newOpts});
                           }} />
                        </div>
                      );
                    })}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                  <div className="space-y-6">
                    <FormField label="Correct Answer Rationale" required>
                      <textarea className="w-full px-5 py-4 bg-green-50/30 border border-green-100 rounded-2xl text-[11px] font-medium text-green-800 min-h-[100px] outline-none" placeholder="Why is the chosen key correct?" value={manualData.reasoningCorrect} onChange={(e) => setManualData({...manualData, reasoningCorrect: e.target.value})} />
                    </FormField>
                    <FormField label="Verbatim Evidence (from document)" required>
                      <div className="relative group">
                         <DocumentTextIcon className="absolute left-4 top-4 w-4 h-4 text-gray-300" />
                         <textarea className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-[10px] font-bold italic text-gray-500 min-h-[80px] outline-none focus:bg-white" placeholder="Copy-paste the exact sentence from the source..." value={manualData.verbatimReference} onChange={(e) => setManualData({...manualData, verbatimReference: e.target.value})} />
                      </div>
                    </FormField>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Distractor Logics *</label>
                    {['A', 'B', 'C', 'D', 'E'].filter(k => k !== manualData.correctAnswer).map(k => (
                      <div key={k} className="flex items-start gap-3 p-3 bg-red-50/20 border border-red-100/50 rounded-xl">
                        <span className="text-[10px] font-black text-red-300 mt-1">{k}</span>
                        <input className="w-full bg-transparent border-none p-0 text-[10px] font-medium text-gray-500 outline-none" placeholder={`Rationale for incorrect ${k}...`} value={manualData.reasoningDistractors[k]} onChange={(e) => {
                           const newRd = { ...manualData.reasoningDistractors };
                           newRd[k] = e.target.value;
                           setManualData({...manualData, reasoningDistractors: newRd});
                        }} />
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          <div className="pt-8 flex justify-end">
            <button type="submit" disabled={isGenerating} className="w-full md:w-auto px-12 py-5 bg-[#004A74] text-[#FED400] rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-4">
              {mode === 'AI' ? <SparklesIcon className="w-4 h-4" /> : <CheckIconSolid className="w-4 h-4" />}
              {mode === 'AI' ? 'Generate Assessment' : 'Secure Manual Record'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default QuestionSetupModal;
