import React, { useState, useEffect, useMemo } from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { 
  CVTemplateType, 
  UserProfile, 
  EducationEntry, 
  CareerEntry, 
  PublicationItem, 
  ActivityItem 
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
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Check,
  Eye,
  GraduationCap,
  Briefcase,
  Share2,
  ClipboardCheck,
  Calendar,
  Filter,
  CheckSquare,
  Square
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

  const [pubFilter, setPubFilter] = useState({ start: '', end: '' });
  const [actFilter, setActFilter] = useState({ start: '', end: '' });

  const [sourceData, setSourceData] = useState<{
    profile: UserProfile | null,
    education: EducationEntry[],
    career: CareerEntry[],
    publications: PublicationItem[],
    activities: ActivityItem[]
  }>({ profile: null, education: [], career: [], publications: [], activities: [] });

  const [config, setConfig] = useState({
    title: `CV ARCHIVE - ${new Date().getFullYear()}`,
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
      setConfig(prev => ({
        ...prev,
        selectedEducationIds: data.education.map(e => e.id),
        selectedCareerIds: data.career.map(c => c.id)
      }));
      setIsLoading(false);
    };
    load();
  }, []);

  const filteredPubs = useMemo(() => {
    if (!pubFilter.start && !pubFilter.end) return [];
    return sourceData.publications.filter(p => {
      const yr = parseInt(p.year);
      if (pubFilter.start && yr < parseInt(pubFilter.start)) return false;
      if (pubFilter.end && yr > parseInt(pubFilter.end)) return false;
      return true;
    }).sort((a,b) => String(b.year).localeCompare(String(a.year)));
  }, [sourceData.publications, pubFilter]);

  const filteredActs = useMemo(() => {
    if (!actFilter.start && !actFilter.end) return [];
    return sourceData.activities.filter(a => {
      const date = new Date(a.startDate);
      if (actFilter.start && date < new Date(actFilter.start)) return false;
      if (actFilter.end && date > new Date(actFilter.end)) return false;
      return true;
    }).sort((a,b) => String(b.startDate).localeCompare(String(a.startDate)));
  }, [sourceData.activities, actFilter]);

  const handleGenerateSummary = async () => {
    if (!sourceData.profile) return;
    setIsGenerating(true);
    showXeenapsToast('info', 'AI is architecting your summary...');

    const eduText = sourceData.education
      .filter(e => config.selectedEducationIds.includes(e.id))
      .map(e => `${e.level} ${e.major} at ${e.institution}`)
      .join(', ');
    
    const careerText = sourceData.career
      .filter(c => config.selectedCareerIds.includes(c.id))
      .map(c => `${c.position} at ${c.company}`)
      .join(', ');

    const prompt = `ACT AS A CV BRANDING ARCHITECT.
    Draft a concise 3-sentence professional executive summary.
    NAME: ${sourceData.profile.fullName}
    CURRENT: ${sourceData.profile.jobTitle} at ${sourceData.profile.affiliation}
    EDU: ${eduText}
    EXP: ${careerText}
    
    RULE: RETURN ONLY CLEAN TEXT STRING. NO JSON. NO QUOTES.`;

    try {
      const result = await callAiProxy('groq', prompt, undefined, undefined, 'text');
      if (result) setConfig({ ...config, aiSummary: result });
    } catch (e) {
      showXeenapsToast('error', 'Synthesis failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsGenerating(true);
    Swal.fire({ title: 'Synthesizing PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), ...XEENAPS_SWAL_CONFIG });
    try {
      const result = await generateCVPdf(config);
      Swal.close();
      if (result) {
        showXeenapsToast('success', 'PDF Synchronized');
        navigate('/cv-architect');
      } else throw new Error("Backend failed");
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'SYNTHESIS FAILED', text: 'Cloud Engine Timeout.', ...XEENAPS_SWAL_CONFIG });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelection = (list: string[], id: string) => {
    return list.includes(id) ? list.filter(i => i !== id) : [...list, id];
  };

  const bulkSelect = (type: 'PUB' | 'ACT', isAll: boolean) => {
    if (type === 'PUB') {
      setConfig({ ...config, selectedPublicationIds: isAll ? filteredPubs.map(p => p.id) : [] });
    } else {
      setConfig({ ...config, selectedActivityIds: isAll ? filteredActs.map(a => a.id) : [] });
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black text-[#004A74] uppercase tracking-widest">Entering Architecture Studio...</div>;

  return (
    <FormPageContainer>
      <FormStickyHeader 
        title="CV Architect" 
        subtitle="Professional Synthesis Engine" 
        onBack={() => navigate('/cv-architect')}
        rightElement={
          <div className="flex bg-gray-50 p-1 rounded-2xl">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${step === i ? 'bg-[#004A74] text-white shadow-lg' : 'text-black opacity-20'}`}>{i}</div>
            ))}
          </div>
        }
      />

      <FormContentArea>
        <div className="max-w-6xl mx-auto space-y-12 pb-32">
          {step === 1 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
               <FormField label="Document Title">
                  <input className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold text-[#004A74] uppercase outline-none focus:ring-4 focus:ring-[#004A74]/5" 
                    value={config.title} onChange={e => setConfig({...config, title: e.target.value})} />
               </FormField>

               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-black px-4">Blueprints Palette</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {Object.values(CVTemplateType).map((t) => (
                       <div 
                         key={t}
                         onClick={() => setConfig({...config, template: t})}
                         className={`group relative aspect-[1/1.2] rounded-[3rem] border-2 transition-all duration-700 cursor-pointer overflow-hidden flex flex-col ${config.template === t ? 'border-[#004A74] shadow-2xl scale-105 z-10' : 'border-gray-200 bg-white grayscale hover:grayscale-0'}`}
                       >
                          <div className="flex-1 bg-gray-50 flex items-center justify-center relative">
                             <div className="w-24 h-32 bg-white rounded shadow-sm border border-gray-100 overflow-hidden flex flex-col p-2 space-y-1 group-hover:scale-110 transition-transform">
                                {t === CVTemplateType.MODERN_ACADEMIC ? (
                                  <>
                                    <div className="h-4 w-full bg-[#004A74] rounded-sm" />
                                    <div className="h-1 w-1/2 bg-black rounded-sm" />
                                    <div className="h-2 w-full bg-black opacity-10 rounded-sm" /><div className="h-2 w-full bg-black opacity-10 rounded-sm" />
                                  </>
                                ) : t === CVTemplateType.EXECUTIVE_BLUE ? (
                                  <div className="flex gap-1 h-full">
                                    <div className="w-1/3 bg-[#004A74] rounded-sm" />
                                    <div className="flex-1 space-y-1">
                                      <div className="h-2 w-full bg-[#004A74] rounded-sm" />
                                      <div className="h-1 w-full bg-black rounded-sm" /><div className="h-1 w-full bg-black rounded-sm" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="h-2 w-1/3 bg-black rounded-sm" />
                                    <div className="h-1 w-full bg-black opacity-10 rounded-sm" />
                                    <div className="h-1 w-full bg-black opacity-10 rounded-sm" />
                                  </div>
                                )}
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); setIsPreviewOpen(true); }} className="absolute bottom-4 right-4 p-2.5 bg-[#004A74] text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"><Eye size={16} /></button>
                          </div>
                          <div className="p-5 bg-white border-t border-gray-100 text-center"><p className="text-[10px] font-black uppercase tracking-widest text-[#004A74]">{t}</p></div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="flex justify-end pt-10"><button onClick={() => setStep(2)} className="flex items-center gap-3 px-12 py-5 bg-[#004A74] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-105 active:scale-95 transition-all">Proceed to Data <ChevronRight size={18} /></button></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-[#004A74] uppercase tracking-widest flex items-center gap-2 px-2"><GraduationCap size={16} /> Education History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {sourceData.education.map(edu => (
                         <div key={edu.id} onClick={() => setConfig({...config, selectedEducationIds: toggleSelection(config.selectedEducationIds, edu.id)})} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${config.selectedEducationIds.includes(edu.id) ? 'border-[#004A74] bg-blue-50 shadow-sm' : 'border-gray-100 bg-white opacity-60 hover:opacity-100'}`}>
                            <div className="flex items-center gap-3 min-w-0">
                               <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${config.selectedEducationIds.includes(edu.id) ? 'bg-[#004A74] border-[#004A74] text-white' : 'border-gray-200'}`}>{config.selectedEducationIds.includes(edu.id) && <Check size={12} strokeWidth={4} />}</div>
                               <span className="text-[10px] font-bold text-black uppercase truncate">{edu.institution}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  </section>
                  <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-[#004A74] uppercase tracking-widest flex items-center gap-2 px-2"><Briefcase size={16} /> Professional Career</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {sourceData.career.map(job => (
                         <div key={job.id} onClick={() => setConfig({...config, selectedCareerIds: toggleSelection(config.selectedCareerIds, job.id)})} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${config.selectedCareerIds.includes(job.id) ? 'border-[#004A74] bg-blue-50 shadow-sm' : 'border-gray-100 bg-white opacity-60 hover:opacity-100'}`}>
                            <div className="flex items-center gap-3 min-w-0">
                               <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${config.selectedCareerIds.includes(job.id) ? 'bg-[#004A74] border-[#004A74] text-white' : 'border-gray-200'}`}>{config.selectedCareerIds.includes(job.id) && <Check size={12} strokeWidth={4} />}</div>
                               <span className="text-[10px] font-bold text-black uppercase truncate">{job.company}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  </section>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-gray-100">
                  <section className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-inner">
                       <div className="flex items-center justify-between">
                         <h3 className="text-[11px] font-black text-[#004A74] uppercase tracking-widest flex items-center gap-2"><Share2 size={16} /> Publications</h3>
                         <div className="flex gap-2">
                            <button onClick={() => bulkSelect('PUB', true)} className="p-1.5 bg-[#004A74] text-white rounded-lg hover:scale-110 transition-all"><CheckSquare size={14}/></button>
                            <button onClick={() => bulkSelect('PUB', false)} className="p-1.5 bg-white text-black border border-black rounded-lg hover:bg-gray-100 transition-all"><Square size={14}/></button>
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><label className="text-[8px] font-black text-black uppercase tracking-widest ml-1">From Year</label><input type="number" placeholder="2020" className="w-full px-4 py-2 rounded-xl text-[10px] font-bold border border-gray-200 outline-none focus:border-[#004A74]" value={pubFilter.start} onChange={e => setPubFilter({...pubFilter, start: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[8px] font-black text-black uppercase tracking-widest ml-1">To Year</label><input type="number" placeholder="2025" className="w-full px-4 py-2 rounded-xl text-[10px] font-bold border border-gray-200 outline-none focus:border-[#004A74]" value={pubFilter.end} onChange={e => setPubFilter({...pubFilter, end: e.target.value})} /></div>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                       {filteredPubs.map(p => (
                          <div key={p.id} onClick={() => setConfig({...config, selectedPublicationIds: toggleSelection(config.selectedPublicationIds, p.id)})} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${config.selectedPublicationIds.includes(p.id) ? 'border-black bg-black text-white shadow-sm' : 'bg-white border-gray-100'}`}><p className="text-[10px] font-bold truncate uppercase">{p.title}</p></div>
                       ))}
                    </div>
                  </section>
                  <section className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-inner">
                       <div className="flex items-center justify-between">
                         <h3 className="text-[11px] font-black text-[#004A74] uppercase tracking-widest flex items-center gap-2"><ClipboardCheck size={16} /> Activities</h3>
                         <div className="flex gap-2">
                            <button onClick={() => bulkSelect('ACT', true)} className="p-1.5 bg-[#004A74] text-white rounded-lg hover:scale-110 transition-all"><CheckSquare size={14}/></button>
                            <button onClick={() => bulkSelect('ACT', false)} className="p-1.5 bg-white text-black border border-black rounded-lg hover:bg-gray-100 transition-all"><Square size={14}/></button>
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><label className="text-[8px] font-black text-black uppercase tracking-widest ml-1">Start Date</label><input type="date" className="w-full px-4 py-2 rounded-xl text-[10px] font-bold border border-gray-200 outline-none focus:border-[#004A74]" value={actFilter.start} onChange={e => setActFilter({...actFilter, start: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[8px] font-black text-black uppercase tracking-widest ml-1">End Date</label><input type="date" className="w-full px-4 py-2 rounded-xl text-[10px] font-bold border border-gray-200 outline-none focus:border-[#004A74]" value={actFilter.end} onChange={e => setActFilter({...actFilter, end: e.target.value})} /></div>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                       {filteredActs.map(a => (
                          <div key={a.id} onClick={() => setConfig({...config, selectedActivityIds: toggleSelection(config.selectedActivityIds, a.id)})} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${config.selectedActivityIds.includes(a.id) ? 'border-black bg-black text-white shadow-sm' : 'bg-white border-gray-100'}`}><p className="text-[10px] font-bold truncate uppercase">{a.eventName}</p></div>
                       ))}
                    </div>
                  </section>
               </div>
               <div className="flex justify-between pt-10">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 px-8 py-4 bg-gray-100 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 active:scale-95 transition-all"><ChevronLeft size={16} /> Back</button>
                  <button onClick={() => setStep(3)} className="flex items-center gap-3 px-12 py-5 bg-[#004A74] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-105 active:scale-95 transition-all">Final Synthesis <ChevronRight size={18} /></button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                     <h3 className="text-sm font-black text-[#004A74] uppercase tracking-widest flex items-center gap-2"><Sparkles size={18} /> Professional Statement</h3>
                     <button onClick={handleGenerateSummary} disabled={isGenerating} className="px-6 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Draft with AI
                     </button>
                  </div>
                  <textarea className="w-full p-10 bg-white border border-gray-100 rounded-[3rem] shadow-inner outline-none text-sm font-medium text-black leading-relaxed italic text-center resize-none transition-all focus:ring-4 focus:ring-[#004A74]/5 min-h-[250px]" placeholder="Awaiting AI Synthesis..." value={config.aiSummary} onChange={e => setConfig({...config, aiSummary: e.target.value})} />
               </div>
               <div className="flex flex-col md:flex-row gap-4 pt-10">
                  <button onClick={() => setStep(2)} disabled={isGenerating} className="flex-1 py-5 bg-gray-100 text-black rounded-[1.5rem] font-black uppercase text-xs active:scale-95 transition-all">Adjust Data</button>
                  <button onClick={handleFinalSubmit} disabled={isGenerating} className="flex-[2] py-5 bg-[#004A74] text-white rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all">{isGenerating ? 'Synthesizing PDF...' : 'Generate CV PDF'}</button>
               </div>
            </div>
          )}
        </div>
      </FormContentArea>
      {isPreviewOpen && <CVPreviewModal template={previewTemplate} onClose={() => setIsPreviewOpen(false)} />}
    </FormPageContainer>
  );
};

export default CVForm;