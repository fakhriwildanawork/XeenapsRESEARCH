import React, { useRef, useState } from 'react';
import { UserProfile } from '../../types';
import { BRAND_ASSETS } from '../../assets';
import { Camera, Trash2, Loader2, Sparkles } from 'lucide-react';
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
    <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center animate-in slide-in-from-left duration-700">
      
      {/* PHOTO AREA */}
      <div className="relative mb-10 group">
         <div className="absolute inset-0 bg-gradient-to-tr from-[#004A74] to-[#FED400] rounded-full blur-xl opacity-10 group-hover:opacity-20 transition-opacity" />
         
         <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full p-2 bg-white shadow-2xl border border-gray-50 overflow-hidden">
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-50">
               {isUploading ? (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-[#004A74]/5">
                    <Loader2 className="w-8 h-8 text-[#004A74] animate-spin mb-2" />
                    <span className="text-[8px] font-black text-[#004A74] uppercase tracking-widest">Sharding...</span>
                 </div>
               ) : (
                 <img src={photoUrl} className="w-full h-full object-cover" alt="Profile" />
               )}
            </div>

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="p-3 bg-white text-[#004A74] rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                 title="Upload New Photo"
               >
                 <Camera size={20} />
               </button>
               {profile.photoUrl && (
                 <button 
                   onClick={handleDeletePhoto}
                   className="p-3 bg-red-500 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                   title="Delete Photo"
                 >
                   <Trash2 size={20} />
                 </button>
               )}
            </div>
         </div>
         <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
      </div>

      {/* IDENTITY INPUTS - MERGED NAME AND DEGREE */}
      <div className="w-full space-y-4 text-center">
         <div className="space-y-1">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">Full Name & Degree</span>
            <textarea 
              className="w-full bg-transparent border-none text-xl md:text-2xl font-bold text-[#004A74] text-center focus:ring-0 placeholder:text-gray-100 outline-none resize-none overflow-hidden"
              defaultValue={profile.fullName}
              onBlur={(e) => onUpdate('fullName', e.target.value)}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              placeholder="Official Name & Academic Degree..."
              rows={2}
            />
         </div>
      </div>

      <div className="mt-10 pt-6 border-t border-dashed border-gray-100 w-full flex items-center justify-center gap-3 opacity-30">
         <Sparkles size={14} className="text-[#FED400]" />
         <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#004A74]">Verified Academic Identity</span>
      </div>

    </div>
  );
};

export default IDCardSection;