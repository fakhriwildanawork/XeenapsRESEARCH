import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { BRAND_ASSETS } from '../../assets';
import { MapPin, Mail, Phone, ShieldCheck, Globe, Building2, Briefcase, Camera } from 'lucide-react';

interface IDCardSectionProps {
  profile: UserProfile;
  onUpdate: (field: keyof UserProfile, value: string) => void;
}

const IDCardSection: React.FC<IDCardSectionProps> = ({ profile, onUpdate }) => {
  const photoUrl = profile.photoUrl || BRAND_ASSETS.USER_DEFAULT;

  return (
    <div className="relative w-full aspect-[3/4] max-w-[360px] mx-auto perspective group animate-in slide-in-from-left duration-1000">
      {/* CARD BODY */}
      <div className="relative w-full h-full bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col items-center p-8 transition-all duration-700 group-hover:shadow-[0_40px_120px_rgba(0,74,116,0.15)]">
        
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

        {/* Profile Photo - Inline URL Edit */}
        <div className="relative mb-6">
           <div className="absolute inset-0 bg-gradient-to-tr from-[#004A74] to-[#FED400] rounded-full blur-lg opacity-20 scale-110" />
           <div className="relative w-40 h-40 rounded-full p-1.5 bg-white shadow-xl border border-gray-100 group/photo">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 border-2 border-gray-50">
                 <img 
                   src={photoUrl} 
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                   alt={profile.fullName} 
                 />
                 {/* Photo URL Input Overlay */}
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                    <Camera size={20} className="text-white mb-2" />
                    <input 
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-2 py-1 text-[8px] text-white text-center focus:bg-white focus:text-[#004A74] outline-none"
                      placeholder="Paste Image URL..."
                      defaultValue={profile.photoUrl}
                      onBlur={(e) => onUpdate('photoUrl', e.target.value)}
                    />
                 </div>
              </div>
              <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#004A74] text-[#FED400] rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                 <ShieldCheck size={18} strokeWidth={3} />
              </div>
           </div>
        </div>

        {/* Identity Details - Inline Editable */}
        <div className="text-center space-y-4 mb-6 w-full relative z-10 px-2">
          {/* Full Name */}
          <input 
            className="w-full bg-transparent border-none text-xl font-black text-[#004A74] uppercase tracking-tighter text-center focus:ring-4 focus:ring-[#FED400]/10 rounded-xl outline-none transition-all placeholder:text-gray-200"
            defaultValue={profile.fullName}
            onBlur={(e) => onUpdate('fullName', e.target.value)}
            placeholder="FULL NAME..."
          />
          
          <div className="flex flex-col items-center gap-1">
            {/* Job Title */}
            <div className="flex items-center gap-2 text-gray-400 group/field">
               <Briefcase size={12} />
               <input 
                 className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-center focus:text-[#004A74] outline-none transition-all placeholder:text-gray-300"
                 defaultValue={profile.jobTitle}
                 onBlur={(e) => onUpdate('jobTitle', e.target.value)}
                 placeholder="JOB TITLE..."
               />
            </div>
            {/* Affiliation */}
            <div className="flex items-center gap-2 text-gray-400 group/field">
               <Building2 size={12} />
               <input 
                 className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-center focus:text-[#004A74] outline-none transition-all placeholder:text-gray-300"
                 defaultValue={profile.affiliation}
                 onBlur={(e) => onUpdate('affiliation', e.target.value)}
                 placeholder="AFFILIATION..."
               />
            </div>
          </div>
        </div>

        {/* Contact Snippets - Inline Editable */}
        <div className="w-full space-y-2 pt-4 border-t border-gray-50 relative z-10">
          <div className="flex items-center gap-4 group/item">
             <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-[#004A74] group-hover/item:text-white transition-all shadow-sm shrink-0">
                <MapPin size={14} />
             </div>
             <input 
               className="w-full bg-transparent border-none text-[10px] font-bold text-gray-500 uppercase tracking-tight focus:text-[#004A74] outline-none"
               defaultValue={profile.address}
               onBlur={(e) => onUpdate('address', e.target.value)}
               placeholder="ADDRESS..."
             />
          </div>
          <div className="flex items-center gap-4 group/item">
             <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-[#004A74] group-hover/item:text-white transition-all shadow-sm shrink-0">
                <Mail size={14} />
             </div>
             <input 
               className="w-full bg-transparent border-none text-[10px] font-bold text-gray-500 uppercase tracking-tight focus:text-[#004A74] outline-none"
               defaultValue={profile.email}
               onBlur={(e) => onUpdate('email', e.target.value)}
               placeholder="EMAIL..."
             />
          </div>
          <div className="flex items-center gap-4 group/item">
             <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-[#004A74] group-hover/item:text-white transition-all shadow-sm shrink-0">
                <Phone size={14} />
             </div>
             <input 
               className="w-full bg-transparent border-none text-[10px] font-bold text-gray-500 uppercase tracking-tight focus:text-[#004A74] outline-none"
               defaultValue={profile.phone}
               onBlur={(e) => onUpdate('phone', e.target.value)}
               placeholder="PHONE..."
             />
          </div>
          <div className="flex items-center gap-4 group/item">
             <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-[#004A74] group-hover/item:text-white transition-all shadow-sm shrink-0">
                <Globe size={14} />
             </div>
             <input 
               className="w-full bg-transparent border-none text-[10px] font-bold text-gray-500 uppercase tracking-tight focus:text-[#004A74] outline-none"
               defaultValue={profile.socialMedia}
               onBlur={(e) => onUpdate('socialMedia', e.target.value)}
               placeholder="SOCIAL MEDIA / LINK..."
             />
          </div>
        </div>

        {/* Signature Area & Unique App ID (Editable with Double Confirmation) */}
        <div className="mt-auto w-full flex justify-between items-end relative z-10 pt-4">
           <div className="flex flex-col group/appid">
              <span className="text-[6px] font-black uppercase tracking-widest text-[#004A74] opacity-40">Auth Code</span>
              <input 
                className="bg-transparent border-none text-[8px] font-mono font-bold text-[#004A74] tracking-tighter outline-none focus:bg-[#FED400] rounded-sm px-1 transition-all"
                defaultValue={profile.uniqueAppId}
                onBlur={(e) => onUpdate('uniqueAppId', e.target.value)}
              />
           </div>
           <img src={BRAND_ASSETS.LOGO_FULL} className="h-4 object-contain opacity-20" alt="Xeenaps" />
        </div>

      </div>
    </div>
  );
};

export default IDCardSection;