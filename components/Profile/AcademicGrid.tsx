import React from 'react';
import { UserProfile } from '../../types';
import { 
  Quote, 
  ExternalLink, 
  Linkedin, 
  Globe, 
  BookMarked, 
  Award,
  Link as LinkIcon
} from 'lucide-react';

interface AcademicGridProps {
  profile: UserProfile;
}

const AcademicGrid: React.FC<AcademicGridProps> = ({ profile }) => {
  
  const ids = [
    { label: 'SINTA ID', value: profile.sintaId, icon: Award, color: 'bg-orange-50 text-orange-600 border-orange-100', link: `https://sinta.kemdikbud.go.id/authors/profile/${profile.sintaId}` },
    { label: 'Scopus ID', value: profile.scopusId, icon: BookMarked, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', link: `https://www.scopus.com/authid/detail.uri?authorId=${profile.scopusId}` },
    { label: 'WoS ID', value: profile.wosId, icon: Globe, color: 'bg-blue-50 text-blue-600 border-blue-100', link: `https://www.webofscience.com/wos/author/record/${profile.wosId}` },
    { label: 'Google Scholar', value: profile.googleScholarId, icon: LinkIcon, color: 'bg-indigo-50 text-indigo-600 border-indigo-100', link: `https://scholar.google.com/citations?user=${profile.googleScholarId}` },
  ];

  return (
    <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right duration-1000">
      
      {/* BIO CARD */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden flex-1 group">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-700">
            <Quote size={80} />
         </div>
         <div className="relative z-10 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Personal Narrative</h3>
            <p className="text-sm md:text-base font-medium text-gray-600 leading-relaxed italic pr-4">
              "{profile.bio || 'Enter your professional story or academic bio in the profile settings.'}"
            </p>
         </div>
      </div>

      {/* ACADEMIC IDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ids.map((id, idx) => (
          <div 
            key={idx}
            onClick={() => id.value && window.open(id.link, '_blank')}
            className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col justify-between group ${id.value ? `cursor-pointer ${id.color} hover:shadow-lg hover:-translate-y-1` : 'bg-white border-gray-100 grayscale opacity-40'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl bg-white shadow-sm`}>
                <id.icon size={20} />
              </div>
              {id.value && <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{id.label}</h4>
              <p className="text-xs font-black truncate">{id.value || 'Not registered'}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AcademicGrid;