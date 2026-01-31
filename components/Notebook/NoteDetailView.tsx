
import React, { useState, useEffect, useRef } from 'react';
import { NoteItem, NoteContent, NoteAttachment } from '../../types';
import { fetchNoteContent, saveNote, uploadNoteAttachment } from '../../services/NoteService';
import { deleteRemoteFile } from '../../services/ActivityService';
import { 
  X, 
  Clock, 
  ExternalLink, 
  FileIcon, 
  Globe, 
  ArrowLeft,
  Calendar,
  Sparkles,
  Library,
  Trash2,
  Plus,
  Bold,
  Italic,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  Eye,
  Link as LinkIcon
} from 'lucide-react';

interface NoteDetailViewProps {
  note: NoteItem;
  onClose: () => void;
  onEdit?: () => void; 
  isMobileSidebarOpen?: boolean;
}

/**
 * Enhanced Inline Rich Editor
 */
const InlineRichEditor: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
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

  const exec = (cmd: string) => {
    document.execCommand(cmd, false);
    updateActiveStates();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="flex flex-col rounded-[2.5rem] border border-gray-200 overflow-hidden bg-white shadow-sm transition-all focus-within:ring-4 focus-within:ring-[#004A74]/5">
       <div className="flex items-center gap-1 p-3 bg-gray-50/50 border-b border-gray-200">
          <button 
            type="button" 
            onClick={() => exec('bold')} 
            className={`p-2 rounded-xl transition-all ${isBold ? 'bg-[#004A74] text-white shadow-md' : 'hover:bg-white text-[#004A74]'}`}
          >
            <Bold size={16} />
          </button>
          <button 
            type="button" 
            onClick={() => exec('italic')} 
            className={`p-2 rounded-xl transition-all ${isItalic ? 'bg-[#004A74] text-white shadow-md' : 'hover:bg-white text-[#004A74]'}`}
          >
            <Italic size={16} />
          </button>
       </div>
       <div 
         ref={editorRef}
         contentEditable 
         onInput={(e) => {
           onChange(e.currentTarget.innerHTML);
           updateActiveStates();
         }}
         onKeyUp={updateActiveStates}
         onMouseUp={updateActiveStates}
         className="p-8 md:p-10 text-sm md:text-base min-h-[350px] outline-none leading-relaxed text-[#004A74] font-medium"
         {...({ "data-placeholder": "Start refining your synthesis..." } as any)}
       />
    </div>
  );
};

const NoteDetailView: React.FC<NoteDetailViewProps> = ({ note, onClose, isMobileSidebarOpen }) => {
  const [localNote, setLocalNote] = useState<NoteItem>(note);
  const [content, setContent] = useState<NoteContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await fetchNoteContent(note.noteJsonId, note.storageNodeUrl);
      setContent(data);
      setIsLoading(false);
    };
    load();
  }, [note]);

  // Silent Background Sync
  const performSync = async (updatedMetadata: NoteItem, updatedContent: NoteContent) => {
    setIsSyncing(true);
    try {
      await saveNote(updatedMetadata, updatedContent);
    } catch (e) {
      console.error("Background sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const scheduleSync = (updatedMetadata: NoteItem, updatedContent: NoteContent) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      performSync(updatedMetadata, updatedContent);
    }, 2000);
  };

  const handleLabelChange = (newLabel: string) => {
    const updated = { ...localNote, label: newLabel.toUpperCase(), updatedAt: new Date().toISOString() };
    setLocalNote(updated);
    if (content) scheduleSync(updated, content);
  };

  const handleDescriptionChange = (newDesc: string) => {
    if (!content) return;
    const updatedContent = { ...content, description: newDesc };
    const updatedMetadata = { ...localNote, updatedAt: new Date().toISOString() };
    setContent(updatedContent);
    setLocalNote(updatedMetadata);
    scheduleSync(updatedMetadata, updatedContent);
  };

  const handleAddLink = () => {
    if (!content) return;
    // Prepend (descending order)
    const updatedContent = { 
      ...content, 
      attachments: [{ type: 'LINK' as const, label: 'NEW LINK', url: '' }, ...content.attachments] 
    };
    setContent(updatedContent);
    performSync(localNote, updatedContent);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !content) return;

    const tempId = crypto.randomUUID();
    let previewUrl: string | undefined;

    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }

    const optimisticAt: NoteAttachment = {
      type: 'FILE',
      label: file.name,
      url: previewUrl, // Local blob for instant preview
      fileId: `pending_${tempId}`,
      mimeType: file.type
    };

    // Prepend (descending order)
    const updatedWithOptimistic = { ...content, attachments: [optimisticAt, ...content.attachments] };
    setContent(updatedWithOptimistic);

    const result = await uploadNoteAttachment(file);
    if (result) {
      const finalUrl = result.mimeType.startsWith('image/') 
        ? `https://lh3.googleusercontent.com/d/${result.fileId}`
        : `https://drive.google.com/file/d/${result.fileId}/view`;

      setContent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          attachments: prev.attachments.map(at => 
            at.fileId === `pending_${tempId}` 
              ? { ...at, fileId: result.fileId, nodeUrl: result.nodeUrl, url: finalUrl } 
              : at
          )
        };
      });
      // Content updated from state above
      const finalContent = {
        ...content,
        attachments: [{
          type: 'FILE' as const,
          label: file.name,
          fileId: result.fileId,
          nodeUrl: result.nodeUrl,
          mimeType: result.mimeType,
          url: finalUrl
        }, ...content.attachments]
      };
      performSync(localNote, finalContent);
    } else {
      setContent(prev => {
        if (!prev) return null;
        return { ...prev, attachments: prev.attachments.filter(at => at.fileId !== `pending_${tempId}`) };
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = async (idx: number) => {
    if (!content) return;
    const target = content.attachments[idx];
    const updatedContent = { ...content, attachments: content.attachments.filter((_, i) => i !== idx) };
    
    setContent(updatedContent);
    performSync(localNote, updatedContent);

    if (target.type === 'FILE' && target.fileId && target.nodeUrl && !target.fileId.startsWith('pending_')) {
      deleteRemoteFile(target.fileId, target.nodeUrl);
    }
  };

  const updateAttachmentLabel = (idx: number, newLabel: string) => {
    if (!content) return;
    const newAt = [...content.attachments];
    newAt[idx].label = newLabel.toUpperCase();
    const updatedContent = { ...content, attachments: newAt };
    setContent(updatedContent);
    scheduleSync(localNote, updatedContent);
  };

  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return "-"; }
  };

  return (
    <div 
      className={`fixed top-0 right-0 bottom-0 z-[1200] bg-white flex flex-col will-change-transform overflow-hidden transition-all duration-500 animate-in fade-in ${
        isMobileSidebarOpen ? 'blur-[15px] opacity-40 pointer-events-none scale-[0.98]' : ''
      }`}
      style={{ 
        left: 'var(--sidebar-offset, 0px)',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      {/* Top Header Navigation */}
      <header className="px-6 md:px-10 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] hover:bg-[#FED400]/20 rounded-xl transition-all active:scale-90 shadow-sm">
               <ArrowLeft size={20} strokeWidth={3} />
            </button>
            <div className="min-w-0">
               <h2 className="text-sm font-black text-[#004A74] uppercase tracking-widest truncate">Independent View</h2>
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Synthesis Independent Workspace</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            {isSyncing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 animate-pulse">
                <Loader2 size={10} className="animate-spin text-[#004A74]" />
                <span className="text-[8px] font-black text-[#004A74] uppercase">Cloud Syncing</span>
              </div>
            )}
            <button onClick={onClose} className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all active:scale-90">
               <X size={24} />
            </button>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfcfc]">
         <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12">
            
            {/* Inline Label Editor */}
            <header className="space-y-6">
               <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#004A74] text-white text-[8px] font-black uppercase tracking-widest rounded-full">Knowledge Anchor</span>
                  {localNote.collectionId && (
                     <span className="px-3 py-1 bg-[#FED400]/10 text-[#004A74] text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm"><Library size={10} /> Source Linked</span>
                  )}
               </div>
               
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Note Label / Summary Title</label>
                  <textarea 
                    className="w-full px-8 py-6 bg-gray-50 border border-gray-200 rounded-[2rem] text-2xl md:text-3xl font-black text-[#004A74] uppercase tracking-tighter leading-tight focus:bg-white focus:ring-4 focus:ring-[#004A74]/5 transition-all outline-none resize-none overflow-hidden"
                    value={localNote.label}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    onInput={(e) => {
                       const target = e.target as HTMLTextAreaElement;
                       target.style.height = 'auto';
                       target.style.height = target.scrollHeight + 'px';
                    }}
                    placeholder="ENTER LABEL..."
                    rows={1}
                    ref={(el) => { if(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                  />
               </div>

               <div className="flex items-center gap-6 pt-4 border-t border-gray-50 text-gray-400">
                  <div className="flex items-center gap-2">
                     <Calendar size={14} className="text-[#FED400]" />
                     <span className="text-[10px] font-bold uppercase tracking-widest">{formatFullDate(localNote.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Clock size={14} />
                     <span className="text-[10px] font-bold uppercase tracking-widest">Last Synced: {new Date(localNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
               </div>
            </header>

            {isLoading ? (
              <div className="space-y-6">
                 <div className="h-[400px] w-full skeleton rounded-[3rem]" />
                 <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 skeleton rounded-2xl" />
                    <div className="h-24 skeleton rounded-2xl" />
                 </div>
              </div>
            ) : (
              <div className="space-y-12 animate-in fade-in duration-700">
                 
                 {/* Rich Text Synthesis Area */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-400 px-2">
                       <Sparkles size={14} className="text-[#FED400]" />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em]">Synthesis Workspace</span>
                    </div>
                    <InlineRichEditor 
                      value={content?.description || ''} 
                      onChange={handleDescriptionChange} 
                    />
                 </div>

                 {/* Documentation Matrix */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2"><Paperclip size={14} /> Documentation Matrix</h3>
                       <div className="flex gap-2">
                          <button onClick={handleAddLink} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#004A74] hover:bg-gray-50 shadow-sm transition-all">
                             <LinkIcon size={12} /> Add Link
                          </button>
                          <label className="flex items-center gap-1.5 px-4 py-2 bg-[#004A74] text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-[#003859] shadow-md transition-all">
                             <Plus size={12} /> Add File
                             <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                          </label>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {content?.attachments.map((at, i) => {
                          const isPending = at.fileId?.startsWith('pending_');
                          const isImage = at.mimeType?.startsWith('image/') || at.url?.includes('lh3.googleusercontent');
                          
                          // Smart URL Mapping for view
                          const viewUrl = at.type === 'LINK' 
                             ? at.url 
                             : (isImage 
                                ? (at.url?.startsWith('blob:') ? at.url : `https://lh3.googleusercontent.com/d/${at.fileId}`)
                                : `https://drive.google.com/file/d/${at.fileId}/view`
                               );

                          const previewThumbnail = isImage 
                             ? (at.url?.startsWith('blob:') ? at.url : `https://lh3.googleusercontent.com/d/${at.fileId}`)
                             : null;

                          return (
                             <div 
                               key={i}
                               className={`group relative bg-white border border-gray-200 rounded-[2.5rem] p-5 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col ${isPending ? 'opacity-50 grayscale' : ''}`}
                             >
                                <div className="aspect-video bg-gray-50 rounded-[1.5rem] mb-4 overflow-hidden relative border border-gray-100">
                                   {previewThumbnail ? (
                                      <img src={previewThumbnail} className="w-full h-full object-cover" />
                                   ) : at.type === 'LINK' ? (
                                      <div className="w-full h-full flex items-center justify-center text-gray-200"><Globe size={40} /></div>
                                   ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-200"><FileIcon size={40} /></div>
                                   )}
                                   
                                   <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                      {viewUrl && !isPending && (
                                        <button 
                                          onClick={() => window.open(viewUrl, '_blank')}
                                          className="p-3 bg-[#FED400] text-[#004A74] rounded-full hover:scale-110 transition-all shadow-lg"
                                        >
                                           <Eye size={20} />
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => handleRemoveAttachment(i)}
                                        className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all active:scale-90 shadow-lg"
                                      >
                                         <Trash2 size={20} />
                                      </button>
                                   </div>
                                </div>

                                <div className="space-y-1">
                                   <input 
                                     className="w-full bg-transparent border-none p-0 text-[10px] font-black text-[#004A74] uppercase outline-none focus:ring-0 placeholder:text-gray-200"
                                     value={at.label}
                                     placeholder="LABEL..."
                                     onChange={(e) => updateAttachmentLabel(i, e.target.value)}
                                   />
                                   <div className="flex items-center justify-between">
                                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{at.type}</span>
                                      {at.type === 'LINK' && (
                                         <input 
                                           className="flex-1 ml-4 bg-transparent border-none p-0 text-[9px] font-medium text-blue-500 underline truncate outline-none focus:ring-0"
                                           value={at.url}
                                           placeholder="https://..."
                                           onChange={(e) => {
                                              const newAt = [...content.attachments];
                                              newAt[i].url = e.target.value;
                                              const updated = { ...content, attachments: newAt };
                                              setContent(updated);
                                              scheduleSync(localNote, updated);
                                           }}
                                         />
                                      )}
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>

                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
              </div>
            )}

            <footer className="pt-20 pb-10 space-y-3 opacity-20 text-center">
               <Library size={48} className="mx-auto text-[#004A74]" />
               <p className="text-[8px] font-black uppercase tracking-[0.8em] text-[#004A74]">XEENAPS NOTEBOOK INFRASTRUCTURE</p>
            </footer>

         </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.08); border-radius: 10px; }
        .note-body b { font-weight: 800; color: #004A74; }
        .note-body i { font-style: italic; color: #64748B; }
      `}</style>
    </div>
  );
};

export default NoteDetailView;
