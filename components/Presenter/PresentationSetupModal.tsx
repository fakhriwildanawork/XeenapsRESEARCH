
import React, { useState } from 'react';
import { LibraryItem, PresentationTemplate, PresentationItem } from '../../types';
import { createPresentationWorkflow } from '../../services/PresentationService';
import { 
  XMarkIcon, 
  SparklesIcon, 
  PaintBrushIcon, 
  UserGroupIcon, 
  QueueListIcon,
  ChevronRightIcon,
  CircleStackIcon,
  CheckBadgeIcon,
  // Added missing PresentationChartBarIcon import
  PresentationChartBarIcon
} from '@heroicons/react/24/outline';
import { FormField, FormDropdown } from '../Common/FormComponents';
import Swal from 'sweetalert2';
import { XEENAPS_SWAL_CONFIG } from '../../utils/swalUtils';
import { showXeenapsToast } from '../../utils/toastUtils';

interface PresentationSetupModalProps {
  item?: LibraryItem; // Optional for multi-source mode
  items?: LibraryItem[]; // Database of items for selection
  onClose: () => void;
  onComplete: () => void;
}

const PresentationSetupModal: React.FC<PresentationSetupModalProps> = ({ item, items = [], onClose, onComplete }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [generatedPpt, setGeneratedPpt] = useState<PresentationItem | null>(null);
  
  const [selectedSources, setSelectedSources] = useState<LibraryItem[]>(item ? [item] : []);

  const [formData, setFormData] = useState({
    title: item ? `Insights: ${item.title}` : 'Cross-Source Analysis',
    context: '',
    presenters: ['Xeenaps User'],
    slidesCount: 8,
    primaryColor: '#004A74',
    secondaryColor: '#FED400',
    fontFamily: 'Inter',
    language: 'English'
  });

  const languages = ['English', 'Indonesian', 'French', 'German', 'Spanish', 'Japanese'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSources.length === 0) {
      showXeenapsToast('error', 'Please select at least one source collection.');
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await createPresentationWorkflow(selectedSources, {
        title: formData.title,
        context: formData.context,
        presenters: formData.presenters,
        theme: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          fontFamily: formData.fontFamily,
          headingFont: formData.fontFamily
        },
        slidesCount: formData.slidesCount,
        language: formData.language
      }, (stage) => setProgressStage(stage));

      if (result) {
        setGeneratedPpt(result);
        setIsGenerating(false);
      } else {
        throw new Error("Empty Result");
      }
    } catch (err) {
      Swal.fire({
        ...XEENAPS_SWAL_CONFIG,
        icon: 'error',
        title: 'GENERATION FAILED',
        text: 'A timeout occurred or storage is full. Please check your Drive quota.'
      });
      setIsGenerating(false);
    }
  };

  const handleOpenPpt = () => {
    if (generatedPpt) {
      window.open(`https://docs.google.com/presentation/d/${generatedPpt.gSlidesId}/edit`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-[0_35px_100px_rgba(0,0,0,0.4)] overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Progress Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-[300] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-10 animate-in fade-in">
            <div className="w-24 h-24 mb-8 relative">
              <div className="absolute inset-0 border-4 border-[#004A74]/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#004A74] border-t-transparent rounded-full animate-spin" />
              <SparklesIcon className="absolute inset-0 m-auto w-10 h-10 text-[#004A74] animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-[#004A74] uppercase tracking-tighter mb-2">Architecting Knowledge</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{progressStage || "Synthesizing intelligence..."}</p>
            <div className="mt-8 px-8 py-3 bg-[#FED400]/20 text-[#004A74] rounded-2xl text-[10px] font-black uppercase tracking-widest border border-[#FED400]/40">
              Deep Analysis Mode (60-120s) • Do not refresh
            </div>
          </div>
        )}

        {/* Success View */}
        {generatedPpt && (
          <div className="absolute inset-0 z-[310] bg-white flex flex-col items-center justify-center text-center p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/10 border border-emerald-100 animate-bounce">
              <CheckBadgeIcon className="w-12 h-12" />
            </div>
            
            <h2 className="text-3xl font-black text-[#004A74] uppercase tracking-tight mb-4">Slide is Ready!</h2>
            
            <div className="max-w-md bg-gray-50 p-6 rounded-[2rem] border border-gray-100 mb-10">
              <p className="text-sm font-semibold text-gray-600 leading-relaxed">
                Please check manually, as AI may generate inconsistent or poorly organized presentation slides. Refine and complete the presentation as necessary.
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              <button 
                onClick={handleOpenPpt}
                className="w-full py-5 bg-[#004A74] text-[#FED400] rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-[#004A74]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <PresentationChartBarIcon className="w-5 h-5" />
                Open Presentation
              </button>
              
              <button 
                onClick={onComplete}
                className="w-full py-4 bg-gray-100 text-gray-400 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-200 hover:text-gray-600 transition-all"
              >
                Dismiss & Close
              </button>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg shadow-[#004A74]/20">
              <SparklesIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#004A74] uppercase tracking-tight">Presenter Engine</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Universal Elegant Layout V8</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-10">
          
          <div className="space-y-6">
            {!item && (
              <FormField label="Select Source Collections" required>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <CircleStackIcon className="w-5 h-5 text-gray-300" />
                  </div>
                  <FormDropdown 
                    isMulti 
                    multiValues={selectedSources.map(s => s.title)}
                    onAddMulti={(val) => {
                      // LIMIT GUARD: Block selection if more than 5 sources
                      if (selectedSources.length >= 5) {
                        showXeenapsToast('warning', 'Maximum 5 sources allowed for deep synthesis stability.');
                        return;
                      }
                      const source = items.find(it => it.title === val);
                      if (source && !selectedSources.some(s => s.id === source.id)) {
                        setSelectedSources([...selectedSources, source]);
                      }
                    }}
                    onRemoveMulti={(val) => {
                      setSelectedSources(selectedSources.filter(s => s.title !== val));
                    }}
                    options={items.map(it => it.title)}
                    placeholder="Search source titles..."
                    value="" onChange={() => {}}
                  />
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-2 px-1">Selected Sources: {selectedSources.length} (Max 5)</p>
              </FormField>
            )}

            <FormField label="Presentation Title">
              <input 
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm font-bold text-[#004A74] outline-none focus:ring-2 focus:ring-[#004A74]/10"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </FormField>

            <FormField label="Strategic Context (Thematic Lens)">
              <textarea 
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm font-medium min-h-[100px] outline-none focus:ring-2 focus:ring-[#004A74]/10"
                placeholder="Give specific instructions to AI Librarian (e.g., Synthesize the correlation between methodology)..."
                value={formData.context}
                onChange={(e) => setFormData({...formData, context: e.target.value})}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-50">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004A74] flex items-center gap-2">
                <PaintBrushIcon className="w-4 h-4" /> Branding & Identity
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Primary Color">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <input type="color" value={formData.primaryColor} onChange={(e) => setFormData({...formData, primaryColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                    <span className="text-[10px] font-mono font-bold text-gray-500">{formData.primaryColor.toUpperCase()}</span>
                  </div>
                </FormField>
                <FormField label="Accent Color">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <input type="color" value={formData.secondaryColor} onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                    <span className="text-[10px] font-mono font-bold text-gray-500">{formData.secondaryColor.toUpperCase()}</span>
                  </div>
                </FormField>
              </div>

              <FormField label="Presented By">
                <FormDropdown 
                  isMulti 
                  multiValues={formData.presenters}
                  onAddMulti={(v) => setFormData({...formData, presenters: [...formData.presenters, v]})}
                  onRemoveMulti={(v) => setFormData({...formData, presenters: formData.presenters.filter(p => p !== v)})}
                  options={['Xeenaps User']}
                  placeholder="Type presenter name..."
                  value="" onChange={() => {}}
                />
              </FormField>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004A74] flex items-center gap-2">
                <QueueListIcon className="w-4 h-4" /> Synthesis Parameters
              </h3>

              <FormField label="Target Slides">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <input 
                    type="range" min="3" max="20" 
                    value={formData.slidesCount} 
                    onChange={(e) => setFormData({...formData, slidesCount: parseInt(e.target.value)})}
                    className="flex-1 accent-[#004A74]"
                  />
                  <span className="w-10 h-10 bg-[#004A74] text-white rounded-lg flex items-center justify-center font-black text-sm">{formData.slidesCount}</span>
                </div>
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
          </div>

          <div className="pt-8 flex justify-end">
            <button 
              type="submit"
              disabled={isGenerating}
              className="w-full md:w-auto px-12 py-5 bg-[#004A74] text-[#FED400] rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-[#004A74]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              Initialize Synthesis <ChevronRightIcon className="w-5 h-5 stroke-[3]" />
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

export default PresentationSetupModal;
