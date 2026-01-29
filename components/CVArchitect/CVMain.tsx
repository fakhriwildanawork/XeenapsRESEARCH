import React, { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { useNavigate, Routes, Route } from 'react-router-dom';
import { CVDocument } from '../../types';
import { fetchCVList, deleteCVDocument } from '../../services/CVService';
import { 
  FileUser, 
  Plus, 
  Trash2, 
  Download, 
  Eye, 
  FileText, 
  Clock, 
  LayoutGrid,
  Search,
  ExternalLink
} from 'lucide-react';
import { SmartSearchBox } from '../Common/SearchComponents';
import { StandardPrimaryButton } from '../Common/ButtonComponents';
import { CardGridSkeleton } from '../Common/LoadingComponents';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import { showXeenapsToast } from '../../utils/toastUtils';
import CVForm from './CVForm';

const CVGallery: React.FC = () => {
  const navigate = useNavigate();
  const [cvs, setCvs] = useState<CVDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchCVList();
    setCvs(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed) {
      const success = await deleteCVDocument(id);
      if (success) {
        showXeenapsToast('success', 'CV removed from cloud');
        loadData();
      }
    }
  };

  const handleDownload = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, '_blank');
  };

  const handleView = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
  };

  const filteredCvs = cvs.filter(cv => 
    cv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return "-"; }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-1 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
            <FileUser size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#004A74] uppercase tracking-tight">The Architect</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">CV Generation Engine</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto flex-1 max-w-2xl">
          <SmartSearchBox 
            value={searchQuery} 
            onChange={setSearchQuery} 
            phrases={["Search by CV Title...", "Search by Template..."]}
          />
          <StandardPrimaryButton onClick={() => navigate('/cv-architect/new')} icon={<Plus size={20} />}>
            Architect New CV
          </StandardPrimaryButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : filteredCvs.length === 0 ? (
          <div className="py-40 text-center flex flex-col items-center justify-center space-y-4 opacity-30 grayscale">
            <FileUser size={80} strokeWidth={1} className="text-[#004A74]" />
            <p className="text-sm font-black uppercase tracking-[0.4em]">No CV Documents Found</p>
            <p className="text-xs font-bold text-gray-400 italic">Click "Architect New CV" to initialize synthesis.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
            {filteredCvs.map(cv => (
              <div 
                key={cv.id}
                onClick={(e) => handleView(e, cv.fileId)}
                className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1 bg-[#004A74]/5 text-[#004A74] text-[8px] font-black uppercase tracking-widest rounded-full">{cv.template}</span>
                  <button onClick={(e) => handleDelete(e, cv.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>

                <div className="w-full aspect-[1/1.4] bg-gray-50 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden border border-gray-100 group-hover:border-[#004A74]/20 transition-all">
                   <FileText size={48} className="text-gray-200 group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-[#004A74]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                      <button onClick={(e) => handleView(e, cv.fileId)} className="p-3 bg-[#FED400] text-[#004A74] rounded-full shadow-lg hover:scale-110 transition-all"><Eye size={20} /></button>
                      <button onClick={(e) => handleDownload(e, cv.fileId)} className="p-3 bg-white text-[#004A74] rounded-full shadow-lg hover:scale-110 transition-all"><Download size={20} /></button>
                   </div>
                </div>

                <h3 className="text-sm font-black text-[#004A74] leading-tight mb-2 uppercase line-clamp-2 flex-1">{cv.title}</h3>
                
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-gray-400">
                   <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <span className="text-[9px] font-black uppercase tracking-tighter">{formatShortDate(cv.createdAt)}</span>
                   </div>
                   <div className="flex items-center gap-1 text-[#FED400]">
                      <span className="text-[7px] font-black uppercase tracking-widest">PDF Ready</span>
                      <ExternalLink size={10} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 74, 116, 0.2); }
      `}</style>
    </div>
  );
};

const CVMain: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<CVGallery />} />
      <Route path="/new" element={<CVForm />} />
    </Routes>
  );
};

export default CVMain;