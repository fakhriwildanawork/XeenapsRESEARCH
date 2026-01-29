
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TeachingVaultItem, TeachingItem } from '../../types';
import { fetchTeachingVaultContent, updateTeachingVaultContent, saveTeachingItem } from '../../services/TeachingService';
import { uploadVaultFile, deleteRemoteFile } from '../../services/ActivityService';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Link as LinkIcon, 
  X, 
  PlusCircle, 
  FileIcon, 
  Eye, 
  ArrowLeft, 
  LayoutGrid, 
  Loader2,
  CloudUpload,
  Globe
} from 'lucide-react';
import { showXeenapsToast } from '../../utils/toastUtils';
import { showXeenapsConfirm } from '../../utils/swalUtils';

const TeachingVault: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [metadata, setMetadata] = useState<TeachingItem | null>((location.state as any)?.item || null);
  const [items, setItems] = useState<TeachingVaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [fileQueue, setFileQueue] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadVault = async () => {
      if (!metadata?.vaultJsonId) return;
      setIsLoading(true);
      const content = await fetchTeachingVaultContent(metadata.vaultJsonId, metadata.storageNodeUrl);
      setItems(content);
      setIsLoading(false);
    };
    loadVault();
  }, [metadata?.vaultJsonId]);

  const handleSyncVault = async (newItems: TeachingVaultItem[]) => {
    if (!metadata || !sessionId) return;
    const result = await updateTeachingVaultContent(sessionId, metadata.vaultJsonId, newItems, metadata.storageNodeUrl);
    if (result.success) {
      const updatedMetadata: TeachingItem = { 
        ...metadata, 
        vaultJsonId: result.newVaultId || metadata.vaultJsonId,
        storageNodeUrl: result.newNodeUrl || metadata.storageNodeUrl,
        updatedAt: new Date().toISOString()
      };
      setMetadata(updatedMetadata);
      await saveTeachingItem(updatedMetadata);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newItems = files.map(file => ({
      file,
      label: file.name,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setFileQueue(prev => [...prev, ...newItems]);
  };

  const handleUpload = async () => {
    if (fileQueue.length === 0) return;
    setIsProcessing(true);
    setIsFileModalOpen(false);

    try {
      const uploaded: TeachingVaultItem[] = [];
      for (const q of fileQueue) {
        const res = await uploadVaultFile(q.file);
        if (res) {
          uploaded.push({ type: 'FILE', fileId: res.fileId, nodeUrl: res.nodeUrl, label: q.label, mimeType: q.file.type });
        }
      }
      const final = [...items, ...uploaded];
      setItems(final);
      await handleSyncVault(final);
      showXeenapsToast('success', 'Documents Encrypted & Stored');
    } catch (err) {
      showXeenapsToast('error', 'Vault sync failed');
    } finally {
      setFileQueue([]);
      setIsProcessing(false);
    }
  };

  const handleRemove = async (idx: number) => {
    const item = items[idx];
    const confirm = await showXeenapsConfirm('PURGE DOCUMENT?', 'This will permanently erase the file from Cloud Storage.', 'PURGE');
    if (confirm.isConfirmed) {
      const filtered = items.filter((_, i) => i !== idx);
      setItems(filtered);
      if (item.type === 'FILE' && item.fileId && item.nodeUrl) {
        await deleteRemoteFile(item.fileId, item.nodeUrl);
      }
      await handleSyncVault(filtered);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-in slide-in-from-right duration-500 overflow-hidden">
      <header className="px-6 md:px-10 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shrink-0 z-50">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/teaching/${sessionId}`, { state: { item: metadata } })} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] rounded-xl transition-all shadow-sm">
               <ArrowLeft size={18} strokeWidth={3} />
            </button>
            <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight truncate max-w-md">{metadata?.label || 'Session Vault'}</h2>
         </div>
         <button onClick={() => setIsFileModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-[#004A74] text-white rounded-2xl text-[9px] font-black uppercase shadow-lg">
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Evidence
         </button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-square skeleton rounded-[2.5rem]" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-40 text-center opacity-20 flex flex-col items-center justify-center space-y-4">
             <LayoutGrid size={80} strokeWidth={1} className="text-[#004A74]" />
             <p className="text-sm font-black uppercase tracking-[0.4em]">Vault Empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {items.map((item, idx) => (
              <div key={idx} className="group relative aspect-square bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                   {item.mimeType?.startsWith('image/') ? (
                     <img src={`https://lh3.googleusercontent.com/d/${item.fileId}`} className="w-full h-full object-cover" />
                   ) : (
                     <FileText size={40} className="text-[#004A74]/20" />
                   )}
                   <div className="absolute inset-0 bg-[#004A74]/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                      <button onClick={() => window.open(`https://lh3.googleusercontent.com/d/${item.fileId}`, '_blank')} className="p-3 bg-[#FED400] text-[#004A74] rounded-full hover:scale-110 transition-all shadow-lg"><Eye size={18} /></button>
                      <button onClick={() => handleRemove(idx)} className="p-2 bg-red-500 text-white rounded-full"><Trash2 size={14} /></button>
                   </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3 bg-white/90 backdrop-blur-sm border-t border-gray-100">
                   <p className="text-[8px] font-black text-[#004A74] truncate uppercase">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isFileModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                 <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">Vault Ingestion</h2>
                 <button onClick={() => setIsFileModalOpen(false)} className="p-2 hover:bg-red-50 text-gray-400 rounded-full"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                 {fileQueue.length === 0 ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-gray-50 cursor-pointer hover:bg-white transition-all group">
                       <PlusCircle className="w-10 h-10 text-gray-300 group-hover:text-[#004A74] mb-3" />
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Evidence Files</p>
                       <input type="file" className="hidden" multiple onChange={onFileSelect} />
                    </label>
                 ) : (
                    <div className="space-y-4">
                       {fileQueue.map((q, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                {q.previewUrl ? <img src={q.previewUrl} className="w-full h-full object-cover" /> : <FileIcon size={20} className="text-gray-300" />}
                             </div>
                             <input className="flex-1 bg-white border border-gray-100 px-3 py-2 rounded-lg text-[10px] font-bold text-[#004A74]" value={q.label} onChange={e => setFileQueue(prev => prev.map((item, idx) => idx === i ? {...item, label: e.target.value} : item))} />
                             <button onClick={() => setFileQueue(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-red-300"><X size={16} /></button>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                 <button onClick={handleUpload} disabled={fileQueue.length === 0} className="px-10 py-3 bg-[#004A74] text-[#FED400] rounded-xl text-[10px] font-black uppercase shadow-xl">Secure Upload</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeachingVault;
