import React from 'react';
import { CVTemplateType } from '../../types';
import { X, User, Briefcase, GraduationCap, Mail, Phone, MapPin, Award, Share2 } from 'lucide-react';

interface CVPreviewModalProps {
  template: CVTemplateType;
  onClose: () => void;
}

const CVPreviewModal: React.FC<CVPreviewModalProps> = ({ template, onClose }) => {
  
  const getTemplateLayout = () => {
    switch(template) {
      case CVTemplateType.MODERN_ACADEMIC:
        return (
          <div className="w-full h-full bg-white flex flex-col p-8 space-y-6 animate-in zoom-in-95 duration-500 overflow-hidden">
             {/* Header */}
             <div className="flex items-start justify-between border-b-2 border-[#004A74] pb-4">
                <div className="space-y-2 flex-1">
                   <div className="h-6 w-3/4 bg-[#004A74]/10 rounded" />
                   <div className="h-2 w-1/2 bg-[#FED400]/40 rounded" />
                   <div className="flex gap-2 pt-2">
                      <div className="h-1.5 w-10 bg-gray-100 rounded" />
                      <div className="h-1.5 w-12 bg-gray-100 rounded" />
                   </div>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gray-50 border-2 border-[#FED400] flex items-center justify-center text-gray-200">
                   <User size={32} />
                </div>
             </div>
             
             {/* Summary */}
             <div className="p-3 bg-gray-50 border-l-4 border-[#FED400] rounded-r-lg">
                <div className="h-1.5 w-full bg-gray-200 rounded mb-1.5" />
                <div className="h-1.5 w-5/6 bg-gray-200 rounded" />
             </div>

             <div className="space-y-5">
                <div className="space-y-3">
                   <div className="flex items-center gap-2 border-b border-gray-100 pb-1">
                      <GraduationCap size={14} className="text-[#FED400]" />
                      <div className="h-2 w-24 bg-[#004A74]/20 rounded-full" />
                   </div>
                   <div className="pl-4 space-y-2 border-l border-gray-100">
                      <div className="flex justify-between items-center"><div className="h-2 w-28 bg-gray-100 rounded" /><div className="h-1.5 w-8 bg-gray-50 rounded" /></div>
                      <div className="h-1.5 w-40 bg-gray-50 rounded" />
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center gap-2 border-b border-gray-100 pb-1">
                      <Briefcase size={14} className="text-[#FED400]" />
                      <div className="h-2 w-28 bg-[#004A74]/20 rounded-full" />
                   </div>
                   <div className="pl-4 space-y-2 border-l border-gray-100">
                      <div className="flex justify-between items-center"><div className="h-2 w-32 bg-gray-100 rounded" /><div className="h-1.5 w-8 bg-gray-50 rounded" /></div>
                      <div className="h-1.5 w-full bg-gray-50 rounded" />
                   </div>
                </div>
             </div>
          </div>
        );
      case CVTemplateType.EXECUTIVE_BLUE:
        return (
          <div className="w-full h-full bg-white flex animate-in zoom-in-95 duration-500 overflow-hidden">
             {/* Left Sidebar */}
             <div className="w-[35%] bg-[#004A74] p-5 text-white space-y-6 shrink-0">
                <div className="w-full aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 overflow-hidden">
                   <User size={40} className="text-white/20" />
                </div>
                
                <div className="space-y-4">
                   <div className="space-y-2 pb-2 border-b border-white/10">
                      <div className="h-1.5 w-12 bg-[#FED400] rounded" />
                      <div className="flex items-center gap-2"><Mail size={10} className="text-[#FED400]/60" /><div className="h-1 w-16 bg-white/20 rounded" /></div>
                      <div className="flex items-center gap-2"><Phone size={10} className="text-[#FED400]/60" /><div className="h-1 w-12 bg-white/20 rounded" /></div>
                   </div>

                   <div className="space-y-2">
                      <div className="h-1.5 w-16 bg-[#FED400] rounded" />
                      <div className="flex items-center gap-2"><Award size={10} className="text-[#FED400]/60" /><div className="h-1 w-20 bg-white/20 rounded" /></div>
                      <div className="flex items-center gap-2"><Award size={10} className="text-[#FED400]/60" /><div className="h-1 w-18 bg-white/20 rounded" /></div>
                   </div>
                </div>
             </div>

             {/* Main Content */}
             <div className="flex-1 p-6 space-y-6 bg-white overflow-hidden">
                <div className="space-y-2 pb-4 border-b border-gray-50">
                   <div className="h-4 w-40 bg-[#004A74] rounded" />
                   <div className="h-2 w-28 bg-gray-400 rounded" />
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-3">
                      <div className="h-2 w-16 bg-[#FED400] rounded" />
                      <div className="space-y-2">
                         <div className="h-1.5 w-full bg-gray-50 rounded" />
                         <div className="h-1.5 w-full bg-gray-50 rounded" />
                         <div className="h-1.5 w-4/5 bg-gray-50 rounded" />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="h-2 w-24 bg-[#004A74]/10 rounded" />
                      <div className="space-y-3">
                         <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-50">
                            <div className="flex justify-between mb-2"><div className="h-2 w-20 bg-gray-200 rounded" /><div className="h-1 w-8 bg-gray-100 rounded" /></div>
                            <div className="h-1.5 w-full bg-gray-100/50 rounded" />
                         </div>
                         <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-50">
                            <div className="flex justify-between mb-2"><div className="h-2 w-24 bg-gray-200 rounded" /><div className="h-1 w-8 bg-gray-100 rounded" /></div>
                            <div className="h-1.5 w-full bg-gray-100/50 rounded" />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
      case CVTemplateType.INSTITUTIONAL_CLASSIC:
        return (
          <div className="w-full h-full bg-white p-10 space-y-10 animate-in zoom-in-95 duration-500 overflow-hidden">
             <div className="flex gap-6 items-start justify-center">
                <div className="flex-1 space-y-3 pt-2 text-center">
                   <div className="h-6 w-3/4 bg-gray-800 rounded mx-auto" />
                   <div className="flex justify-center gap-4">
                      <div className="h-1.5 w-20 bg-gray-300 rounded-full" />
                      <div className="h-1.5 w-20 bg-gray-300 rounded-full" />
                   </div>
                   <div className="h-1.5 w-40 bg-gray-100 rounded-full mx-auto" />
                </div>
             </div>

             <div className="space-y-8">
                <div className="space-y-4">
                   <div className="h-3 w-32 border-b-2 border-gray-800 flex items-center gap-2"><GraduationCap size={12}/> <span className="text-[10px] font-black uppercase">Education</span></div>
                   <div className="space-y-4 pl-4">
                      <div className="space-y-2">
                        <div className="flex justify-between font-bold"><div className="h-2 w-36 bg-gray-200 rounded" /><div className="h-1.5 w-10 bg-gray-200 rounded" /></div>
                        <div className="h-1.5 w-48 bg-gray-100 rounded" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between font-bold"><div className="h-2 w-40 bg-gray-200 rounded" /><div className="h-1.5 w-10 bg-gray-200 rounded" /></div>
                        <div className="h-1.5 w-52 bg-gray-100 rounded" />
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="h-3 w-32 border-b-2 border-gray-800 flex items-center gap-2"><Share2 size={12}/> <span className="text-[10px] font-black uppercase">Publications</span></div>
                   <div className="space-y-2 pl-4">
                      <div className="h-1.5 w-full bg-gray-50 rounded" />
                      <div className="h-1.5 w-11/12 bg-gray-50 rounded" />
                      <div className="h-1.5 w-full bg-gray-50 rounded" />
                   </div>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden relative flex flex-col border border-white/20">
        
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
           <div>
              <h3 className="text-lg font-black text-[#004A74] uppercase tracking-tight">{template} Prototype</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Architectural Layout Preview</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
              <X className="w-6 h-6" />
           </button>
        </div>

        <div className="p-8 bg-gray-100 flex items-center justify-center overflow-hidden">
           <div className="aspect-[1/1.414] w-[300px] md:w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ring-8 ring-white/50 transform hover:scale-105 transition-transform duration-700">
              {getTemplateLayout()}
           </div>
        </div>

        <div className="px-10 py-6 border-t border-gray-100 text-center bg-gray-50/30">
           <button 
             onClick={onClose}
             className="px-10 py-3 bg-[#004A74] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
           >
             Close Preview
           </button>
        </div>

      </div>
    </div>
  );
};

export default CVPreviewModal;