
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  TeachingItem, 
  SessionMode, 
  TeachingRole, 
  SessionStatus 
} from '../../types';
import { fetchTeachingPaginated, saveTeachingItem, deleteTeachingItem } from '../../services/TeachingService';
import { 
  ArrowLeft, 
  FolderOpen, 
  Trash2, 
  Layout, 
  Layers, 
  FileCheck,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  Zap
} from 'lucide-react';
import { showXeenapsToast } from '../../utils/toastUtils';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import { FormDropdown } from '../Common/FormComponents';

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${active ? 'bg-[#004A74] text-white shadow-xl scale-105' : 'text-gray-400 hover:text-[#004A74] bg-white'}`}
  >
    <Icon size={14} /> {label}
  </button>
);

const InlineInput: React.FC<{ 
  label: string; 
  value: any; 
  onChange: (v: any) => void; 
  type?: string; 
  placeholder?: string;
  className?: string;
}> = ({ label, value, onChange, type = "text", placeholder, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{label}</label>
    <input 
      type={type}
      className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-[11px] font-bold text-[#004A74] outline-none focus:ring-4 focus:ring-[#004A74]/5 focus:border-[#004A74]/20 transition-all placeholder:text-gray-200"
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const TeachingDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [item, setItem] = useState<TeachingItem | null>(null);
  const [activeTab, setActiveTab] = useState<'logistics' | 'substance' | 'outcome'>('logistics');
  const [isLoading, setIsLoading] = useState(true);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load Data
  useEffect(() => {
    const load = async () => {
      const stateItem = (location.state as any)?.item;
      if (stateItem && stateItem.id === sessionId) {
        setItem(stateItem);
        setIsLoading(false);
        return;
      }
      const res = await fetchTeachingPaginated(1, 1000);
      const found = res.items.find(i => i.id === sessionId);
      if (found) setItem(found);
      else navigate('/teaching');
      setIsLoading(false);
    };
    load();
  }, [sessionId, location.state, navigate]);

  // Logic: Auto-calculate Duration and Attendance %
  useEffect(() => {
    if (!item) return;

    let updated = { ...item };
    let changed = false;

    // 1. Duration Calculation
    if (item.actualStartTime && item.actualEndTime) {
      const [startH, startM] = item.actualStartTime.split(':').map(Number);
      const [endH, endM] = item.actualEndTime.split(':').map(Number);
      const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      if (diffMinutes > 0) {
        const durationStr = `${diffMinutes} mins`;
        if (item.teachingDuration !== durationStr) {
          updated.teachingDuration = durationStr;
          changed = true;
        }
      }
    }

    // 2. Attendance % Calculation
    const actual = item.totalStudentsPresent || 0;
    const planned = item.plannedStudents || 0;
    let percentage = 100;
    if (planned > 0) {
      percentage = Math.round((actual / planned) * 100);
    }
    if (item.attendancePercentage !== percentage) {
      updated.attendancePercentage = percentage;
      changed = true;
    }

    if (changed) {
      setItem(updated);
    }
  }, [item?.actualStartTime, item?.actualEndTime, item?.totalStudentsPresent, item?.plannedStudents]);

  // Zen Auto-save Engine
  useEffect(() => {
    if (!item || isLoading) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await saveTeachingItem({ ...item, updatedAt: new Date().toISOString() });
    }, 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [item]);

  const handleDelete = async () => {
    if (!item) return;
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed) {
      if (await deleteTeachingItem(item.id)) {
        showXeenapsToast('success', 'Record purged');
        navigate('/teaching');
      }
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black text-[#004A74] uppercase tracking-widest">Accessing Ledger...</div>;
  if (!item) return null;

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] animate-in fade-in duration-700">
      
      {/* Header Ledger */}
      <header className="px-6 md:px-10 py-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 sticky top-0 z-[100]">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate('/teaching')} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A74] hover:bg-[#FED400]/20 rounded-xl transition-all shadow-sm active:scale-90">
               <ArrowLeft size={18} strokeWidth={3} />
            </button>
            <div>
               <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tighter">{item.label}</h2>
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Academic Performance Ledger</p>
            </div>
         </div>

         <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(`/teaching/${item.id}/vault`, { state: { item } })}
              className="p-3 bg-white border border-gray-100 text-[#004A74] hover:bg-blue-50 rounded-xl transition-all shadow-sm active:scale-90"
              title="Documentation Vault"
            >
              <FolderOpen size={18} />
            </button>
            <button 
              onClick={handleDelete}
              className="p-3 bg-white border border-gray-100 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm active:scale-90"
              title="Delete Record"
            >
              <Trash2 size={18} />
            </button>
         </div>
      </header>

      {/* Tab Navigation */}
      <div className="px-6 md:px-10 py-4 bg-white border-b border-gray-50 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
         <TabButton active={activeTab === 'logistics'} onClick={() => setActiveTab('logistics')} icon={Layout} label="1. Logistics" />
         <TabButton active={activeTab === 'substance'} onClick={() => setActiveTab('substance')} icon={Layers} label="2. Substance" />
         <TabButton active={activeTab === 'outcome'} onClick={() => setActiveTab('outcome')} icon={FileCheck} label="3. Outcome" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
        <div className="max-w-5xl mx-auto space-y-10">
           
           {/* TAB 1: LOGISTICS (PLANNING) */}
           {activeTab === 'logistics' && (
             <section className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <InlineInput label="Ledger Label" value={item.label} onChange={(v) => setItem({...item, label: v})} />
                   <InlineInput label="Date of Session" type="date" value={item.teachingDate} onChange={(v) => setItem({...item, teachingDate: v})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <InlineInput label="Start Time (Planned)" type="time" value={item.startTime} onChange={(v) => setItem({...item, startTime: v})} />
                   <InlineInput label="End Time (Planned)" type="time" value={item.endTime} onChange={(v) => setItem({...item, endTime: v})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <InlineInput label="Institution" value={item.institution} onChange={(v) => setItem({...item, institution: v})} />
                   <InlineInput label="Faculty" value={item.faculty} onChange={(v) => setItem({...item, faculty: v})} />
                   <InlineInput label="Study Program" value={item.program} onChange={(v) => setItem({...item, program: v})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Academic Year</label>
                      <FormDropdown value={item.academicYear} options={['2023/2024', '2024/2025', '2025/2026']} onChange={(v) => setItem({...item, academicYear: v})} placeholder="Year" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Semester</label>
                      <FormDropdown value={item.semester} options={['Ganjil', 'Genap', 'Antara']} onChange={(v) => setItem({...item, semester: v})} placeholder="Semester" />
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <InlineInput label="Class / Group" value={item.classGroup} onChange={(v) => setItem({...item, classGroup: v})} />
                   <InlineInput label="Meeting Number" type="number" value={item.meetingNo} onChange={(v) => setItem({...item, meetingNo: parseInt(v) || 1})} />
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Session Mode</label>
                      <FormDropdown value={item.mode} options={Object.values(SessionMode)} onChange={(v) => setItem({...item, mode: v as SessionMode})} placeholder="Mode" />
                   </div>
                   <InlineInput label="Planned Students" type="number" value={item.plannedStudents} onChange={(v) => setItem({...item, plannedStudents: parseInt(v) || 0})} />
                </div>
             </section>
           )}

           {/* TAB 2: SUBSTANCE (PREPARING) */}
           {activeTab === 'substance' && (
             <section className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <InlineInput label="Course Code" className="md:col-span-1" value={item.courseCode} onChange={(v) => setItem({...item, courseCode: v.toUpperCase()})} />
                   <InlineInput label="Full Course Title" className="md:col-span-2" value={item.courseTitle} onChange={(v) => setItem({...item, courseTitle: v})} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Learning Outcome (Sub-CPMK)</label>
                   <textarea 
                     className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[2rem] text-xs font-medium text-gray-600 leading-relaxed outline-none focus:ring-4 focus:ring-[#FED400]/5 focus:border-[#FED400]/40 min-h-[120px] resize-none"
                     value={item.learningOutcomes}
                     onChange={(e) => setItem({...item, learningOutcomes: e.target.value})}
                     placeholder="What should students achieve?"
                   />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Teaching Method (IKU 7)</label>
                      <FormDropdown value={item.method} options={['Lecture', 'Case Method', 'Team-Based Project', 'Laboratory Work']} onChange={(v) => setItem({...item, method: v})} placeholder="Method" />
                   </div>
                   <InlineInput label="Credits (SKS)" type="number" value={item.theoryCredits} onChange={(v) => setItem({...item, theoryCredits: parseFloat(v) || 0})} />
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Lecturer Role</label>
                      <FormDropdown value={item.role} options={Object.values(TeachingRole)} onChange={(v) => setItem({...item, role: v as TeachingRole})} placeholder="Role" />
                   </div>
                </div>
                
                {/* ATTACHMENT HUB */}
                <div className="p-8 bg-[#004A74]/5 rounded-[2.5rem] border border-[#004A74]/10 space-y-6">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-[#004A74] flex items-center gap-2">
                     <Zap size={14} className="text-[#FED400]" /> Integrated Resource Attachments
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#004A74] transition-all group">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={14} /> Library Item</span>
                            <Plus size={14} className="text-[#004A74]" />
                         </button>
                         <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#004A74] transition-all group">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Layers size={14} /> Presentation</span>
                            <Plus size={14} className="text-[#004A74]" />
                         </button>
                      </div>
                      <div className="space-y-3">
                         <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#004A74] transition-all group">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><FileCheck size={14} /> Question Bank</span>
                            <Plus size={14} className="text-[#004A74]" />
                         </button>
                         <InlineInput label="External Asset Link" placeholder="https://..." value={item.attachmentLink} onChange={(v) => setItem({...item, attachmentLink: v})} />
                      </div>
                   </div>
                </div>
             </section>
           )}

           {/* TAB 3: OUTCOME (REPORTING) */}
           {activeTab === 'outcome' && (
             <section className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <InlineInput label="Actual Start Time" type="time" value={item.actualStartTime} onChange={(v) => setItem({...item, actualStartTime: v})} />
                   <InlineInput label="Actual End Time" type="time" value={item.actualEndTime} onChange={(v) => setItem({...item, actualEndTime: v})} />
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Teaching Duration</label>
                      <div className="w-full px-5 py-3.5 bg-[#004A74] text-[#FED400] rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg">
                         {item.teachingDuration || '0 mins'}
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <InlineInput label="Actual Student Attendance" type="number" value={item.totalStudentsPresent} onChange={(v) => setItem({...item, totalStudentsPresent: parseInt(v) || 0})} />
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Attendance Percentage</label>
                      <div className="w-full px-5 py-3.5 bg-[#FED400] text-[#004A74] rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg">
                         {item.attendancePercentage || 0}%
                      </div>
                   </div>
                </div>
                <InlineInput label="Attendance List (Cloud Link / Drive ID)" value={item.attendanceListLink} onChange={(v) => setItem({...item, attendanceListLink: v})} />
                
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase tracking-widest text-red-400">Obstacles & Problems Encountered</label>
                   <textarea 
                     className="w-full px-6 py-4 bg-red-50/20 border border-red-100 rounded-[2rem] text-xs font-medium text-red-900 leading-relaxed outline-none focus:bg-white transition-all min-h-[100px]"
                     value={item.problems}
                     onChange={(e) => setItem({...item, problems: e.target.value})}
                     placeholder="Describe any constraints during session..."
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Lecturer Self-Reflection</label>
                   <textarea 
                     className="w-full px-6 py-4 bg-white border border-gray-100 rounded-[2rem] text-xs font-medium text-gray-600 leading-relaxed italic outline-none focus:ring-4 focus:ring-[#004A74]/5 min-h-[150px]"
                     value={item.reflection}
                     onChange={(e) => setItem({...item, reflection: e.target.value})}
                     placeholder="How can you improve the next session?"
                   />
                </div>

                <div className="pt-4 border-t border-gray-100">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Overall Session Status</label>
                      <FormDropdown value={item.status} options={Object.values(SessionStatus)} onChange={(v) => setItem({...item, status: v as SessionStatus})} placeholder="Final Status" />
                   </div>
                </div>
             </section>
           )}

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 74, 116, 0.2); }
      `}</style>
    </div>
  );
};

export default TeachingDetail;
