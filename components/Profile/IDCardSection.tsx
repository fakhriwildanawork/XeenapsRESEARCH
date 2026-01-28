import React from 'react';
import { UserProfile } from '../../types';
import { BRAND_ASSETS } from '../../assets';
import { MapPin, Mail, Phone, ShieldCheck } from 'lucide-react';

interface IDCardSectionProps {
  profile: UserProfile;
}

const IDCardSection: React.FC<IDCardSectionProps> = ({ profile }) => {
  const photoUrl = profile.photoUrl || BRAND_ASSETS.USER_DEFAULT;

  return (
    <div className="relative w-full aspect-[3/4] max-w-[360px] mx-auto perspective group animate-in slide-in-from-left duration-1000">
      {/* CARD BODY */}
      <div className="relative w-full h-full bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col items-center p-8 transition-all duration-700 group-hover:shadow-[0_40px_120px_rgba(0,74,116,0.15)] group-hover:-translate-y-2">
        
        {/* Background Decorative Mesh */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-br from-[#004A74] to-[#003859] opacity-10 blur-3xl -translate-y-10" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#FED400] opacity-5 blur-3xl translate-x-20 translate-y-20" />
        
        {/* Xeenaps Branding Header */}
        <div className="w-full flex justify-between items-center mb-8 relative z-10">
          <img src={BRAND_ASSETS.LOGO_ICON} className="w-10 h-10 object-contain brightness-90" alt="Logo" />
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-[#004A74] uppercase tracking-[0.3em]">Identity Card</span>
            <div className="h-0.5 w-8 bg-[#FED400] rounded-full mt-1" />
          </div>
        </div>

        {/* Profile Photo - Circle with Premium Border */}
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-gradient-to-tr from-[#004A74] to-[#FED400] rounded-full blur-lg opacity-20 scale-110" />
           <div className="relative w-44 h-44 rounded-full p-1.5 bg-white shadow-xl border border-gray-100">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 border-2 border-gray-50">
                 <img 
                   src={photoUrl} 
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                   alt={profile.fullName} 
                 />
              </div>
              <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#004A74] text-[#FED400] rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                 <ShieldCheck size={18} strokeWidth={3} />
              </div>
           </div>
        </div>

        {/* Identity Details */}
        <div className="text-center space-y-2 mb-10 w-full relative z-10">
          <h1 className="text-2xl font-black text-[#004A74] uppercase tracking-tighter leading-tight line-clamp-2">
            {profile.fullName}
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-gray-50 border border-gray-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FED400] animate-pulse" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Verified Researcher</span>
          </div>
        </div>

        {/* Contact Snippets */}
        <div className="w-full space-y-4 pt-6 border-t border-gray-50 relative z-10">
          <div className="flex items-center gap-4 group/item">
             <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-[#004A74] group-hover/item:text-white transition-all shadow-sm">
                <MapPin size={14} />
             </div>
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight line-clamp-1">{profile.address || 'Not set'}</p>
          </div>
          <div className="flex items-center gap-4 group/item">
             <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-[#004A74] group-hover/item:text-white transition-all shadow-sm">
                <Mail size={14} />
             </div>
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight line-clamp-1">{profile.email}</p>
          </div>
        </div>

        {/* Signature Area */}
        <div className="mt-auto w-full flex justify-between items-end opacity-20 select-none">
           <div className="flex flex-col">
              <span className="text-[6px] font-black uppercase tracking-widest text-[#004A74]">Auth Code</span>
              <span className="text-[8px] font-mono font-bold text-[#004A74] tracking-tighter">XN-{Math.random().toString(36).substring(7).toUpperCase()}</span>
           </div>
           <img src={BRAND_ASSETS.LOGO_FULL} className="h-4 object-contain opacity-40" alt="Xeenaps" />
        </div>

      </div>
    </div>
  );
};

export default IDCardSection;