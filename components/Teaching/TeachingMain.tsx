import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { TeachingItem, SessionStatus, SessionMode, TeachingRole, CourseType, EducationLevel, AssignmentType } from '../../types';
import { fetchTeachingPaginated, deleteTeachingItem, saveTeachingItem } from '../../services/TeachingService';
import { 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  School,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  LayoutGrid,
  CalendarDays,
  X,
  ChevronLeft,
  Search
} from 'lucide-react';
import { SmartSearchBox } from '../Common/SearchComponents';
import { StandardPrimaryButton } from '../Common/ButtonComponents';
import { CardGridSkeleton } from '../Common/LoadingComponents';
import { useAsyncWorkflow } from '../../hooks/useAsyncWorkflow';
import { showXeenapsDeleteConfirm } from '../../utils/confirmUtils';
import { showXeenapsToast } from '../../utils/toastUtils';
import TeachingDetail from './TeachingDetail';
import TeachingVault from './TeachingVault';
import AttachedQuestion from './AttachedQuestion';
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
  
  // New States: View Mode and Date Filter
  const [viewMode, setViewMode] = useState<'card' | 'calendar'>('card');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Calendar States
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const itemsPerPage = 100; // Larger limit to handle calendar indicators locally if needed

  const loadData = useCallback(() => {
    workflow.execute(
      async (signal) => {
        setIsLoading(true);
        // We load a larger batch to populate the calendar accurately
        const result = await fetchTeachingPaginated(1, 1000, appliedSearch, "", signal);
        setItems(result.items);
        setTotalCount(result.totalCount);
      },
      () => setIsLoading(false),
      () => setIsLoading(false)
    );
  }, [appliedSearch]);

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
        eventColor: '#004A74',
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

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!dateRange.start && !dateRange.end) return true;
      const itemDate = new Date(item.teachingDate);
      if (dateRange.start && itemDate < new Date(dateRange.start)) return false;
      if (dateRange.end && itemDate > new Date(dateRange.end)) return false;
      return true;
    });
  }, [items, dateRange]);

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
      case SessionStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      case SessionStatus.RESCHEDULED: return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  // --- CALENDAR LOGIC (iPhone style) ---
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    // Padding for first week
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
    
    return days;
  }, [selectedMonth]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, TeachingItem[]> = {};
    items.forEach(item => {
      const dateStr = item.teachingDate; // YYYY-MM-DD
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(item);
    });
    return map;
  }, [items]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <SmartSearchBox 
            value={localSearch} 
            onChange={setLocalSearch} 
            onSearch={() => { setAppliedSearch(localSearch); }} 
            className="flex-1 lg:w-72"
          />
          {/* VIEW MODE TOGGLE */}
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shrink-0">
            <button 
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'card' ? 'bg-[#004A74] text-white shadow-md' : 'text-gray-400 hover:text-[#004A74]'}`}
              title="Card View"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-[#004A74] text-white shadow-md' : 'text-gray-400 hover:text-[#004A74]'}`}
              title="Calendar View"
            >
              <CalendarDays size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* DATE RANGE FILTER - ONLY IN CARD MODE */}
          {viewMode === 'card' && (
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100 flex-1 lg:flex-none">
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-[#004A74] outline-none p-1.5 w-full cursor-pointer"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <span className="text-gray-300">-</span>
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-[#004A74] outline-none p-1.5 w-full cursor-pointer"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
              {(dateRange.start || dateRange.end) && (
                <button onClick={() => setDateRange({start: '', end: ''})} className="p-1 hover:bg-gray-200 rounded-lg transition-all text-red-400">
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          <StandardPrimaryButton onClick={handleCreateNew} icon={<Plus size={20} />} className="shrink-0">
            Record Session
          </StandardPrimaryButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {isLoading ? (
          <CardGridSkeleton count={8} />
        ) : viewMode === 'card' ? (
          /* CARD MODE */
          <>
            {filteredItems.length === 0 ? (
              <div className="py-40 text-center flex flex-col items-center justify-center space-y-4 opacity-30 grayscale">
                <School size={80} strokeWidth={1} className="text-[#004A74]" />
                <p className="text-sm font-black uppercase tracking-[0.4em]">No Teaching Logs Found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => navigate(`/teaching/${item.id}`, { state: { item } })}
                    className="group relative bg-white border border-gray-100 border-l-[6px] rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer flex flex-col h-full"
                    style={{ borderLeftColor: item.eventColor || '#004A74' }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-3 py-1 bg-gray-50 text-[#004A74] text-[8px] font-black uppercase tracking-widest rounded-full truncate max-w-[150px]">{item.label}</span>
                      <button onClick={(e) => handleDelete(e, item.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h3 className="text-base font-black text-[#004A74] leading-tight mb-2 uppercase line-clamp-2">{item.courseTitle || 'Untitled Course'}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 italic">{item.courseCode || 'No Code'}</p>
                    
                    <div className="space-y-3 mb-6 flex-1">
                       <div className="flex items-center gap-2 text-gray-500">
                          <CalendarIcon size={14} className="shrink-0 text-[#FED400]" />
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
                       <ChevronRight size={18} className="text-gray-300 group-hover:text-[#FED400] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* CALENDAR MODE (iPhone style) */
          <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Calendar Header */}
            <div className="p-6 md:p-8 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
               <h3 className="text-xl font-black text-[#004A74] uppercase tracking-tighter">
                  {monthNames[selectedMonth.getMonth()]} <span className="text-gray-400 font-bold ml-1">{selectedMonth.getFullYear()}</span>
               </h3>
               <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}
                    className="p-2.5 bg-white border border-gray-100 rounded-xl hover:bg-white active:scale-90 transition-all text-[#004A74] shadow-sm"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={() => setSelectedMonth(new Date())}
                    className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FED400] transition-all text-[#004A74] shadow-sm"
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}
                    className="p-2.5 bg-white border border-gray-100 rounded-xl hover:bg-white active:scale-90 transition-all text-[#004A74] shadow-sm"
                  >
                    <ChevronRight size={18} />
                  </button>
               </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4 md:p-8">
               <div className="grid grid-cols-7 mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest py-2">{day}</div>
                  ))}
               </div>
               <div className="grid grid-cols-7 gap-px bg-gray-50 rounded-[1.5rem] overflow-hidden border border-gray-50">
                  {calendarDays.map((date, idx) => {
                    if (!date) return <div key={`pad-${idx}`} className="bg-white min-h-[80px] md:min-h-[100px]" />;
                    
                    const dateStr = date.toISOString().split('T')[0];
                    const daySessions = sessionsByDate[dateStr] || [];
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    
                    return (
                      <div 
                        key={dateStr} 
                        className="bg-white min-h-[80px] md:min-h-[100px] p-2 relative group hover:bg-blue-50/30 transition-colors"
                      >
                         <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black transition-all ${isToday ? 'bg-[#004A74] text-white shadow-lg' : 'text-gray-400 group-hover:text-[#004A74]'}`}>
                            {date.getDate()}
                         </div>

                         {/* Session Indicators (Colored Dots) */}
                         <div className="mt-2 flex flex-wrap gap-1">
                            {daySessions.map(session => (
                              <div 
                                key={session.id} 
                                onClick={(e) => { e.stopPropagation(); navigate(`/teaching/${session.id}`, { state: { item: session } }); }}
                                className="w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform shadow-sm"
                                style={{ backgroundColor: session.eventColor || '#004A74' }}
                                title={session.courseTitle || session.label}
                              />
                            ))}
                         </div>
                         
                         {/* Preview Session Title (on desktop hover) */}
                         {daySessions.length > 0 && (
                           <div className="hidden lg:block mt-2">
                             {daySessions.slice(0, 2).map(s => (
                               <p key={s.id} className="text-[7px] font-black text-[#004A74] truncate uppercase opacity-60 leading-tight">
                                 {s.courseTitle || s.label}
                               </p>
                             ))}
                             {daySessions.length > 2 && <p className="text-[7px] font-black text-gray-300 uppercase tracking-tighter">+{daySessions.length - 2} More</p>}
                           </div>
                         )}
                      </div>
                    );
                  })}
               </div>
            </div>
            
            {/* Mobile Legend/Indicator Info */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#004A74]" />
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Scheduled Session</span>
               </div>
               <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest italic">Tap indicators to open ledger</p>
            </div>
          </div>
        ) }
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
      <Route path="/:sessionId/questions" element={<AttachedQuestion />} />
    </Routes>
  );
};

export default TeachingMain;