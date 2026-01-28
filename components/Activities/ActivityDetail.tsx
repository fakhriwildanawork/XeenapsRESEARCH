
import React, { useState, useEffect, useRef, useCallback } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { ActivityItem, ActivityType, ActivityLevel, ActivityRole } from '../../types';
import { fetchActivitiesPaginated, saveActivity } from '../../services/ActivityService';
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
  // Added missing icon imports
  AlignLeft,
  ClipboardCheck
} from 'lucide-react';
import { showXeenapsToast } from '../../utils/toastUtils';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import DocumentationVault from './DocumentationVault';
import { GoogleGenAI } from "@google/genai";

/**
 * Inline Editable Text Component
 */
const InlineInput: React.FC<{
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  prefixIcon?: React.ReactNode;
}> = ({ value, onSave, placeholder, className = "", multiline = false, prefixIcon }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const commonProps = {
      ref: inputRef,
      value: localValue,
      onChange: (e: any) => setLocalValue(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      placeholder: placeholder,
      className: `w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-bold text-[#004A74] outline-none ring-2 ring-[#FED400]/40 transition-all ${className}`
    };

    return multiline ? <textarea {...commonProps} rows={3} /> : <input type="text" {...commonProps} />;
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={`group flex items-center gap-3 cursor-pointer rounded-xl hover:bg-gray-50/80 transition-all p-2 -ml-2 w-full ${className}`}
    >
      {prefixIcon && <div className="shrink-0 text-gray-300 group-hover:text-[#004A74] transition-colors">{prefixIcon}</div>}
      <div className="flex-1 min-w-0">
        {localValue ? (
          <p className="text-sm font-bold text-[#004A74] leading-relaxed break-words">{localValue}</p>
        ) : (
          <p className="text-sm font-bold text-gray-200 uppercase tracking-widest">{placeholder || "Click to add content..."}</p>
        )}
      </div>
      <Edit3 size={14} className="opacity-0 group-hover:opacity-100 text-[#FED400] transition-all shrink-0" />
    </div>
  );
};

const ActivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [item, setItem] = useState<ActivityItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetchActivitiesPaginated(1, 1000);
      const found = res.items.find(i => i.id === id);
      if (found) {
        setItem(found);
      } else {
        showXeenapsToast('error', 'Activity not found');
        navigate('/activities');
      }
      setIsLoading(false);
    };
    load();
  }, [id, navigate]);

  const handleUpdate = async (updated: ActivityItem) => {
    setItem(updated);
    setIsSyncing(true);
    try {
      await saveActivity({ ...updated, updatedAt: new Date().toISOString() });
    } catch (e) {
      showXeenapsToast('error', 'Cloud sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFieldSave = (field: keyof ActivityItem, val: any) => {
    if (!item) return;
    handleUpdate({ ...item, [field]: val });
  };

  const handleAiReflection = async () => {
    if (!item?.description && !item?.notes) {
      showXeenapsToast('warning', 'Please provide description or notes for AI context.');
      return;
    }
    
    setIsAiProcessing(true);
    showXeenapsToast('info', 'AI is synthesizing reflection points...');

    try {
      // Corrected: use proper initialization according to Gemini guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `ACT AS AN ACADEMIC REFLECTION EXPERT. 
      SUMMARIZE THE FOLLOWING ACTIVITY EXPERIENCE INTO 3 HIGH-IMPACT LEARNING POINTS.
      
      ACTIVITY: ${item.eventName}
      DESC: ${item.description}
      NOTES: ${item.notes}
      
      --- RULES ---
      - USE BULLET POINTS (•).
      - MAX 100 WORDS.
      - FOCUS ON COMPETENCY AND PROFESSIONAL GROWTH.
      - OUTPUT PLAIN TEXT ONLY.`;

      // Corrected: use ai.models.generateContent directly with the model and prompt
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      // Corrected: Accessing response.text property directly
      const reflection = response.text || "";
      if (reflection) {
        handleUpdate({ ...item, notes: `${item.notes}\n\n[AI REFLECTION]\n${reflection}` });
        showXeenapsToast('success', 'Reflection points added to notes.');
      }
    } catch (e) {
      showXeenapsToast('error', 'AI Reflection interrupted.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black text-[#004A74] uppercase tracking-widest">Architecting Workspace...</div>;
  if (!item) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden relative animate-in slide-in-from-right duration-500">
      
      {/* HUD Header */}
      <header className="px-6 md:px-10 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shrink-0 z-[90]">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate('/activities')} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] hover:bg-[#FED400]/20 rounded-xl transition-all shadow-sm active:scale-90">
               <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
               <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tighter truncate max-w-xs md:max-w-md">Activity Workspace</h2>
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Portfolio & Credential Hub</p>
            </div>
         </div>

         <div className="flex items-center gap-3">
            {isSyncing && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#004A74]/5 rounded-full">
                 <Loader2 size={12} className="animate-spin text-[#004A74]" />
                 <span className="text-[8px] font-black text-[#004A74] uppercase tracking-widest">Syncing...</span>
              </div>
            )}
            <button 
              onClick={() => handleFieldSave('isFavorite', !item.isFavorite)}
              className="p-2.5 bg-white text-[#FED400] hover:bg-yellow-50 rounded-xl transition-all shadow-sm active:scale-90 border border-gray-100"
            >
              <Star size={18} className={item.isFavorite ? "fill-[#FED400]" : ""} />
            </button>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-10">
         <div className="max-w-7xl mx-auto space-y-10">
            
            {/* PRIMARY BLOCK: IDENTITY */}
            <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#004A74]/5 -translate-y-24 translate-x-24 rounded-full" />
               
               <div className="relative z-10 space-y-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
                        <Tag size={14} /> Activity Branding
                     </label>
                     <div className="text-2xl md:text-4xl font-black text-[#004A74] tracking-tighter uppercase leading-tight">
                        <InlineInput 
                          value={item.eventName} 
                          onSave={(v) => handleFieldSave('eventName', v)} 
                          placeholder="EVENT NAME..." 
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Held By / Organizer</label>
                        <InlineInput 
                          value={item.organizer} 
                          onSave={(v) => handleFieldSave('organizer', v)} 
                          prefixIcon={<User size={14} />} 
                          placeholder="ORGANIZER..." 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Type & Magnitude</label>
                        <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
                           <select 
                             className="bg-transparent border-none text-[10px] font-bold text-[#004A74] uppercase outline-none px-2 py-1 flex-1 cursor-pointer"
                             value={item.type}
                             onChange={(e) => handleFieldSave('type', e.target.value)}
                           >
                              {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                           </select>
                           <select 
                             className="bg-transparent border-none text-[10px] font-bold text-[#004A74] uppercase outline-none px-2 py-1 flex-1 cursor-pointer border-l border-gray-200"
                             value={item.level}
                             onChange={(e) => handleFieldSave('level', e.target.value)}
                           >
                              {Object.values(ActivityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                           </select>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Assigned Role</label>
                        <select 
                          className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl text-[10px] font-black text-[#004A74] uppercase outline-none cursor-pointer"
                          value={item.role}
                          onChange={(e) => handleFieldSave('role', e.target.value)}
                        >
                           {Object.values(ActivityRole).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                  </div>
               </div>
            </div>

            {/* TECHNICAL BLOCK: LOGISTICS & CREDENTIALS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#004A74] flex items-center gap-2 mb-6">
                     <Globe size={16} className="text-[#FED400]" /> Logistics & Location
                  </h3>
                  <div className="space-y-6">
                     <InlineInput 
                       value={item.location} 
                       onSave={(v) => handleFieldSave('location', v)} 
                       prefixIcon={<MapPin size={16} />} 
                       placeholder="SPECIFIC LOCATION (ONLINE/OFFLINE)..." 
                     />
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Start Date</label>
                           <input 
                             type="date" 
                             className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl text-xs font-bold text-[#004A74] uppercase outline-none cursor-pointer"
                             value={item.startDate}
                             onChange={(e) => handleFieldSave('startDate', e.target.value)}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">End Date</label>
                           <input 
                             type="date" 
                             className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl text-xs font-bold text-[#004A74] uppercase outline-none cursor-pointer"
                             value={item.endDate}
                             onChange={(e) => handleFieldSave('endDate', e.target.value)}
                           />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#004A74] flex items-center gap-2 mb-6">
                     <ShieldCheck size={16} className="text-[#FED400]" /> Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Certificate Number</label>
                        <InlineInput 
                          value={item.certificateNumber} 
                          onSave={(v) => handleFieldSave('certificateNumber', v)} 
                          placeholder="CERT NO..." 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Credit Points (SKP/CPD)</label>
                        <InlineInput 
                          value={item.credit} 
                          onSave={(v) => handleFieldSave('credit', v)} 
                          placeholder="0 POINTS..." 
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">External Event Link</label>
                     <InlineInput 
                       value={item.link} 
                       onSave={(v) => handleFieldSave('link', v)} 
                       prefixIcon={<LinkIcon size={14} />} 
                       placeholder="HTTPS://..." 
                     />
                  </div>
               </div>
            </div>

            {/* CONTENT BLOCK: DESCRIPTION & NOTES */}
            <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
                        <AlignLeft size={14} /> Activity Summary / Experience
                     </label>
                     <InlineInput 
                       multiline 
                       value={item.description} 
                       onSave={(v) => handleFieldSave('description', v)} 
                       placeholder="What happened? What were the key takeaways..." 
                       className="min-h-[250px] !p-0 !bg-transparent text-sm"
                     />
                  </div>

                  <div className="space-y-4 flex flex-col">
                     <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
                           <Zap size={14} /> Personal Reflection & Reflection
                        </label>
                        <button 
                          onClick={handleAiReflection}
                          disabled={isAiProcessing}
                          className="flex items-center gap-2 px-4 py-1.5 bg-[#FED400]/20 text-[#004A74] rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#FED400] transition-all disabled:opacity-50"
                        >
                           {isAiProcessing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Reflect
                        </button>
                     </div>
                     <InlineInput 
                       multiline 
                       value={item.notes} 
                       onSave={(v) => handleFieldSave('notes', v)} 
                       placeholder="Private notes, thoughts, or AI synthesized reflections..." 
                       className="flex-1 min-h-[250px] !p-0 !bg-transparent text-sm italic"
                     />
                  </div>
               </div>
            </div>

            {/* DOCUMENTATION VAULT BLOCK */}
            <DocumentationVault 
              activityId={item.id} 
              vaultJsonId={item.vaultJsonId} 
              storageNodeUrl={item.storageNodeUrl}
              onUpdateVault={(newVaultId, newNodeUrl) => {
                handleUpdate({ ...item, vaultJsonId: newVaultId || '', storageNodeUrl: newNodeUrl || '' });
              }}
            />

            <footer className="pt-20 pb-10 space-y-3 opacity-20 text-center">
              <ClipboardCheck size={48} className="mx-auto text-[#004A74]" />
              <p className="text-[8px] font-black uppercase tracking-[0.8em] text-[#004A74]">XEENAPS PORTFOLIO INFRASTRUCTURE</p>
            </footer>
         </div>
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
