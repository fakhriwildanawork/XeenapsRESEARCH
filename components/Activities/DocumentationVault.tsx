
import React, { useState, useEffect, useRef } from 'react';
import { ActivityVaultItem } from '../../types';
import { fetchVaultContent, updateVaultContent, uploadVaultFile } from '../../services/ActivityService';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Link as LinkIcon, 
  ExternalLink, 
  Image as ImageIcon,
  Loader2,
  X,
  PlusCircle,
  FileIcon,
  Download,
  Eye,
  Settings,
  Globe
} from 'lucide-react';
import { showXeenapsToast } from '../../utils/toastUtils';
import { showXeenapsConfirm } from '../../utils/swalUtils';
import Swal from 'sweetalert2';
import { XEENAPS_SWAL_CONFIG } from '../../utils/swalUtils';

interface DocumentationVaultProps {
  activityId: string;
  vaultJsonId: string;
  storageNodeUrl?: string;
  onUpdateVault: (newVaultId?: string, newNodeUrl?: string) => void;
}

const DocumentationVault: React.FC<DocumentationVaultProps> = ({ 
  activityId, 
  vaultJsonId, 
  storageNodeUrl, 
  onUpdateVault 
}) => {
  const [items, setItems] = useState<ActivityVaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!vaultJsonId) return;
      setIsLoading(true);
      const content = await fetchVaultContent(vaultJsonId, storageNodeUrl);
      setItems(content);
      setIsLoading(false);
    };
    load();
  }, [vaultJsonId, storageNodeUrl]);

  const handleSaveVault = async (newItems: ActivityVaultItem[]) => {
    setItems(newItems);
    const result = await updateVaultContent(activityId, vaultJsonId, newItems, storageNodeUrl);
    if (result.success) {
      if (result.newVaultId !== vaultJsonId) {
        onUpdateVault(result.newVaultId, result.newNodeUrl);
      }
    } else {
      showXeenapsToast('error', 'Vault synchronization failed');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const updatedItems = [...items];

    for (const file of files) {
      showXeenapsToast('info', `Uploading ${file.name}...`);
      
      const result = await uploadVaultFile(file);
      if (result) {
        updatedItems.push({
          type: 'FILE',
          fileId: result.fileId,
          nodeUrl: result.nodeUrl, // Store specific node URL
          label: file.name,
          mimeType: file.type
        });
        showXeenapsToast('success', `${file.name} uploaded`);
      } else {
        showXeenapsToast('error', `Failed to upload ${file.name}`);
      }
    }

    await handleSaveVault(updatedItems);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddLink = async () => {
    const { value: url } = await Swal.fire({
      title: 'ADD EXTERNAL LINK',
      input: 'url',
      inputLabel: 'Reference URL',
      inputPlaceholder: 'https://drive.google.com/...',
      showCancelButton: true,
      confirmButtonText: 'ADD',
      ...XEENAPS_SWAL_CONFIG
    });

    if (url) {
      const { value: label } = await Swal.fire({
        title: 'ASSIGN LABEL',
        input: 'text',
        inputPlaceholder: 'e.g., Full Documentation Drive...',
        showCancelButton: true,
        confirmButtonText: 'CONFIRM',
        ...XEENAPS_SWAL_CONFIG
      });

      if (label) {
        const newItems = [...items, { type: 'LINK' as const, url, label }];
        await handleSaveVault(newItems);
        showXeenapsToast('success', 'Link added to vault');
      }
    }
  };

  const handleRemoveItem = async (idx: number) => {
    const item = items[idx];
    const confirm = await showXeenapsConfirm(
      'REMOVE DOCUMENT?', 
      `Are you sure? ${item.type === 'FILE' ? 'This file will be PERMANENTLY DELETED from its storage node.' : 'This link will be removed.'}`,
      'DELETE'
    );

    if (confirm.isConfirmed) {
      const newItems = items.filter((_, i) => i !== idx);
      
      // LOGIC: Specific Node Deletion
      if (item.type === 'FILE' && item.fileId && item.nodeUrl) {
        try {
          await fetch(item.nodeUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteRemoteFiles', fileIds: [item.fileId] })
          });
        } catch (e) {
          console.warn("Node deletion failed, proceeding with index update.");
        }
      }
      
      await handleSaveVault(newItems);
      showXeenapsToast('success', 'Vault item removed');
    }
  };

  const getPreviewUrl = (item: ActivityVaultItem) => {
    if (item.type === 'LINK') return item.url;
    return `https://lh3.googleusercontent.com/d/${item.fileId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
            <ImageIcon size={14} /> Documentation Vault
          </h3>
          <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Supports Multi-Node Sharding</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAddLink}
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#004A74] rounded-2xl text-[9px] font-black uppercase tracking-widest border border-gray-200 transition-all hover:bg-gray-50 active:scale-95 shadow-sm"
          >
            <LinkIcon size={14} /> Add Link
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#004A74] text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:shadow-lg active:scale-95"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Upload File
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            multiple 
            className="hidden" 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-square skeleton rounded-3xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-gray-200 rounded-[3rem] opacity-20">
           <ImageIcon size={48} className="mx-auto mb-2 text-[#004A74]" />
           <p className="text-[10px] font-black uppercase tracking-widest">Vault is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {items.map((item, idx) => {
            const isImage = item.type === 'FILE' && item.mimeType?.startsWith('image/');
            const previewUrl = getPreviewUrl(item);

            return (
              <div 
                key={idx}
                className="group relative aspect-square bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col"
              >
                {/* Visual Preview */}
                <div className="flex-1 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                  {isImage ? (
                    <img src={previewUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.label} />
                  ) : item.type === 'LINK' ? (
                    <div className="flex flex-col items-center gap-2 text-[#004A74]/30 group-hover:text-[#FED400] transition-colors">
                       <Globe size={32} strokeWidth={1.5} />
                       <span className="text-[8px] font-black uppercase tracking-tighter">External Link</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[#004A74]/30 group-hover:text-[#004A74] transition-colors">
                       <FileIcon size={32} strokeWidth={1.5} />
                       <span className="text-[8px] font-black uppercase tracking-tighter">Document File</span>
                    </div>
                  )}

                  {/* HOVER ACTIONS */}
                  <div className="absolute inset-0 bg-[#004A74]/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                     <button 
                        onClick={() => window.open(previewUrl, '_blank')}
                        className="p-3 bg-[#FED400] text-[#004A74] rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg"
                        title="View Full"
                     >
                        {item.type === 'FILE' ? <Eye size={18} /> : <ExternalLink size={18} />}
                     </button>
                     <button 
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all active:scale-95"
                        title="Delete Permanently"
                     >
                        <Trash2 size={14} />
                     </button>
                  </div>
                </div>

                {/* Label Overlay */}
                <div className="p-4 bg-white shrink-0 border-t border-gray-50">
                   <p className="text-[9px] font-black text-[#004A74] truncate uppercase tracking-tight">{item.label}</p>
                   {item.nodeUrl && (
                     <div className="flex items-center gap-1 opacity-20 mt-1">
                        <PlusCircle size={8} />
                        <span className="text-[6px] font-black uppercase truncate">Sharded Node</span>
                     </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentationVault;
