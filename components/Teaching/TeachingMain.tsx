
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { TeachingItem, SessionStatus, SessionMode, TeachingRole, CourseType, EducationLevel, AssignmentType } from '../../types';
import { fetchTeachingPaginated, deleteTeachingItem, saveTeachingItem } from '../../services/TeachingService';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  School,
  ChevronRight,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import { SmartSearchBox } from '../Common/SearchComponents';
import { StandardPrimaryButton } from '../Common/ButtonComponents';
import { CardGridSkeleton } from '../Common/LoadingComponents';
import { useAsyncWorkflow } from '../../hooks/useAsyncWorkflow';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import { showXeenapsToast } from '../../utils/toastUtils';
import TeachingDetail from './TeachingDetail';
import TeachingVault from './TeachingVault';
import Swal from 'sweetalert2';
import { XEENAPS_SWAL_CONFIG } from '../../utils/swalUtils';

const TeachingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const workflow = useAsyncWorkflow(30000);
  
  const [items, setItems] = useState<TeachingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const itemsPerPage = 12;

  const loadData = useCallback(() => {
    workflow.execute(
      async (signal) => {
        setIsLoading(true);
        const result = await fetchTeachingPaginated(currentPage, itemsPerPage, appliedSearch, "", signal);
        setItems(result.items);
        setTotalCount(result.totalCount);
      },
      () => setIsLoading(false),
      () => setIsLoading(false)
    );
  }, [currentPage, appliedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNew = async () => {
    const { value: label } = await Swal.fire({
      title: 'NEW TEACHING LOG',
      input: 'text',
      inputLabel: 'Session Label / Period',
      inputPlaceholder: 'e.g., Pertemuan 1 - Arsitektur Dasar...',
      showCancelButton: true,
      confirmButtonText: 'INITIALIZE',
      ...XEENAPS_SWAL_CONFIG,
      inputValidator: (value) => {
        if (!value) return 'Label is mandatory!';
        return null;
      }
    });

    if (label) {
      const id = crypto.randomUUID();
      const newItem: TeachingItem = {
        id,
        label,
        teachingDate: new Date().toISOString().substring(0, 10),
        startTime: '08:00',
        endTime: '10:00',
        institution: '',
        faculty: '',
        program: '',
        academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        semester: '1',
        classGroup: '',
        meetingNo: 1,
        mode: SessionMode.OFFLINE,
        plannedStudents: 0,
        location: '',
        courseTitle: '',
        courseCode: '',
        learningOutcomes: '',
        method: 'Lecture',
        theoryCredits: 2,
        practicalCredits: 0,
        courseType: CourseType.WAJIB_PRODI,
        educationLevel: EducationLevel.S1,
        topic: '',
        role: TeachingRole.MANDIRI,
        referenceLinks: [],
        presentationId: [],
        questionBankId: [],
        attachmentLink: [],
        assignmentType: AssignmentType.NONE,
        assessmentCriteria: '',
        status: SessionStatus.COMPLETED,
        vaultJsonId: '',
        storageNodeUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const success = await saveTeachingItem(newItem);
      if (success) {
        navigate(`/teaching/${id}`, { state: { item: newItem } });
      } else {
        showXeenapsToast('error', 'Handshake failed');
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await showXeenapsDeleteConfirm(1);
    if (confirmed) {
      const success = await deleteTeachingItem(id);
      if (success) {
        showXeenapsToast('success', 'Record removed');
        loadData();
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6 shrink-0">
        <SmartSearchBox 
          value={localSearch} 
          onChange={setLocalSearch} 
          onSearch={() => { setAppliedSearch(localSearch); setCurrentPage(1); }} 
        />
        <StandardPrimaryButton onClick={handleCreateNew} icon={<Plus size={20} />}>
          Record Session
        </StandardPrimaryButton>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {isLoading ? (
          <CardGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <div className="py-40 text-center flex flex-col items-center justify-center space-y-4 opacity-30 grayscale">
            <School size={80} strokeWidth={1} className="text-[#004A74]" />
            <p className="text-sm font-black uppercase tracking-[0.4em]">No Teaching Logs Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map(item => (
              <div 
                key={item.id}
                onClick={() => navigate(`/teaching/${item.id}`, { state: { item } })}
                className="group bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1 bg-[#004A74]/5 text-[#004A74] text-[8px] font-black uppercase tracking-widest rounded-full truncate max-w-[150px]">{item.label}</span>
                  <button onClick={(e) => handleDelete(e, item.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="text-base font-black text-[#004A74] leading-tight mb-2 uppercase line-clamp-2">{item.courseTitle || 'Untitled Course'}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 italic">{item.courseCode || 'No Code'}</p>
                
                <div className="space-y-3 mb-6 flex-1">
                   <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={14} className="shrink-0 text-[#FED400]" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{item.teachingDate}</span>
                   </div>
                   <div className="flex items-center gap-2 text-gray-500">
                      <Clock size={14} className="shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{item.startTime} - {item.endTime}</span>
                   </div>
                   <div className="flex items-center gap-2 text-gray-500">
                      <Users size={14} className="shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{item.totalStudentsPresent || 0} / {item.plannedStudents} Present</span>
                   </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                   <span className={`px-3 py-1 border text-[8px] font-black uppercase tracking-widest rounded-full ${getStatusColor(item.status)}`}>{item.status}</span>
                   <ChevronRight size={18} className="text-gray-200 group-hover:text-[#FED400] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TeachingMain: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<TeachingDashboard />} />
      <Route path="/:sessionId" element={<TeachingDetail />} />
      <Route path="/:sessionId/vault" element={<TeachingVault />} />
    </Routes>
  );
};

export default TeachingMain;
