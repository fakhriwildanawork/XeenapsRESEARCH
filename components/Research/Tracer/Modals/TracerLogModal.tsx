import React, { useState, useEffect, useRef } from 'react';
import { TracerLog } from '../../../../types';
import { fetchFileContent } from '../../../../services/gasService';
import { 
  X, 
  Save, 
  Calendar, 
  FileText, 
  Layout, 
  Clock, 
  Trash2, 
  Bold, 
  Italic,
  Loader2
} from 'lucide-react';
import { FormField } from '../../../Common/FormComponents';
import { showXeenapsDeleteConfirm } from '../../../../utils/confirmUtils';

interface TracerLogModalProps {
  projectId: string;
  log?: TracerLog;
  onClose: () => void;
  onSave: (item: TracerLog, content: { description: string }) => void;
  onDelete: (id: string) => void;
}

const RichEditor: React.FC<{ value: string; onChange: (v: string) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const updateActiveStates = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
  };

  const execCommand = (command: string) => {
    document.execCommand(command, false);
    updateActiveStates();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className={`flex flex-col rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm transition-all focus-within:ring-4 focus-within:ring-[#004A74]/5 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-100">
        <button type="button" onClick={() => execCommand('bold')} disabled={disabled} className={`p-1.5 rounded-lg transition-all ${isBold ? 'bg-[#004A74] text-white shadow-inner' : 'hover:bg-white text-[#004A74]'}`}><Bold size={14} /></button>
        <button type="button" onClick={() => execCommand('italic')} disabled={disabled} className={`p-1.5 rounded-lg transition-all ${isItalic ? 'bg-[#004A74] text-white shadow-inner' : 'hover:bg-white text-[#004A74]'}`}><Italic size={14} /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={(e) => {
          onChange(e.currentTarget.innerHTML);
          updateActiveStates();
        }}
        onKeyUp={updateActiveStates}
        onMouseUp={updateActiveStates}
        className="p-5 text-sm min-h-[200px] outline-none leading-relaxed custom-scrollbar font-medium text-gray-700"
        {...({ "data-placeholder": "What happened during this research phase?" } as any)}
      />
      <style>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: #9CA3AF; pointer-events: none; display: block; }`}</style>
    </div>
  );
};

const TracerLogModal: React.FC<TracerLogModalProps> = ({ projectId, log, onClose, onSave, onDelete }) => {
  const [isLoadingContent, setIsLoadingContent] = useState(!!log);
  const [formData, setFormData] = useState<TracerLog>(log || {
    id: crypto.randomUUID(),
    projectId,
    date: new Date().toISOString().split('T')[0],
    title: '',
    logJsonId: '',
    storageNodeUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [description, setDescription] = useState('');

  useEffect(() => {
    if (log?.logJsonId) {
      const load = async () => {
        const data = await fetchFileContent(log.logJsonId, log.storageNodeUrl);
        if (data && data.description) setDescription(data.description);
        setIsLoadingContent(false);
      };
      load();
    }
  }, [log]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave({ ...formData, updatedAt: new Date().toISOString() }, { description });
  };

  const handleDeleteClick = async () => {
    if (!log) return;
    if (await showXeenapsDeleteConfirm(1)) {
      onDelete(log.id);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
                 <Layout size={24} />
              </div>
              <div>
                 <h3 className="text-xl font-black text-[#004A74] uppercase tracking-tight">Journal Entry</h3>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{log ? 'Modify Entry' : 'New Chronological Log'}</p>
              </div>
           </div>
           <div className="flex items-center gap-2">
              {log && (
                <button 
                  onClick={handleDeleteClick}
                  className="p-2.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"><X size={28} /></button>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 space-y-8">
           {isLoadingContent ? (
             <div className="py-20 flex flex-col items-center gap-4 opacity-30">
                <Loader2 size={32} className="animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Retrieving Content...</p>
             </div>
           ) : (
             <>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Entry Date" required>
                     <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input 
                           type="date" 
                           className="w-full pl-11 pr-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#004A74] outline-none" 
                           value={formData.date} 
                           onChange={e => setFormData({...formData, date: e.target.value})} 
                           required 
                        />
                     </div>
                  </FormField>
                  <FormField label="Quick Reference ID">
                     <div className="px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-mono font-bold text-gray-400 uppercase flex items-center gap-2">
                        <Clock size={12} /> {formData.id.substring(0,8)}
                     </div>
                  </FormField>
               </div>

               <FormField label="Log Title" required>
                  <input 
                    autoFocus
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold text-[#004A74] outline-none focus:bg-white focus:ring-4 focus:ring-[#004A74]/5 transition-all"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="E.G., PHASE 1: DATA COLLECTION COMPLETED"
                    required
                  />
               </FormField>

               <FormField label="Journal Narrative (Rich Text)">
                  <RichEditor value={description} onChange={setDescription} />
               </FormField>

               <div className="pt-6">
                  <button 
                    type="submit" 
                    className="w-full py-5 bg-[#004A74] text-[#FED400] rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                     <Save size={18} />
                     {log ? 'Synchronize Updates' : 'Authorize & Sync Entry'}
                  </button>
               </div>
             </>
           )}
        </form>
      </div>
    </div>
  );
};

export default TracerLogModal;