
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { ActivityItem, ActivityType, ActivityLevel, ActivityRole } from '../../types';
import { fetchActivitiesPaginated, saveActivity, deleteActivity } from '../../services/ActivityService';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Award, 
  ShieldCheck, 
  Trash2, 
  Star,
  Sparkles,
  ExternalLink,
  Edit3,
  Globe,
  Loader2,
  CheckCircle2,
  Tag,
  Link as LinkIcon,
  Zap,
  Info,
  AlignLeft,
  ClipboardCheck,
  FolderOpen,
  FileText
} from 'lucide-react';
import { showXeenapsToast } from '../../utils/toastUtils';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import { GoogleGenAI } from "@google/genai";

/**
 * Optimized Inline Input for Auto-Expand Textarea with conditional border
 */
const IdentityTitleInput: React.FC<{
  value: string;
  onSave: (val: string) => void;
}> = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localValue, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) onSave(localValue);
  };

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        rows={1}
        placeholder="ENTER ACTIVITY TITLE..."
        className={`w-full bg-transparent border-none outline-none text-2xl md:text-4xl font-black text-[#004A74] tracking-tighter leading-tight resize-none transition-all placeholder:text-gray-100 ${
          isEditing ? 'ring-2 ring-[#004A74]/20 rounded-xl p-2 -m-2' : ''
        }`}
      />
    </div>
  );
};

const InlineField: React.FC<{
  label: string;
  value: string;
  onSave: (val: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
}> = ({ label, value, onSave, icon, placeholder }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) onSave(localValue);
  };

  return (
    <div className="space-y-1 group">
      <label className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1.5">
        {icon} {label}
      </label>
      {isEditing ? (
        <input 
          autoFocus
          className="w-full bg-white border border-[#004A74]/20 rounded-lg px-3 py-1.5 text-xs font-bold text-[#004A74] outline-none"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
        />
      ) : (
        <p 
          onClick={() => setIsEditing(true)}
          className={`text-xs font-bold text-[#004A74] cursor-pointer hover:bg-gray-50 rounded-lg py-1 transition-all ${!value ? 'text-gray-200 italic' : ''}`}
        >
          {value || placeholder || 'Not set'}
        </p>
      )}
    </div>
  );
};

const ActivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [item, setItem] = useState<ActivityItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetchActivitiesPaginated(1, 1000);
      const found = res.items.find(i => i.id === id);
      if (found) setItem(found);
      else navigate('/activities');
      setIsLoading(false);
    };
    load();
  }, [id, navigate]);

  const handleFieldSave = async (field: keyof ActivityItem, val: any) => {
    if (!item) return;
    const updated = { ...item, [field]: val, updatedAt: new Date().toISOString() };
    setItem(updated);
    setIsSyncing(true);
    try {
      await saveActivity(updated);
    } catch (e) {
      showXeenapsToast('error', 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed) {
      setIsSyncing(true);
      const success = await deleteActivity(item.id);
      if (success) {
        showXeenapsToast('success', 'Activity removed');
        navigate('/activities');
      } else {
        setIsSyncing(false);
        showXeenapsToast('error', 'Delete failed');
      }
    }
  };

  const handleAiReflection = async () => {
    if (!item?.description && !item?.notes) {
      showXeenapsToast('warning', 'Need description for AI context.');
      return;
    }
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Synthesize 3 professional growth points from this activity:\nEvent: ${item.eventName}\nDesc: ${item.description}\nNotes: ${item.notes}\nFormat: Plain text bullet points.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      const reflection = response.text || "";
      if (reflection) {
        handleFieldSave('notes', `${item.notes}\n\n[AI REFLECTION]\n${reflection}`);
      }
    } catch (e) {
      showXeenapsToast('error', 'AI synthesis error');
    } finally {
      setIsAiProcessing(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black text-[#004A74] uppercase tracking-widest">Loading Portfolio...</div>;
  if (!item) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#FCFCFC] h-full overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-500">
      
      {/* 1. APP-INTEGRATED HEADER (NON-STICKY) */}
      <nav className="px-6 md:px-10 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
        <button onClick={() => navigate('/activities')} className="flex items-center gap-2 text-[#004A74] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 px-3 py-2 rounded-xl transition-all">
          <ArrowLeft size={16} strokeWidth={3} /> Back to Portfolio
        </button>
        {isSyncing && (
           <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#004A74] rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
             <Loader2 size={10} className="animate-spin" /> Saving Changes
           </div>
        )}
      </nav>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto w-full p-6 md:p-10 space-y-8 relative">
        
        {/* TOP RIGHT ACTION BOX */}
        <div className="absolute top-10 right-10 flex items-center gap-2 z-10">
           <button 
             onClick={() => handleFieldSave('isFavorite', !item.isFavorite)}
             className={`p-3 rounded-2xl border transition-all shadow-sm active:scale-90 ${item.isFavorite ? 'bg-yellow-50 border-yellow-200 text-[#FED400]' : 'bg-white border-gray-100 text-gray-300'}`}
           >
             <Star size={20} className={item.isFavorite ? "fill-[#FED400]" : ""} />
           </button>
           <button 
             onClick={handleDelete}
             className="p-3 bg-white border border-gray-100 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm active:scale-90"
           >
             <Trash2 size={20} />
           </button>
        </div>

        {/* SECTION 1: IDENTITY BLOCK */}
        <section className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
          {/* Top Grid: Title */}
          <div className="max-w-4xl space-y-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] block">Authenticated Activity Label</span>
            <IdentityTitleInput value={item.eventName} onSave={(v) => handleFieldSave('eventName', v)} />
          </div>

          {/* Bottom Grid: 50/50 Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-gray-50">
             {/* Left Stacking */}
             <div className="space-y-6">
                <InlineField label="Held By / Organizer" value={item.organizer} onSave={(v) => handleFieldSave('organizer', v)} icon={<User size={12}/>} placeholder="ORGANIZATION NAME..." />
                <InlineField label="Specific Location" value={item.location} onSave={(v) => handleFieldSave('location', v)} icon={<MapPin size={12}/>} placeholder="CITY / ONLINE..." />
                <div className="grid grid-cols-2 gap-4 items-center">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Start</label>
                      <input type="date" value={item.startDate} onChange={(e) => handleFieldSave('startDate', e.target.value)} className="w-full bg-gray-50 border-none rounded-lg p-2 text-xs font-bold text-[#004A74] outline-none" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">End</label>
                      <input type="date" value={item.endDate} onChange={(e) => handleFieldSave('endDate', e.target.value)} className="w-full bg-gray-50 border-none rounded-lg p-2 text-xs font-bold text-[#004A74] outline-none" />
                   </div>
                </div>
             </div>

             {/* Right Stacking */}
             <div className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Activity Type</label>
                   <select value={item.type} onChange={(e) => handleFieldSave('type', e.target.value)} className="w-full bg-gray-50 border-none rounded-lg p-2 text-xs font-bold text-[#004A74] outline-none cursor-pointer">
                      {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Recognition Magnitude</label>
                   <select value={item.level} onChange={(e) => handleFieldSave('level', e.target.value)} className="w-full bg-gray-50 border-none rounded-lg p-2 text-xs font-bold text-[#004A74] outline-none cursor-pointer">
                      {Object.values(ActivityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Assigned Role</label>
                   <select value={item.role} onChange={(e) => handleFieldSave('role', e.target.value)} className="w-full bg-gray-50 border-none rounded-lg p-2 text-xs font-bold text-[#004A74] outline-none cursor-pointer">
                      {Object.values(ActivityRole).map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
             </div>
          </div>
        </section>

        {/* SECTION 2: CREDENTIAL BLOCK */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Left: Certificate Folder Button */}
           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6 group/vault">
              <div className="w-20 h-20 bg-gray-50 text-[#004A74] rounded-[2rem] flex items-center justify-center shadow-inner group-hover/vault:bg-[#004A74] group-hover/vault:text-[#FED400] transition-all duration-500">
                 <FolderOpen size={40} />
              </div>
              <div className="space-y-2">
                 <h4 className="text-sm font-black text-[#004A74] uppercase tracking-widest">Documentation Vault</h4>
                 <p className="text-[10px] font-medium text-gray-400 max-w-[200px]">Securely store your certificates, photos, and links.</p>
              </div>
              <button 
                onClick={() => navigate(`/activities/${item.id}/vault`)}
                className="px-10 py-3 bg-[#004A74] text-[#FED400] rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-[#004A74]/10 hover:scale-105 active:scale-95 transition-all"
              >
                 Open Gallery
              </button>
           </div>

           {/* Right: Cert Details Vertical Stack */}
           <div className="bg-[#004A74] p-8 rounded-[3rem] shadow-xl space-y-8 flex flex-col justify-center">
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
                   <ShieldCheck size={14} /> Certificate Tracking
                 </label>
                 <IdentityTitleInput value={item.certificateNumber} onSave={(v) => handleFieldSave('certificateNumber', v)} />
              </div>
              <div className="space-y-1 border-t border-white/10 pt-6">
                 <label className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
                   <Zap size={14} /> Academic Credit Points
                 </label>
                 <IdentityTitleInput value={item.credit} onSave={(v) => handleFieldSave('credit', v)} />
              </div>
           </div>
        </section>

        {/* SECTION 3: SUMMARY BLOCK */}
        <section className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
                <AlignLeft size={16} /> Activity Synthesis & Summary
              </h3>
              <button 
                onClick={handleAiReflection}
                disabled={isAiProcessing}
                className="flex items-center gap-2 px-5 py-2 bg-gray-50 text-[#004A74] rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#FED400] transition-all disabled:opacity-50"
              >
                {isAiProcessing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Analysis
              </button>
           </div>
           <textarea 
             className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-600 leading-relaxed min-h-[300px] resize-none"
             value={item.description}
             onChange={(e) => setItem({...item, description: e.target.value})}
             onBlur={() => handleFieldSave('description', item.description)}
             placeholder="DESCRIBE YOUR EXPERIENCE AND LEARNING OUTCOMES HERE..."
           />
           {item.notes && (
              <div className="pt-8 border-t border-gray-50">
                 <label className="text-[9px] font-black uppercase tracking-widest text-gray-300 block mb-4">Strategic Reflection Log</label>
                 <p className="text-xs font-bold text-[#004A74] italic leading-relaxed whitespace-pre-wrap">{item.notes}</p>
              </div>
           )}
        </section>

        <footer className="pt-20 pb-10 space-y-3 opacity-20 text-center">
          <ClipboardCheck size={48} className="mx-auto text-[#004A74]" />
          <p className="text-[8px] font-black uppercase tracking-[0.8em] text-[#004A74]">XEENAPS PORTFOLIO INFRASTRUCTURE</p>
        </footer>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.08); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ActivityDetail;
