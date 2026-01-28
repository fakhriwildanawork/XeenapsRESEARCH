import React from 'react';
import { UserProfile } from '../../types';
import { 
  Quote, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Briefcase, 
  Building2, 
  Award, 
  BookMarked, 
  Calendar,
  ShieldCheck,
  Edit3,
  Share2,
  Link as LinkIcon
} from 'lucide-react';
import { showXeenapsConfirm } from '../../utils/swalUtils';

interface AcademicGridProps {
  profile: UserProfile;
  onUpdate: (field: keyof UserProfile, value: string) => void;
  onEditUniqueId: () => void;
}

const AcademicGrid: React.FC<AcademicGridProps> = ({ profile, onUpdate, onEditUniqueId }) => {
  
  const calculateAge = (dob: string) => {
    if (!dob) return "-";
    try {
      const birth = new Date(dob);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      let days = now.getDate() - birth.getDate();
      
      if (days < 0) {
        months--;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }
      return `${years} Years, ${months} Months, ${days} Days`;
    } catch (e) {
      return "-";
    }
  };

  const handleUniqueIdRequest = async () => {
    const confirm = await showXeenapsConfirm(
      'MODIFY SYSTEM IDENTITY?', 
      'Changing your Unique App ID is a critical action that may affect system traceability. Proceed to edit?',
      'AUTHORIZE EDIT'
    );
    if (confirm.isConfirmed) {
      onEditUniqueId();
    }
  };

  const idCards = [
    { key: 'sintaId' as keyof UserProfile, label: 'SINTA ID', icon: Award, color: 'text-orange-500' },
    { key: 'scopusId' as keyof UserProfile, label: 'Scopus ID', icon: BookMarked, color: 'text-emerald-500' },
    { key: 'wosId' as keyof UserProfile, label: 'WoS ID', icon: Globe, color: 'text-blue-500' },
    { key: 'googleScholarId' as keyof UserProfile, label: 'Scholar ID', icon: LinkIcon, color: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-1000">
      
      {/* NARRATIVE BIO */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
         <Quote size={48} className="absolute top-6 right-8 opacity-5 text-[#004A74]" />
         <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4">Personal Narrative</h3>
         <textarea 
            className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-600 leading-relaxed italic resize-none focus:ring-4 focus:ring-[#FED400]/5 rounded-2xl p-2 transition-all"
            defaultValue={profile.bio}
            onBlur={(e) => onUpdate('bio', e.target.value)}
            placeholder="Introduce your academic focus or professional journey here..."
            rows={3}
         />
      </div>

      {/* DATA HUB FORM */}
      <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            
            {/* DOB & AGE */}
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Calendar size={14} className="text-[#FED400]" /> Date of Birth
                  </label>
                  <input 
                    type="date"
                    className="w-full bg-gray-50 border border-gray-100 px-5 py-3.5 rounded-2xl text-xs font-bold text-[#004A74] outline-none focus:bg-white focus:border-[#FED400] transition-all"
                    defaultValue={profile.birthDate}
                    onBlur={(e) => onUpdate('birthDate', e.target.value)}
                  />
               </div>
               <div className="p-4 bg-[#004A74]/5 rounded-2xl border border-[#004A74]/10">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Actual Age</span>
                  <p className="text-sm font-black text-[#004A74]">{calculateAge(profile.birthDate)}</p>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <MapPin size={14} /> Public Address
                  </label>
                  <input 
                    className="w-full bg-gray-50 border border-gray-100 px-5 py-3.5 rounded-2xl text-xs font-bold text-[#004A74] outline-none focus:bg-white focus:border-[#FED400] transition-all"
                    defaultValue={profile.address}
                    onBlur={(e) => onUpdate('address', e.target.value)}
                    placeholder="City, Country..."
                  />
               </div>
            </div>

            {/* CONTACT & JOB */}
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                       <Mail size={14} /> Email
                     </label>
                     <input 
                       className="w-full bg-gray-50 border border-gray-100 px-5 py-3.5 rounded-2xl text-[11px] font-bold text-[#004A74] outline-none focus:bg-white transition-all"
                       defaultValue={profile.email}
                       onBlur={(e) => onUpdate('email', e.target.value)}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                       <Phone size={14} /> WhatsApp
                     </label>
                     <input 
                       className="w-full bg-gray-50 border border-gray-100 px-5 py-3.5 rounded-2xl text-[11px] font-bold text-[#004A74] outline-none focus:bg-white transition-all"
                       defaultValue={profile.phone}
                       onBlur={(e) => onUpdate('phone', e.target.value)}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Share2 size={14} /> Social Media Handle
                  </label>
                  <input 
                    className="w-full bg-gray-50 border border-gray-100 px-5 py-3.5 rounded-2xl text-[11px] font-bold text-[#004A74] outline-none focus:bg-white transition-all"
                    defaultValue={profile.socialMedia}
                    onBlur={(e) => onUpdate('socialMedia', e.target.value)}
                    placeholder="@username or profile link..."
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Briefcase size={14} /> Job Title
                  </label>
                  <input 
                    className="w-full bg-gray-50 border border-gray-100 px-5 py-3.5 rounded-2xl text-xs font-bold text-[#004A74] outline-none focus:bg-white transition-all"
                    defaultValue={profile.jobTitle}
                    onBlur={(e) => onUpdate('jobTitle', e.target.value)}
                    placeholder="Researcher, Professor, etc..."
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Building2 size={14} /> Recent Affiliation
                  </label>
                  <input 
                    className="w-full bg-gray-50 border border-gray-100 px-5 py-3.5 rounded-2xl text-xs font-bold text-[#004A74] outline-none focus:bg-white transition-all"
                    defaultValue={profile.affiliation}
                    onBlur={(e) => onUpdate('affiliation', e.target.value)}
                    placeholder="University or Company name..."
                  />
               </div>
            </div>

         </div>

         {/* SECTION: ACADEMIC IDS & SYSTEM */}
         <div className="pt-10 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* UNIQUE ID (LOCKED BY DEFAULT) */}
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                    <ShieldCheck size={14} /> Unique App ID
                  </label>
                  <button 
                    onClick={handleUniqueIdRequest}
                    className="p-1 text-gray-300 hover:text-red-400 transition-all"
                  >
                    <Edit3 size={12} />
                  </button>
               </div>
               <div className="w-full bg-red-50/20 border border-red-100 px-5 py-3.5 rounded-2xl text-xs font-mono font-bold text-gray-400 select-none">
                  {profile.uniqueAppId}
               </div>
            </div>

            {/* IDS GRID */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
               {idCards.map((id) => (
                 <div key={id.key} className="space-y-2">
                    <label className={`text-[8px] font-black uppercase tracking-tighter flex items-center gap-1.5 ${id.color}`}>
                       <id.icon size={12} /> {id.label}
                    </label>
                    <input 
                      className="w-full bg-gray-50 border border-gray-100 px-3 py-3 rounded-xl text-[10px] font-mono font-bold text-[#004A74] outline-none focus:bg-white focus:border-[#FED400] transition-all"
                      defaultValue={profile[id.key]}
                      onBlur={(e) => onUpdate(id.key, e.target.value)}
                      placeholder="CODE..."
                    />
                 </div>
               ))}
            </div>
         </div>

      </div>

    </div>
  );
};

export default AcademicGrid;