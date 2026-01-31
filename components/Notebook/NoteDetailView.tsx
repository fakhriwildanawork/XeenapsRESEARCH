
import React, { useState, useEffect } from 'react';
import { NoteItem, NoteContent } from '../../types';
import { fetchNoteContent } from '../../services/NoteService';
import { 
  X, 
  Edit2, 
  Clock, 
  ExternalLink, 
  FileIcon, 
  Globe, 
  ArrowLeft,
  Calendar,
  Sparkles,
  Library
} from 'lucide-react';

interface NoteDetailViewProps {
  note: NoteItem;
  onClose: () => void;
  onEdit: () => void;
}

const NoteDetailView: React.FC<NoteDetailViewProps> = ({ note, onClose, onEdit }) => {
  const [content, setContent] = useState<NoteContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchNoteContent(note.noteJsonId, note.storageNodeUrl);
      setContent(data);
      setIsLoading(false);
    };
    load();
  }, [note]);

  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return "-"; }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[1200] w-full max-w-3xl bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500 border-l border-gray-100">
      
      <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
         <button onClick={onClose} className="p-2 bg-gray-50 text-gray-400 hover:text-[#004A74] rounded-xl transition-all shadow-sm">
            <ArrowLeft size={20} strokeWidth={3} />
         </button>
         <div className="flex gap-2">
            <button onClick={onEdit} className="flex items-center gap-2 px-6 py-2.5 bg-[#004A74] text-[#FED400] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 transition-all">
               <Edit2 size={14} /> Refine
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all">
               <X size={24} />
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
         <div className="p-8 md:p-12 space-y-10">
            
            <header className="space-y-6">
               <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#004A74]/5 text-[#004A74] text-[8px] font-black uppercase tracking-widest rounded-full">Note Analysis</span>
                  {note.collectionId && (
                     <span className="px-3 py-1 bg-[#FED400]/10 text-[#004A74] text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5"><Library size={10} /> Linked Collection</span>
                  )}
               </div>
               <h1 className="text-2xl md:text-3xl font-black text-[#004A74] uppercase tracking-tighter leading-tight">{note.label}</h1>
               <div className="flex items-center gap-6 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-gray-400">
                     <Calendar size={14} className="text-[#FED400]" />
                     <span className="text-[10px] font-bold uppercase tracking-widest">{formatFullDate(note.createdAt)}</span>
                  </div>
               </div>
            </header>

            {isLoading ? (
              <div className="space-y-4">
                 <div className="h-6 w-full skeleton rounded-lg" />
                 <div className="h-6 w-3/4 skeleton rounded-lg" />
                 <div className="h-40 w-full skeleton rounded-3xl" />
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in duration-700">
                 
                 {/* Main Content */}
                 <div className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#004A74]/5 -translate-y-12 translate-x-12 rounded-full" />
                    <div className="relative z-10">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 flex items-center gap-2"><Sparkles size={14} /> Description & Synthesis</h3>
                       <div 
                         className="text-sm md:text-base leading-relaxed text-[#004A74] font-medium whitespace-pre-wrap note-body"
                         dangerouslySetInnerHTML={{ __html: content?.description || 'No description provided.' }}
                       />
                    </div>
                 </div>

                 {/* Attachments Matrix */}
                 {(content?.attachments || []).length > 0 && (
                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2 px-2">Documentation Matrix</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {content?.attachments.map((at, i) => (
                             <button 
                               key={i}
                               onClick={() => window.open(at.type === 'LINK' ? at.url : `https://lh3.googleusercontent.com/d/${at.fileId}`, '_blank')}
                               className="p-5 bg-white border border-gray-100 rounded-3xl flex items-center gap-4 hover:shadow-xl hover:border-[#FED400] transition-all group text-left shadow-sm"
                             >
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[#004A74] group-hover:text-[#FED400] transition-all">
                                   {at.type === 'LINK' ? <Globe size={20} /> : <FileIcon size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className="text-[10px] font-black text-[#004A74] uppercase truncate mb-0.5">{at.label}</p>
                                   <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{at.type}</p>
                                </div>
                                <ExternalLink size={16} className="text-gray-200 group-hover:text-[#004A74]" />
                             </button>
                          ))}
                       </div>
                    </div>
                 )}

              </div>
            )}
         </div>
      </div>

      <style>{`
        .note-body b { font-weight: 800; color: #004A74; }
        .note-body i { font-style: italic; color: #64748B; }
      `}</style>
    </div>
  );
};

export default NoteDetailView;
