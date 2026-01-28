import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, EducationEntry, CareerEntry } from '../../types';
import { fetchUserProfile, fetchEducationHistory, fetchCareerHistory, saveUserProfile } from '../../services/ProfileService';
import IDCardSection from './IDCardSection';
import AcademicGrid from './AcademicGrid';
import HistoryTimeline from './HistoryTimeline';
import { EducationModal, CareerModal, UniqueIdModal } from './ProfileModals';
import { 
  GraduationCap, 
  Briefcase, 
  Plus, 
  Loader2,
  Award,
  BookMarked,
  Globe,
  Link as LinkIcon
} from 'lucide-react';
import { showXeenapsToast } from '../../utils/toastUtils';
import { showXeenapsConfirm } from '../../utils/swalUtils';

const UserProfileView: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [career, setCareer] = useState<CareerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modals state
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [isUniqueIdModalOpen, setIsUniqueIdModalOpen] = useState(false);
  const [selectedEdu, setSelectedEdu] = useState<EducationEntry | undefined>();
  const [selectedCareer, setSelectedCareer] = useState<CareerEntry | undefined>();

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [p, e, c] = await Promise.all([
        fetchUserProfile(),
        fetchEducationHistory(),
        fetchCareerHistory()
      ]);
      
      const defaultProfile: UserProfile = {
        fullName: "Xeenaps User, Degree",
        photoUrl: "",
        photoFileId: "",
        photoNodeUrl: "",
        birthDate: "",
        address: "Not set",
        email: "user@xeenaps.app",
        phone: "-",
        sintaId: "",
        scopusId: "",
        wosId: "",
        googleScholarId: "",
        jobTitle: "Researcher",
        affiliation: "Independent",
        uniqueAppId: `XN-${Math.random().toString(36).substring(7).toUpperCase()}`,
        socialMedia: ""
      };

      const finalProfile = p || defaultProfile;
      setProfile(finalProfile);
      setLocalProfile(finalProfile);
      setEducation(e);
      setCareer(c);
    } catch (err) {
      showXeenapsToast('error', 'Failed to synchronize profile data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Unified Inline Update Handler
  const handleFieldUpdate = async (field: keyof UserProfile, value: string) => {
    if (!localProfile || !profile) return;
    if (localProfile[field] === value) return;

    const newProfile = { ...localProfile, [field]: value };
    setLocalProfile(newProfile);
    setIsSyncing(true);
    
    const success = await saveUserProfile(newProfile);
    if (success) {
      setProfile(newProfile);
      showXeenapsToast('success', `${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
    } else {
      setLocalProfile(profile); // Rollback
      showXeenapsToast('error', 'Cloud sync failed');
    }
    setIsSyncing(false);
  };

  const handleUniqueIdUpdate = async (newId: string) => {
    if (!localProfile) return;
    await handleFieldUpdate('uniqueAppId', newId);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10">
        <Loader2 className="w-12 h-12 text-[#004A74] animate-spin mb-4" />
        <p className="text-[10px] font-black text-[#004A74] uppercase tracking-[0.4em] animate-pulse">Syncing Identity</p>
      </div>
    );
  }

  const idCards = [
    { key: 'sintaId' as keyof UserProfile, label: 'SINTA ID', icon: Award, color: 'text-orange-500' },
    { key: 'scopusId' as keyof UserProfile, label: 'Scopus ID', icon: BookMarked, color: 'text-emerald-500' },
    { key: 'wosId' as keyof UserProfile, label: 'WoS ID', icon: Globe, color: 'text-blue-500' },
    { key: 'googleScholarId' as keyof UserProfile, label: 'Scholar ID', icon: LinkIcon, color: 'text-indigo-500' },
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfcfc] animate-in fade-in duration-700 h-full">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-32">
        
        {isSyncing && (
          <div className="fixed top-24 right-10 z-[100] flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full animate-pulse border border-emerald-100 shadow-sm">
             <Loader2 size={12} className="animate-spin" />
             <span className="text-[8px] font-black uppercase tracking-widest">Saving Changes</span>
          </div>
        )}

        {/* BLOK ATAS: 50% 50% SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="h-full">
            <IDCardSection 
              profile={localProfile!} 
              onUpdate={handleFieldUpdate}
              onPhotoChange={(url, id, node) => {
                const updated = { ...localProfile!, photoUrl: url, photoFileId: id, photoNodeUrl: node };
                setLocalProfile(updated);
                setProfile(updated);
              }}
              onEditUniqueId={() => setIsUniqueIdModalOpen(true)}
            />
          </div>

          <div className="h-full">
            <AcademicGrid 
              profile={localProfile!} 
              onUpdate={handleFieldUpdate}
            />
          </div>
        </div>

        {/* BLOK TENGAH: FULL WIDTH ACADEMIC IDS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
           <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 px-2">Academic Meta-Identifiers</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {idCards.map((id) => (
                <div key={id.key} className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 focus-within:border-[#FED400] transition-all">
                   <label className={`text-[8px] font-black uppercase tracking-tighter flex items-center gap-1.5 ${id.color}`}>
                      <id.icon size={12} /> {id.label}
                   </label>
                   <input 
                     className="w-full bg-transparent border-none p-0 text-[10px] font-mono font-bold text-[#004A74] outline-none placeholder:text-gray-200"
                     defaultValue={localProfile![id.key]}
                     onBlur={(e) => handleFieldUpdate(id.key, e.target.value)}
                     placeholder="CODE..."
                   />
                </div>
              ))}
           </div>
        </div>

        {/* BLOK BAWAH: 50% 50% HISTORY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#004A74] flex items-center gap-2">
                <GraduationCap size={18} /> Education History
              </h3>
              <button 
                onClick={() => { setSelectedEdu(undefined); setIsEduModalOpen(true); }}
                className="p-2 bg-[#004A74] text-[#FED400] rounded-xl hover:scale-110 active:scale-95 transition-all shadow-md"
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
            <HistoryTimeline 
              type="education"
              items={education}
              onEdit={(item) => { setSelectedEdu(item as EducationEntry); setIsEduModalOpen(true); }}
              onRefresh={loadAllData}
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#004A74] flex items-center gap-2">
                <Briefcase size={18} /> Career Journey
              </h3>
              <button 
                onClick={() => { setSelectedCareer(undefined); setIsCareerModalOpen(true); }}
                className="p-2 bg-[#004A74] text-[#FED400] rounded-xl hover:scale-110 active:scale-95 transition-all shadow-md"
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
            <HistoryTimeline 
              type="career"
              items={career}
              onEdit={(item) => { setSelectedCareer(item as CareerEntry); setIsCareerModalOpen(true); }}
              onRefresh={loadAllData}
            />
          </div>
        </div>

        <footer className="pt-20 pb-10 opacity-20 text-center">
          <div className="w-10 h-0.5 bg-[#004A74] mx-auto mb-4 rounded-full" />
          <p className="text-[8px] font-black text-[#004A74] uppercase tracking-[0.8em]">XEENAPS IDENTITY ECOSYSTEM</p>
        </footer>
      </div>

      {isEduModalOpen && (
        <EducationModal 
          entry={selectedEdu} 
          onClose={() => setIsEduModalOpen(false)} 
          onSuccess={loadAllData} 
        />
      )}

      {isCareerModalOpen && (
        <CareerModal 
          entry={selectedCareer} 
          onClose={() => setIsCareerModalOpen(false)} 
          onSuccess={loadAllData} 
        />
      )}

      {isUniqueIdModalOpen && (
        <UniqueIdModal 
          currentId={localProfile?.uniqueAppId || ''} 
          onClose={() => setIsUniqueIdModalOpen(false)} 
          onConfirm={handleUniqueIdUpdate} 
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default UserProfileView;