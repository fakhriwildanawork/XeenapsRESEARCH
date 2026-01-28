import React from 'react';
import { UserProfile } from '../../types';
import { 
  Quote, 
  ExternalLink, 
  Globe, 
  BookMarked, 
  Award,
  Link as LinkIcon
} from 'lucide-react';

interface AcademicGridProps {
  profile: UserProfile;
  onUpdate: (field: keyof UserProfile, value: string) => void;
}

const AcademicGrid: React.FC<AcademicGridProps> = ({ profile, onUpdate }) => {
  
  const ids = [
    { 
      key: 'sintaId' as keyof UserProfile, 
      label: 'SINTA ID', 
      value: profile.sintaId, 
      icon: Award, 
      color: 'bg-orange-50 text-orange-600 border-orange-100', 
      link: `https://sinta.kemdikbud.go.id/authors/profile/${profile.sintaId}` 
    },
    { 
      key: 'scopusId' as keyof UserProfile, 
      label: 'Scopus ID', 
      value: profile.scopusId, 
      icon: BookMarked, 
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100', 
      link: `https://www.scopus.com/authid/detail.uri?authorId=${profile.scopusId}` 
    },
    { 
      key: 'wosId' as keyof UserProfile, 
      label: 'WoS ID', 
      value: profile.wosId, 
      icon: Globe, 
      color: 'bg-blue-50 text-blue-600 border-blue-100', 
      link: `https://www.webofscience.com/wos/author/record/${profile.wosId}` 
    },
    { 
      key: 'googleScholarId' as keyof UserProfile, 
      label: 'Google Scholar', 
      value: profile.googleScholarId, 
      icon: LinkIcon, 
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100', 
      link: `https://scholar.google.com/citations?user=${profile.googleScholarId}` 
    },
  ];

  return (
    <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right duration-1000">
      
      {/* BIO CARD - INLINE EDITABLE */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden flex-1 group">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-700">
            <Quote size={80} />
         </div>
         <div className="relative z-10 h-full flex flex-col space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Personal Narrative</h3>
            <textarea 
              className="flex-1 w-full bg-transparent border-none text-sm md:text-base font-medium text-gray-600 leading-relaxed italic outline-none focus:ring-4 focus:ring-[#FED400]/5 rounded-[2rem] p-4 transition-all resize-none placeholder:text-gray-200"
              defaultValue={profile.bio}
              onBlur={(e) => onUpdate('bio', e.target.value)}
              placeholder="Enter your professional story or academic bio here..."
            />
         </div>
      </div>

      {/* ACADEMIC IDS GRID - INLINE EDITABLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ids.map((id, idx) => (
          <div 
            key={idx}
            className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col justify-between group bg-white border-gray-100 hover:shadow-lg hover:border-[#FED400]/30`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${id.color} shadow-sm border`}>
                <id.icon size={20} />
              </div>
              {id.value && (
                <button 
                  onClick={() => window.open(id.link, '_blank')}
                  className="p-2 text-gray-300 hover:text-[#004A74] transition-all"
                >
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{id.label}</h4>
              <input 
                className="w-full bg-transparent border-none text-xs font-black text-[#004A74] outline-none focus:text-blue-600 transition-colors placeholder:text-gray-100"
                defaultValue={id.value}
                onBlur={(e) => onUpdate(id.key, e.target.value)}
                placeholder="ID CODE..."
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AcademicGrid;