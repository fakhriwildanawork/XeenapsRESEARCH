import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore - Resolving TS error for missing exported members
import { useParams, useNavigate } from 'react-router-dom';
import { TracerProject, TracerLog, LibraryItem, TracerStatus, TracerReference } from '../../../types';
import { fetchTracerProjects, saveTracerProject, fetchTracerLogs, saveTracerLog, fetchTracerReferences, unlinkTracerReference } from '../../../services/TracerService';
import { getCleanedProfileName } from '../../../services/ProfileService';
import { 
  ArrowLeft, 
  Layout, 
  Flame, 
  BookOpen, 
  Library,
  Save,
  Trash2,
  Plus,
  Clock,
  User,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  Target,
  MessageSquare,
  FlaskConical,
  Users,
  Search,
  Zap,
  Tag,
  CheckSquare
} from 'lucide-react';
import { FormPageContainer, FormField, FormDropdown } from '../../Common/FormComponents';
import { showXeenapsToast } from '../../../utils/toastUtils';
import ReferenceTab from './Tabs/ReferenceTab';
import TodoTab from './Tabs/TodoTab';

/**
 * TRACER DETAIL SKELETON
 * Premium UI structure mimicking the identity tab for smooth transitions.
 */
const TracerDetailSkeleton: React.FC = () => (
  <div className="animate-in fade-in duration-500 w-full h-full flex flex-col">
    <div className="px-6 md:px-10 py-6 border-b border-gray-50 flex items-center justify-between">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 skeleton rounded-xl" />
          <div className="space-y-2">
             <div className="h-4 w-48 skeleton rounded-md" />
             <div className="h-3 w-24 skeleton rounded-md" />
          </div>
       </div>
       <div className="flex gap-1 bg-gray-50 p-1 rounded-2xl">
          {[1,2,3,4].map(i => <div key={i} className="w-24 h-9 skeleton rounded-xl" />)}
       </div>
    </div>
    <div className="p-10 space-y-8 max-w-5xl mx-auto w-full">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-16 skeleton rounded-2xl" />
          <div className="h-16 skeleton rounded-2xl" />
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-16 skeleton rounded-2xl" />
          <div className="h-16 skeleton rounded-2xl" />
       </div>
       <div className="h-32 skeleton rounded-[2rem]" />
       <div className="h-16 skeleton rounded-2xl" />
    </div>
  </div>
);

const TracerDetail: React.FC<{ libraryItems: LibraryItem[] }> = ({ libraryItems }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<TracerProject | null>(null);
  const [logs, setLogs] = useState<TracerLog[]>([]);
  const [activeTab, setActiveTab] = useState<'identity' | 'todo' | 'log' | 'refs'>('identity');
  const [isLoading, setIsLoading] = useState(true);
  const [cleanedProfileName, setCleanedProfileName] = useState("Xeenaps User");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      
      const [cleanedName, res] = await Promise.all([
        getCleanedProfileName(),
        fetchTracerProjects(1, 1000)
      ]);
      
      setCleanedProfileName(cleanedName);
      
      const found = res.items.find(p => p.id === id);
      if (found) {
        // Normalize arrays for stable rendering and prevent circular empty saves
        setProject({
          ...found,
          keywords: Array.isArray(found.keywords) ? found.keywords : [],
          authors: Array.isArray(found.authors) ? found.authors : [cleanedName]
        });
        const logData = await fetchTracerLogs(id);
        setLogs(logData);
      } else navigate('/research/tracer');
      setIsLoading(false);
    };
    load();
  }, [id]);

  const handleUpdateField = (f: keyof TracerProject, v: any) => {
    // CRITICAL FIX: Guard against auto-saving during initial loading to prevent "Data Reset" bug
    if (!project || isLoading) return;
    
    const updated = { ...project, [f]: v, updatedAt: new Date().toISOString() };
    setProject(updated);
    
    // Silent auto-save logic
    saveTracerProject(updated);
  };

  const tabs = [
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'todo', label: 'To Do', icon: CheckSquare },
    { id: 'log', label: 'Journal', icon: Layout },
    { id: 'refs', label: 'References', icon: BookOpen }
  ] as const;

  if (isLoading) return (
    <FormPageContainer>
      <TracerDetailSkeleton />
    </FormPageContainer>
  );
  
  if (!project) return null;

  return (
    <FormPageContainer>
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md px-6 md:px-10 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/research/tracer')} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] rounded-xl transition-all"><ArrowLeft size={18} /></button>
          <div className="min-w-0">
            {/* HEADER FIX: Show label if title is not yet filled */}
            <h2 className="text-sm font-black text-[#004A74] uppercase truncate">{project.title || project.label}</h2>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Project ID: {project.id.substring(0,8)}</p>
          </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all ${activeTab === t.id ? 'bg-[#004A74] text-white shadow-lg' : 'text-gray-400 hover:text-[#004A74]'}`}>
              <t.icon size={14} /><span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
        <div className="max-w-5xl mx-auto">
          
          {activeTab === 'identity' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
               
               {/* a. 2 column 50% 50%: Label | Progress */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Audit Project Label" required>
                     <input 
                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm font-bold text-[#004A74] uppercase outline-none focus:ring-4 focus:ring-[#004A74]/5 transition-all"
                        value={project.label || ''}
                        onChange={e => handleUpdateField('label', e.target.value)}
                        placeholder="SHORT LABEL..."
                     />
                  </FormField>
                  <FormField label="Progress Index">
                     <div className="flex items-center gap-4 bg-gray-50 px-5 py-2 rounded-2xl border border-gray-200 h-[52px]">
                        <input type="range" className="flex-1 accent-[#004A74]" min="0" max="100" value={project.progress} onChange={e => handleUpdateField('progress', parseInt(e.target.value))} />
                        <span className="font-black text-sm text-[#004A74] w-10 text-right">{project.progress}%</span>
                     </div>
                  </FormField>
               </div>

               {/* b. 2 Column 50% 50: Start Date-Target Date */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Project Start Date">
                     <input type="date" className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm font-mono font-bold text-[#004A74]" value={project.startDate} onChange={e => handleUpdateField('startDate', e.target.value)} />
                  </FormField>
                  <FormField label="Target / Estimated End Date">
                     <input type="date" className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm font-mono font-bold text-[#004A74]" value={project.estEndDate} onChange={e => handleUpdateField('estEndDate', e.target.value)} />
                  </FormField>
               </div>

               {/* c. Full width research title */}
               <FormField label="Full Research Title">
                  <textarea 
                     className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-[1.5rem] text-sm font-bold text-[#004A74] uppercase outline-none focus:bg-white focus:ring-4 focus:ring-[#004A74]/5 transition-all min-h-[100px] resize-none"
                     value={project.title}
                     onChange={e => handleUpdateField('title', e.target.value)}
                     placeholder="OFFICIAL RESEARCH TITLE..."
                  />
               </FormField>

               {/* d. Full width Research Topic (Domain/topik riset) */}
               <FormField label="Research Topic / Domain">
                  <div className="relative group">
                     <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#004A74]" />
                     <input 
                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#004A74] outline-none focus:bg-white focus:ring-4 focus:ring-[#004A74]/5 transition-all"
                        value={project.topic || ''}
                        onChange={e => handleUpdateField('topic', e.target.value)}
                        placeholder="e.g. SUSTAINABLE ARCHITECTURE, QUANTUM COMPUTING..."
                     />
                  </div>
               </FormField>

               {/* e. Full width Problem justification */}
               <FormField label="Problem Justification">
                  <textarea 
                     className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-[1.5rem] text-xs font-medium text-gray-600 leading-relaxed outline-none focus:bg-white focus:ring-4 focus:ring-[#004A74]/5 transition-all min-h-[120px] resize-none"
                     value={project.problemStatement || ''}
                     onChange={e => handleUpdateField('problemStatement', e.target.value)}
                     placeholder="Describe the urgency and core issues being addressed..."
                  />
               </FormField>

               {/* f. Full width The White Space (Gap) */}
               <FormField label="The White Space (Gap)">
                  <div className="relative">
                     <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FED400] rounded-l-[1.5rem]" />
                     <textarea 
                        className="w-full px-8 py-5 bg-[#004A74]/5 border border-[#004A74]/10 rounded-[1.5rem] text-xs font-bold text-[#004A74] leading-relaxed outline-none focus:bg-white focus:ring-4 focus:ring-[#004A74]/5 transition-all min-h-[120px] resize-none"
                        value={project.researchGap || ''}
                        onChange={e => handleUpdateField('researchGap', e.target.value)}
                        placeholder="What have previous studies missed? Define your unique niche..."
                     />
                  </div>
               </FormField>

               {/* g. Full width Investigation Question */}
               <FormField label="Investigation Question">
                  <div className="relative">
                     <MessageSquare className="absolute left-4 top-5 w-4 h-4 text-gray-300" />
                     <textarea 
                        className="w-full pl-11 pr-6 py-5 bg-gray-50 border border-gray-200 rounded-[1.5rem] text-sm font-bold text-[#004A74] italic leading-relaxed outline-none focus:bg-white focus:ring-4 focus:ring-[#004A74]/5 transition-all min-h-[100px] resize-none"
                        value={project.researchQuestion || ''}
                        onChange={e => handleUpdateField('researchQuestion', e.target.value)}
                        placeholder="What are the primary questions this research aims to answer?"
                     />
                  </div>
               </FormField>

               {/* h. Full width Approach & Methodology */}
               <FormField label="Approach & Methodology">
                  <div className="relative">
                     <FlaskConical className="absolute left-4 top-5 w-4 h-4 text-gray-300" />
                     <textarea 
                        className="w-full pl-11 pr-6 py-5 bg-gray-50 border border-gray-200 rounded-[1.5rem] text-xs font-medium text-gray-600 leading-relaxed outline-none focus:bg-white focus:ring-4 focus:ring-[#004A74]/5 transition-all min-h-[120px] resize-none"
                        value={project.methodology || ''}
                        onChange={e => handleUpdateField('methodology', e.target.value)}
                        placeholder="Describe technical procedures, paradigms, and analytical tools..."
                     />
                  </div>
               </FormField>

               {/* i. Full width Targeted Population */}
               <FormField label="Targeted Population / Data">
                  <div className="relative">
                     <Users className="absolute left-4 top-5 w-4 h-4 text-gray-300" />
                     <textarea 
                        className="w-full pl-11 pr-6 py-5 bg-gray-50 border border-gray-200 rounded-[1.5rem] text-xs font-medium text-gray-600 leading-relaxed outline-none focus:bg-white focus:ring-4 focus:ring-[#004A74]/5 transition-all min-h-[120px] resize-none"
                        value={project.population || ''}
                        onChange={e => handleUpdateField('population', e.target.value)}
                        placeholder="Define subjects, data sources, or specific demographics..."
                     />
                  </div>
               </FormField>

               {/* j. Full width Keywords */}
               <FormField label="Strategic Keywords">
                  <FormDropdown 
                     isMulti 
                     multiValues={project.keywords || []} 
                     options={[]} 
                     onAddMulti={v => handleUpdateField('keywords', [...(project.keywords || []), v])} 
                     onRemoveMulti={v => handleUpdateField('keywords', (project.keywords || []).filter(k => k !== v))} 
                     placeholder="Type keywords and press enter..." 
                     value="" 
                     onChange={()=>{}} 
                  />
               </FormField>

               {/* Auxiliary Info: Authors & Status */}
               <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Author Team">
                     <FormDropdown isMulti multiValues={project.authors} options={[cleanedProfileName]} onAddMulti={v => handleUpdateField('authors', [...project.authors, v])} onRemoveMulti={v => handleUpdateField('authors', project.authors.filter(a => a !== v))} placeholder="Add members..." value="" onChange={()=>{}} />
                  </FormField>
                  <FormField label="Workflow Status">
                     <FormDropdown value={project.status} options={Object.values(TracerStatus)} onChange={v => handleUpdateField('status', v)} placeholder="Status" allowCustom={false} showSearch={false} />
                  </FormField>
               </div>
            </div>
          )}

          {activeTab === 'todo' && (
            <TodoTab projectId={project.id} />
          )}

          {activeTab === 'log' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
               <div className="flex justify-between items-center px-4">
                  <h3 className="text-[11px] font-black text-[#004A74] uppercase tracking-widest flex items-center gap-2"><Layout size={18} /> Research Journal</h3>
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-[#004A74] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={16} /> New Log Entry</button>
               </div>
               <div className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="py-20 text-center opacity-20"><Layout size={48} className="mx-auto mb-2" /><p className="text-[10px] font-black uppercase">No entries yet</p></div>
                  ) : logs.map(l => (
                    <div key={l.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex gap-4 hover:shadow-xl transition-all cursor-pointer group">
                       <div className="shrink-0 w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#004A74] group-hover:text-white transition-all"><Clock size={20} /></div>
                       <div className="flex-1">
                          <p className="text-[9px] font-black text-[#FED400] bg-[#004A74] inline-block px-2 py-0.5 rounded-md uppercase mb-2">{new Date(l.date).toLocaleDateString()}</p>
                          <h4 className="text-sm font-black text-[#004A74] uppercase">{l.title}</h4>
                       </div>
                       <ChevronRight size={24} className="text-gray-200 mt-4" />
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'refs' && (
             <ReferenceTab projectId={project.id} libraryItems={libraryItems} />
          )}

        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
      `}</style>
    </FormPageContainer>
  );
};

export default TracerDetail;