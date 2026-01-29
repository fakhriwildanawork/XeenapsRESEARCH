
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  TeachingItem, 
  SessionMode, 
  TeachingRole, 
  SessionStatus,
  CourseType,
  EducationLevel,
  AssignmentType
} from '../../types';
import { fetchTeachingPaginated, saveTeachingItem, deleteTeachingItem } from '../../services/TeachingService';
import { 
  ArrowLeft, 
  FolderOpen, 
  Trash2, 
  Calendar, 
  Clock, 
  BookOpen, 
  ClipboardCheck, 
  MapPin,
  Users,
  Plus,
  Trash2 as TrashIcon,
  Layers,
  FileText,
  Presentation,
  GraduationCap,
  Link as LinkIcon,
  ChevronRight,
  ExternalLink,
  Zap,
  Save
} from 'lucide-react';
import { 
  FormPageContainer, 
  FormStickyHeader, 
  FormContentArea, 
  FormField, 
  FormDropdown 
} from '../Common/FormComponents';
import { showXeenapsToast } from '../../utils/toastUtils';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import ResourcePicker, { PickerType } from './ResourcePicker';
import Swal from 'sweetalert2';
import { XEENAPS_SWAL_CONFIG } from '../../utils/swalUtils';

const TeachingDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [item, setItem] = useState<TeachingItem | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'substance' | 'report'>('schedule');
  const [isLoading, setIsLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<PickerType>('LIBRARY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      const stateItem = (location.state as any)?.item;
      if (stateItem && stateItem.id === sessionId) {
        setItem({
          ...stateItem,
          presentationIds: stateItem.presentationIds || [],
          questionBankIds: stateItem.questionBankIds || [],
          externalLinks: stateItem.externalLinks || []
        });
        setIsLoading(false);
        return;
      }
      const res = await fetchTeachingPaginated(1, 1000);
      const found = res.items.find(i => i.id === sessionId);
      if (found) {
        setItem({
          ...found,
          presentationIds: found.presentationIds || [],
          questionBankIds: found.questionBankIds || [],
          externalLinks: found.externalLinks || []
        });
      } else navigate('/teaching');
      setIsLoading(false);
    };
    load();
  }, [sessionId, location.state, navigate]);

  const handleFieldChange = (field: keyof TeachingItem, val: any) => {
    if (!item) return;
    const updated = { ...item, [field]: val, updatedAt: new Date().toISOString() };
    setItem(updated);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await saveTeachingItem(updated);
    }, 1500);
  };

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

  const handleAddExternalLink = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'ADD EXTERNAL LINK',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Link Label (e.g. Video Case)">' +
        '<input id="swal-input2" class="swal2-input" placeholder="URL (https://...)">',
      focusConfirm: false,
      ...XEENAPS_SWAL_CONFIG,
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement).value,
          (document.getElementById('swal-input2') as HTMLInputElement).value
        ]
      }
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newLinks = [...(item?.externalLinks || []), { label: formValues[0], url: formValues[1] }];
      handleFieldChange('externalLinks', newLinks);
    }
  };

  const openPicker = (type: PickerType) => {
    setPickerType(type);
    setIsPickerOpen(true);
  };

  const handleResourceSelect = (id: string) => {
    if (!item) return;
    if (pickerType === 'LIBRARY') {
      if (!item.referenceLinks.includes(id)) {
        handleFieldChange('referenceLinks', [...item.referenceLinks, id]);
      }
    } else if (pickerType === 'PRESENTATION') {
      if (!item.presentationIds.includes(id)) {
        handleFieldChange('presentationIds', [...item.presentationIds, id]);
      }
    } else if (pickerType === 'QUESTION') {
      if (!item.questionBankIds.includes(id)) {
        handleFieldChange('questionBankIds', [...item.questionBankIds, id]);
      }
    }
    setIsPickerOpen(false);
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black text-[#004A74] uppercase tracking-widest">Accessing Ledger...</div>;
  if (!item) return null;

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'substance', label: 'Substance', icon: BookOpen },
    { id: 'report', label: 'Report', icon: ClipboardCheck }
  ];

  return (
    <FormPageContainer>
      <FormStickyHeader 
        title={item.label} 
        subtitle="Teaching Performance Ledger" 
        onBack={() => navigate('/teaching')}
        rightElement={
          <div className="flex bg-gray-50 p-1.5 rounded-2xl gap-1 mx-auto lg:mx-0">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#004A74] text-white shadow-lg' : 'text-gray-400 hover:text-[#004A74]'}`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        }
      />

      <FormContentArea>
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* TAB 1: SCHEDULE (PLANNING) */}
          {activeTab === 'schedule' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <FormField label="Ledger Identity / Session Label" required>
                 <input className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-black text-[#004A74] uppercase transition-all focus:bg-white focus:ring-4 focus:ring-[#004A74]/5" 
                   value={item.label} onChange={e => handleFieldChange('label', e.target.value)} />
               </FormField>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="Session Date" required>
                    <input type="date" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={item.teachingDate} onChange={e => handleFieldChange('teachingDate', e.target.value)} />
                  </FormField>
                  <FormField label="Start Time" required>
                    <input type="time" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={item.startTime} onChange={e => handleFieldChange('startTime', e.target.value)} />
                  </FormField>
                  <FormField label="End Time" required>
                    <input type="time" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={item.endTime} onChange={e => handleFieldChange('endTime', e.target.value)} />
                  </FormField>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="Institution">
                    <input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={item.institution} onChange={e => handleFieldChange('institution', e.target.value)} placeholder="e.g. Universitas Indonesia" />
                  </FormField>
                  <FormField label="Faculty">
                    <input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={item.faculty} onChange={e => handleFieldChange('faculty', e.target.value)} placeholder="e.g. Teknik" />
                  </FormField>
                  <FormField label="Study Program">
                    <input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={item.program} onChange={e => handleFieldChange('program', e.target.value)} placeholder="e.g. Arsitektur" />
                  </FormField>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="Academic Year">
                    <FormDropdown value={item.academicYear} options={[`${new Date().getFullYear()-1}/${new Date().getFullYear()}`, `${new Date().getFullYear()}/${new Date().getFullYear()+1}`]} onChange={v => handleFieldChange('academicYear', v)} placeholder="Year" />
                  </FormField>
                  <FormField label="Semester (Numeric)">
                    <FormDropdown value={item.semester} options={['1','2','3','4','5','6','7','8','Short Session']} onChange={v => handleFieldChange('semester', v)} placeholder="Semester" />
                  </FormField>
                  <FormField label="Class / Group">
                    <input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={item.classGroup} onChange={e => handleFieldChange('classGroup', e.target.value)} placeholder="e.g. AR-A" />
                  </FormField>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="Meeting Number">
                    <input type="number" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center" value={item.meetingNo} onChange={e => handleFieldChange('meetingNo', parseInt(e.target.value) || 1)} />
                  </FormField>
                  <FormField label="Session Mode">
                    <FormDropdown value={item.mode} options={Object.values(SessionMode)} onChange={v => handleFieldChange('mode', v as SessionMode)} placeholder="Mode" />
                  </FormField>
                  <FormField label="Planned Students">
                    <input type="number" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center" value={item.plannedStudents} onChange={e => handleFieldChange('plannedStudents', parseInt(e.target.value) || 0)} />
                  </FormField>
               </div>

               <FormField label="Location / Room / Venue">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-[#004A74]" value={item.location} onChange={e => handleFieldChange('location', e.target.value)} placeholder="Room name or Zoom link..." />
                  </div>
               </FormField>
            </div>
          )}

          {/* TAB 2: SUBSTANCE (PREPARING) */}
          {activeTab === 'substance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Course Code" required>
                    <input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold uppercase" value={item.courseCode} onChange={e => handleFieldChange('courseCode', e.target.value.toUpperCase())} placeholder="e.g. AR123" />
                  </FormField>
                  <FormField label="Full Course Title" required>
                    <input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={item.courseTitle} onChange={e => handleFieldChange('courseTitle', e.target.value)} placeholder="e.g. Architectural Design" />
                  </FormField>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormField label="Theory SKS"><input type="number" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center" value={item.theoryCredits} onChange={e => handleFieldChange('theoryCredits', parseFloat(e.target.value) || 0)} /></FormField>
                  <FormField label="Practical SKS"><input type="number" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center" value={item.practicalCredits} onChange={e => handleFieldChange('practicalCredits', parseFloat(e.target.value) || 0)} /></FormField>
                  <FormField label="Course Type"><FormDropdown value={item.courseType} options={Object.values(CourseType)} onChange={v => handleFieldChange('courseType', v as CourseType)} placeholder="Type" /></FormField>
                  <FormField label="Education Level"><FormDropdown value={item.educationLevel} options={Object.values(EducationLevel)} onChange={v => handleFieldChange('educationLevel', v as EducationLevel)} placeholder="Level" /></FormField>
               </div>

               <FormField label="Planned Topic / Subject Matter" required>
                  <input className="w-full px-5 py-4 bg-[#004A74]/5 border border-[#004A74]/10 rounded-2xl text-base font-bold text-[#004A74] uppercase" value={item.topic} onChange={e => handleFieldChange('topic', e.target.value)} placeholder="WHAT ARE YOU TEACHING TODAY?" />
               </FormField>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Teaching Method (IKU-7 Compliance)">
                    <FormDropdown value={item.method} options={['Lecture', 'Case Method', 'Team-Based Project', 'Discussion', 'Laboratory Work']} onChange={v => handleFieldChange('method', v)} placeholder="Method" />
                  </FormField>
                  <FormField label="Lecturer Assigned Role">
                    <FormDropdown value={item.role} options={Object.values(TeachingRole)} onChange={v => handleFieldChange('role', v as TeachingRole)} placeholder="Role" />
                  </FormField>
               </div>

               <FormField label="Learning Outcomes (Sub-CPMK)">
                  <textarea className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-[2rem] text-xs font-medium min-h-[120px] leading-relaxed" value={item.learningOutcomes} onChange={e => handleFieldChange('learningOutcomes', e.target.value)} placeholder="What should students achieve after this session?" />
               </FormField>

               {/* ATTACHMENT HUB - 4 COLUMN GRID */}
               <div className="space-y-4 pt-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004A74] flex items-center gap-2">
                     <Zap size={14} className="text-[#FED400] fill-[#FED400]" /> Integrated Resource Attachments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     {/* Column 1: Library */}
                     <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm flex flex-col min-h-[250px]">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><BookOpen size={12} /> Library</span>
                           <button onClick={() => openPicker('LIBRARY')} className="p-1.5 bg-[#004A74]/5 text-[#004A74] rounded-lg hover:bg-[#004A74] hover:text-white transition-all"><Plus size={14} /></button>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[180px] pr-1 custom-scrollbar">
                           {item.referenceLinks.length === 0 ? <p className="text-[8px] font-bold text-gray-300 uppercase italic py-10 text-center">No Library Items</p> : 
                             item.referenceLinks.map(id => (
                               <div key={id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-xl group">
                                  <span className="text-[8px] font-bold text-[#004A74] truncate">ID: {id.substring(0, 8)}...</span>
                                  <button onClick={() => handleFieldChange('referenceLinks', item.referenceLinks.filter(i => i !== id))} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"><TrashIcon size={12} /></button>
                               </div>
                             ))
                           }
                        </div>
                     </div>

                     {/* Column 2: Presentations */}
                     <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm flex flex-col min-h-[250px]">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><Presentation size={12} /> Slides</span>
                           <button onClick={() => openPicker('PRESENTATION')} className="p-1.5 bg-[#004A74]/5 text-[#004A74] rounded-lg hover:bg-[#004A74] hover:text-white transition-all"><Plus size={14} /></button>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[180px] pr-1 custom-scrollbar">
                           {item.presentationIds.length === 0 ? <p className="text-[8px] font-bold text-gray-300 uppercase italic py-10 text-center">No Slides Attached</p> : 
                             item.presentationIds.map(id => (
                               <div key={id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-xl group">
                                  <span className="text-[8px] font-bold text-[#004A74] truncate">Slide ID: {id.substring(0, 8)}</span>
                                  <button onClick={() => handleFieldChange('presentationIds', item.presentationIds.filter(i => i !== id))} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"><TrashIcon size={12} /></button>
                               </div>
                             ))
                           }
                        </div>
                     </div>

                     {/* Column 3: Questions */}
                     <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm flex flex-col min-h-[250px]">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><GraduationCap size={12} /> Questions</span>
                           <button onClick={() => openPicker('QUESTION')} className="p-1.5 bg-[#004A74]/5 text-[#004A74] rounded-lg hover:bg-[#004A74] hover:text-white transition-all"><Plus size={14} /></button>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[180px] pr-1 custom-scrollbar">
                           {item.questionBankIds.length === 0 ? <p className="text-[8px] font-bold text-gray-300 uppercase italic py-10 text-center">No Question Bank</p> : 
                             item.questionBankIds.map(id => (
                               <div key={id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-xl group">
                                  <span className="text-[8px] font-bold text-[#004A74] truncate">Q-ID: {id.substring(0, 8)}</span>
                                  <button onClick={() => handleFieldChange('questionBankIds', item.questionBankIds.filter(i => i !== id))} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"><TrashIcon size={12} /></button>
                               </div>
                             ))
                           }
                        </div>
                     </div>

                     {/* Column 4: External Links */}
                     <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm flex flex-col min-h-[250px]">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><LinkIcon size={12} /> External</span>
                           <button onClick={handleAddExternalLink} className="p-1.5 bg-[#004A74]/5 text-[#004A74] rounded-lg hover:bg-[#004A74] hover:text-white transition-all"><Plus size={14} /></button>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[180px] pr-1 custom-scrollbar">
                           {item.externalLinks.length === 0 ? <p className="text-[8px] font-bold text-gray-300 uppercase italic py-10 text-center">No External Links</p> : 
                             item.externalLinks.map((link, idx) => (
                               <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-xl group">
                                  <a href={link.url} target="_blank" rel="noreferrer" className="text-[8px] font-bold text-blue-600 truncate hover:underline flex items-center gap-1">
                                    {link.label} <ExternalLink size={8} />
                                  </a>
                                  <button onClick={() => handleFieldChange('externalLinks', item.externalLinks.filter((_, i) => i !== idx))} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"><TrashIcon size={12} /></button>
                               </div>
                             ))
                           }
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* TAB 3: REPORT (REPORTING) */}
          {activeTab === 'report' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Actual Student Attendance">
                    <input type="number" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center" value={item.totalStudentsPresent} onChange={e => handleFieldChange('totalStudentsPresent', parseInt(e.target.value) || 0)} />
                  </FormField>
                  <FormField label="Session Realization Status">
                    <FormDropdown value={item.status} options={Object.values(SessionStatus)} onChange={v => handleFieldChange('status', v as SessionStatus)} placeholder="Status" />
                  </FormField>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Actual Start Time"><input type="time" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={item.actualStartTime} onChange={e => handleFieldChange('actualStartTime', e.target.value)} /></FormField>
                  <FormField label="Actual End Time"><input type="time" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={item.actualEndTime} onChange={e => handleFieldChange('actualEndTime', e.target.value)} /></FormField>
               </div>

               <FormField label="Attendance List (Link/ID)">
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-blue-500 underline" value={item.attendanceListLink} onChange={e => handleFieldChange('attendanceListLink', e.target.value)} placeholder="Google Sheet or Drive Folder Link..." />
                  </div>
               </FormField>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  <FormField label="Assignment Plan">
                    <FormDropdown value={item.assignmentType} options={Object.values(AssignmentType)} onChange={v => handleFieldChange('assignmentType', v as AssignmentType)} placeholder="Assignment" />
                  </FormField>
                  <FormField label="Assessment Criteria">
                    <input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold" value={item.assessmentCriteria} onChange={e => handleFieldChange('assessmentCriteria', e.target.value)} placeholder="e.g. rubrics, accuracy..." />
                  </FormField>
               </div>

               <FormField label="Obstacles & Problems (BKD Requirement)">
                  <textarea className="w-full px-6 py-4 bg-red-50/30 border border-red-100 rounded-[2rem] text-xs font-medium min-h-[100px] leading-relaxed" value={item.problems} onChange={e => handleFieldChange('problems', e.target.value)} placeholder="Describe constraints (Projector fail, Connection, etc.)..." />
               </FormField>

               <FormField label="Lecturer Self-Reflection">
                  <textarea className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-[2rem] text-xs font-medium min-h-[150px] leading-relaxed italic" value={item.reflection} onChange={e => handleFieldChange('reflection', e.target.value)} placeholder="How to improve next session?" />
               </FormField>
            </div>
          )}

        </div>
      </FormContentArea>

      {isPickerOpen && (
        <ResourcePicker 
          type={pickerType}
          onClose={() => setIsPickerOpen(false)}
          onSelect={handleResourceSelect}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 74, 116, 0.2); }
      `}</style>
    </FormPageContainer>
  );
};

export default TeachingDetail;
