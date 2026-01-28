import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, EducationEntry, CareerEntry } from '../../types';
import { fetchUserProfile, fetchEducationHistory, fetchCareerHistory, saveUserProfile } from '../../services/ProfileService';
import IDCardSection from './IDCardSection';
import AcademicGrid from './AcademicGrid';
import HistoryTimeline from './HistoryTimeline';
import { EducationModal, CareerModal } from './ProfileModals';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Plus, 
  Loader2,
  ShieldCheck,
  Save
} from 'lucide-react';
import { showXeenapsToast } from '../../utils/toastUtils';
import { showXeenapsAlert, showXeenapsConfirm } from '../../utils/swalUtils';

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
        fullName: "Xeenaps User",
        photoUrl: "",
        bio: "Add your academic or professional bio here to personalize your PKM workspace.",
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
    if (localProfile[field] === value) return; // No change

    const newProfile = { ...localProfile, [field]: value };
    
    // SPECIAL CASE: Unique App ID (Double Confirmation)
    if (field === 'uniqueAppId') {
      const confirm1 = await showXeenapsConfirm(
        'CHANGE UNIQUE ID?', 
        'This ID is your primary system identity. Changing it might affect your traceability.',
        'PROCEED'
      );
      if (!confirm1.isConfirmed) {
        setLocalProfile({ ...localProfile }); // Revert local state
        return;
      }
      
      const confirm2 = await showXeenapsConfirm(
        'ARE YOU ABSOLUTELY SURE?', 
        'This is the last warning. Changing your Unique App ID is a critical system action.',
        'YES, CHANGE IT'
      );
      if (!confirm2.isConfirmed) {
        setLocalProfile({ ...localProfile }); // Revert local state
        return;
      }
    }

    setLocalProfile(newProfile);
    setIsSyncing(true);
    
    const success = await saveUserProfile(newProfile);
    if (success) {
      setProfile(newProfile);
      showXeenapsToast('success', `${field.charAt(0).toUpperCase() + field.slice(1)} synchronized`);
    } else {
      setLocalProfile(profile); // Rollback
      showXeenapsToast('error', 'Cloud sync failed');
    }
    setIsSyncing(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10">
        <Loader2 className="w-12 h-12 text-[#004A74] animate-spin mb-4" />
        <p className="text-[10px] font-black text-[#004A74] uppercase tracking-[0.4em] animate-pulse">Syncing Identity</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] animate-in fade-in duration-700 h-full">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-32">
        
        {/* HEADER SECTION (HUD STYLE) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#004A74] uppercase tracking-tighter">My Identity</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Personal & Academic Portfolio</p>
            </div>
          </div>
          {isSyncing && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full animate-pulse border border-emerald-100">
               <Loader2 size={12} className="animate-spin" />
               <span className="text-[8px] font-black uppercase tracking-widest">Syncing to Cloud</span>
            </div>
          )}
        </div>

        {/* TOP GRID: ID Card & Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 xl:col-span-4">
            <IDCardSection 
              profile={localProfile!} 
              onUpdate={handleFieldUpdate}
            />
          </div>
          <div className="lg:col-span-7 xl:col-span-8 h-full">
            <AcademicGrid 
              profile={localProfile!} 
              onUpdate={handleFieldUpdate}
            />
          </div>
        </div>

        {/* BOTTOM GRID: History Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          
          {/* Education Section */}
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

          {/* Career Section */}
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
          <p className="text-[8px] font-black text-[#004A74] uppercase tracking-[0.8em]">XEENAPS PROFILE INFRASTRUCTURE</p>
        </footer>
      </div>

      {/* Modals for List Entries */}
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default UserProfileView;