import React from 'react';
import { CVTemplateType } from '../../types';
import { X, User, Briefcase, GraduationCap, Mail, Phone, MapPin } from 'lucide-react';

interface CVPreviewModalProps {
  template: CVTemplateType;
  onClose: () => void;
}

const CVPreviewModal: React.FC<CVPreviewModalProps> = ({ template, onClose }) => {
  
  const getTemplateLayout = () => {
    switch(template) {
      case CVTemplateType.MODERN_ACADEMIC:
        return (
          <div className="w-full h-full bg-white flex flex-col p-8 space-y-6 animate-in zoom-in-95 duration-500">
             <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-[#FED400] flex items-center justify-center text-gray-300">
                   <User size={40} />
                </div>
                <div className="space-y-1">
                   <div className="h-4 w-32 bg-[#004A74] rounded-full mx-auto" />
                   <div className="h-2 w-24 bg-[#FED400]/40 rounded-full mx-auto" />
                </div>
             </div>
             <div className="h-px bg-gray-100 w-full" />
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <GraduationCap size={12} className="text-[#FED400]" />
                   <div className="h-2 w-20 bg-gray-200 rounded-full" />
                </div>
                <div className="pl-5 space-y-2">
                   <div className="h-3 w-full bg-gray-50 rounded-lg" />
                   <div className="h-3 w-3/4 bg-gray-50 rounded-lg" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                   <Briefcase size={12} className="text-[#FED400]" />
                   <div className="h-2 w-20 bg-gray-200 rounded-full" />
                </div>
                <div className="pl-5 space-y-2">
                   <div className="h-3 w-full bg-gray-50 rounded-lg" />
                   <div className="h-3 w-5/6 bg-gray-50 rounded-lg" />
                </div>
             </div>
          </div>
        );
      case CVTemplateType.EXECUTIVE_BLUE:
        return (
          <div className="w-full h-full bg-white flex animate-in zoom-in-95 duration-500 overflow-hidden">
             <div className="w-1/3 bg-[#004A74] p-6 text-white space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                   <User size={32} className="text-white/40" />
                </div>
                <div className="space-y-3 pt-4">
                   <div className="flex items-center gap-2 opacity-40"><Mail size={8} /><div className="h-1 w-12 bg-white rounded-full" /></div>
                   <div className="flex items-center gap-2 opacity-40"><Phone size={8} /><div className="h-1 w-10 bg-white rounded-full" /></div>
                   <div className="flex items-center gap-2 opacity-40"><MapPin size={8} /><div className="h-1 w-14 bg-white rounded-full" /></div>
                </div>
                <div className="pt-8 space-y-2">
                   <div className="h-1.5 w-12 bg-[#FED400] rounded-full" />
                   <div className="h-2 w-full bg-white/10 rounded-full" />
                   <div className="h-2 w-5/6 bg-white/10 rounded-full" />
                </div>
             </div>
             <div className="flex-1 p-8 space-y-6">
                <div className="space-y-2">
                   <div className="h-5 w-40 bg-[#004A74] rounded-lg" />
                   <div className="h-2 w-24 bg-gray-200 rounded-full" />
                </div>
                <div className="space-y-4">
                   <div className="h-2 w-16 bg-[#004A74]/20 rounded-full" />
                   <div className="space-y-2">
                      <div className="h-10 w-full bg-gray-50 rounded-xl" />
                      <div className="h-10 w-full bg-gray-50 rounded-xl" />
                   </div>
                </div>
             </div>
          </div>
        );
      case CVTemplateType.INSTITUTIONAL_CLASSIC:
        return (
          <div className="w-full h-full bg-white p-10 space-y-10 animate-in zoom-in-95 duration-500">
             <div className="flex gap-6 items-start">
                <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-lg shrink-0 flex items-center justify-center text-gray-200">
                   <User size={48} />
                </div>
                <div className="flex-1 space-y-3 pt-2">
                   <div className="h-6 w-full bg-gray-800 rounded-md" />
                   <div className="grid grid-cols-2 gap-4">
                      <div className="h-2 w-full bg-gray-200 rounded-full" />
                      <div className="h-2 w-full bg-gray-200 rounded-full" />
                   </div>
                </div>
             </div>
             <div className="space-y-8">
                <div className="space-y-4">
                   <div className="h-3 w-32 border-b-2 border-gray-800 font-bold uppercase text-[10px]">Education</div>
                   <div className="space-y-3">
                      <div className="flex justify-between"><div className="h-3 w-48 bg-gray-100 rounded" /><div className="h-2 w-12 bg-gray-100 rounded" /></div>
                      <div className="h-2 w-64 bg-gray-50 rounded ml-4" />
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="h-3 w-32 border-b-2 border-gray-800 font-bold uppercase text-[10px]">Experience</div>
                   <div className="space-y-3">
                      <div className="flex justify-between"><div className="h-3 w-56 bg-gray-100 rounded" /><div className="h-2 w-12 bg-gray-100 rounded" /></div>
                      <div className="h-2 w-72 bg-gray-50 rounded ml-4" />
                   </div>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-[#004A74]/40 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden relative flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
           <div>
              <h3 className="text-lg font-black text-[#004A74] uppercase tracking-tight">{template} Preview</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Architectural Layout Blueprint</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
              <X className="w-6 h-6" />
           </button>
        </div>

        {/* Scaled Preview Box */}
        <div className="p-8 bg-gray-100 shrink-0">
           <div className="aspect-[1/1.414] w-full bg-white rounded-2xl shadow-inner border border-gray-200 overflow-hidden ring-8 ring-white/50">
              {getTemplateLayout()}
           </div>
        </div>

        {/* Footer Info */}
        <div className="px-10 py-6 border-t border-gray-100 text-center bg-gray-50/30">
           <p className="text-[10px] font-bold text-gray-400 italic">
             "Layout will dynamically adjust based on your selected data entries and chronological sorting."
           </p>
        </div>

      </div>
    </div>
  );
};

export default CVPreviewModal;