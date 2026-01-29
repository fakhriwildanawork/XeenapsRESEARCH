
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TeachingItem, SessionStatus } from '../../types';
import { fetchTeachingPaginated, deleteTeachingItem } from '../../services/TeachingService';
// Added missing Monitor icon to lucide-react imports
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen, 
  Layers, 
  FileCheck, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Monitor
} from 'lucide-react';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import { showXeenapsToast } from '../../utils/toastUtils';

const TeachingDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<TeachingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetchTeachingPaginated(1, 1000);
      const found = res.items.find(i => i.id === sessionId);
      if (found) setItem(found);
      else navigate('/teaching');
      setIsLoading(false);
    };
    load();
  }, [sessionId]);

  const handleDelete = async () => {
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed && item) {
      const success = await deleteTeachingItem(item.id);
      if (success) {
        showXeenapsToast('success', 'Session removed');
        navigate('/teaching');
      }
    }
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
      case SessionStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      case SessionStatus.RESCHEDULED: return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black text-[#004A74] uppercase tracking-widest">Loading Academic Record...</div>;
  if (!item) return null;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
      
      {/* Detail Header */}
      <header className="px-6 md:px-10 py-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 sticky top-0 z-50">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate('/teaching')} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] rounded-xl transition-all shadow-sm active:scale-90">
               <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
               <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#004A74] text-white text-[8px] font-black uppercase tracking-widest rounded-full">{item.courseCode}</span>
                  <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight truncate max-w-md">{item.courseTitle}</h2>
               </div>
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Semester {item.semester} • {item.academicYear}</p>
            </div>
         </div>

         <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(`/teaching/edit/${item.id}`)}
              className="p-3 bg-white border border-gray-100 text-[#004A74] hover:bg-blue-50 rounded-xl transition-all shadow-sm active:scale-90"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={handleDelete}
              className="p-3 bg-white border border-gray-100 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm active:scale-90"
            >
              <Trash2 size={18} />
            </button>
         </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10 pb-32">
         
         {/* IDENTITAS LOGISTIK */}
         <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
               <div className="flex items-center gap-3 text-[#FED400]">
                  <Calendar size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Schedule</span>
               </div>
               <p className="text-sm font-black text-[#004A74]">{new Date(item.teachingDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
               <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Clock size={14} /> {item.startTime} - {item.endTime}
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
               <div className="flex items-center gap-3 text-[#004A74]">
                  <MapPin size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Venue</span>
               </div>
               <p className="text-sm font-black text-[#004A74]">{item.location || '-'}</p>
               <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <Monitor size={14} /> {item.mode}
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
               <div className="flex items-center gap-3 text-green-500">
                  <ShieldCheck size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">BKD Status</span>
               </div>
               <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatusColor(item.status)}`}>
                  {item.status}
               </div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.role} ROLE</p>
            </div>
         </section>

         {/* PEDAGOGI & CONTENT */}
         <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#FED400]"><BookOpen size={24} /></div>
               <div>
                  <h3 className="text-xl font-black text-[#004A74] uppercase tracking-tighter leading-none">Pedagogical Substance</h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Teaching Plan & Resources</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Subject Matter / Topic</label>
                     <p className="text-base font-black text-[#004A74] leading-tight uppercase border-l-4 border-[#FED400] pl-4">{item.topic || 'Untitled Session'}</p>
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Teaching Method (IKU 7)</label>
                     <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-[#004A74]">
                        <Layers size={14} /> {item.method}
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Learning Outcomes (Sub-CPMK)</label>
                     <p className="text-xs font-medium text-gray-600 leading-relaxed italic">"{item.learningOutcomes || 'No outcomes defined for this session.'}"</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Library Resources</label>
                     <div className="space-y-2">
                        {item.referenceLinks.length === 0 ? (
                           <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No Library Resources Linked</p>
                        ) : item.referenceLinks.map((refId, i) => (
                           <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-xs font-bold text-[#004A74] border border-gray-100">
                              <Layers size={14} className="text-[#FED400]" />
                              <span>Librarian Asset (ID: {refId.substring(0,8)})</span>
                              <ExternalLink size={12} className="ml-auto opacity-30" />
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                     <div><label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Theory SKS</label><p className="text-sm font-black text-[#004A74]">{item.theoryCredits} JAM</p></div>
                     <div><label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Practical SKS</label><p className="text-sm font-black text-[#004A74]">{item.practicalCredits} JAM</p></div>
                  </div>
               </div>
            </div>
         </section>

         {/* REALISASI & REFLEKSI */}
         <section className="bg-[#004A74] p-10 rounded-[3rem] shadow-xl text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 -translate-y-32 translate-x-32 rounded-full" />
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#FED400]"><FileCheck size={24} /></div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Session Realization</h3>
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">Outcome & Reflection Record</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
               <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                     <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-2">Student Attendance</label>
                     <div className="flex items-end gap-3">
                        <p className="text-4xl font-black text-[#FED400]">{item.totalStudentsPresent || 0}</p>
                        <p className="text-xs font-bold text-white/60 mb-1">/ {item.plannedStudents} STUDENTS PRESENT</p>
                     </div>
                     {item.attendanceListLink && (
                        <button 
                          onClick={() => window.open(item.attendanceListLink, '_blank')}
                          className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FED400] hover:underline"
                        >
                           <ExternalLink size={14} /> Open Digital Presence List
                        </button>
                     )}
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-[#FED400]" /> Identified Obstacles
                     </label>
                     <p className="text-sm font-medium leading-relaxed opacity-80">{item.problems || 'No specific problems recorded during this session.'}</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 border-l-[6px] border-l-[#FED400]">
                     <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2 flex items-center gap-2">
                        <Lightbulb size={14} /> Lecturer Reflection
                     </label>
                     <p className="text-sm font-medium leading-relaxed italic">"{item.reflection || 'Reflection pending.'}"</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-[9px] font-black uppercase text-white/40 block mb-1">Actual Start</label><p className="text-sm font-bold text-white">{item.actualStartTime || '-'}</p></div>
                     <div><label className="text-[9px] font-black uppercase text-white/40 block mb-1">Actual End</label><p className="text-sm font-bold text-white">{item.actualEndTime || '-'}</p></div>
                  </div>
               </div>
            </div>
         </section>

         <footer className="py-10 text-center opacity-20">
            <p className="text-[8px] font-black text-[#004A74] uppercase tracking-[0.8em]">XEENAPS ACADEMIC LEDGER</p>
         </footer>

      </div>
    </div>
  );
};

export default TeachingDetail;
