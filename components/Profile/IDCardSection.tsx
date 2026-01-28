import React, { useRef, useState } from 'react';
import { UserProfile } from '../../types';
import { BRAND_ASSETS } from '../../assets';
import { Camera, Trash2, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { uploadProfilePhoto, deleteProfilePhoto, saveUserProfile } from '../../services/ProfileService';
import { showXeenapsToast } from '../../utils/toastUtils';

interface IDCardSectionProps {
  profile: UserProfile;
  onUpdate: (field: keyof UserProfile, value: string) => void;
  onPhotoChange: (url: string, id: string, node: string) => void;
}

const IDCardSection: React.FC<IDCardSectionProps> = ({ profile, onUpdate, onPhotoChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    showXeenapsToast('info', 'Synchronizing photo with storage node...');
    
    const result = await uploadProfilePhoto(file);
    if (result) {
      onPhotoChange(result.photoUrl, result.fileId, result.nodeUrl);
      await saveUserProfile({ 
        ...profile, 
        photoUrl: result.photoUrl, 
        photoFileId: result.fileId, 
        photoNodeUrl: result.nodeUrl 
      });
      showXeenapsToast('success', 'Profile photo updated');
    } else {
      showXeenapsToast('error', 'Upload failed. Check storage quota.');
    }
    setIsUploading(false);
  };

  const handleDeletePhoto = async () => {
    if (!profile.photoFileId || !profile.photoNodeUrl) return;
    
    setIsUploading(true);
    const success = await deleteProfilePhoto(profile.photoFileId, profile.photoNodeUrl);
    if (success) {
      onPhotoChange("", "", "");
      await saveUserProfile({ ...profile, photoUrl: "", photoFileId: "", photoNodeUrl: "" });
      showXeenapsToast('success', 'Photo removed');
    }
    setIsUploading(false);
  };

  const photoUrl = profile.photoUrl || BRAND_ASSETS.USER_DEFAULT;

  return (
    <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-full animate-in slide-in-from-left duration-700 min-h-[600px]">
      
      {/* CARD HEADER - EXECUTIVE NAVY */}
      <div className="bg-[#004A74] px-8 py-10 relative overflow-hidden shrink-0">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 -translate-y-24 translate-x-24 rounded-full" />
         <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
               <h2 className="text-white text-xl font-black tracking-tighter uppercase leading-none">XEENAPS IDENTITY</h2>
               <p className="text-[#FED400] text-[8px] font-black uppercase tracking-[0.5em]">Academic Portfolio</p>
            </div>
            <img src={BRAND_ASSETS.LOGO_ICON} className="w-10 h-10 brightness-0 invert opacity-40" alt="Logo" />
         </div>
      </div>

      {/* CARD BODY */}
      <div className="flex-1 p-10 flex flex-col items-center justify-center space-y-10 relative">
         
         {/* PHOTO AREA - LARGER SCALE */}
         <div className="relative group">
            <div className="absolute inset-0 bg-[#FED400]/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-56 h-72 rounded-[2.5rem] p-1.5 bg-white shadow-xl border border-gray-100 overflow-hidden group">
               <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-gray-50 border border-gray-100">
                  {isUploading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#004A74]/5">
                       <Loader2 className="w-10 h-10 text-[#004A74] animate-spin mb-2" />
                       <span className="text-[8px] font-black text-[#004A74] uppercase tracking-widest">Encrypting...</span>
                    </div>
                  ) : (
                    <img src={photoUrl} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" alt="Profile" />
                  )}
               </div>

               {/* HOVER OVERLAY */}
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 bg-white text-[#004A74] rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                  >
                    <Camera size={24} />
                  </button>
                  {profile.photoUrl && (
                    <button 
                      onClick={handleDeletePhoto}
                      className="p-4 bg-red-500 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                    >
                      <Trash2 size={24} />
                    </button>
                  )}
               </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
         </div>

         {/* IDENTITY INPUTS - MERGED NAME AND DEGREE */}
         <div className="w-full space-y-2 text-center">
            <div className="space-y-1">
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] block mb-2">Member Authentication</span>
               <textarea 
                 className="w-full bg-transparent border-none text-2xl md:text-3xl font-black text-[#004A74] text-center focus:ring-0 placeholder:text-gray-100 outline-none resize-none overflow-hidden uppercase tracking-tight leading-tight"
                 defaultValue={profile.fullName}
                 onBlur={(e) => onUpdate('fullName', e.target.value)}
                 onInput={(e) => {
                   const target = e.target as HTMLTextAreaElement;
                   target.style.height = 'auto';
                   target.style.height = target.scrollHeight + 'px';
                 }}
                 placeholder="FULL NAME & DEGREE..."
                 rows={1}
               />
            </div>
         </div>

         {/* CARD FOOTER ELEMENT */}
         <div className="w-full pt-10 flex flex-col items-center gap-4 border-t border-dashed border-gray-100">
            <div className="flex items-center gap-2 px-6 py-2 bg-gray-50 rounded-full border border-gray-100">
               <ShieldCheck size={14} className="text-[#004A74]" />
               <span className="text-[10px] font-mono font-bold text-[#004A74] tracking-widest">{profile.uniqueAppId}</span>
            </div>
            <div className="flex items-center gap-3 opacity-30">
               <Sparkles size={14} className="text-[#FED400]" />
               <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#004A74]">Verified Academic Identity</span>
            </div>
         </div>

      </div>

      {/* MAGNETIC STRIP STYLE DECORATION */}
      <div className="h-4 bg-[#FED400] w-full shrink-0" />

    </div>
  );
};

export default IDCardSection;