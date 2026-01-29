import React from 'react';
import { CVTemplateType } from '../../types';
import { X, User, Briefcase, GraduationCap, Award, FileText, Info } from 'lucide-react';
import { BRAND_ASSETS } from '../../assets';

interface CVPreviewModalProps {
  template: CVTemplateType;
  onClose: () => void;
}

const CVPreviewModal: React.FC<CVPreviewModalProps> = ({ template, onClose }) => {
  
  const getTemplateLayout = () => {
    switch(template) {
      case CVTemplateType.MODERN_ACADEMIC:
        return (
          <div className="w-full h-full bg-white flex flex-col p-6 space-y-4 animate-in zoom-in-95 duration-500 overflow-hidden border border-gray-100">
             <div className="flex items-start justify-between border-b-2 border-[#004A74] pb-3">
                <div className="space-y-1.5 flex-1">
                   <div className="h-5 w-3/4 bg-[#004A74] rounded-sm" />
                   <div className="h-2 w-1/2 bg-black rounded-sm" />
                   <div className="flex gap-2 pt-1">
                      <div className="h-1 w-10 bg-black rounded-full" />
                      <div className="h-1 w-12 bg-black rounded-full" />
                   </div>
                </div>
                <div className="w-14 h-[18.6px] rounded-sm bg-gray-50 border-2 border-[#004A74] flex items-center justify-center text-gray-200 shrink-0" style={{ height: '74.6px' }}>
                   <User size={24} className="text-black" />
                </div>
             </div>
             
             <div className="p-3 bg-blue-50 border-l-4 border-[#004A74] rounded-r-lg">
                <div className="h-1 w-full bg-[#004A74] rounded mb-1" />
                <div className="h-1 w-4/5 bg-[#004A74] rounded" />
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                   <div className="h-3 w-32 bg-[#004A74] rounded-sm" />
                   <div className="pl-3 space-y-1.5 border-l-2 border-black">
                      <div className="flex justify-between items-center"><div className="h-2 w-28 bg-black rounded-sm" /><div className="h-1 w-8 bg-black rounded-full" /></div>
                      <div className="h-1.5 w-40 bg-black rounded-sm" />
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="h-3 w-40 bg-[#004A74] rounded-sm" />
                   <div className="space-y-1">
                      <div className="h-1.5 w-full bg-black rounded-sm" />
                      <div className="h-1.5 w-11/12 bg-black rounded-sm" />
                   </div>
                </div>
             </div>
             <div className="mt-auto pt-2 border-t border-black text-center">
                <div className="h-1 w-24 bg-black mx-auto rounded-full" />
             </div>
          </div>
        );
      case CVTemplateType.EXECUTIVE_BLUE:
        return (
          <div className="w-full h-full bg-white flex animate-in zoom-in-95 duration-500 overflow-hidden">
             <div className="w-[30%] bg-[#004A74] p-4 text-white space-y-5 shrink-0 flex flex-col items-center">
                <div className="w-16 h-[21.3px] rounded-lg bg-white border-2 border-white flex items-center justify-center mb-4 overflow-hidden" style={{ height: '85.3px' }}>
                   <User size={28} className="text-[#004A74]" />
                </div>
                <div className="w-full space-y-3">
                   <div className="h-1 w-1/2 bg-white rounded mx-auto" />
                   <div className="h-1 w-2/3 bg-white rounded mx-auto" />
                   <div className="pt-4 space-y-2">
                      <div className="h-2 w-full bg-white rounded" />
                      <div className="h-2 w-full bg-white rounded" />
                   </div>
                </div>
             </div>
             <div className="flex-1 p-5 space-y-5 bg-white overflow-hidden">
                <div className="space-y-1.5 pb-3 border-b-2 border-[#004A74]">
                   <div className="h-5 w-40 bg-[#004A74] rounded-sm" />
                   <div className="h-2 w-28 bg-black rounded-sm" />
                </div>
                <div className="space-y-5">
                   <div className="space-y-2">
                      <div className="h-2 w-20 bg-black rounded-sm" />
                      <div className="space-y-1.5">
                         <div className="h-1.5 w-full bg-black rounded-sm" />
                         <div className="h-1.5 w-full bg-black rounded-sm" />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="h-3 w-32 bg-[#004A74] rounded-sm" />
                      <div className="p-2 border border-black rounded-lg">
                         <div className="flex justify-between mb-1.5"><div className="h-2 w-20 bg-black rounded-sm" /><div className="h-1 w-8 bg-black rounded-full" /></div>
                         <div className="h-1.5 w-full bg-black rounded-sm" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
      case CVTemplateType.INSTITUTIONAL_CLASSIC:
        return (
          <div className="w-full h-full bg-white p-8 space-y-8 animate-in zoom-in-95 duration-500 overflow-hidden border border-gray-100">
             <div className="flex flex-col items-center space-y-3 pt-2 text-center border-b-2 border-[#004A74] pb-5">
                <div className="w-12 h-16 bg-white border border-black rounded-sm flex items-center justify-center text-black">
                   <User size={20} />
                </div>
                <div className="h-6 w-3/4 bg-[#004A74] rounded-sm" />
                <div className="h-2 w-1/2 bg-black rounded-sm" />
             </div>
             <div className="space-y-6">
                <div className="space-y-3">
                   <div className="h-3 w-32 border-b-2 border-black flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#004A74]"/> <div className="h-2 w-20 bg-[#004A74] rounded-sm"/></div>
                   <div className="space-y-3 pl-2">
                      <div className="flex justify-between"><div className="h-2 w-36 bg-black rounded-sm" /><div className="h-2 w-10 bg-black rounded-sm" /></div>
                      <div className="h-1.5 w-48 bg-black rounded-sm" />
                   </div>
                </div>
                <div className="space-y-3">
                   <div className="h-3 w-40 border-b-2 border-black flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#004A74]"/> <div className="h-2 w-24 bg-[#004A74] rounded-sm"/></div>
                   <div className="space-y-1.5 pl-2">
                      <div className="h-1.5 w-full bg-black rounded-sm" />
                      <div className="h-1.5 w-11/12 bg-black rounded-sm" />
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
              <p className="text-[9px] font-bold text-black uppercase tracking-widest">High Contrast / Zero Gray / 3:4 Aspect</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
              <X className="w-6 h-6" />
           </button>
        </div>

        <div className="p-8 bg-gray-100 flex items-center justify-center overflow-hidden">
           <div className="aspect-[1/1.414] w-[280px] md:w-[320px] bg-white rounded-lg shadow-2xl border border-gray-300 overflow-hidden transform hover:scale-105 transition-transform duration-700">
              {getTemplateLayout()}
           </div>
        </div>

        <div className="px-10 py-6 border-t border-gray-100 text-center bg-gray-50/30">
           <button 
             onClick={onClose}
             className="px-10 py-3 bg-[#004A74] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
           >
             Close Prototype
           </button>
        </div>

      </div>
    </div>
  );
};

export default CVPreviewModal;