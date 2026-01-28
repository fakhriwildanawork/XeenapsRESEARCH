import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, EducationEntry, CareerEntry } from '../../types';
import { fetchUserProfile, fetchEducationHistory, fetchCareerHistory } from '../../services/ProfileService';
import IDCardSection from './IDCardSection';
import AcademicGrid from './AcademicGrid';
import HistoryTimeline from './HistoryTimeline';
import { EditProfileModal, EducationModal, CareerModal } from './ProfileModals';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Plus, 
  Settings2,
  Loader2,
  Sparkles
} from 'lucide-react';
import { showXeenapsToast } from '../../utils/toastUtils';

const UserProfileView: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [career, setCareer] = useState<CareerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
      setProfile(p);
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

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10">
        <Loader2 className="w-12 h-12 text-[#004A74] animate-spin mb-4" />
        <p className="text-[10px] font-black text-[#004A74] uppercase tracking-[0.4em] animate-pulse">Syncing Identity</p>
      </div>
    );
  }

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
    googleScholarId: ""
  };

  const activeProfile = profile || defaultProfile;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-32">
        
        {/* HEADER SECTION (HUD STYLE) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#004A74] uppercase tracking-tighter">My Identity</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Personal & Academic Portfolio</p>
            </div>
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 text-[#004A74] hover:bg-[#FED400]/20 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border border-gray-100 shadow-sm"
          >
            <Settings2 size={16} /> Edit Profile
          </button>
        </div>

        {/* TOP GRID: ID Card & Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 xl:col-span-4">
            <IDCardSection profile={activeProfile} />
          </div>
          <div className="lg:col-span-7 xl:col-span-8">
            <AcademicGrid profile={activeProfile} />
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

      {/* Modals */}
      {isProfileModalOpen && (
        <EditProfileModal 
          profile={activeProfile} 
          onClose={() => setIsProfileModalOpen(false)} 
          onSuccess={loadAllData} 
        />
      )}
      
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