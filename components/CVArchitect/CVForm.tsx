import React, { useState, useEffect, useMemo } from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { 
  CVTemplateType, 
  UserProfile, 
  EducationEntry, 
  CareerEntry, 
  PublicationItem, 
  ActivityItem, 
  ResearchStatus 
} from '../../types';
import { fetchSourceDataForCV, generateCVPdf } from '../../services/CVService';
import { callAiProxy } from '../../services/gasService';
import { 
  FormPageContainer, 
  FormStickyHeader, 
  FormContentArea, 
  FormField 
} from '../Common/FormComponents';
import { 
  Layout, 
  CheckCircle2, 
  Sparkles, 
  User, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Image as ImageIcon,
  Check,
  Eye,
  GraduationCap,
  Briefcase,
  Share2,
  ClipboardCheck,
  Info
} from 'lucide-react';
import { showXeenapsToast } from '../../utils/toastUtils';
import CVPreviewModal from './CVPreviewModal';
import Swal from 'sweetalert2';
import { XEENAPS_SWAL_CONFIG } from '../../utils/swalUtils';

const CVForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CVTemplateType>(CVTemplateType.MODERN_ACADEMIC);

  // Source Data
  const [sourceData, setSourceData] = useState<{
    profile: UserProfile | null,
    education: EducationEntry[],
    career: CareerEntry[],
    publications: PublicationItem[],
    activities: ActivityItem[]
  }>({ profile: null, education: [], career: [], publications: [], activities: [] });

  // Selections
  const [config, setConfig] = useState({
    title: `CV - ${new Date().getFullYear()}`,
    template: CVTemplateType.MODERN_ACADEMIC,
    selectedEducationIds: [] as string[],
    selectedCareerIds: [] as string[],
    selectedPublicationIds: [] as string[],
    selectedActivityIds: [] as string[],
    includePhoto: true,
    aiSummary: ''
  });

  useEffect(() => {
    const load = async () => {
      const data = await fetchSourceDataForCV();
      setSourceData(data);
      // Default selection: All items
      setConfig(prev => ({
        ...prev,
        selectedEducationIds: data.education.map(e => e.id),
        selectedCareerIds: data.career.map(c => c.id),
        selectedPublicationIds: data.publications.map(p => p.id),
        selectedActivityIds: data.activities.map(a => a.id)
      }));
      setIsLoading(false);
    };
    load();
  }, []);

  // --- LOGIKA SORTING CHRONOLOGICAL DESCENDING ---
  const sortedEdu = useMemo(() => {
    return [...sourceData.education].sort((a, b) => {
      const getVal = (v: string) => v === 'Present' ? '9999' : (v || '0000');
      return String(getVal(b.endYear)).localeCompare(String(getVal(a.endYear))) || 
             String(b.startYear).localeCompare(String(a.startYear));
    });
  }, [sourceData.education]);

  const sortedCareer = useMemo(() => {
    return [...sourceData.career].sort((a, b) => {
      const getVal = (v: string) => v === 'Present' ? '9999' : (v || '0000');
      return String(getVal(b.endDate)).localeCompare(String(getVal(a.endDate))) || 
             String(b.startDate).localeCompare(String(a.startDate));
    });
  }, [sourceData.career]);

  const sortedPubs = useMemo(() => {
    return [...sourceData.publications].sort((a, b) => String(b.year).localeCompare(String(a.year)));
  }, [sourceData.publications]);

  const sortedActs = useMemo(() => {
    return [...sourceData.activities].sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
  }, [sourceData.activities]);

  const handleGenerateSummary = async () => {
    if (!sourceData.profile) return;
    setIsGenerating(true);
    showXeenapsToast('info', 'AI is drafting your profile summary...');

    const eduText = sourceData.education
      .filter(e => config.selectedEducationIds.includes(e.id))
      .map(e => `${e.level} ${e.major} at ${e.institution}`)
      .join(', ');
    
    const careerText = sourceData.career
      .filter(c => config.selectedCareerIds.includes(c.id))
      .map(c => `${c.position} at ${c.company}`)
      .join(', ');

    const prompt = `ACT AS A PROFESSIONAL EXECUTIVE BRANDING EXPERT.
    Draft a powerful 3-sentence professional summary for a CV based on these facts:
    NAME: ${sourceData.profile.fullName}
    CURRENT ROLE: ${sourceData.profile.jobTitle} at ${sourceData.profile.affiliation}
    EDUCATION: ${eduText}
    KEY ROLES: ${careerText}
    
    RULES: Use formal, authoritative tone. Max 60 words. No hallucinations. Return only the summary text.`;

    try {
      const result = await callAiProxy('groq', prompt);
      if (result) setConfig({ ...config, aiSummary: result });
    } catch (e) {
      showXeenapsToast('error', 'AI Synthesis failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!config.title.trim()) {
      showXeenapsToast('warning', 'Document title is required');
      return;
    }
    
    setIsGenerating(true);
    Swal.fire({ title: 'Architecting PDF Document...', text: 'Rendering templates and assets...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), ...XEENAPS_SWAL_CONFIG });

    try {
      const result = await generateCVPdf(config);
      Swal.close();
      if (result) {
        showXeenapsToast('success', 'CV Architecture Successful');
        navigate('/cv-architect');
      } else {
        throw new Error("PDF Engine failed");
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'SYNTHESIS FAILED', text: 'Backend engine timeout or storage error.', ...XEENAPS_SWAL_CONFIG });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelection = (list: string[], id: string) => {
    return list.includes(id) ? list.filter(i => i !== id) : [...list, id];
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black text-[#004A74] uppercase tracking-widest">Entering Studio...</div>;

  return (
    <FormPageContainer>
      <FormStickyHeader 
        title="The Architect" 
        subtitle="Step-by-step CV Synthesis" 
        onBack={() => navigate('/cv-architect')}
        rightElement={
          <div className="flex items-center gap-4">
             <div className="flex bg-gray-50 p-1 rounded-2xl">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${step === i ? 'bg-[#004A74] text-white shadow-lg' : 'text-gray-300'}`}>{i}</div>
                ))}
             </div>
          </div>
        }
      />

      <FormContentArea>
        <div className="max-w-4xl mx-auto space-y-12 pb-32">
          
          {/* STEP 1: TEMPLATE & IDENTITY */}
          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
               <FormField label="Document Internal Label">
                  <input className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold text-[#004A74] uppercase outline-none focus:ring-4 focus:ring-[#004A74]/5" 
                    value={config.title} onChange={e => setConfig({...config, title: e.target.value})} placeholder="e.g. CV 2024 - ACADEMIC MODE" />
               </FormField>

               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-2">Select Visual Architecture</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {Object.values(CVTemplateType).map((t) => (
                       <div 
                         key={t}
                         onClick={() => setConfig({...config, template: t})}
                         className={`group relative aspect-[1/1.2] rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col ${config.template === t ? 'border-[#004A74] shadow-2xl scale-105 z-10' : 'border-gray-100 bg-white hover:border-[#004A74]/30 grayscale hover:grayscale-0'}`}
                       >
                          <div className="flex-1 bg-gray-50 flex items-center justify-center relative">
                             <Layout size={48} className={`transition-all duration-500 ${config.template === t ? 'text-[#004A74] scale-110' : 'text-gray-200'}`} />
                             <button 
                               onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); setIsPreviewOpen(true); }}
                               className="absolute bottom-4 right-4 p-2.5 bg-white text-[#004A74] rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FED400] active:scale-90"
                             >
                                <Eye size={16} />
                             </button>
                             {config.template === t && (
                               <div className="absolute top-4 right-4 w-6 h-6 bg-[#004A74] text-[#FED400] rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in-95">
                                  <Check size={14} strokeWidth={4} />
                               </div>
                             )}
                          </div>
                          <div className="p-4 bg-white border-t border-gray-50 text-center">
                             <p className="text-[10px] font-black uppercase tracking-widest text-[#004A74]">{t}</p>
                             <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">
                               {t === CVTemplateType.MODERN_ACADEMIC ? 'Gold Accents • Clean' : t === CVTemplateType.EXECUTIVE_BLUE ? 'Professional • Navy Sidebar' : 'Minimalist • Formal'}
                             </p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="p-8 bg-[#004A74]/5 rounded-[2.5rem] border border-[#004A74]/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#004A74] shadow-sm border border-gray-100">
                        <ImageIcon size={24} />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-[#004A74] uppercase tracking-tighter">Include Profile Photo</h4>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Automatic sync from profile module</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setConfig({...config, includePhoto: !config.includePhoto})}
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-500 flex items-center ${config.includePhoto ? 'bg-emerald-500 justify-end' : 'bg-gray-200 justify-start'}`}
                  >
                     <div className="w-6 h-6 bg-white rounded-full shadow-md" />
                  </button>
               </div>

               <div className="flex justify-end pt-10">
                  <button onClick={() => setStep(2)} className="flex items-center gap-3 px-10 py-5 bg-[#004A74] text-[#FED400] rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-105 transition-all">
                    Data Selection <ChevronRight size={18} />
                  </button>
               </div>
            </div>
          )}

          {/* STEP 2: DATA SELECTION (CHRONOLOGICAL DESCENDING) */}
          {step === 2 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
               
               {/* EDUCATION SECTION */}
               <section className="space-y-6">
                  <div className="flex items-center gap-3 px-4">
                     <GraduationCap size={20} className="text-[#004A74]" />
                     <h3 className="text-sm font-black text-[#004A74] uppercase tracking-widest">Education Credentials</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     {sortedEdu.map(edu => (
                       <div key={edu.id} onClick={() => setConfig({...config, selectedEducationIds: toggleSelection(config.selectedEducationIds, edu.id)})} className={`group p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${config.selectedEducationIds.includes(edu.id) ? 'border-[#004A74] bg-[#004A74]/5' : 'border-gray-100 bg-white hover:border-[#004A74]/20'}`}>
                          <div className="flex items-center gap-4">
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${config.selectedEducationIds.includes(edu.id) ? 'bg-[#004A74] border-[#004A74] text-white shadow-md' : 'border-gray-200 bg-white'}`}>
                                {config.selectedEducationIds.includes(edu.id) && <Check size={14} strokeWidth={4} />}
                             </div>
                             <div>
                                <h4 className="text-[11px] font-black text-[#004A74] uppercase">{edu.institution}</h4>
                                <p className="text-[10px] font-bold text-gray-500">{edu.level} • {edu.major} ({edu.startYear}-{edu.endYear})</p>
                             </div>
                          </div>
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{edu.startYear}</span>
                       </div>
                     ))}
                  </div>
               </section>

               {/* CAREER SECTION */}
               <section className="space-y-6">
                  <div className="flex items-center gap-3 px-4">
                     <Briefcase size={20} className="text-[#004A74]" />
                     <h3 className="text-sm font-black text-[#004A74] uppercase tracking-widest">Professional Experience</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     {sortedCareer.map(job => (
                       <div key={job.id} onClick={() => setConfig({...config, selectedCareerIds: toggleSelection(config.selectedCareerIds, job.id)})} className={`group p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${config.selectedCareerIds.includes(job.id) ? 'border-[#004A74] bg-[#004A74]/5' : 'border-gray-100 bg-white hover:border-[#004A74]/20'}`}>
                          <div className="flex items-center gap-4">
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${config.selectedCareerIds.includes(job.id) ? 'bg-[#004A74] border-[#004A74] text-white shadow-md' : 'border-gray-200 bg-white'}`}>
                                {config.selectedCareerIds.includes(job.id) && <Check size={14} strokeWidth={4} />}
                             </div>
                             <div>
                                <h4 className="text-[11px] font-black text-[#004A74] uppercase">{job.company}</h4>
                                <p className="text-[10px] font-bold text-gray-500">{job.position} ({job.startDate}-{job.endDate})</p>
                             </div>
                          </div>
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{job.startDate}</span>
                       </div>
                     ))}
                  </div>
               </section>

               {/* PUBLICATIONS & ACTIVITIES COLLAPSIBLE INFO */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                     <h4 className="text-[10px] font-black text-[#004A74] uppercase tracking-widest flex items-center gap-2 mb-4"><Share2 size={14} /> Publications</h4>
                     <p className="text-[11px] font-bold text-gray-400 mb-4">{sourceData.publications.length} Total Registered. Selective logic applied.</p>
                     <button onClick={() => setConfig({...config, selectedPublicationIds: config.selectedPublicationIds.length === 0 ? sortedPubs.map(p => p.id) : []})} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${config.selectedPublicationIds.length > 0 ? 'bg-[#004A74] text-white' : 'bg-white text-gray-400 border-gray-100'}`}>
                       {config.selectedPublicationIds.length > 0 ? `Include All (${config.selectedPublicationIds.length})` : 'Skip All'}
                     </button>
                  </div>
                  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                     <h4 className="text-[10px] font-black text-[#004A74] uppercase tracking-widest flex items-center gap-2 mb-4"><ClipboardCheck size={14} /> Activities</h4>
                     <p className="text-[11px] font-bold text-gray-400 mb-4">{sourceData.activities.length} Total Registered. Selective logic applied.</p>
                     <button onClick={() => setConfig({...config, selectedActivityIds: config.selectedActivityIds.length === 0 ? sortedActs.map(a => a.id) : []})} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${config.selectedActivityIds.length > 0 ? 'bg-[#004A74] text-white' : 'bg-white text-gray-400 border-gray-100'}`}>
                       {config.selectedActivityIds.length > 0 ? `Include All (${config.selectedActivityIds.length})` : 'Skip All'}
                     </button>
                  </div>
               </div>

               <div className="flex justify-between pt-10">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 px-8 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button onClick={() => setStep(3)} className="flex items-center gap-3 px-10 py-5 bg-[#004A74] text-[#FED400] rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-105 transition-all">
                    AI Summary & Review <ChevronRight size={18} />
                  </button>
               </div>
            </div>
          )}

          {/* STEP 3: AI SUMMARY & FINAL REVIEW */}
          {step === 3 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
               
               <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                     <div className="flex items-center gap-3">
                        <Sparkles size={20} className="text-[#FED400]" />
                        <h3 className="text-sm font-black text-[#004A74] uppercase tracking-widest">Professional Statement</h3>
                     </div>
                     <button 
                        onClick={handleGenerateSummary}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#004A74] text-[#FED400] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                     >
                        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Draft with GROQ AI
                     </button>
                  </div>
                  
                  <textarea 
                    className="w-full p-10 bg-white border border-gray-100 rounded-[3rem] shadow-sm outline-none text-sm font-medium text-gray-600 leading-relaxed italic text-center resize-none transition-all focus:ring-4 focus:ring-[#004A74]/5 min-h-[150px]"
                    value={config.aiSummary}
                    onChange={e => setConfig({...config, aiSummary: e.target.value})}
                    placeholder="AI will summarize your selected education and career entries here..."
                  />
                  <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-widest">Review and edit manually if needed before final generation.</p>
               </div>

               <div className="p-10 bg-[#004A74]/5 rounded-[3rem] border border-[#004A74]/10 space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-[#004A74] text-[#FED400] rounded-3xl flex items-center justify-center shadow-xl">
                        <Info size={28} />
                     </div>
                     <div>
                        <h4 className="text-base font-black text-[#004A74] uppercase tracking-tighter">Architecture Summary</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Final document validation</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="p-4 bg-white rounded-2xl border border-gray-100 text-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Education</span>
                        <span className="text-sm font-black text-[#004A74]">{config.selectedEducationIds.length} Slots</span>
                     </div>
                     <div className="p-4 bg-white rounded-2xl border border-gray-100 text-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Experience</span>
                        <span className="text-sm font-black text-[#004A74]">{config.selectedCareerIds.length} Slots</span>
                     </div>
                     <div className="p-4 bg-white rounded-2xl border border-gray-100 text-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Impact</span>
                        <span className="text-sm font-black text-[#004A74]">{config.selectedPublicationIds.length + config.selectedActivityIds.length} Items</span>
                     </div>
                     <div className="p-4 bg-white rounded-2xl border border-gray-100 text-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Photo</span>
                        <span className="text-sm font-black text-emerald-500">{config.includePhoto ? 'YES' : 'NO'}</span>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row gap-4 pt-10">
                  <button onClick={() => setStep(2)} disabled={isGenerating} className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">
                    Adjust Data
                  </button>
                  <button onClick={handleFinalSubmit} disabled={isGenerating} className="flex-[2] py-5 bg-[#004A74] text-[#FED400] rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-[#004A74]/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                    {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}
                    Architect My CV
                  </button>
               </div>
            </div>
          )}

        </div>
      </FormContentArea>

      {isPreviewOpen && (
        <CVPreviewModal 
          template={previewTemplate} 
          onClose={() => setIsPreviewOpen(false)} 
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 74, 116, 0.2); }
      `}</style>
    </FormPageContainer>
  );
};

export default CVForm;