
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore - Resolving TS error for missing exported members
import { useParams, useNavigate } from 'react-router-dom';
import { TracerProject, TracerLog, LibraryItem, TracerStatus, TracerReference } from '../../../types';
import { fetchTracerProjects, saveTracerProject, fetchTracerLogs, saveTracerLog, fetchTracerReferences, unlinkTracerReference } from '../../../services/TracerService';
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
  ChevronRight
} from 'lucide-react';
import { FormPageContainer, FormField, FormDropdown } from '../../Common/FormComponents';
import { showXeenapsToast } from '../../../utils/toastUtils';
import ReferenceTab from './Tabs/ReferenceTab';

const TracerDetail: React.FC<{ libraryItems: LibraryItem[] }> = ({ libraryItems }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<TracerProject | null>(null);
  const [logs, setLogs] = useState<TracerLog[]>([]);
  const [activeTab, setActiveTab] = useState<'identity' | 'heatmap' | 'log' | 'refs'>('identity');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const res = await fetchTracerProjects(1, 1000);
      const found = res.items.find(p => p.id === id);
      if (found) {
        setProject(found);
        const logData = await fetchTracerLogs(id);
        setLogs(logData);
      } else navigate('/research/tracer');
      setIsLoading(false);
    };
    load();
  }, [id]);

  const handleUpdateField = (f: keyof TracerProject, v: any) => {
    if (!project) return;
    const updated = { ...project, [f]: v, updatedAt: new Date().toISOString() };
    setProject(updated);
    // Silent auto-save logic should be here
    saveTracerProject(updated);
  };

  const tabs = [
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'heatmap', label: 'Heatmap', icon: Flame },
    { id: 'log', label: 'Journal', icon: Layout },
    { id: 'refs', label: 'References', icon: BookOpen }
  ] as const;

  if (isLoading) return <div className="p-20 text-center animate-pulse uppercase font-black text-[#004A74]">Synchronizing Audit Trail...</div>;
  if (!project) return null;

  return (
    <FormPageContainer>
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md px-6 md:px-10 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/research/tracer')} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] rounded-xl transition-all"><ArrowLeft size={18} /></button>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-[#004A74] uppercase truncate">{project.title}</h2>
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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
               <div className="bg-[#004A74] p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 -translate-y-24 translate-x-24 rounded-full" />
                  <div className="relative z-10 space-y-6">
                     <FormField label={<span className="text-white/50">Full Research Title</span>}>
                        <textarea className="w-full bg-transparent border-none text-2xl font-black uppercase tracking-tight focus:ring-0 resize-none p-0" value={project.title} onChange={e => handleUpdateField('title', e.target.value)} />
                     </FormField>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
                        <div>
                           <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Category</p>
                           <FormDropdown value={project.category} options={['Experimental','Observation','Descriptive','R&D']} onChange={v => handleUpdateField('category', v)} placeholder="Category" />
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Status</p>
                           <FormDropdown value={project.status} options={Object.values(TracerStatus)} onChange={v => handleUpdateField('status', v)} placeholder="Status" />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                           <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Progress Index</p>
                           <div className="flex items-center gap-3">
                              <input type="range" className="flex-1 accent-[#FED400]" min="0" max="100" value={project.progress} onChange={e => handleUpdateField('progress', parseInt(e.target.value))} />
                              <span className="font-black text-lg text-[#FED400]">{project.progress}%</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <FormField label="Author Identity & Team"><FormDropdown isMulti multiValues={project.authors} options={['Xeenaps User']} onAddMulti={v => handleUpdateField('authors', [...project.authors, v])} onRemoveMulti={v => handleUpdateField('authors', project.authors.filter(a => a !== v))} placeholder="Add members..." value="" onChange={()=>{}} /></FormField>
               </div>
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
               <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-8 flex items-center gap-2"><Flame size={16} className="text-[#FED400]" /> 30-Day Activity Pulse</h3>
                  <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                     {[...Array(30)].map((_, i) => {
                        const date = new Date(); date.setDate(date.getDate() - (29 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        const count = logs.filter(l => l.date.split('T')[0] === dateStr).length;
                        const opacity = count > 0 ? Math.min(1, 0.2 + (count * 0.2)) : 0.05;
                        return (
                          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                             <div className="w-8 h-8 rounded-lg shadow-inner transition-all hover:scale-110" style={{ backgroundColor: count > 0 ? `rgba(0, 74, 116, ${opacity})` : '#f3f4f6', border: count > 0 ? '1px solid rgba(0, 74, 116, 0.2)' : '1px solid #eee' }} />
                             <span className="text-[7px] font-bold text-gray-300 uppercase">{date.getDate()}</span>
                          </div>
                        );
                     })}
                  </div>
               </div>
            </div>
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
