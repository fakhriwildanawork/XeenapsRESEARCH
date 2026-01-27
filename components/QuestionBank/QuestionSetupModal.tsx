import React, { useState } from 'react';
import { LibraryItem, BloomsLevel, QuestionItem } from '../../types';
import { generateQuestionsWorkflow } from '../../services/QuestionService';
import { 
  XMarkIcon, 
  SparklesIcon, 
  AcademicCapIcon, 
  QueueListIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  TagIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';
import { FormField, FormDropdown } from '../Common/FormComponents';
import Swal from 'sweetalert2';
import { XEENAPS_SWAL_CONFIG } from '../../utils/swalUtils';
import { showXeenapsToast } from '../../utils/toastUtils';

interface QuestionSetupModalProps {
  item?: LibraryItem;
  items?: LibraryItem[]; // Database of items for manual selection
  onClose: () => void;
  onComplete: () => void;
}

const QuestionSetupModal: React.FC<QuestionSetupModalProps> = ({ item, items = [], onClose, onComplete }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<LibraryItem | null>(item || null);

  const [formData, setFormData] = useState({
    bloomLevel: BloomsLevel.C2_UNDERSTAND,
    customLabel: '',
    count: 3,
    additionalContext: '',
    language: 'English'
  });

  const bloomOptions = Object.values(BloomsLevel);
  const languages = ['English', 'Indonesian', 'French', 'German', 'Spanish'];

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
      } else {
        throw new Error("Generation Failed");
      }
    } catch (err) {
      Swal.fire({
        ...XEENAPS_SWAL_CONFIG,
        icon: 'error',
        title: 'GENERATION FAILED',
        text: 'AI Question Bank Engine encountered an error. Please verify source extraction.'
      });
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[95vh] md:max-h-[90vh]">
        
        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-[300] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 md:p-10 animate-in fade-in">
            <div className="w-20 h-20 md:w-24 md:h-24 mb-6 md:mb-8 relative">
              <div className="absolute inset-0 border-4 border-[#004A74]/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#004A74] border-t-transparent rounded-full animate-spin" />
              <AcademicCapIcon className="absolute inset-0 m-auto w-8 h-8 md:w-10 md:h-10 text-[#004A74] animate-pulse" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-[#004A74] uppercase tracking-tighter mb-2">Analyzing Concepts</h3>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Building {formData.bloomLevel} Questions...</p>
            <div className="mt-8 px-5 py-2 bg-blue-50 text-[#004A74] rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest">
              Pedagogical Engine Active • ETA 45s
            </div>
          </div>
        )}

        {/* Success View */}
        {generatedCount !== null && (
          <div className="absolute inset-0 z-[310] bg-white flex flex-col items-center justify-center text-center p-8 md:p-12 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-emerald-100">
              <CheckBadgeIcon className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#004A74] uppercase tracking-tight mb-2">{generatedCount} Questions Ready!</h2>
            <p className="text-xs md:text-sm font-medium text-gray-500 mb-10">AI has mapped your content with verbatim references.</p>
            <button 
              onClick={onComplete}
              className="w-full max-w-xs py-4 md:py-5 bg-[#004A74] text-[#FED400] rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs shadow-2xl hover:scale-105 transition-all"
            >
              See Question Bank
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 md:px-8 py-6 md:py-8 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#004A74] text-[#FED400] rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-[#004A74] uppercase tracking-tight">AI Generator</h2>
              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Standardized Assessment V2.0</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
            <XMarkIcon className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6 md:space-y-8">
          
          {/* Source Selection if no item passed */}
          {!item && (
            <FormField label="Source Collection" required>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <CircleStackIcon className="w-4 h-4 text-gray-400" />
                </div>
                <FormDropdown 
                  value={selectedSource?.title || ''}
                  options={items.map(it => it.title)}
                  onChange={(val) => {
                    const found = items.find(it => it.title === val);
                    if (found) setSelectedSource(found);
                  }}
                  placeholder="Select source to analyze..."
                />
              </div>
            </FormField>
          )}

          <FormField label="Question Set Label" required>
            <div className="relative">
              <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                className="w-full pl-11 pr-5 py-3 md:py-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-200 text-sm font-bold text-[#004A74] outline-none focus:ring-2 focus:ring-[#004A74]/10 transition-all"
                placeholder="e.g., Weekly Quiz #1, Mid-term prep..."
                value={formData.customLabel}
                onChange={(e) => setFormData({...formData, customLabel: e.target.value})}
              />
            </div>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Cognitive Level" required>
              <FormDropdown 
                value={formData.bloomLevel}
                options={bloomOptions}
                onChange={(v) => setFormData({...formData, bloomLevel: v as BloomsLevel})}
                placeholder="Select Level"
                allowCustom={false}
                showSearch={false}
              />
            </FormField>

            <FormField label="Output Language">
              <FormDropdown 
                value={formData.language}
                options={languages}
                onChange={(v) => setFormData({...formData, language: v})}
                placeholder="Select Language"
                allowCustom={false}
                showSearch={false}
              />
            </FormField>
          </div>

          <FormField label="Number of Questions (Max 5)">
            <div className="flex items-center gap-4 bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-200">
              <input 
                type="range" min="1" max="5" 
                value={formData.count} 
                onChange={(e) => setFormData({...formData, count: parseInt(e.target.value)})}
                className="flex-1 accent-[#004A74] cursor-pointer"
              />
              <span className="w-10 h-10 md:w-12 md:h-10 bg-[#004A74] text-white rounded-xl flex items-center justify-center font-black text-sm">{formData.count}</span>
            </div>
          </FormField>

          <FormField label="Additional Context (Optional)">
            <textarea 
              className="w-full px-5 py-3 md:py-4 bg-gray-50 rounded-xl md:rounded-[2rem] border border-gray-200 text-sm font-medium min-h-[100px] md:min-h-[120px] outline-none focus:ring-2 focus:ring-[#004A74]/10 transition-all"
              placeholder="Focus on specific sub-chapters or keywords..."
              value={formData.additionalContext}
              onChange={(e) => setFormData({...formData, additionalContext: e.target.value})}
            />
          </FormField>

          <div className="pt-4 md:pt-8 flex justify-end">
            <button 
              type="submit"
              disabled={isGenerating}
              className="w-full md:w-auto px-8 md:px-10 py-4 md:py-5 bg-[#004A74] text-[#FED400] rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              Generate Questions <ChevronRightIcon className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #004A7420; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default QuestionSetupModal;